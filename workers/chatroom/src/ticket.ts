/**
 * One-shot HMAC ticket for WS upgrade gating.
 *
 * Format:  <expMs>.<hexSig>
 * Payload: roomId | expMs              (no IP — local Vercel dev calls the
 *                                       deployed Worker, IPs would mismatch)
 *
 * The 60s TTL is the main protection; IP-binding gave marginal value at
 * the cost of breaking local dev. Phase 3 trade-off accepted.
 */

const TTL_MS = 60_000;

export async function signTicket(roomId: string, secret: string): Promise<string> {
	const exp = Date.now() + TTL_MS;
	const payload = `${roomId}|${exp}`;
	const sig = await hmacHex(payload, secret);
	return `${exp}.${sig}`;
}

export async function verifyTicket(roomId: string, ticket: string, secret: string): Promise<boolean> {
	const dot = ticket.indexOf(".");
	if (dot < 0) return false;
	const expStr = ticket.slice(0, dot);
	const sig = ticket.slice(dot + 1);
	const exp = Number(expStr);
	if (!Number.isFinite(exp) || exp < Date.now()) return false;

	const payload = `${roomId}|${exp}`;
	const expected = await hmacHex(payload, secret);
	return timingSafeEq(expected, sig);
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
