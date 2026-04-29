import { DurableObject } from "cloudflare:workers";
import { getPersona, pickAgents, type Persona } from "./personas";
import { getTopic, pickTopic } from "./topics";
import { addSpend, estimateCost, getMonthlySpend, type AnthropicUsage } from "./cost";
import { verifyTicket } from "./ticket";
import { NUDGE_TEMPLATES, pickTemplate } from "./voice";

/**
 * The chatroom DO. Two AI agents (Maya, Jordan) plus the visitor. The
 * conversation runs on a phase state machine that paces itself around the
 * visitor — see Phase.
 *
 *   opening          → produces 2 agent turns, transitions to awaiting_user
 *   awaiting_user    → silence allowance; alarm fire → nudging
 *   nudging          → 1 turn addressing the visitor by name; alarm fire → picking_back_up
 *   picking_back_up  → 2 turns acknowledging silence + pivoting; → awaiting_user
 *   responding       → 2 turns reacting to the visitor; → awaiting_user
 *
 * Any user `say` event collapses whatever phase we're in into `responding`
 * and overrides the pending alarm.
 *
 * State lives in two SQLite tables in the DO so it survives hibernation.
 */

type MessageRole = "user" | "agent" | "system";

type Phase = "opening" | "awaiting_user" | "nudging" | "responding" | "idle";

type DBMessage = {
	id: number;
	role: MessageRole;
	agent_id: string | null;
	author: string;
	content: string;
	created_at: number;
};

type WireMessage = {
	id: number;
	role: MessageRole;
	agentId: string | null;
	author: string;
	content: string;
	created_at: number;
};

type RoomRow = {
	id: number;
	topic_id: string;
	topic_title: string | null;
	agent_ids: string;
	turns_used: number;
	status: string;
	last_user_at: number | null;
	created_at: number;
	phase: string;
	phase_turn: number;
	topic_changes: number;
	user_name: string | null;
	user_avatar: string | null;
	mode: string;
	cutoff_inserted: number;
	auto_nudge_used: number;
};

type RoomMode = "dev" | "prod";

type RoomState = {
	topicTitle: string;
	topicId: string | null;
	agentIds: string[];
	turnsUsed: number;
	status: "active" | "ended";
	lastUserAt: number | null;
	phase: Phase;
	phaseTurn: number;
	topicChanges: number;
	userName: string | null;
	userAvatar: string | null;
	mode: RoomMode;
	cutoffInserted: boolean;
	autoNudgeUsed: boolean;
};

type TurnKind = "normal" | "nudge" | "opener";

type CallContext = {
	persona: Persona;
	topicTitle: string;
	openerInspiration: string | null;
	transcript: DBMessage[];
	kind: TurnKind;
	userName: string | null;
};

const CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, OPTIONS",
	"access-control-allow-headers": "Content-Type",
} as const;

