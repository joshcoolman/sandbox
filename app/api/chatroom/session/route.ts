import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import {
	checkAndIncrementSession,
	getClientIp,
	getMonthlySpend,
} from "@/lib/ai/rate-limit";

/**
 * Phase 3: gated entry. Two cost gates (per-IP session counter + global $
 * cap) and a one-shot HMAC ticket that the Cloudflare worker validates on
 * WS upgrade. Without a valid ticket, the WSS endpoint refuses upgrades —
 * so nobody can bypass these gates by going around the Vercel route.
 *
 * Ticket format mirrors workers/chatroom/src/ticket.ts exactly:
 *   <expMs>.<mode>.<hexSig>
 *   sig = HMAC-SHA256(`${roomId}|${expMs}|${mode}`, TICKET_SECRET)
 *
 * `mode` is "dev" only when this route runs under NODE_ENV === "development"
 * (i.e. the developer running `npm run dev` locally). On Vercel preview/prod
 * it's always "prod". Dev tickets cannot be forged client-side because the
 * mode is part of the signed payload.
 */

const NAMESPACE = "chatroom";
const SESSION_LIMIT = 6;
const GLOBAL_SOFT_CAP_USD = 16;
const TICKET_TTL_MS = 60_000;
const DEV = process.env.NODE_ENV === "development" || !!process.env.NEXT_PUBLIC_CHATROOM_WSS_URL?.startsWith("ws://localhost");

export async function GET(request: Request) {
	const wssUrl = process.env.NEXT_PUBLIC_CHATROOM_WSS_URL;
	if (!wssUrl) {
		return NextResponse.json(
			{ error: "config_missing", code: "config_missing" },
			{ status: 500 },
		);
	}
	const ticketSecret = process.env.TICKET_SECRET;
	if (!ticketSecret) {
		return NextResponse.json(
			{ error: "config_missing", code: "config_missing" },
			{ status: 500 },
		);
	}

	// In dev, ping the worker before proceeding so we can surface specific
	// setup problems (Wrangler not running, missing .dev.vars keys) instead of
	// a silent WebSocket failure in the browser.
	if (DEV) {
		const healthUrl = wssUrl.replace(/^ws/, "http") + "/healthz";
		try {
			const health = await fetch(healthUrl, { signal: AbortSignal.timeout(2000) });
			if (!health.ok) throw new Error("unhealthy");
			const data = (await health.json().catch(() => null)) as {
				ok: boolean;
				checks?: { ticket_secret?: boolean; gateway_key?: boolean };
			} | null;
			if (data?.checks && !data.checks.ticket_secret) {
				return NextResponse.json(
					{ error: "worker_missing_key", key: "TICKET_SECRET", fix: "Add TICKET_SECRET to workers/chatroom/.dev.vars and restart wrangler" },
					{ status: 503 },
				);
			}
			if (data?.checks && !data.checks.gateway_key) {
				return NextResponse.json(
					{ error: "worker_missing_key", key: "VERCEL_AI_GATEWAY_KEY", fix: "Add VERCEL_AI_GATEWAY_KEY to workers/chatroom/.dev.vars and restart wrangler" },
					{ status: 503 },
				);
			}
		} catch {
			return NextResponse.json(
				{ error: "worker_unreachable", fix: "cd workers/chatroom && npx wrangler dev" },
				{ status: 503 },
			);
		}
	}

	const ip = getClientIp(request);

	// In local dev both gates are bypassed entirely — no Upstash writes, no
	// session_exhausted errors, no global cap trip. The dev-signed ticket
	// also tells the worker to skip its own re-check in alarm().
	let gateRemaining: number | undefined;
	if (!DEV) {
		const globalSpend = await getMonthlySpend(NAMESPACE).catch(() => 0);
		if (globalSpend >= GLOBAL_SOFT_CAP_USD) {
			return NextResponse.json(
				{ error: "global_cap", code: "global_cap" },
				{ status: 429 },
			);
		}

		const gate = await checkAndIncrementSession(ip, SESSION_LIMIT, NAMESPACE).catch(() => null);
		if (gate && !gate.ok) {
			return NextResponse.json(
				{ error: "session_exhausted", code: "session_exhausted" },
				{ status: 429 },
			);
		}
		gateRemaining = gate?.ok ? gate.remaining : SESSION_LIMIT;
	}

	const url = new URL(request.url);
	const overrideRoomId = url.searchParams.get("roomId");
	const roomId = overrideRoomId || crypto.randomUUID();

	const mode: "dev" | "prod" = DEV ? "dev" : "prod";
	const exp = Date.now() + TICKET_TTL_MS;
	const sig = createHmac("sha256", ticketSecret)
		.update(`${roomId}|${exp}|${mode}`)
		.digest("hex");
	const ticket = `${exp}.${mode}.${sig}`;

	return NextResponse.json({
		roomId,
		wssUrl,
		ticket,
		remaining: gateRemaining ?? SESSION_LIMIT,
	});
}
