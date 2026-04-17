# Monono

First AI-backed experiment in this sandbox. A J-pop idol persona ("Monono Aware") trapped in a cheap "entertainment core" device. Live calls to Anthropic Haiku, per-IP rate limiting, monthly spend cap. **This repo is public — safety rails here are load-bearing, not decorative.**

## Architecture

```
page.tsx
  └─ MononoChat.tsx                 (client, holds turn history, idle nudges, session state)
       └─ POST /api/monono
            ├─ lib/ai/rate-limit.ts (Upstash Redis: session counter + monthly spend)
            └─ lib/ai/anthropic.ts  (singleton SDK client) → Anthropic Haiku
```

Memory lives on the client. The server is stateless per request — it receives the trimmed history each call. Idle/greeting/cutoff/error lines are canned (`data/voice.ts`) and never hit the API.

## Key files

- `app/api/monono/route.ts:18` — `MONONO_SYSTEM` system prompt. Edit with care, never weaken the "no earnest advice / never break character / no markdown" rules. World knowledge (brands, songs, trivia) IS allowed and makes her funnier — the ban is on earnest explanation, how-to, and sincere emotional support, not on knowing things.
- `app/api/monono/route.ts:13-16` — tunables: `SESSION_LIMIT`, `GLOBAL_SOFT_CAP_USD`, `MAX_OUTPUT_TOKENS`, `MEMORY_WINDOW`.
- `app/api/monono/route.ts:47` — `estimateCostUsd`; rates hard-coded to Haiku 4.5.
- `lib/ai/anthropic.ts` — singleton Anthropic-SDK client pointed at Vercel AI Gateway (`baseURL: https://ai-gateway.vercel.sh`). `HAIKU_MODEL` is `anthropic/claude-haiku-4.5` (Gateway-prefixed).
- `lib/ai/rate-limit.ts` — Upstash counters, namespaced keys, fails **open** if Upstash env vars are missing (dev ergonomics — don't ship that way).
- `components/MononoSprite.tsx` — weighted resting-sprite rotation, blink + talk frames; sprites preloaded as absolutely-positioned `<Image>`s with opacity toggled for zero-flash swaps.
- `components/MononoChat.tsx` — chat shell, idle-nudge timers (30s soft, 90s pouty), session cutoff flow.
- `data/voice.ts` — canned copy. Adding new idle/cutoff variants here costs nothing. Prefer this to round-tripping the API for anything deterministic.

## Safety rails — do not quietly unwind

| Rail | Value | Why |
| --- | --- | --- |
| Per-IP session cap | 60 req / IP / month | Bounds one visitor's cost |
| Global monthly spend soft cap | $4 USD | Trip switch for the whole experiment |
| Max output tokens | 150 | Haiku can still reply in bursts; no runaway generations |
| Memory window | 10 msgs | Context doesn't grow unboundedly as chats continue |
| Input length cap | 800 chars server, 500 in textarea | Payload / prompt-injection bound |
| System prompt caching | `cache_control: ephemeral` | ~10× cheaper on cache hits — never drop |
| Idle copy | `voice.ts`, not the API | Idle nudges are free |

## Cost model

Haiku 4.5 assumed rates (see `estimateCostUsd`) — Gateway charges Anthropic's list prices with zero markup:

- Input: $1.00 / M tokens
- Output: $5.00 / M tokens
- Cached input reads: $0.10 / M tokens

`response.usage.cache_read_input_tokens` tracks cache hits (passes through Gateway unchanged). Note `usage.input_tokens` returned by Anthropic is uncached-only; total input = `input_tokens + cache_read_input_tokens`.

## Env vars

- `VERCEL_AI_GATEWAY_KEY` — required; `getAnthropic()` throws without it. The client is the Anthropic SDK pointed at `https://ai-gateway.vercel.sh`. Model IDs use the `anthropic/` prefix.
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — required in production. Missing = rate-limit disabled with a console warning (fine locally, unsafe in prod).

## Why Gateway (and what still needs Upstash)

Gateway gives us: one key for many providers, zero markup on tokens, spend dashboard, request logs, provider fallbacks. Set the **hard** spend cap in the Vercel AI Gateway dashboard (per-project budget) — it replaces the old Anthropic-console key cap.

Gateway does **not** give us: per-IP / per-visitor rate limiting. Upstash stays exactly as it is — `lib/ai/rate-limit.ts` still enforces the 60/month/IP session cap and the $4 app-level soft cap. Those live above the Gateway.

## Character invariants (prompt-level)

When editing `MONONO_SYSTEM`, these three are non-negotiable:

1. Never break character (no "I'm an AI", no mentioning Anthropic / models / prompts).
2. Never use markdown, bullets, headers, or code blocks.
3. Short replies — target 1–2 sentences, occasionally a phrase or half-song.

The rest of the prompt (voice palette, sounds, endearments, pivot habits) is tunable.

## Patterns for future AI experiments

- Reuse `lib/ai/anthropic.ts` and `lib/ai/rate-limit.ts` verbatim.
- Give each new experiment its own `NAMESPACE` string in the route so Upstash keys don't collide (`'monono'` here).
- Put canned / deterministic copy in a `data/voice.ts`-style file. Only call the API for responses that actually need model intelligence.
- Keep the client-side memory window small and server-side truncated defensively — don't trust whatever the client sends.

## Development reset

When running locally and you trip the per-IP session cap (easy during dogfooding), a **Development Reset** button appears in the device below the input, styled pink-on-mono. Click it to:

- `POST /api/monono/reset` — deletes your Upstash `monono:session:<month>:<ip>` key (dev-only; the route returns 404 in prod)
- Client resets transcript, mood, and session state to a fresh greeting

Both the button and the endpoint guard on `process.env.NODE_ENV !== 'production'` — the button tree-shakes out of the prod bundle, and the reset route will 404 in prod even if someone POSTs to it directly. This does **not** clear the global `$4` spend cap; that's deliberate — if the global trips, think before resetting.

## Don'ts

- Don't bump `MAX_OUTPUT_TOKENS` or `SESSION_LIMIT` without recalculating the $4 cap.
- Don't swap the model without a cost review — Haiku pricing is baked into `estimateCostUsd`.
- Don't log user messages (the `console.error` path deliberately only logs the error).
- Don't add streaming without re-checking how `checkAndIncrementSession` increments — it runs pre-call and won't refund on stream failures.
- Don't remove the `cache_control` block on the system prompt.
- Don't add client-side persistence of the transcript (keep sessions ephemeral and the blast radius small).
