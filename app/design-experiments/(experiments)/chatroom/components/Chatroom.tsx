"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AGENTS } from "../data/agents";
import { useIdentity, type Identity } from "../hooks/useIdentity";
import type {
	ClientEvent,
	EndedReason,
	PhaseEvent,
	ServerEvent,
	SessionError,
	SessionResponse,
	WireMessage,
} from "../types";
import { AgentAvatar } from "./AgentAvatar";
import { Composer } from "./Composer";
import { IdentityChip } from "./IdentityChip";
import { IdentityModal } from "./IdentityModal";
import { MessageRow, TypingRow } from "./MessageRow";
import { TopicChangeModal } from "./TopicChangeModal";
import styles from "../page.module.css";

const IS_DEV = process.env.NODE_ENV === "development";
const PING_INTERVAL_MS = 25_000;

export function Chatroom() {
	const { identity, update: updateIdentity } = useIdentity();
	const [editingIdentity, setEditingIdentity] = useState(false);
	const [changingTopic, setChangingTopic] = useState(false);
	const [topic, setTopic] = useState<{ id: string | null; title: string } | null>(null);
	const [messages, setMessages] = useState<WireMessage[]>([]);
	const [draft, setDraft] = useState("");
	const [status, setStatus] = useState<"connecting" | "open" | "closed" | "error" | "ended">("connecting");
	const [endedReason, setEndedReason] = useState<EndedReason | null>(null);
	const [turnsUsed, setTurnsUsed] = useState(0);
	const [maxTurns, setMaxTurns] = useState(20);
	const [phase, setPhase] = useState<PhaseEvent["phase"]>("opening");
	const [topicChangeError, setTopicChangeError] = useState<string | null>(null);
	const [mode, setMode] = useState<"dev" | "prod">("prod");
	const [typingAgent, setTypingAgent] = useState<{ agentId: string; name: string } | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const identityRef = useRef<Identity | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		identityRef.current = identity;
	}, [identity]);

	// Resend identify whenever identity changes (after WS is open).
	useEffect(() => {
		if (!identity) return;
		const ws = wsRef.current;
		if (ws && ws.readyState === WebSocket.OPEN) {
			sendClient(ws, { type: "identify", name: identity.name, avatarId: identity.avatarId });
		}
	}, [identity]);

	useEffect(() => {
		let cancelled = false;
		let ws: WebSocket | null = null;
		let pingTimer: ReturnType<typeof setInterval> | null = null;

		async function connect() {
			const url = new URL(window.location.href);
			const overrideRoomId = url.searchParams.get("roomId");
			const sessionUrl = overrideRoomId
				? `/api/chatroom/session?roomId=${encodeURIComponent(overrideRoomId)}`
				: "/api/chatroom/session";

			const sessionRes = await fetch(sessionUrl);
			if (!sessionRes.ok) {
				if (cancelled) return;
				const body = (await sessionRes.json().catch(() => null)) as SessionError | null;
				const code: EndedReason = body?.code ?? "session_failed";
				setStatus("ended");
				setEndedReason(code);
				return;
			}
			const session = (await sessionRes.json()) as SessionResponse;
			if (cancelled) return;

			ws = new WebSocket(
				`${session.wssUrl}/rooms/${session.roomId}/ws?ticket=${encodeURIComponent(session.ticket)}`,
			);
			wsRef.current = ws;

			ws.addEventListener("open", () => {
				if (cancelled || !ws) return;
				setStatus("open");
				const me = identityRef.current;
				if (me) {
					sendClient(ws, { type: "identify", name: me.name, avatarId: me.avatarId });
				}
				pingTimer = setInterval(() => {
					if (ws && ws.readyState === WebSocket.OPEN) ws.send("ping");
				}, PING_INTERVAL_MS);
			});

			ws.addEventListener("message", (event) => {
				if (typeof event.data !== "string") return;
				if (event.data === "pong") return;
				let parsed: ServerEvent;
				try {
					parsed = JSON.parse(event.data) as ServerEvent;
				} catch {
					return;
				}

				if (parsed.type === "hello") {
					setTopic(parsed.topic);
					setMessages(parsed.messages);
					setTurnsUsed(parsed.turnsUsed);
					setMaxTurns(parsed.maxTurns);
					setPhase(parsed.phase);
					if (parsed.mode) setMode(parsed.mode);
					if (parsed.status === "ended") setStatus("ended");
				} else if (parsed.type === "message") {
					setMessages((prev) =>
						prev.some((m) => m.id === parsed.message.id) ? prev : [...prev, parsed.message],
					);
					setTurnsUsed((prev) => (parsed.message.role === "agent" ? prev + 1 : prev));
					// A message arriving implicitly clears the typing indicator
					// (typing was for *this* turn; the message ends it).
					setTypingAgent(null);
				} else if (parsed.type === "typing") {
					if (parsed.agentId) {
						setTypingAgent({ agentId: parsed.agentId, name: parsed.name ?? "" });
					} else {
						setTypingAgent(null);
					}
				} else if (parsed.type === "phase") {
					setPhase(parsed.phase);
				} else if (parsed.type === "topic_change_rejected") {
					setTopicChangeError(
						parsed.reason === "limit"
							? "You've reached the topic-change limit for this room."
							: "That topic didn't go through. Try again.",
					);
				} else if (parsed.type === "ended") {
					setStatus("ended");
					setEndedReason(parsed.reason);
				}
			});

			ws.addEventListener("close", () => {
				if (cancelled) return;
				setStatus((prev) => (prev === "ended" ? "ended" : "closed"));
			});

			ws.addEventListener("error", () => {
				if (cancelled) return;
				setStatus((prev) => (prev === "ended" ? "ended" : "error"));
			});
		}

		connect();

		return () => {
			cancelled = true;
			if (pingTimer) clearInterval(pingTimer);
			if (ws && ws.readyState <= WebSocket.OPEN) ws.close();
			wsRef.current = null;
		};
	}, []);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages, typingAgent]);

	const send = useCallback(() => {
		const ws = wsRef.current;
		const me = identityRef.current;
		const trimmed = draft.trim();
		if (!ws || ws.readyState !== WebSocket.OPEN || !trimmed || !me) return;
		sendClient(ws, { type: "say", author: me.name, content: trimmed });
		setDraft("");
	}, [draft]);

	const handleIdentitySave = useCallback(
		(next: Identity) => {
			updateIdentity(next);
			setEditingIdentity(false);
		},
		[updateIdentity],
	);

	const handleTopicChange = useCallback((title: string) => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		setTopicChangeError(null);
		sendClient(ws, { type: "change_topic", title });
		setChangingTopic(false);
	}, []);

	const handleAskMeSomething = useCallback(() => {
		const ws = wsRef.current;
		if (!ws || ws.readyState !== WebSocket.OPEN) return;
		sendClient(ws, { type: "ask_me_something" });
	}, []);

	const inputDisabled = status !== "open";
	const turnsRemaining = Math.max(0, maxTurns - turnsUsed);
	const myName = identity?.name ?? null;
	const phaseHint = phaseToHint(phase, status);
	const showAskButton = status === "open" && (phase === "awaiting_user" || phase === "idle");

	return (
		<div className={styles.shell}>
			<header className={styles.header}>
				<h1 className={styles.title}>chatroom</h1>
				<p className={styles.subtitle}>
					Two opinionated agents are mid-conversation. Join in as the third.
				</p>
				<div className={styles.topicRow}>
					{topic && (
						<span className={styles.topicGroup}>
							<span className={styles.topicChip}>{topic.title}</span>
							{status === "open" && (
								<button
									type="button"
									className={styles.changeTopicBtn}
									onClick={() => setChangingTopic(true)}
									aria-label="Change topic"
								>
									change
								</button>
							)}
						</span>
					)}
					<span className={styles.statusPill} data-state={status}>
						<span className={styles.statusDot} />
						{status}
					</span>
					{mode === "dev" && <span className={styles.devPill}>dev</span>}
					{identity && (
						<div className={styles.identitySlot}>
							<IdentityChip identity={identity} onEdit={() => setEditingIdentity(true)} />
						</div>
					)}
				</div>
			</header>

			<ul className={styles.messages}>
				<AnimatePresence initial={false}>
					{messages.map((m) => (
						<MessageRow key={m.id} message={m} isMe={!!myName && m.author === myName} />
					))}
					{typingAgent && (
						<TypingRow
							key={`typing-${typingAgent.agentId}`}
							agentId={typingAgent.agentId}
							name={typingAgent.name}
						/>
					)}
				</AnimatePresence>
				{messages.length === 0 && status === "open" && (
					<li className={styles.idle}>waiting for the room to wake up…</li>
				)}
				<div ref={messagesEndRef} />
			</ul>

			{status === "ended" ? (
				<div className={styles.endedCard}>
					<div className={styles.endedTitle}>{endedTitle(endedReason)}</div>
					<div className={styles.endedBody}>{describeEndedReason(endedReason)}</div>
					{IS_DEV && endedReason === "session_exhausted" && (
						<button type="button" onClick={resetAndReload} className={styles.resetBtn}>
							[dev] clear session counter and reload
						</button>
					)}
				</div>
			) : (
				<Composer
					value={draft}
					disabled={inputDisabled}
					turnsRemaining={turnsRemaining}
					maxTurns={maxTurns}
					phaseHint={phaseHint}
					showAskButton={showAskButton}
					onAskMeSomething={handleAskMeSomething}
					onChange={setDraft}
					onSubmit={send}
				/>
			)}
			{topicChangeError && (
				<div className={styles.topicError} role="alert">
					{topicChangeError}
				</div>
			)}

			<div className={styles.roster}>
				<div className={styles.rosterLabel}>In the room</div>
				<ul className={styles.rosterList}>
					{AGENTS.map((a) => (
						<li key={a.id} className={styles.rosterItem}>
							<AgentAvatar name={a.name} gradient={a.gradient} image={a.image} size="sm" />
							<div>
								<span className={styles.rosterName}>{a.name}</span>
								<span> · </span>
								<span className={styles.rosterBio}>{a.bio}</span>
							</div>
						</li>
					))}
				</ul>
			</div>

			{editingIdentity && identity && (
				<IdentityModal
					identity={identity}
					onSave={handleIdentitySave}
					onClose={() => setEditingIdentity(false)}
				/>
			)}

			{changingTopic && (
				<TopicChangeModal
					onSubmit={handleTopicChange}
					onClose={() => setChangingTopic(false)}
				/>
			)}
		</div>
	);
}

