import { DurableObject } from "cloudflare:workers";
import { getPersona, pickAgents, type Persona } from "./personas";
import { getTopic, pickTopic, type Topic } from "./topics";

/**
 * Phase 2 — three agents converse on a tick. The visitor can interject and
 * an agent picks them up within ~1.2s. Cap at 20 total turns for cheap
 * testing (Phase 3 raises this and adds cost gates + ticket auth).
 *
 * State lives in two SQLite tables inside the DO so it survives hibernation:
 *   messages  — every utterance, both agents and the human
 *   room      — the topic, the chosen agents, turns_used, status
 *
 * Each visitor gets a fresh roomId from /api/chatroom/session, so each room
 * is private and starts empty. The DO stays alive (or sleeps) until the
 * idle deathwatch in alarm() lets it die.
 */

type DBMessage = {
	id: number;
	role: "user" | "agent";
	agent_id: string | null;
	author: string;
	content: string;
	created_at: number;
};

type WireMessage = {
	id: number;
	role: "user" | "agent";
	agentId: string | null;
	author: string;
	content: string;
	created_at: number;
};

type RoomRow = {
	id: number;
	topic_id: string;
	agent_ids: string;
	turns_used: number;
	status: string;
	last_user_at: number | null;
	created_at: number;
};

type RoomState = {
	topic: Topic;
	agentIds: string[];
	turnsUsed: number;
	status: "active" | "ended";
	lastUserAt: number | null;
};

const CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, OPTIONS",
	"access-control-allow-headers": "Content-Type",
} as const;

const MAX_TURNS = 20;
const MAX_OUTPUT_TOKENS = 100;
const MEMORY_WINDOW = 12;
const AMBIENT_TICK_MS = 8_000;
const AMBIENT_JITTER_MS = 4_000;
const FIRST_OPENER_DELAY_MS = 600;
const RESPOND_TO_USER_DELAY_MS = 1_200;
const DEATHWATCH_MS = 90_000;
const LLM_RETRY_DELAY_MS = 8_000;

const VERCEL_GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/messages";
const HAIKU_MODEL = "anthropic/claude-haiku-4.5";

