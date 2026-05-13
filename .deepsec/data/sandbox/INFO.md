# sandbox

Personal Next.js design experiments site. 20+ self-contained experiment routes,
a markdown blog, and two AI-backed chat experiments (Monono, Chatroom). No user
accounts, no database. Deployed on Vercel; AI calls route through Vercel AI Gateway.

## What this codebase does

Public portfolio/sketchpad. Most routes are purely client-side (canvas games, CSS
demos, animations). The only server-side attack surface is the AI proxy layer:
`/api/monono/*` and `/api/chatroom/*`. Everything else is static or read-only
server components.

## Auth shape

No traditional auth — no sessions, no JWTs, no middleware. AI endpoints are
protected by:

- `getClientIp(req)` — reads `x-forwarded-for` (first hop) or `x-real-ip`
- `checkAndIncrementSession(ip, limit, namespace)` — per-IP monthly counter in Upstash Redis
- `getMonthlySpend(namespace)` / `addSpend(cost, namespace)` — global USD cap in Redis
- HMAC-SHA256 tickets (`TICKET_SECRET`) — signed `<exp>.<mode>.<hexSig>`, issued by
  `/api/chatroom/session`, validated by the Cloudflare Worker on WebSocket upgrade

Rate limiting silently disables (returns `ok: true`) when Upstash env vars are absent —
by design for local dev, documented in README.

## Threat model

1. **AI cost abuse** (highest impact): hammering `/api/monono` or `/api/chatroom/session`
   to exhaust the monthly spend cap or generate large bills before the cap trips.
2. **IP spoofing**: `x-forwarded-for` is trusted without validation — proxy rotation
   can trivially bypass per-IP counters.
3. **Chatroom ticket replay/forgery**: HMAC tickets are one-shot but expire in 60s;
   the Cloudflare Worker is the final enforcement point.
4. No user data, no privileged ops — no auth bypass or data exfiltration angle.

## Project-specific patterns to flag

- `getClientIp()` takes first entry of `x-forwarded-for` unchecked — attacker-controlled
  header can spoof IP and bypass per-IP rate limits.
- `checkAndIncrementSession` / `getMonthlySpend` fail open (`ok: true`, spend = 0)
  when Redis is unavailable — transient Upstash outage removes all rate limiting.
- User message content is sliced to 800 chars and forwarded verbatim into the
  Anthropic `messages` array — flag any path where that slice is missing or bypassed.
- `roomId` in `/api/chatroom/session` is caller-supplied (`url.searchParams.get("roomId")`);
  it's signed into the HMAC but never validated as a UUID — confirm the Worker enforces format.

## Known false-positives

- `/api/monono/reset` and `/api/chatroom/reset` — intentional dev-only reset endpoints;
  both return 404 in production (`NODE_ENV === 'production'` guard).
- Rate limiting disabled without Upstash — expected, documented, local-dev only.
- `DEV` mode skips all Redis gates in `/api/chatroom/session` — intentional; the
  mode string (`"dev"`) is baked into the HMAC so the Worker knows to skip its own re-check.
- All non-AI experiments (canvas games, CSS demos, etc.) have no server code — flag
  noise from those client-only files is a false positive.