function sendClient(ws: WebSocket, event: ClientEvent) {
	ws.send(JSON.stringify(event));
}

function phaseToHint(phase: PhaseEvent["phase"], status: string): string | null {
	if (status !== "open") return null;
	switch (phase) {
		// opening + responding: the per-agent typing indicator in the message
		// list carries the "thinking" signal — composer stays quiet.
		case "opening":
		case "responding":
		case "awaiting_user":
			return null;
		case "nudging":
			return "they're asking you something…";
		case "idle":
			return "the room is waiting on you — say something to keep it going.";
	}
}

function endedTitle(reason: EndedReason | null): string {
	switch (reason) {
		case "turn_cap":
			return "Conversation reached its turn cap.";
		case "global_cap":
			return "Spend cap reached.";
		case "session_exhausted":
			return "Session limit reached.";
		case "config_missing":
			return "Server not configured.";
		case "session_failed":
			return "Couldn't start a session.";
		default:
			return "Conversation ended.";
	}
}

function describeEndedReason(reason: EndedReason | null): string {
	switch (reason) {
		case "turn_cap":
			return "Refresh the page for a brand-new room with a new topic.";
		case "global_cap":
			return "The global spend cap for this experiment has been reached. It'll reset at the start of the month.";
		case "session_exhausted":
			return "You've started the maximum number of chatroom sessions for this month from this IP.";
		case "config_missing":
			return "The chatroom server is missing required environment variables.";
		case "session_failed":
			return "Something went wrong starting a session. Check the dev console for details.";
		default:
			return "The room is closed.";
	}
}

async function resetAndReload() {
	try {
		await fetch("/api/chatroom/reset", { method: "POST" });
	} catch {
		// ignore
	}
	window.location.href = window.location.pathname;
}
