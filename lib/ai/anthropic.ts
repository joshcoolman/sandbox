import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!client) {
    const apiKey = process.env.VERCEL_AI_GATEWAY_KEY
    if (!apiKey) throw new Error('VERCEL_AI_GATEWAY_KEY is not set')
    client = new Anthropic({
      apiKey,
      baseURL: 'https://ai-gateway.vercel.sh',
    })
  }
  return client
}

export const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'
