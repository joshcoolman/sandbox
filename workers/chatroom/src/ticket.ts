/**
 * One-shot HMAC ticket for WS upgrade gating.
 *
 * Format:  <expMs>.<mode>.<hexSig>
 * Payload: roomId | expMs | mode      (no IP — local Vercel dev calls the
 *                                       deployed Worker, IPs would mismatch)
 *
 * `mode` is signed in so a dev-mode ticket can only be minted by a session
 * route that actually saw NODE_ENV === "development". Without this, any
 * client could request dev privileges and bypass production caps.
 *
 * The 60s TTL is the main protection against replay; IP-binding gave
 * marginal value at the cost of breaking local dev. Phase 3 trade-off.
 */

const TTL_MS = 60_000;

export type TicketMode = "dev" | "prod";

export type TicketVerification =
	| { valid: true; mode: TicketMode }
	| { valid: false };

function normalizeMode(raw: string): TicketMode {
	return raw === "dev" ? "dev" : "prod";
}

export async function signTicket(roomId: string, mode: TicketMode, secret: string): Promise<string> {
	const exp = Date.now() + TTL_MS;
	const safeMode: TicketMode = mode === "dev" ? "dev" : "prod";
	const payload = `${roomId}|${exp}|${safeMode}`;
	const sig = await hmacHex(payload, secret);
	return `${exp}.${safeMode}.${sig}`;
}

export async function verifyTicket(roomId: string, ticket: string, secret: string): Promise<TicketVerification> {
	const parts = ticket.split(".");
	if (parts.length !== 3) return { valid: false };
	const [expStr, modeStr, sig] = parts;

	const exp = Number(expStr);
	if (!Number.isFinite(exp) || exp < Date.now()) return { valid: false };

	const mode = normalizeMode(modeStr);
	const payload = `${roomId}|${exp}|${mode}`;
	const expected = await hmacHex(payload, secret);
	if (!timingSafeEq(expected, sig)) return { valid: false };

	return { valid: true, mode };
}

async function hmacHex(payload: string, secret: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
	return bufferToHex(sig);
}

function bufferToHex(buf: ArrayBuffer): string {
	const bytes = new Uint8Array(buf);
	let s = "";
	for (let i = 0; i < bytes.length; i++) {
		s += bytes[i].toString(16).padStart(2, "0");
	}
	return s;
}

function timingSafeEq(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}
