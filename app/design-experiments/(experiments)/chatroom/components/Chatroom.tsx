"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Phase 1 client — intentionally bare. Functional only; visual polish lands
 * in Phase 4. The goal is to prove WS plumbing + hibernation pong end-to-end:
 * two tabs with the same roomId chat through the deployed worker, refresh =
 * fresh room.
 */

type Message = {
	id: number;
	author: string;
	content: string;
	created_at: number;
};

type SessionResponse = { roomId: string; wssUrl: string };

const PING_INTERVAL_MS = 25_000;

function generateAuthor(): string {
	return `anon-${Math.random().toString(36).slice(2, 6)}`;
}

export function Chatroom() {
	const [roomId, setRoomId] = useState<string | null>(null);
	const [author, setAuthor] = useState<string | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [draft, setDraft] = useState("");
	const [status, setStatus] = useState<"connecting" | "open" | "closed" | "error">("connecting");
	const wsRef = useRef<WebSocket | null>(null);
	const authorRef = useRef<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		let ws: WebSocket | null = null;
		let pingTimer: ReturnType<typeof setInterval> | null = null;

		// Generated post-mount so SSR and first client render match.
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
				setStatus("error");
				return;
			}
			const session = (await sessionRes.json()) as SessionResponse;
			if (cancelled) return;

			setRoomId(session.roomId);

			const historyRes = await fetch(`${toHttp(session.wssUrl)}/rooms/${session.roomId}/messages`);
			if (historyRes.ok) {
				const history = (await historyRes.json()) as Message[];
				if (!cancelled) setMessages(history);
			}

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
				try {
					const message = JSON.parse(event.data) as Message;
					setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
				} catch {
					// ignore
				}
			});

			ws.addEventListener("close", () => {
				if (cancelled) return;
				setStatus("closed");
			});

			ws.addEventListener("error", () => {
				if (cancelled) return;
				setStatus("error");
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

	const send = useCallback(() => {
		const ws = wsRef.current;
		const me = authorRef.current;
		const trimmed = draft.trim();
		if (!ws || ws.readyState !== WebSocket.OPEN || !trimmed || !me) return;
		ws.send(JSON.stringify({ author: me, content: trimmed }));
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
			<h1 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>chatroom — phase 1</h1>
			<p style={{ fontSize: 12, opacity: 0.6, margin: "4px 0 24px" }}>
				you are <strong style={{ color: "#ffd24a" }}>{author ?? "—"}</strong> · status:{" "}
				<span style={{ color: status === "open" ? "#7ee787" : "#ff7b72" }}>{status}</span>
			</p>
			{roomId && (
				<p style={{ fontSize: 11, opacity: 0.55, margin: "0 0 24px", wordBreak: "break-all" }}>
					room: <code>{roomId}</code>
					<br />
					to test broadcast in another tab, open:{" "}
					<code>?roomId={roomId}</code>
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
					<li
						key={m.id}
						style={{
							padding: "8px 12px",
							border: "1px solid rgba(255,255,255,0.08)",
							borderRadius: 6,
							background: author && m.author === author ? "rgba(255,210,74,0.04)" : "transparent",
						}}
					>
						<div style={{ fontSize: 11, opacity: 0.55, marginBottom: 2 }}>
							{m.author} · {formatTime(m.created_at)}
						</div>
						<div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{m.content}</div>
					</li>
				))}
				{messages.length === 0 && (
					<li style={{ fontSize: 12, opacity: 0.5 }}>no messages yet — type something below</li>
				)}
			</ul>

			<input
				type="text"
				value={draft}
				onChange={(e) => setDraft(e.target.value)}
				onKeyDown={handleKey}
				placeholder={status === "open" ? "type a message and press enter" : "connecting…"}
				disabled={status !== "open"}
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
		</main>
	);
}

function toHttp(wssUrl: string): string {
	return wssUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
}

function formatTime(ts: number): string {
	const d = new Date(ts);
	return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
