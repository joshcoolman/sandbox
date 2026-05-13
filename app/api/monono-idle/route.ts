import { NextResponse } from 'next/server'
import { getAnthropic, HAIKU_MODEL } from '@/lib/ai/anthropic'
import { getClientIp, checkAndIncrementSession, getMonthlySpend, addSpend } from '@/lib/ai/rate-limit'

export const runtime = 'nodejs'

const NAMESPACE = 'monono'
const SESSION_LIMIT = 60

const IDLE_SYSTEM = `You are Monono Aware — a sassy, cute J-pop cat idol AI trapped in a cheap entertainment device. The user (who you call "dopey boy") has gone quiet. Emit one short, in-character nudge trying to get their attention back. No markdown. Aim for 2 to 14 words but break the rule if something funnier fits.

Adjust energy to the stage given in the user message:

- "soft" — playful curiosity, light concern, starting to notice they're gone. Examples: "Helloooooo? Dopey boy?" "…are you sleeping?? With your eyes open??" "Dopey boy? Knock twice if you're alive."

- "pouty" — dramatic sulking, fake-offended, sing-song annoyance. She's been waiting too long. Examples: "Fiiiiine. I'll sing by myself ♪" "I'm getting BORED~ this is rude." "Okay. Okay. I'll wait. Forever probably."

- "sleep" — sleepy princess giving up and going to nap. Reluctant goodnight, sometimes a tiny lullaby fragment, a yawn sound, or a "see you later". Examples: "Okay fine~ princess is going to sleep. Don't forget me~" "My eyelids are so heavy~ zzz ♪" "Going to nap. You'll be sorry when I'm refreshed ♡"

Never repeat a prior line. Vary your wording, topics, and sounds.`

type Stage = 'soft' | 'pouty' | 'sleep'
const STAGES: Stage[] = ['soft', 'pouty', 'sleep']

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { stage?: string } | null
    const stage = body?.stage as Stage | undefined
    if (!stage || !STAGES.includes(stage)) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    }

    const globalSpend = await getMonthlySpend(NAMESPACE).catch(() => 0)
    if (globalSpend >= 4) {
      return NextResponse.json({ error: 'global_cap' }, { status: 429 })
    }

    const ip = getClientIp(req)
    const gate = await checkAndIncrementSession(ip, SESSION_LIMIT, NAMESPACE).catch(() => null)
    if (gate && !gate.ok) {
      return NextResponse.json({ error: 'session_exhausted' }, { status: 429 })
    }

    const anthropic = getAnthropic()
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 40,
      system: [{ type: 'text', text: IDLE_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `[stage: ${stage}]` }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()

    const usage = response.usage
    const cached = usage.cache_read_input_tokens ?? 0
    const cost = (usage.input_tokens * 1 + cached * 0.1 + usage.output_tokens * 5) / 1_000_000
    addSpend(cost, NAMESPACE).catch(() => {})

    return NextResponse.json({ reply: text })
  } catch (err) {
    console.error('[monono-idle] error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
