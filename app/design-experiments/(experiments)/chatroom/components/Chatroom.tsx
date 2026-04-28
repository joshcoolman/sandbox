"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AGENTS, getAgent } from "../data/agents";

/**
 * Phase 2 client. Three agents converse on a tick; you join as the fourth.
 * Still bare-bones styling (Phase 4 owns visuals) — the goal here is to
 * make the agent identities + topic + ended state visible enough to verify
 * the worker behavior end-to-end.
 */

type WireMessage = {
	id: number;
	role: "user" | "agent";
	agentId: string | null;
	author: string;
	content: string;
	created_at: number;
};

type HelloEvent = {
	type: "hello";
	topic: { id: string; title: string };
	agents: Array<{ id: string; name: string }>;
	messages: WireMessage[];
	status: "active" | "ended";
	turnsUsed: number;
	maxTurns: number;
};

type MessageEvent_ = { type: "message"; message: WireMessage };
type EndedEvent = { type: "ended"; reason: "turn_cap" | "global_cap" };
type ServerEvent = HelloEvent | MessageEvent_ | EndedEvent;

type SessionResponse = { roomId: string; wssUrl: string };

const PING_INTERVAL_MS = 25_000;

function generateAuthor(): string {
	return `anon-${Math.random().toString(36).slice(2, 6)}`;
}

export function Chatroom() {
	const [roomId, setRoomId] = useState<string | null>(null);
	const [author, setAuthor] = useState<string | null>(null);
	const [topic, setTopic] = useState<{ id: string; title: string } | null>(null);
	const [messages, setMessages] = useState<WireMessage[]>([]);
	const [draft, setDraft] = useState("");
	const [status, setStatus] = useState<"connecting" | "open" | "closed" | "error" | "ended">("connecting");
	const [endedReason, setEndedReason] = useState<EndedEvent["reason"] | null>(null);
	const [turnsUsed, setTurnsUsed] = useState(0);
	const [maxTurns, setMaxTurns] = useState(20);
	const wsRef = useRef<WebSocket | null>(null);
	const authorRef = useRef<string | null>(null);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		let cancelled = false;
		let ws: WebSocket | null = null;
		let pingTimer: ReturnType<typeof setInterval> | null = null;

		const me = generateAuthor();
		authorRef.current = me;
		setAuthor(me);

		async function connect() {
			const url = new URL(window.location.href);
			const overrideRoomId = url.searchParams.get("roomId");
			const sessionUrl = overrideRoomId
				? `/api/chatroom/session?roomId=${encodeURIComponent(overrideRoomId)}`
				: "/api/chatroom/session";

			const sessionRes = await fetch(sessionUrl);
			if (!sessionRes.ok) {
				if (!cancelled) setStatus("error");
				return;
			}
			const session = (await sessionRes.json()) as SessionResponse;
			if (cancelled) return;
			setRoomId(session.roomId);

			ws = new WebSocket(`${session.wssUrl}/rooms/${session.roomId}/ws`);
			wsRef.current = ws;

			ws.addEventListener("open", () => {
				if (cancelled) return;
				setStatus("open");
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
					if (parsed.status === "ended") setStatus("ended");
				} else if (parsed.type === "message") {
					setMessages((prev) =>
						prev.some((m) => m.id === parsed.message.id) ? prev : [...prev, parsed.message],
					);
					setTurnsUsed((prev) => (parsed.message.role === "agent" ? prev + 1 : prev));
				} else if (parsed.type === "ended") {
					setStatus("ended");
					setEndedReason(parsed.reason);
				}
			});

			ws.addEventListener("close", () => {
				if (cancelled) return;
				// Don't downgrade an "ended" state to "closed" — ended is more specific.
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
	}, [messages]);

	const send = useCallback(() => {
		const ws = wsRef.current;
		const me = authorRef.current;
		const trimmed = draft.trim();
		if (!ws || ws.readyState !== WebSocket.OPEN || !trimmed || !me) return;
		ws.send(JSON.stringify({ type: "say", author: me, content: trimmed }));
		setDraft("");
	}, [draft]);

	const handleKey = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				send();
			}
		},
		[send],
	);

	const inputDisabled = status !== "open";
	const turnsRemaining = Math.max(0, maxTurns - turnsUsed);

	return (
		<main
			style={{
				maxWidth: 720,
				margin: "0 auto",
				padding: "48px 24px 96px",
				fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
				color: "#e8e9f3",
				minHeight: "100vh",
			}}
		>
			<h1 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>chatroom — phase 2</h1>
			<p style={{ fontSize: 12, opacity: 0.6, margin: "4px 0 4px" }}>
				you are <strong style={{ color: "#ffd24a" }}>{author ?? "—"}</strong> · status:{" "}
				<span
					style={{
						color:
							status === "open"
								? "#7ee787"
								: status === "ended"
									? "#a78bfa"
									: "#ff7b72",
					}}
				>
					{status}
				</span>{" "}
				· {turnsRemaining}/{maxTurns} turns left
			</p>
			{topic && (
				<p style={{ fontSize: 12, opacity: 0.7, margin: "0 0 4px" }}>
					topic: <strong>{topic.title}</strong>
				</p>
			)}
			{roomId && (
				<p style={{ fontSize: 11, opacity: 0.45, margin: "0 0 24px", wordBreak: "break-all" }}>
					room: <code>{roomId}</code>
				</p>
			)}

			<ul
				style={{
					listStyle: "none",
					margin: 0,
					padding: 0,
					display: "flex",
					flexDirection: "column",
					gap: 8,
					marginBottom: 24,
				}}
			>
				{messages.map((m) => (
					<MessageRow key={m.id} message={m} isMe={!!author && m.author === author} />
				))}
				{messages.length === 0 && status === "open" && (
					<li style={{ fontSize: 12, opacity: 0.5 }}>waiting for the room to wake up…</li>
				)}
				<div ref={messagesEndRef} />
			</ul>

			{status === "ended" ? (
				<div
					style={{
						padding: "16px",
						border: "1px solid rgba(167,139,250,0.4)",
						borderRadius: 6,
						background: "rgba(167,139,250,0.06)",
						fontSize: 13,
					}}
				>
					conversation ended ({endedReason ?? "unknown"}). refresh on the bare URL for a new room.
				</div>
			) : (
				<input
					type="text"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKey}
					placeholder={status === "open" ? "type a message and press enter" : "connecting…"}
					disabled={inputDisabled}
					maxLength={500}
					style={{
						width: "100%",
						padding: "10px 12px",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid rgba(255,255,255,0.12)",
						borderRadius: 6,
						color: "inherit",
						fontFamily: "inherit",
						fontSize: 14,
					}}
				/>
			)}

			<details style={{ marginTop: 32, fontSize: 11, opacity: 0.5 }}>
				<summary style={{ cursor: "pointer" }}>agents in this room</summary>
				<ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 4 }}>
					{AGENTS.map((a) => (
						<li key={a.id}>
							<strong>{a.name}</strong> — {a.bio}
						</li>
					))}
				</ul>
			</details>
		</main>
	);
}

