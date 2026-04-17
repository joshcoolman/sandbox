import { NextResponse } from 'next/server'
import { getClientIp, clearSession } from '@/lib/ai/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const ip = getClientIp(req)
  await clearSession(ip, 'monono').catch(() => {})
  return NextResponse.json({ ok: true })
}
