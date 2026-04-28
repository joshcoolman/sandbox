import { DurableObject } from "cloudflare:workers";

/**
 * Phase 1 — tutorial-shaped echo room.
 *
 * Each visitor gets a fresh roomId from /api/chatroom/session in the Next app,
 * which routes here as wss://<worker>/rooms/:roomId/ws. Messages persist in
 * the DO's SQLite database so they survive hibernation and re-render on
 * reconnect. No LLM, no ticket auth, no rate limits yet — those land in
 * Phases 2 and 3.
 *
 * Mirrors github.com/jillesme/finally-durable-objects-click. See the
 * experiment README for the full spec.
 */

type Message = {
	id: number;
	author: string;
	content: string;
	created_at: number;
};

const CORS_HEADERS = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, OPTIONS",
	"access-control-allow-headers": "Content-Type",
} as const;

export class ChatroomDO extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		// Heartbeat pings get an automatic "pong" without waking the DO from
		// hibernation. Without this line, the WS keep-alive defeats the whole
		// point of the hibernation API.
		this.ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair("ping", "pong"),
		);

		ctx.blockConcurrencyWhile(async () => {
			this.ctx.storage.sql.exec(`
				CREATE TABLE IF NOT EXISTS messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					author TEXT NOT NULL,
					content TEXT NOT NULL,
					created_at INTEGER NOT NULL
				)
			`);
		});
	}

	async getMessages(): Promise<Message[]> {
		return this.ctx.storage.sql
			.exec<Message>("SELECT * FROM messages ORDER BY created_at ASC")
			.toArray();
	}

	async fetch(_request: Request): Promise<Response> {
		const pair = new WebSocketPair();
		const [client, server] = Object.values(pair);

		// Hibernation API. NOT server.accept() — that's the legacy non-hibernating
		// path and would silently disable hibernation.
		this.ctx.acceptWebSocket(server);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(_ws: WebSocket, data: string | ArrayBuffer) {
		if (typeof data !== "string") return;

		let parsed: { author?: unknown; content?: unknown };
		try {
			parsed = JSON.parse(data);
		} catch {
			return;
		}

		const author = typeof parsed.author === "string" ? parsed.author.slice(0, 32) : "anon";
		const content = typeof parsed.content === "string" ? parsed.content.slice(0, 500) : "";
		if (!content.trim()) return;

		const message = this.ctx.storage.sql
			.exec<Message>(
				"INSERT INTO messages (author, content, created_at) VALUES (?, ?, ?) RETURNING *",
				author,
				content,
				Date.now(),
			)
			.one();

		const payload = JSON.stringify(message);
		for (const socket of this.ctx.getWebSockets()) {
			try {
				socket.send(payload);
			} catch {
				// Socket may have closed mid-broadcast; ignore.
			}
		}
	}

	// webSocketClose intentionally omitted — with compatibility_date >= 2026-04-07
	// the runtime auto-replies to Close frames.
}

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

		// kind === "messages"
		if (request.method !== "GET") {
			return new Response("Method not allowed", {
				status: 405,
				headers: CORS_HEADERS,
			});
		}

		const messages = await room.getMessages();
		return Response.json(messages, { headers: CORS_HEADERS });
	},
} satisfies ExportedHandler<Env>;