const MAX_TURNS_PROD = 80;
const MAX_TURNS_DEV = 200;
const MAX_OUTPUT_TOKENS = 100;
const NUDGE_OUTPUT_TOKENS = 60;
const MEMORY_WINDOW = 14;
const FIRST_OPENER_DELAY_MS = 600;
const OPENING_BEAT_MS = 2_000;
const WAIT_FOR_USER_MS = 25_000;
const WAIT_AFTER_NUDGE_MS = 25_000;
const RESPOND_TO_USER_DELAY_MS = 1_500;
const RESPONDING_PAIR_DELAY_MS = 3_000;
const TOPIC_PIVOT_DELAY_MS = 600;
const DEATHWATCH_MS = 90_000;
const LLM_RETRY_DELAY_MS = 8_000;
const GLOBAL_SOFT_CAP_USD = 8;
const MAX_TOPIC_CHANGES = 3;
const MAX_TOPIC_TITLE_LEN = 60;
const MAX_NAME_LEN = 32;
const MAX_AVATAR_LEN = 16;

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

			// Best-effort migrations. Each ALTER throws if the column already
			// exists; that's fine.
			for (const stmt of [
				`ALTER TABLE messages ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`,
				`ALTER TABLE messages ADD COLUMN agent_id TEXT`,
				`ALTER TABLE room ADD COLUMN phase TEXT NOT NULL DEFAULT 'opening'`,
				`ALTER TABLE room ADD COLUMN phase_turn INTEGER NOT NULL DEFAULT 0`,
				`ALTER TABLE room ADD COLUMN topic_title TEXT`,
				`ALTER TABLE room ADD COLUMN topic_changes INTEGER NOT NULL DEFAULT 0`,
				`ALTER TABLE room ADD COLUMN user_name TEXT`,
				`ALTER TABLE room ADD COLUMN user_avatar TEXT`,
				`ALTER TABLE room ADD COLUMN mode TEXT NOT NULL DEFAULT 'prod'`,
				`ALTER TABLE room ADD COLUMN cutoff_inserted INTEGER NOT NULL DEFAULT 0`,
				`ALTER TABLE room ADD COLUMN nudged_since_user INTEGER NOT NULL DEFAULT 0`,
				`ALTER TABLE room ADD COLUMN auto_nudge_used INTEGER NOT NULL DEFAULT 0`,
			]) {
				try {
					this.ctx.storage.sql.exec(stmt);
				} catch {}
			}

			// Bootstrap the room row on first wake. Subsequent wakes (from
			// hibernation) skip this and read the existing row.
			const existing = this.ctx.storage.sql
				.exec<{ id: number }>(`SELECT id FROM room WHERE id = 1`)
				.toArray();
			if (existing.length === 0) {
				const topic = pickTopic();
				const agentIds = pickAgents();
				const now = Date.now();
				this.ctx.storage.sql.exec(
					`INSERT INTO room (id, topic_id, topic_title, agent_ids, turns_used, status, last_user_at, created_at, phase, phase_turn, topic_changes)
					 VALUES (1, ?, NULL, ?, 0, 'active', NULL, ?, 'opening', 0, 0)`,
					topic.id,
					JSON.stringify(agentIds),
					now,
				);
				// The topic opener used to render as a visible system message —
				// now it's inspiration handed to whichever agent opens the
				// conversation, so the first turn IS the opener (in their voice).
			}
		});
	}

	// ── routing ──────────────────────────────────────────────────────────

	async fetch(request: Request): Promise<Response> {
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		this.ctx.acceptWebSocket(server);

		// One-shot dev-mode lock from the worker entry's verified header.
		// Once a room is dev, it stays dev — subsequent connections can't
		// downgrade. Any room created without this header stays prod.
		const headerMode = request.headers.get("X-Chatroom-Mode");
		if (headerMode === "dev") {
			this.ctx.storage.sql.exec(
				`UPDATE room SET mode = 'dev' WHERE id = 1 AND mode = 'prod'`,
			);
		}

		const room = this.getRoom();
		if (room) {
			const hello = {
				type: "hello" as const,
				topic: { id: room.topicId, title: room.topicTitle },
				agents: room.agentIds.map((id) => {
					const p = getPersona(id);
					return p ? { id: p.id, name: p.name } : { id, name: id };
				}),
				messages: this.getRecentMessages().map(toWire),
				status: room.status,
				turnsUsed: room.turnsUsed,
				maxTurns: effectiveMaxTurns(room),
				phase: room.phase,
				mode: room.mode,
			};
			server.send(JSON.stringify(hello));

			// Kick off the first opening turn if no alarm is queued.
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

		let parsed: Record<string, unknown>;
		try {
			parsed = JSON.parse(data) as Record<string, unknown>;
		} catch {
			return;
		}

		if (parsed.type === "say") {
			await this.handleSay(parsed);
			return;
		}
		if (parsed.type === "identify") {
			this.handleIdentify(parsed);
			return;
		}
		if (parsed.type === "change_topic") {
			await this.handleChangeTopic(parsed);
			return;
		}
		if (parsed.type === "ask_me_something") {
			await this.handleAskMeSomething();
			return;
		}
	}

	private async handleAskMeSomething() {
		const room = this.getRoom();
		if (!room || room.status === "ended") return;
		// Only honor when the user could speak. Cheap server-side guard
		// against double-clicks landing during a phase transition.
		if (room.phase !== "awaiting_user" && room.phase !== "idle") return;
		if (room.turnsUsed + 1 >= effectiveMaxTurns(room)) {
			this.endRoom("turn_cap");
			return;
		}
		// Mark slot consumed so a later silence doesn't auto-nudge too.
		this.ctx.storage.sql.exec(`UPDATE room SET auto_nudge_used = 1 WHERE id = 1`);
		// Enter nudging with phaseTurn=0 ("not produced yet") and let the
		// alarm path produce the turn after a small delay so the UI updates.
		this.setPhase("nudging", 0);
		await this.ctx.storage.setAlarm(Date.now() + 600);
	}

	private async handleSay(parsed: Record<string, unknown>) {
		const author = typeof parsed.author === "string" ? parsed.author.slice(0, MAX_NAME_LEN) : "anon";
		const content = typeof parsed.content === "string" ? parsed.content.slice(0, 8000) : "";
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

		if (room.turnsUsed + 1 >= effectiveMaxTurns(room)) {
			this.endRoom("turn_cap");
			return;
		}

		// First user message also consumes the auto-nudge slot — we don't want
		// to fire an opening prompt later in some random silence after the user
		// has already engaged. Idempotent.
		this.ctx.storage.sql.exec(`UPDATE room SET auto_nudge_used = 1 WHERE id = 1`);

		// Whatever phase we were in, collapse to responding.
		this.setPhase("responding", 0);
		await this.ctx.storage.setAlarm(Date.now() + RESPOND_TO_USER_DELAY_MS);
	}

	private handleIdentify(parsed: Record<string, unknown>) {
		const name = typeof parsed.name === "string" ? parsed.name.trim().slice(0, MAX_NAME_LEN) : "";
		const avatar = typeof parsed.avatarId === "string" ? parsed.avatarId.slice(0, MAX_AVATAR_LEN) : "";
		if (!name) return;
		this.ctx.storage.sql.exec(
			`UPDATE room SET user_name = ?, user_avatar = ? WHERE id = 1`,
			name,
			avatar,
		);
	}

	private async handleChangeTopic(parsed: Record<string, unknown>) {
		const room = this.getRoom();
		if (!room || room.status === "ended") return;

		if (room.topicChanges >= MAX_TOPIC_CHANGES) {
			this.broadcast({ type: "topic_change_rejected", reason: "limit" });
			return;
		}

		const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, MAX_TOPIC_TITLE_LEN) : "";
		if (!title) {
			this.broadcast({ type: "topic_change_rejected", reason: "invalid" });
			return;
		}

		const now = Date.now();
		this.ctx.storage.sql.exec(
			`UPDATE room SET topic_title = ?, topic_id = 'custom', topic_changes = topic_changes + 1, phase = 'opening', phase_turn = 0 WHERE id = 1`,
			title,
		);

		const sysMsg = this.insertMessage({
			role: "system",
			agent_id: null,
			author: "—",
			content: `Topic changed to: ${title}`,
		});
		this.broadcast({ type: "message", message: toWire(sysMsg) });
		this.broadcast({ type: "phase", phase: "opening" });

		await this.ctx.storage.setAlarm(now + TOPIC_PIVOT_DELAY_MS);
	}

	// ── the heartbeat ───────────────────────────────────────────────────

	async alarm() {
		const room = this.getRoom();
		if (!room || room.status === "ended") return;

		if (room.turnsUsed >= effectiveMaxTurns(room)) {
			this.endRoom("turn_cap");
			return;
		}

		// Idle deathwatch: no clients connected AND no human chatter recently.
		const sockets = this.ctx.getWebSockets();
		const lastUserAge = room.lastUserAt == null ? Number.POSITIVE_INFINITY : Date.now() - room.lastUserAt;
		if (sockets.length === 0 && lastUserAge > DEATHWATCH_MS) {
			return;
		}

		// Global spend cap pre-flight. Skipped in dev — dev sessions still
		// hit the AI Gateway dashboard but don't pollute the shared cap.
		if (room.mode !== "dev") {
			const spent = await getMonthlySpend(this.env).catch(() => 0);
			if (spent >= GLOBAL_SOFT_CAP_USD) {
				this.endRoom("global_cap");
				return;
			}
		}

		// Phase dispatch. Some phases produce a turn in-place; the timeout
		// phases (awaiting_user, nudging) transition first, then produce.
		switch (room.phase) {
			case "awaiting_user":
				// One auto-nudge per session, max. After it's been used (or
				// the user has typed at least once), silence transitions
				// straight to idle and the user drives via the Ask Me Something
				// button.
				if (room.autoNudgeUsed) {
					this.setPhase("idle", 0);
					return;
				}
				this.ctx.storage.sql.exec(`UPDATE room SET auto_nudge_used = 1 WHERE id = 1`);
				this.setPhase("nudging", 0);
				await this.produceAgentTurn(this.getRoom()!);
				return;
			case "nudging":
				// phaseTurn distinguishes the two states this phase represents:
				//   0 = nudge requested but not produced yet (button-triggered)
				//   1 = nudge produced, waiting for the user to reply
				if (room.phaseTurn === 0) {
					await this.produceAgentTurn(room);
					return;
				}
				// Produced + silent → idle.
				this.setPhase("idle", 0);
				return;
			case "opening":
			case "responding":
				await this.produceAgentTurn(room);
				return;
			case "idle":
				// Should never fire — idle has no scheduled alarm — but be defensive.
				return;
		}
	}

	// ── phase + turn production ─────────────────────────────────────────

	private async produceAgentTurn(room: RoomState) {
		const messages = this.getRecentMessages();
		const speakerId = pickSpeaker(room.agentIds, messages);
		const persona = getPersona(speakerId);
		if (!persona) return;

		// "First agent turn" = no agent has spoken since the most recent
		// prompt boundary (room bootstrap or topic-change system message).
		const lastSystemAt = messages.reduce(
			(acc, m) => (m.role === "system" ? Math.max(acc, m.created_at) : acc),
			0,
		);
		const isFirstAgentTurn = !messages.some(
			(m) => m.role === "agent" && m.created_at > lastSystemAt,
		);
		const kind = kindForPhase(room.phase, isFirstAgentTurn);

		// Curated openers serve as inspiration on the very first turn only.
		// After topic-changes the topic is custom (no curated opener).
		const openerInspiration =
			kind === "opener" && room.topicId
				? getTopic(room.topicId)?.opener ?? null
				: null;

		// Broadcast a per-agent typing indicator before the LLM call so the
		// UI shows "Maya is thinking…" while we wait. Clients clear it
		// implicitly when the agent's message arrives, and we explicitly
		// clear it on retry-bound failures (where no message will land).
		this.broadcast({ type: "typing", agentId: persona.id, name: persona.name });

		let reply: { content: string; usage?: AnthropicUsage };
		try {
			reply = await callLLM(this.env, {
				persona,
				topicTitle: room.topicTitle,
				openerInspiration,
				transcript: messages,
				kind,
				userName: room.userName,
			});
		} catch (err) {
			console.error("[chatroom] LLM call failed", err);
			// Canned fallback for nudge keeps the room alive without a retry.
			if (kind === "nudge") {
				reply = { content: pickTemplate(NUDGE_TEMPLATES, room.userName ?? "") };
			} else {
				// Other phases: retry on next ambient tick. Clear the typing
				// indicator since no message will land this cycle.
				this.broadcast({ type: "typing", agentId: null });
				await this.ctx.storage.setAlarm(Date.now() + LLM_RETRY_DELAY_MS);
				return;
			}
		}

		if (reply.usage) {
			addSpend(this.env, estimateCost(reply.usage)).catch(() => {});
		}

		const inserted = this.insertMessage({
			role: "agent",
			agent_id: persona.id,
			author: persona.name,
			content: reply.content,
		});
		this.broadcast({ type: "message", message: toWire(inserted) });
		this.incrementTurns();

		const next = this.getRoom();
		if (!next) return;

		// In dev, post a one-time inline divider when the conversation crosses
		// the production turn cap so it's visually obvious "everything past
		// here is dev-only behavior I'm watching."
		if (
			next.mode === "dev" &&
			!next.cutoffInserted &&
			next.turnsUsed >= MAX_TURNS_PROD
		) {
			const sysMsg = this.insertMessage({
				role: "system",
				agent_id: null,
				author: "—",
				content: `Production cutoff — dev session continues (${MAX_TURNS_PROD} turns).`,
			});
			this.broadcast({ type: "message", message: toWire(sysMsg) });
			this.ctx.storage.sql.exec(`UPDATE room SET cutoff_inserted = 1 WHERE id = 1`);
		}

		if (next.turnsUsed >= effectiveMaxTurns(next)) {
			this.endRoom("turn_cap");
			return;
		}

		await this.advancePhase(next);
	}

	private async advancePhase(room: RoomState) {
		const newTurn = room.phaseTurn + 1;

		if (room.phase === "opening" || room.phase === "responding") {
			if (newTurn < 2) {
				this.setPhaseTurn(newTurn);
				const delay = room.phase === "responding" ? RESPONDING_PAIR_DELAY_MS : OPENING_BEAT_MS;
				await this.ctx.storage.setAlarm(Date.now() + delay);
				return;
			}
			// Two turns done — pause for the user.
			this.setPhase("awaiting_user", 0);
			await this.ctx.storage.setAlarm(Date.now() + WAIT_FOR_USER_MS);
			return;
		}

		if (room.phase === "nudging") {
			// Nudge produced; wait for the user to respond. phaseTurn=1
			// signals "produced" so a subsequent alarm fires the idle path.
			this.setPhaseTurn(1);
			await this.ctx.storage.setAlarm(Date.now() + WAIT_AFTER_NUDGE_MS);
			return;
		}
	}

	private setPhase(phase: Phase, phaseTurn: number) {
		this.ctx.storage.sql.exec(
			`UPDATE room SET phase = ?, phase_turn = ? WHERE id = 1`,
			phase,
			phaseTurn,
		);
		this.broadcast({ type: "phase", phase });
	}

	private setPhaseTurn(n: number) {
		this.ctx.storage.sql.exec(`UPDATE room SET phase_turn = ? WHERE id = 1`, n);
	}

	// ── SQL helpers ──────────────────────────────────────────────────────

	private getRoom(): RoomState | null {
		const rows = this.ctx.storage.sql
			.exec<RoomRow>(`SELECT * FROM room WHERE id = 1`)
			.toArray();
		if (rows.length === 0) return null;
		const row = rows[0];

		// Resolve title: free-form override beats curated lookup.
		let topicTitle: string;
		let topicId: string | null;
		if (row.topic_title) {
			topicTitle = row.topic_title;
			topicId = row.topic_id === "custom" ? null : row.topic_id;
		} else {
			const t = getTopic(row.topic_id);
			topicTitle = t?.title ?? row.topic_id;
			topicId = row.topic_id;
		}

		let agentIds: string[];
		try {
			agentIds = JSON.parse(row.agent_ids);
		} catch {
			agentIds = pickAgents();
		}

		return {
			topicTitle,
			topicId,
			agentIds,
			turnsUsed: row.turns_used,
			status: row.status === "ended" ? "ended" : "active",
			lastUserAt: row.last_user_at,
			phase: normalizePhase(row.phase),
			phaseTurn: row.phase_turn ?? 0,
			topicChanges: row.topic_changes ?? 0,
			userName: row.user_name,
			userAvatar: row.user_avatar,
			mode: row.mode === "dev" ? "dev" : "prod",
			cutoffInserted: !!row.cutoff_inserted,
			autoNudgeUsed: !!row.auto_nudge_used,
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

	private insertMessage(msg: { role: MessageRole; agent_id: string | null; author: string; content: string }): DBMessage {
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

function effectiveMaxTurns(room: RoomState): number {
	return room.mode === "dev" ? MAX_TURNS_DEV : MAX_TURNS_PROD;
}

function normalizePhase(raw: string | null | undefined): Phase {
	switch (raw) {
		case "awaiting_user":
		case "nudging":
		case "responding":
		case "idle":
			return raw;
		default:
			return "opening";
	}
}

function kindForPhase(phase: Phase, isFirstAgentTurn: boolean): TurnKind {
	if (phase === "nudging") return "nudge";
	if (phase === "opening" && isFirstAgentTurn) return "opener";
	return "normal";
}

function pickSpeaker(agentIds: string[], messages: DBMessage[]): string {
	if (messages.length === 0) {
		return agentIds[Math.floor(Math.random() * agentIds.length)];
	}

	const last = messages[messages.length - 1];
	if (last.role === "user") {
		const lower = last.content.toLowerCase();
		for (const id of agentIds) {
			const p = getPersona(id);
			if (p && lower.includes(p.name.toLowerCase())) return id;
		}
	}

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

type AnthropicResponse = {
	content?: Array<{ type: string; text?: string }>;
	usage?: AnthropicUsage;
	stop_reason?: string;
};

async function callLLM(
	env: Env,
	ctx: CallContext,
): Promise<{ content: string; usage?: AnthropicUsage }> {
	const apiKey = env.VERCEL_AI_GATEWAY_KEY;
	if (!apiKey) throw new Error("VERCEL_AI_GATEWAY_KEY is not set");

	const userMessage = buildUserMessage(ctx);
	const maxTokens = ctx.kind === "nudge" ? NUDGE_OUTPUT_TOKENS : MAX_OUTPUT_TOKENS;

	const res = await fetch(VERCEL_GATEWAY_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
			"anthropic-version": "2023-06-01",
		},
		body: JSON.stringify({
			model: HAIKU_MODEL,
			max_tokens: maxTokens,
			system: [
				{
					type: "text",
					text: ctx.persona.systemPrompt,
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

function buildUserMessage(ctx: CallContext): string {
	// Most recent system message is the active topic-change pivot prompt.
	// On a fresh room there is none — agents open with a turn of their own.
	let activeSystem: DBMessage | null = null;
	for (const m of ctx.transcript) {
		if (m.role === "system") activeSystem = m;
	}
	const conversation = ctx.transcript.filter((m) => m.role !== "system");
	const me = ctx.userName?.trim() || "the visitor";

	// Opener kind: this agent IS the conversation's opening voice. No prior
	// agent context exists since the most recent prompt boundary.
	if (ctx.kind === "opener") {
		const headline = activeSystem
			? `The topic just changed: "${activeSystem.content}"`
			: `Topic: ${ctx.topicTitle}.`;
		const inspiration = ctx.openerInspiration
			? `\n\nA seed thought you can riff off (paraphrase it in your own voice — don't quote): "${ctx.openerInspiration}"`
			: "";
		const recentLines =
			conversation.length > 0
				? `\n\nRecent chat (for context — but the topic has changed, pivot away):\n${conversation
						.slice(-4)
						.map((m) => `[${m.author}]: ${m.content}`)
						.join("\n")}`
				: "";
		return `${headline}${inspiration}${recentLines}\n\nYou (${ctx.persona.name}) are opening this conversation. Pick a hook a stranger reading along can follow. Don't preface or stage-set — just dive in with your take.`;
	}

	const promptLine = activeSystem
		? `Conversation prompt: "${activeSystem.content}"`
		: `Topic: ${ctx.topicTitle}.`;
	const lines = conversation.map((m) => `[${m.author}]: ${m.content}`).join("\n");

	let instruction: string;
	if (ctx.kind === "nudge") {
		instruction = `${me} is in the chat reading along but hasn't said anything yet. Address ${me} directly by name (or as "you" if that's what's natural) and ask what they think — be specific about something just said. Keep it natural, like you're inviting them in. One short sentence.`;
	} else {
		instruction = `Your turn (${ctx.persona.name}).`;
	}

	return `${promptLine}\n\nRecent chat:\n${lines}\n\n${instruction}`;
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
			if (!env.TICKET_SECRET) {
				return new Response("Server misconfigured: TICKET_SECRET unset", {
					status: 500,
					headers: CORS_HEADERS,
				});
			}
			const ticket = url.searchParams.get("ticket");
			if (!ticket) {
				return new Response("Missing ticket", {
					status: 401,
					headers: CORS_HEADERS,
				});
			}
			const verification = await verifyTicket(roomId, ticket, env.TICKET_SECRET);
			if (!verification.valid) {
				return new Response("Invalid or expired ticket", {
					status: 401,
					headers: CORS_HEADERS,
				});
			}
			// Forward the verified mode to the DO via an internal header.
			// Clients can't forge this — we set it after HMAC verification on
			// every upgrade, and the DO only treats it as authoritative.
			const modeHeaders = new Headers(request.headers);
			modeHeaders.set("X-Chatroom-Mode", verification.mode);
			const forwarded = new Request(request, { headers: modeHeaders });
			return room.fetch(forwarded);
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