function MessageRow({ message, isMe }: { message: WireMessage; isMe: boolean }) {
	const agent = message.agentId ? getAgent(message.agentId) : null;
	const accent = agent?.gradient ?? (isMe ? "linear-gradient(135deg, #ffd24a 0%, #ff7a4d 100%)" : "linear-gradient(135deg, #6c7290 0%, #4b5063 100%)");
	const labelColor = agent
		? "#cbd5e1"
		: isMe
			? "#ffd24a"
			: "#cbd5e1";

	return (
		<li
			style={{
				display: "grid",
				gridTemplateColumns: "32px 1fr",
				gap: 10,
				padding: "8px 12px 8px 8px",
				border: "1px solid rgba(255,255,255,0.08)",
				borderRadius: 6,
				background: isMe ? "rgba(255,210,74,0.04)" : "transparent",
			}}
		>
			<div
				style={{
					width: 28,
					height: 28,
					borderRadius: 14,
					background: accent,
					alignSelf: "start",
					boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
				}}
				aria-hidden
			/>
			<div>
				<div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>
					<span style={{ color: labelColor, fontWeight: 600 }}>{message.author}</span>
					{message.role === "agent" && agent && (
						<span style={{ marginLeft: 6, opacity: 0.7 }}>· {agent.bio}</span>
					)}
					<span style={{ marginLeft: 8, opacity: 0.55 }}>{formatTime(message.created_at)}</span>
				</div>
				<div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{message.content}</div>
			</div>
		</li>
	);
}

function formatTime(ts: number): string {
	const d = new Date(ts);
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
