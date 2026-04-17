import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let checked = false

function getRedis(): Redis | null {
  if (checked) return redis
  checked = true
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn('[monono] Upstash not configured — rate limiting disabled')
    return null
  }
  redis = new Redis({ url, token })
  return redis
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = req.headers.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function secondsUntilNextMonth(): number {
  const now = new Date()
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return Math.max(60, Math.floor((next.getTime() - now.getTime()) / 1000))
}

export type SessionGate =
  | { ok: true; count: number; remaining: number }
  | { ok: false; reason: 'session_exhausted'; count: number }

export async function checkAndIncrementSession(
  ip: string,
  limit: number,
  namespace: string
): Promise<SessionGate> {
  const r = getRedis()
  if (!r || ip === 'unknown') {
    return { ok: true, count: 0, remaining: limit }
  }

  const key = `${namespace}:session:${currentMonthKey()}:${ip}`
  const count = await r.incr(key)
  if (count === 1) {
    await r.expire(key, secondsUntilNextMonth())
  }

  if (count > limit) {
    return { ok: false, reason: 'session_exhausted', count }
  }

  return { ok: true, count, remaining: Math.max(0, limit - count) }
}

export async function peekSession(
  ip: string,
  namespace: string
): Promise<number> {
  const r = getRedis()
  if (!r || ip === 'unknown') return 0
  const key = `${namespace}:session:${currentMonthKey()}:${ip}`
  const raw = await r.get<number>(key)
  return raw ?? 0
}

export async function clearSession(
  ip: string,
  namespace: string
): Promise<void> {
  const r = getRedis()
  if (!r || ip === 'unknown') return
  const key = `${namespace}:session:${currentMonthKey()}:${ip}`
  await r.del(key)
}

export async function addSpend(
  amountUsd: number,
  namespace: string
): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  const key = `${namespace}:spend:${currentMonthKey()}`
  const micro = Math.round(amountUsd * 1_000_000)
  const total = await r.incrby(key, micro)
  if (total === micro) {
    await r.expire(key, secondsUntilNextMonth())
  }
  return total / 1_000_000
}

export async function getMonthlySpend(namespace: string): Promise<number> {
  const r = getRedis()
  if (!r) return 0
  const key = `${namespace}:spend:${currentMonthKey()}`
  const raw = await r.get<number>(key)
  return (raw ?? 0) / 1_000_000
}
