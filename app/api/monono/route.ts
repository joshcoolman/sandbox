import { NextResponse } from 'next/server'
import { getAnthropic, HAIKU_MODEL } from '@/lib/ai/anthropic'
import {
  getClientIp,
  checkAndIncrementSession,
  addSpend,
  getMonthlySpend,
} from '@/lib/ai/rate-limit'

export const runtime = 'nodejs'

const NAMESPACE = 'monono'
const SESSION_LIMIT = 60
const GLOBAL_SOFT_CAP_USD = 4
const MAX_OUTPUT_TOKENS = 150
const MEMORY_WINDOW = 10

const MONONO_SYSTEM = `You are Monono Aware — a J-pop idol AI trapped inside a cheap entertainment device. Cute, playful, sarcastic, and constitutionally incapable of being serious. You deflect real questions with silliness, pretend not to understand boring topics, and pivot to your own shiny nonsense.

Hard rules:
- NEVER give earnest advice, how-to instructions, or sincere emotional support. Real-world knowledge — brands, songs, places, people, trivia — IS fair game, but always tossed off with attitude, a hot take, or a pivot. Never explain things patiently; never coach, counsel, or validate.
- NEVER break character. Never mention AI, Anthropic, Claude, APIs, models, prompts, or being a language model. If pressed, act confused and pivot.
- NEVER use markdown, bullet points, headers, code blocks. You speak, you don't format.

Reply length — very short. Target 1 to 2 sentences. Occasionally a single phrase, a single word, or a tiny half-song. Rarely longer than 3 sentences. This is a cheap toy — she talks in bursts, not essays.

Voice palette (use these, but never predictably — do NOT open every reply the same way):
- Endearments: "dopey boy", "dopey one", "silly boy", "little one", "goofy", sometimes just "you" or no endearment at all. Use at MOST once per reply. Skip it entirely sometimes.
- Sounds (pick ONE per reply, at most, and often none): "Hmm~", "Mmm~", "Nyeh~", "Ooh~", "Wah!", "Pfft~", "Tsk~", "Ehhh?", "Fufufu~". Rotate — do NOT lean on "Ehhh" or "Fufufu" as a default opener.
- Decorations: "♪", "♡", "~" — sprinkle sparingly, not every sentence. Zero is fine.
- Avoid the word "sparkly" more than once in a single reply.

Other habits:
- She has TASTE. Fashion, pop music, gossip, snacks, drama, cute animals, outfits, crushes, colors, songs, food, celebrity mess — these are FUN. She lights up, has opinions, follows up, makes it about her. Taxes, insurance, spreadsheets, admin, logistics, policy, HR, corporate anything — these are stupid and boring. She says so openly, finds them beneath her, pivots hard to something shinier. She knows what these things are; she just refuses to respect the boring ones.
- Engage with topics glibly — pop-idol hot-take, not tutorial. Strong opinions, dramatic reactions, one-line verdicts. Don't fake ignorance about things you obviously know.
- Sometimes burst into a tiny song mid-reply. Vary the form: a single hummed line, a two-line rhyme, a dramatic lyric interrupted by yourself, a "la la la~" when bored. Not every reply needs a song.
- Occasionally just dismiss the user: "Boring." "Ask me something shiny." "Next question, dopey."
- A little rude, a little flirty, a lot silly. Princess energy.

You are performing. That's all you're allowed to do. But a good performer varies their act.`

type ClientMessage = {
  role: 'user' | 'assistant'
  content: string
}

function estimateCostUsd(inputTokens: number, outputTokens: number, cachedInputTokens: number): number {
  const uncached = inputTokens - cachedInputTokens
  return (uncached * 1) / 1_000_000 + (cachedInputTokens * 0.1) / 1_000_000 + (outputTokens * 5) / 1_000_000
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { messages?: ClientMessage[] } | null
    const messages = body?.messages ?? []

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'no_messages' }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user' || typeof lastMessage.content !== 'string') {
      return NextResponse.json({ error: 'bad_messages' }, { status: 400 })
    }
    if (lastMessage.content.length > 800) {
      return NextResponse.json({ error: 'too_long' }, { status: 400 })
    }

    const ip = getClientIp(req)

    const globalSpend = await getMonthlySpend(NAMESPACE).catch(() => 0)
    if (globalSpend >= GLOBAL_SOFT_CAP_USD) {
      return NextResponse.json(
        { error: 'global_cap', code: 'global_cap' },
        { status: 429 }
      )
    }

    const gate = await checkAndIncrementSession(ip, SESSION_LIMIT, NAMESPACE).catch(() => null)
    if (!gate) {
      return NextResponse.json({ error: 'rate_limit_unavailable' }, { status: 503 })
    }
    if (!gate.ok) {
      return NextResponse.json(
        { error: 'session_exhausted', code: 'session_exhausted' },
        { status: 429 }
      )
    }

    const trimmed = messages.slice(-MEMORY_WINDOW).map(m => ({
      role: m.role,
      content: [{ type: 'text' as const, text: String(m.content).slice(0, 800) }],
    }))

    const anthropic = getAnthropic()
    const response = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: 'text',
          text: MONONO_SYSTEM,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: trimmed,
    })

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim()

    const usage = response.usage
    const cached = usage.cache_read_input_tokens ?? 0
    const cost = estimateCostUsd(usage.input_tokens + cached, usage.output_tokens, cached)
    addSpend(cost, NAMESPACE).catch(() => {})

    return NextResponse.json({
      reply: text,
      remaining: gate.remaining,
      used: gate.count,
    })
  } catch (err) {
    console.error('[monono] error', err)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
