#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')

const inputPath = process.env.INPUT
if (!inputPath) {
  console.error('INPUT env var required (path to videos JSON)')
  process.exit(1)
}

const videos = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))

if (videos.length === 0) {
  console.log('No videos found — skipping digest generation.')
  process.exit(0)
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a curator of AI/ML video content. Given a list of YouTube videos as JSON, create a clean digest for technical readers who build with AI.

Curation rules — keep:
- Technical deep-dives and paper explanations
- Tutorials with clear practical value (agent frameworks, coding tools, workflows)
- Significant model/product announcements from credible channels
- Research breakdowns from known AI educators

Curation rules — skip:
- Clickbait titles ("INSANE", "Everything changed", "You NEED this")
- Reaction videos, tier lists, opinion rants
- Obvious affiliate/sponsored content
- Non-English videos
- Low-signal reposts of content already covered elsewhere in the list

Output format — plain markdown only, no frontmatter:

Start with: **X videos worth watching — [date range]**

Then for each video:
**[Title]** — [Channel] ([date])
[One-sentence description of what you actually learn or see]
[url]

Group loosely by theme if natural clusters exist (e.g. "## Agent Frameworks", "## Model News", "## Coding Tools"). Aim for 8–15 videos total. If the list is thin, say so honestly — don't pad with noise.`

const today = new Date().toISOString().slice(0, 10)

const userContent = `Here are the recent AI/ML videos to curate:\n\n${JSON.stringify(videos, null, 2)}\n\nToday is ${today}.`

console.log(`Calling Claude with ${videos.length} videos...`)

const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 4096,
  system: [
    {
      type: 'text',
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
  ],
  messages: [{ role: 'user', content: userContent }],
})

// Inject clickable thumbnails — replace bare YouTube URLs with linked images
const rawContent = response.content[0].text
const digestContent = rawContent.replace(
  /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})[^\s]*/g,
  (match, videoId) => {
    const url = `https://youtube.com/watch?v=${videoId}`
    return `[![](https://img.youtube.com/vi/${videoId}/mqdefault.jpg)](${url})`
  }
)
const videoCount = (digestContent.match(/youtube\.com\/watch/g) || []).length

const formattedDate = new Date(today + 'T12:00:00Z').toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const frontmatter = `---
title: "AI News — ${formattedDate}"
date: ${today}
videoCount: ${videoCount}
---

`

const outputPath = path.join(repoRoot, 'news', `${today}.md`)
fs.writeFileSync(outputPath, frontmatter + digestContent)
console.log(`Written: news/${today}.md (${videoCount} videos)`)
console.log(`Cache: input_tokens=${response.usage.input_tokens}, cache_creation_input_tokens=${response.usage.cache_creation_input_tokens ?? 0}, cache_read_input_tokens=${response.usage.cache_read_input_tokens ?? 0}`)
