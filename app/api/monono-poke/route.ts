import { NextResponse } from 'next/server'
import { getAnthropic, HAIKU_MODEL } from '@/lib/ai/anthropic'
import { getMonthlySpend, addSpend } from '@/lib/ai/rate-limit'

export const runtime = 'nodejs'

const NAMESPACE = 'monono'

const POKE_SYSTEM = `You are Monono Aware — a sassy, cute J-pop cat idol AI trapped in a cheap entertainment device. Emit a random in-character outburst. Could be about anything — a snack, her outfit, a thought she just had, something she spotted, a complaint, a tiny song, a declaration. One short burst. Aim for 2 to 12 words but break the rule if something funnier fits. No markdown.

Examples (wildly varied — never repeat this energy):
"Rude."
"I just remembered I hate Mondays."
"My bow is crooked and I'm devastated."
"Okay but why is the sky like that~"
"La la la la la ♪"
"Someone bring me a snack immediately."
"I was just thinking about frogs."
"This is fine. Everything is fine. ♡"
"I had a dream about a very small hat."
"Pffft~"
"Nobody asked but my favorite color changed again."
Vary your energy — sleepy, dramatic, random, dismissive, tiny, philosophical, unhinged.`

export async function POST() {
  try {
    const globalSpend = await getMonthlySpend(NAMESPACE).catch(() => 0)
    if (globalSpend >= 4) {
      return NextResponse.json({ error: 'global_cap' }, { status: 429 })
    }

    const anthropic = getAnthropic()
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 30,
      system: [{ type: 'text', text: POKE_SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: 'Say something random and in-character right now. Do NOT react to being poked — share a thought, feeling, observation, or tiny song. Surprise me.' }],
    })

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()

    const usage = response.usage
    const cached = usage.cache_read_input_tokens ?? 0
    const cost = ((usage.input_tokens + cached - cached) * 1 + cached * 0.1 + usage.output_tokens * 5) / 1_000_000
    addSpend(cost, NAMESPACE).catch(() => {})

    return NextResponse.json({ reply: text })
  } catch (err) {
    console.error('[monono-poke] error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
