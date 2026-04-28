/**
 * Upstash Redis REST helpers, ported from sandbox/lib/ai/rate-limit.ts but
 * built on raw fetch (no @upstash/redis dep) to keep the Worker bundle tiny.
 *
 * Two state surfaces, both keyed by month:
 *   - per-IP session counter:  chatroom:session:YYYY-MM:IP   (INCR'd at entry)
 *   - global spend, micro-USD: chatroom:spend:YYYY-MM        (INCRBY after each LLM call)
 *
 * Independent from monono's namespace by design — each experiment owns its
 * own caps. Worst-case AI bill = sum of all experiments' caps.
 */

export type SessionGate =
	| { ok: true; count: number; remaining: number }
	| { ok: false; reason: "session_exhausted"; count: number };

const NAMESPACE = "chatroom";

function currentMonthKey(): string {
	const d = new Date();
	return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function secondsUntilNextMonth(): number {
	const now = new Date();
	const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
	return Math.max(60, Math.floor((next.getTime() - now.getTime()) / 1000));
}

type UpstashEnv = {
	UPSTASH_REDIS_REST_URL?: string;
	UPSTASH_REDIS_REST_TOKEN?: string;
};

function getCreds(env: UpstashEnv): { url: string; token: string } | null {
	const url = env.UPSTASH_REDIS_REST_URL;
	const token = env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) return null;
	return { url: url.replace(/\/$/, ""), token };
}

async function call<T>(env: UpstashEnv, path: string[]): Promise<T | null> {
	const creds = getCreds(env);
	if (!creds) return null;
	const segments = path.map((s) => encodeURIComponent(s)).join("/");
	const res = await fetch(`${creds.url}/${segments}`, {
		method: "POST",
		headers: { Authorization: `Bearer ${creds.token}` },
	});
	if (!res.ok) {
		// Fail open in dev; never crash the worker on rate-limit infra hiccups.
		console.warn("[chatroom] upstash call failed", res.status, await res.text().catch(() => ""));
		return null;
	}
	const json = (await res.json().catch(() => null)) as { result?: T } | null;
	return json?.result ?? null;
}

export function getClientIp(req: Request): string {
	const cf = req.headers.get("cf-connecting-ip");
	if (cf) return cf;
	const fwd = req.headers.get("x-forwarded-for");
	if (fwd) return fwd.split(",")[0].trim();
	const real = req.headers.get("x-real-ip");
	if (real) return real.trim();
	return "unknown";
}

export async function checkAndIncrementSession(
	env: UpstashEnv,
	ip: string,
	limit: number,
): Promise<SessionGate> {
	if (ip === "unknown") return { ok: true, count: 0, remaining: limit };
	const creds = getCreds(env);
	if (!creds) return { ok: true, count: 0, remaining: limit };

	const key = `${NAMESPACE}:session:${currentMonthKey()}:${ip}`;
	const count = (await call<number>(env, ["INCR", key])) ?? 0;
	if (count === 1) {
		await call(env, ["EXPIRE", key, String(secondsUntilNextMonth())]);
	}

	if (count > limit) {
		return { ok: false, reason: "session_exhausted", count };
	}
	return { ok: true, count, remaining: Math.max(0, limit - count) };
}

export async function clearSession(env: UpstashEnv, ip: string): Promise<void> {
	if (ip === "unknown") return;
	const key = `${NAMESPACE}:session:${currentMonthKey()}:${ip}`;
	await call(env, ["DEL", key]);
}

export async function addSpend(env: UpstashEnv, amountUsd: number): Promise<number> {
	if (amountUsd <= 0) return 0;
	const key = `${NAMESPACE}:spend:${currentMonthKey()}`;
	const micro = Math.round(amountUsd * 1_000_000);
	const total = (await call<number>(env, ["INCRBY", key, String(micro)])) ?? 0;
	if (total === micro) {
		await call(env, ["EXPIRE", key, String(secondsUntilNextMonth())]);
	}
	return total / 1_000_000;
}

export async function getMonthlySpend(env: UpstashEnv): Promise<number> {
	const key = `${NAMESPACE}:spend:${currentMonthKey()}`;
	const raw = await call<string>(env, ["GET", key]);
	if (raw == null) return 0;
	const n = Number(raw);
	return Number.isFinite(n) ? n / 1_000_000 : 0;
}

export type AnthropicUsage = {
	input_tokens: number;
	output_tokens: number;
	cache_read_input_tokens?: number;
	cache_creation_input_tokens?: number;
};

/**
 * Cost estimate in USD for a single Haiku 4.5 call. Matches monono's pricing
 * table: $1/1M uncached input, $0.10/1M cached read, $5/1M output. Cache
 * writes (1.25x input) are ignored — small overhead, matches monono.
 */
export function estimateCost(usage: AnthropicUsage | undefined): number {
	if (!usage) return 0;
	const uncached = usage.input_tokens;
	const cached = usage.cache_read_input_tokens ?? 0;
	return (
		(uncached * 1) / 1_000_000 +
		(cached * 0.1) / 1_000_000 +
		(usage.output_tokens * 5) / 1_000_000
	);
}