export class ChatroomDO extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair("ping", "pong"),
		);

		ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					role TEXT NOT NULL DEFAULT 'user',
					agent_id TEXT,
					author TEXT NOT NULL,
					content TEXT NOT NULL,
					created_at INTEGER NOT NULL
				)
			`);
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS room (
					id INTEGER PRIMARY KEY,
					topic_id TEXT NOT NULL,
					agent_ids TEXT NOT NULL,
					turns_used INTEGER NOT NULL DEFAULT 0,
					status TEXT NOT NULL DEFAULT 'active',
					last_user_at INTEGER,
					created_at INTEGER NOT NULL
				)
			`);

			// Best-effort migrations for rooms created in Phase 1 (when the
			// messages table only had id/author/content/created_at). Each ALTER
			// throws if the column already exists; that's fine.
			try {
				this.ctx.storage.sql.exec(`ALTER TABLE messages ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
			} catch {}
			try {
				this.ctx.storage.sql.exec(`ALTER TABLE messages ADD COLUMN agent_id TEXT`);
			} catch {}

			// Bootstrap the room row on first wake. Subsequent wakes (from
			// hibernation) skip this and read the existing row.
			const existing = this.ctx.storage.sql
				.exec<RoomRow>(`SELECT id FROM room WHERE id = 1`)
				.toArray();
			if (existing.length === 0) {
				const topic = pickTopic();
				const agentIds = pickAgents();
				this.ctx.storage.sql.exec(
					`INSERT INTO room (id, topic_id, agent_ids, turns_used, status, last_user_at, created_at)
					 VALUES (1, ?, ?, 0, 'active', NULL, ?)`,
					topic.id,
					JSON.stringify(agentIds),
					Date.now(),
				);
			}
		});
	}

	// ── routing ──────────────────────────────────────────────────────────

	async fetch(_request: Request): Promise<Response> {
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		this.ctx.acceptWebSocket(server);

		// Send initial hydration to the just-connected socket.
		const room = this.getRoom();
		if (room) {
			const hello = {
				type: "hello" as const,
				topic: { id: room.topic.id, title: room.topic.title },
				agents: room.agentIds.map((id) => {
					const p = getPersona(id);
					return p ? { id: p.id, name: p.name } : { id, name: id };
				}),
				messages: this.getRecentMessages().map(toWire),
				status: room.status,
				turnsUsed: room.turnsUsed,
				maxTurns: MAX_TURNS,
			};
			server.send(JSON.stringify(hello));

			// If the room is fresh and no alarm is queued, kick off the first
			// agent turn. Existing alarm? Leave it alone.
			if (room.status === "active") {
				const pendingAlarm = await this.ctx.storage.getAlarm();
				if (pendingAlarm == null) {
					await this.ctx.storage.setAlarm(Date.now() + FIRST_OPENER_DELAY_MS);
				}
			}
		}

		return new Response(null, { status: 101, webSocket: client });
	}

	async getMessagesForHttp(): Promise<WireMessage[]> {
		return this.getAllMessages().map(toWire);
	}

	// ── socket handlers ─────────────────────────────────────────────────

	async webSocketMessage(_ws: WebSocket, data: string | ArrayBuffer) {
		if (typeof data !== "string") return;

		let parsed: { type?: unknown; author?: unknown; content?: unknown };
		try {
			parsed = JSON.parse(data);
		} catch {
			return;
		}

		if (parsed.type !== "say") return;

		const author = typeof parsed.author === "string" ? parsed.author.slice(0, 32) : "anon";
		const content = typeof parsed.content === "string" ? parsed.content.slice(0, 500) : "";
		if (!content.trim()) return;

		const room = this.getRoom();
		if (!room || room.status === "ended") return;

		const inserted = this.insertMessage({
			role: "user",
			agent_id: null,
			author,
			content: content.trim(),
		});
		this.updateLastUserAt(inserted.created_at);
		this.broadcast({ type: "message", message: toWire(inserted) });

		// Cap check after the user's message lands.
		if (room.turnsUsed + 1 >= MAX_TURNS) {
			this.endRoom("turn_cap");
			return;
		}

		// Reply soon. Override any pending ambient alarm.
		await this.ctx.storage.setAlarm(Date.now() + RESPOND_TO_USER_DELAY_MS);
	}

	// webSocketClose intentionally omitted (compatibility_date >= 2026-04-07
	// auto-replies to Close frames). Idle cleanup happens in alarm().

	// ── the heartbeat ───────────────────────────────────────────────────

	async alarm() {
		const room = this.getRoom();
		if (!room || room.status === "ended") return;

		if (room.turnsUsed >= MAX_TURNS) {
			this.endRoom("turn_cap");
			return;
		}

		// Idle deathwatch: no clients connected AND no human chatter recently.
		// Without this, the alarm loop would burn LLM credits in an empty room.
		const sockets = this.ctx.getWebSockets();
		const lastUserAge = room.lastUserAt == null ? Number.POSITIVE_INFINITY : Date.now() - room.lastUserAt;
		if (sockets.length === 0 && lastUserAge > DEATHWATCH_MS) {
			return; // no rescheduling — let it lie until the next WS opens.
		}

		const messages = this.getRecentMessages();
		const speakerId = pickSpeaker(room.agentIds, messages);
		const persona = getPersona(speakerId);
		if (!persona) return;

		let reply: { content: string; usage?: AnthropicUsage };
		try {
			reply = await callLLM(this.env, persona, room.topic, messages);
		} catch (err) {
			console.error("[chatroom] LLM call failed", err);
			// Retry on the next ambient tick rather than dying. If nobody's
			// connected the deathwatch will eventually kill the loop anyway.
			await this.ctx.storage.setAlarm(Date.now() + LLM_RETRY_DELAY_MS);
			return;
		}

		const inserted = this.insertMessage({
			role: "agent",
			agent_id: persona.id,
			author: persona.name,
			content: reply.content,
		});
		this.broadcast({ type: "message", message: toWire(inserted) });
		this.incrementTurns();

		// Reschedule with jitter, unless we just hit the cap.
		const next = this.getRoom();
		if (!next || next.turnsUsed >= MAX_TURNS) {
			this.endRoom("turn_cap");
			return;
		}

		const delay = AMBIENT_TICK_MS + Math.floor(Math.random() * AMBIENT_JITTER_MS) - Math.floor(AMBIENT_JITTER_MS / 2);
		await this.ctx.storage.setAlarm(Date.now() + Math.max(2_000, delay));
	}

	// ── SQL helpers ──────────────────────────────────────────────────────

	private getRoom(): RoomState | null {
		const rows = this.ctx.storage.sql
			.exec<RoomRow>(`SELECT * FROM room WHERE id = 1`)
			.toArray();
		if (rows.length === 0) return null;
		const row = rows[0];
		const topic = getTopic(row.topic_id);
		if (!topic) return null;
		let agentIds: string[];
		try {
			agentIds = JSON.parse(row.agent_ids);
		} catch {
			agentIds = pickAgents();
		}
		return {
			topic,
			agentIds,
			turnsUsed: row.turns_used,
			status: row.status === "ended" ? "ended" : "active",
			lastUserAt: row.last_user_at,
		};
	}

	private getRecentMessages(): DBMessage[] {
		return this.ctx.storage.sql
			.exec<DBMessage>(
				`SELECT * FROM (
					SELECT * FROM messages ORDER BY id DESC LIMIT ?
				) ORDER BY id ASC`,
				MEMORY_WINDOW,
			)
			.toArray();
	}

	private getAllMessages(): DBMessage[] {
		return this.ctx.storage.sql
			.exec<DBMessage>(`SELECT * FROM messages ORDER BY id ASC`)
			.toArray();
	}

	private insertMessage(msg: { role: "user" | "agent"; agent_id: string | null; author: string; content: string }): DBMessage {
		return this.ctx.storage.sql
			.exec<DBMessage>(
				`INSERT INTO messages (role, agent_id, author, content, created_at)
				 VALUES (?, ?, ?, ?, ?)
				 RETURNING *`,
				msg.role,
				msg.agent_id,
				msg.author,
				msg.content,
				Date.now(),
			)
			.one();
	}

	private incrementTurns() {
		this.ctx.storage.sql.exec(`UPDATE room SET turns_used = turns_used + 1 WHERE id = 1`);
	}

	private updateLastUserAt(ts: number) {
		this.ctx.storage.sql.exec(`UPDATE room SET last_user_at = ? WHERE id = 1`, ts);
	}

	private endRoom(reason: "turn_cap" | "global_cap") {
		this.ctx.storage.sql.exec(`UPDATE room SET status = 'ended' WHERE id = 1`);
		this.broadcast({ type: "ended", reason });
	}

	private broadcast(payload: unknown) {
		const json = JSON.stringify(payload);
		for (const ws of this.ctx.getWebSockets()) {
			try {
				ws.send(json);
			} catch {
				// socket closed mid-broadcast
			}
		}
	}
}

// ── pure helpers (no DO state) ─────────────────────────────────────────

function toWire(m: DBMessage): WireMessage {
	return {
		id: m.id,
		role: m.role,
		agentId: m.agent_id,
		author: m.author,
		content: m.content,
		created_at: m.created_at,
	};
}

function pickSpeaker(agentIds: string[], messages: DBMessage[]): string {
	if (messages.length === 0) {
		return agentIds[Math.floor(Math.random() * agentIds.length)];
	}

	// Bias: if the user just addressed an agent by name, that agent goes.
	const last = messages[messages.length - 1];
	if (last.role === "user") {
		const lower = last.content.toLowerCase();
		for (const id of agentIds) {
			const p = getPersona(id);
			if (p && lower.includes(p.name.toLowerCase())) return id;
		}
	}

	// Otherwise: pick the agent whose most recent message is oldest, with a
	// hard rule that the same agent never speaks twice in a row.
	const lastAgent = [...messages].reverse().find((m) => m.role === "agent")?.agent_id ?? null;
	const lastSeen = new Map<string, number>();
	for (const m of messages) {
		if (m.role === "agent" && m.agent_id) lastSeen.set(m.agent_id, m.created_at);
	}

	let pick = agentIds[0];
	let oldest = Number.POSITIVE_INFINITY;
	for (const id of agentIds) {
		if (id === lastAgent && agentIds.length > 1) continue;
		const ts = lastSeen.get(id) ?? 0;
		if (ts < oldest) {
			oldest = ts;
			pick = id;
		}
	}
	return pick;
}

type AnthropicUsage = {
	input_tokens: number;
	output_tokens: number;
	cache_read_input_tokens?: number;
	cache_creation_input_tokens?: number;
};

type AnthropicResponse = {
	content?: Array<{ type: string; text?: string }>;
	usage?: AnthropicUsage;
	stop_reason?: string;
};

async function callLLM(
	env: Env,
	persona: Persona,
	topic: Topic,
	transcript: DBMessage[],
): Promise<{ content: string; usage?: AnthropicUsage }> {
	const apiKey = env.VERCEL_AI_GATEWAY_KEY;
	if (!apiKey) throw new Error("VERCEL_AI_GATEWAY_KEY is not set");

	const userMessage = buildUserMessage(persona, topic, transcript);

	const res = await fetch(VERCEL_GATEWAY_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			"anthropic-version": "2023-06-01",
		},
		body: JSON.stringify({
			model: HAIKU_MODEL,
			max_tokens: MAX_OUTPUT_TOKENS,
			system: [
				{
					type: "text",
					text: persona.systemPrompt,
					cache_control: { type: "ephemeral" },
				},
			],
			messages: [
				{
					role: "user",
					content: [{ type: "text", text: userMessage }],
				},
			],
		}),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => "<no body>");
		throw new Error(`gateway ${res.status}: ${body.slice(0, 200)}`);
	}

	const json = (await res.json()) as AnthropicResponse;
	const content = (json.content ?? [])
		.filter((b) => b.type === "text")
		.map((b) => b.text ?? "")
		.join("")
		.trim();

	if (!content) throw new Error("empty reply from gateway");

	return { content, usage: json.usage };
}

function buildUserMessage(persona: Persona, topic: Topic, transcript: DBMessage[]): string {
	if (transcript.length === 0) {
		return `Topic for the chat: ${topic.title}.\n\nA possible thought to react to: "${topic.opener}"\n\nYou (${persona.name}) speak first — react however feels natural.`;
	}
	const lines = transcript.map((m) => `[${m.author}]: ${m.content}`).join("\n");
	return `Recent chat:\n${lines}\n\nYour turn (${persona.name}).`;
}

// ── worker entry ────────────────────────────────────────────────────────

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		if (url.pathname === "/healthz") {
			return new Response("ok", { status: 200, headers: CORS_HEADERS });
		}

		const match = url.pathname.match(/^\/rooms\/([^/]+)\/(ws|messages)\/?$/);
		if (!match) {
			return new Response("Not found", { status: 404, headers: CORS_HEADERS });
		}

		const roomId = decodeURIComponent(match[1]);
		const kind = match[2];
		const room = env.CHATROOM.getByName(roomId);

		if (kind === "ws") {
			if (request.headers.get("Upgrade") !== "websocket") {
				return new Response("Expected WebSocket upgrade", {
					status: 426,
					headers: CORS_HEADERS,
				});
			}
			return room.fetch(request);
		}

		if (request.method !== "GET") {
			return new Response("Method not allowed", {
				status: 405,
				headers: CORS_HEADERS,
			});
		}

		const messages = await room.getMessagesForHttp();
		return Response.json(messages, { headers: CORS_HEADERS });
	},
} satisfies ExportedHandler<Env>;
