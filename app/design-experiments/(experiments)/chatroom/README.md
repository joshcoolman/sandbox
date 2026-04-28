# Chatroom

A small chatroom where three AI agents are mid-conversation when you arrive. You join as the fourth participant. Refresh and you land in a brand-new room with a new topic; close the tab and nothing is saved.

This experiment combines the visual language of [Leaderboard](../leaderboard/) with the cost-protected LLM patterns of [monono](../monono/), then adds a realtime, server-driven cadence by extending into Cloudflare with a Hibernatable Durable Object over WebSockets.

It is the most architecturally ambitious experiment in the sandbox to date — two deploy targets, persistent per-session state in SQLite, server-driven turn cadence, and dual-layer cost gates. To keep that complexity tractable, it ships in five phases with a hard milestone gate between each one.

---

## Status

| Phase | What it proves | Status |
| --- | --- | --- |
| 0. Repo scaffold + this README | Folder structure exists, worker boots, `/healthz` returns ok | **Done** |
| 1. Tutorial-shaped echo room | WS plumbing + hibernation works end-to-end (no LLM) | **Done** |
| 2. Agents arrive | Three agents converse on a tick, user can interject | **Done** (cadence/voice still want tuning) |
| 3. Cost gates + ticket auth | Per-IP and global $ caps, signed WS upgrade | **Done** |
| 4. Leaderboard look + motion | Visual sibling of Leaderboard, springy entrance | Not started |
| 5. SEO + ship | Production build, worker deploy, gallery entry | Not started |

---

## Why Durable Objects

Three things in this experiment push past what a single Vercel route can comfortably do:

1. **Server-driven cadence.** Agents post on a tick whether or not you have typed. Client `setInterval` dies the moment a tab sleeps; we want the conversation to continue while you have the page open but unfocused.
2. **Long-lived connection with cheap idle.** Hibernation lets a room with no one talking cost essentially nothing — the WebSocket stays alive while the DO is evicted from memory.
3. **One actor per session.** Each visitor gets a private room; conversation history, agent personalities, and tick schedule all live in one place. No race conditions between "client polled" and "agent spoke."

A DO with `setAlarm()` and the WebSocket hibernation API hits all three. The architecture also leaves a clean upgrade path to multiplayer (one DO, many sockets) if we ever want it — but the v1 here is private-per-visitor.

---

## Architecture

```
Browser  ──WSS──▶  Cloudflare Worker  ──HTTPS──▶  Vercel AI Gateway  ──▶  Anthropic
   ▲                      │
   │                      ▼
   │              ChatroomDO (one per visitor; identity = fresh UUID)
   │              ├─ ctx.storage.sql        — messages + room state in SQLite
   │              ├─ ctx.acceptWebSocket()  — hibernation API
   │              ├─ ctx.setWebSocketAutoResponse(ping → pong)
   │              └─ ctx.storage.setAlarm() — next agent tick
   │
   └──HTTP──▶ Vercel /api/chatroom/session  — gates entry, mints roomId + signed ticket
```

**Two deploy targets joined by env vars:**

- **Vercel** owns this folder and `app/api/chatroom/session/`. The session route gates entry (per-IP + global $ cap) and returns `{ roomId, wssUrl, ticket }`. The page renders the chat UI and connects to the worker.
- **Cloudflare** owns `workers/chatroom/`. The worker validates the ticket, hands the WebSocket to the DO, and the DO handles everything else: state, agent turns, LLM calls, cost tracking.

**On ephemerality.** The DO uses SQLite-backed storage (the `new_sqlite_classes` migration), so messages survive hibernation — necessary because an alarm firing after the WS hibernates needs to read history. The "fresh on refresh" guarantee comes from a different mechanism: each visitor gets a brand-new `roomId` UUID minted by the session route. New name → new DO instance → empty SQLite. When the turn cap is hit, the DO calls `ctx.storage.deleteAll()` to keep the footprint trimmed; old DOs with no clients eventually get garbage-collected by Cloudflare.

---

## File map

```
app/design-experiments/(experiments)/chatroom/
├── README.md                      # this document
├── page.tsx                       # server shell, exports metadata
├── page.module.css                # background + layout (mirrors leaderboard)
├── types.ts                       # Message, Agent, Topic, WireEvent + spring presets
├── index.ts                       # barrel
├── data/
│   ├── agents.ts                  # display info for the 3 personas (no system prompts here)
│   └── topics.ts                  # curated openers (mirrors workers/chatroom/src/topics.ts)
├── hooks/
│   └── useChatroom.ts             # WSS lifecycle, message buffer, send()
└── components/
    ├── Chatroom.tsx               # main client component
    ├── MessageRow.tsx             # reuses leaderboard row grid
    ├── Composer.tsx               # textarea + char counter + turns-left
    └── AgentAvatar.tsx            # gradient + initials fallback (from leaderboard)

app/api/chatroom/
├── session/route.ts               # gates + signed ticket + wssUrl
└── reset/route.ts                 # dev-only IP counter clear

workers/chatroom/
├── wrangler.jsonc                 # SQLite DO binding, secrets
├── package.json                   # wrangler only
├── tsconfig.json
├── worker-configuration.d.ts      # wrangler types output
└── src/
    └── index.ts                   # ChatroomDO + router (single file until ~400 lines)
```

---

## Personas

Three archetypes, picked to actually disagree with each other. The conversation is the product, so the personalities have to push against each other.

- **The Optimist** — sees upside in everything, technologist energy. Warm gradient.
- **The Skeptic** — challenges premises, brings up second-order effects. Cool gradient.
- **The Philosopher** — abstracts to "what does this say about us." Muted gradient.

Each lives in `workers/chatroom/src/personas.ts` (server-only — system prompts never ship to the browser). The frontend `data/agents.ts` mirrors only the display fields: `id`, `name`, `gradient`, one-line `bio`.

System prompts cap output at "1–2 sentences, no markdown, no lists." Caching is `cache_control: { type: "ephemeral" }`, the same pattern monono uses.

## Topics

Curated list of six openers, picked at room construction:

- AI deepfakes
- Parasocial AI
- The death of search
- Attention as currency
- Taste in the age of generation
- What's worth doing by hand

Listed in both `workers/chatroom/src/topics.ts` and `data/topics.ts` (kept in sync by hand — small enough to not warrant a build step).

---

## Cost guardrails

Two independent gates, both must pass for an LLM call to happen.

**At entry (Vercel `/api/chatroom/session`):**

- Per-IP session counter via Upstash REST. `chatroom:session:YYYY-MM:IP`. Default `SESSION_LIMIT = 4` per IP per month.
- Global monthly spend cap **per experiment**. Uses its own namespace (`chatroom:spend:YYYY-MM`) — `lib/ai/rate-limit.ts` keys spend by namespace, so monono's `monono:spend:YYYY-MM` and chatroom's are independent. Total worst-case AI bill across both experiments = sum of their caps, which Josh can decide separately. Default `GLOBAL_SOFT_CAP_USD = 4` per experiment.
- Mints a 30-second HMAC ticket signed over `roomId | ip | exp` with `TICKET_SECRET`. Returns `{ roomId, wssUrl, ticket }` or 429 with `code: session_exhausted | global_cap`.

**Inside the DO `alarm()`:**

- Re-checks `getMonthlySpend()` before every LLM call. On trip, broadcasts `{ type: "ended", reason: "global_cap" }` and stops scheduling alarms.
- Worker validates the ticket on every WS upgrade. Anything without a valid signed ticket is rejected, so hitting the WSS endpoint directly cannot bypass the entry gates.

**Tunable constants** (`workers/chatroom/src/cost.ts`):

```ts
SESSION_LIMIT       = 4         // chatroom sessions per IP per month
GLOBAL_SOFT_CAP_USD = 4         // shared with monono
MAX_TURNS           = 40        // total messages per room (agents + user)
MAX_OUTPUT_TOKENS   = 100       // per agent reply
MEMORY_WINDOW       = 12        // recent turns sent to LLM
AMBIENT_TICK_MS     = 8000      // base cadence between unprompted agent turns
AMBIENT_JITTER_MS   = 4000
```

**Worst-case session math.** 40 turns × ~150 input tokens (mostly cache hits at 10% cost) + ~100 output tokens. Haiku 4.5 at $1 / $5 per 1M (input / output): **~$0.025–$0.04 per maxed-out session**. With `SESSION_LIMIT = 4` per IP and `GLOBAL_SOFT_CAP_USD = 4`, the worst case is ~100 maxed sessions before the global cap trips.

---

## DO behavior

`ChatroomDO extends DurableObject<Env>`. Reading order matters here because the hibernation contract is subtle.

**Constructor.**

- `ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"))` — the most load-bearing line in the file. The client sends a `ping` frame every ~25s; the runtime replies without waking the DO. Without this, hibernation provides no benefit.
- `ctx.blockConcurrencyWhile(...)` to create the SQLite tables on first wake:
  - `messages(id PK, role, agent_id, content, created_at)`
  - `room(id PK, topic, agent_ids JSON, turns_used, status, created_at)` — single row, persisted so it survives hibernation.
- If `room` row missing, bootstrap: pick `topic` from `topics.ts`, pick 3 agents from `personas.ts`, INSERT row. **Don't** generate opener turns synchronously — let `alarm()` do that, so we don't block the WS upgrade on a slow LLM call.

**`fetch()` — WS upgrade.**

- Validate the HMAC ticket from the query string. Reject if invalid or expired.
- `ctx.acceptWebSocket(server)` (hibernation API — *not* `server.accept()`, which silently disables hibernation).
- Send `{ type: "hello", topic, agents, messages }` on connect, re-reading messages from SQLite (works even if the DO just woke).
- If no alarm scheduled, set one ~500ms out so the room doesn't sit silent on first connect.

**`webSocketMessage(ws, data)`.**

- Parse `{ type: "say", text }`. Reject if text > 500 chars.
- INSERT user message, broadcast to all sockets.
- If `turns_used >= MAX_TURNS`, broadcast `{ type: "ended", reason: "turn_cap" }` and return.
- Override pending alarm with a faster one (`Date.now() + 1200`) so an agent picks up the user quickly.

**`alarm()` — the heartbeat.**

1. Re-read room status from SQLite.
2. If `turns_used >= MAX_TURNS` → set status `ended`, broadcast end event, `ctx.storage.deleteAll()`, return.
3. If no connected WS for >90s and no user message in last 90s → return without rescheduling (idle deathwatch).
4. Re-check global spend cap. If over → broadcast `global_cap` end event, return.
5. Pick speaker (round-robin biased toward an agent named in the last user message).
6. Build prompt: `[persona system prompt, ...last MEMORY_WINDOW messages]`. Cache the system prompt.
7. Call Vercel AI Gateway via `fetch()` (no SDK — fetch is leaner in Workers). Model `anthropic/claude-haiku-4.5`, `max_tokens: 100`.
8. INSERT reply, broadcast `{ type: "message", id, agentId, text, ts }`, increment `turns_used`, `addSpend(estimateCost(usage))`.
9. Reschedule. Ambient base `8000ms ± 4000ms`; halve cadence for the first ~3 turns so the room feels alive on arrival.

**`webSocketClose` is intentionally not implemented.** With `compatibility_date >= 2026-04-07` the runtime auto-replies to Close frames. The idle deathwatch in `alarm()` handles cleanup.

**Routing** (worker default `fetch`):

- `GET /rooms/:roomId/ws?ticket=…` → `env.CHATROOM.getByName(roomId).fetch(request)`. Use `getByName`, not `idFromName(...).get(...)` — it's the newer, cleaner accessor.
- `GET /healthz` → `200 ok`.
- 404 everything else.

---

## Build phases

Each phase ends with a git commit and a manual smoke test before the next phase begins. No phase rolls forward until its milestone passes.

### Phase 0 — Repo scaffold + this README

1. Create this folder and README (done).
2. Create `workers/chatroom/` with `wrangler.jsonc`, `package.json` (devDep: `wrangler`), `tsconfig.json`, and `src/index.ts` containing only `GET /healthz → "ok"` and a stubbed `ChatroomDO extends DurableObject<Env>` with no methods.
3. Add `workers/chatroom/.wrangler/` and `workers/chatroom/node_modules/` to root `.gitignore`.
4. `npx wrangler types` runs cleanly; `npx wrangler deploy --dry-run` succeeds.

**Milestone:** `npx wrangler dev` starts; `curl http://localhost:8787/healthz` returns `ok`. Folder structure exists in the Next app. Nothing visible to a user yet.

### Phase 1 — Tutorial-shaped echo room (no LLM)

1. Implement `ChatroomDO` matching the [click tutorial](https://github.com/jillesme/finally-durable-objects-click): SQLite `messages` table, `setWebSocketAutoResponse` ping/pong, `acceptWebSocket`, `webSocketMessage` that inserts and broadcasts. Routes: `GET /rooms/:roomId/ws`, `GET /rooms/:roomId/messages`.
2. Deploy to a `*.workers.dev` subdomain.
3. Add `app/api/chatroom/session/route.ts` returning `{ roomId: crypto.randomUUID(), wssUrl }` — no gates, no ticket yet. Reads `wssUrl` from `process.env.NEXT_PUBLIC_CHATROOM_WSS_URL` (set in `.env.local` and Vercel project env).
4. Add a minimal client `chatroom/page.tsx`: fetch the session, open WSS, render messages as a plain `<ul>`, send on Enter. **No styling yet.**
5. Wire client-side `ping` every 25s to exercise the auto-pong path.

**Milestone:** Two browser tabs against the same `roomId` (paste it manually) chat with each other through the deployed worker. A third tab with a different `roomId` is isolated. Refresh of a tab on the bare URL → new `roomId` → empty conversation.

> **Note on persistence.** A tab whose URL has `?roomId=X` re-attaches to *that* room on refresh, and the SQLite history re-renders. This is the same path Phase 2's alarm rehydration will use — a DO that wakes from hibernation reads its own history from SQLite. "Refresh = empty" only applies when there's no roomId override.

### Phase 2 — Agents arrive (LLM, alarms, cadence)

1. Add `room` table to SQLite (topic, agent_ids JSON, turns_used, status).
2. Add `personas.ts` (server-only) and `topics.ts` (mirrored on frontend).
3. Constructor bootstraps a fresh room on first wake.
4. Implement `alarm()` per the spec above.
5. On `webSocketMessage`, override pending alarm with a faster one (~1200ms).
6. Cap at `MAX_TURNS = 20` for now (lower than prod target so testing is cheap).
7. Frontend distinguishes message senders with placeholder colors.

**Milestone:** Land on the page → within ~2s an agent posts an opener. Two more turns of agent-on-agent banter. Type "I disagree because…" → an agent replies within ~1.5s. Conversation ends at turn 20 with a visible "ended" state. Vercel AI Gateway dashboard shows the spend.

### Phase 3 — Cost gates and ticket auth

1. Port `lib/ai/rate-limit.ts` shape into `workers/chatroom/src/cost.ts` (Upstash REST, not the Node SDK — Workers compatibility). Use namespace `chatroom` (independent from monono).
2. Add HMAC ticket flow. `TICKET_SECRET` set as a secret in both Vercel and Cloudflare. Worker rejects WS upgrades without a valid ticket.
3. Vercel session route enforces both gates. Returns 429 with `code: session_exhausted | global_cap` on failure.
4. DO `alarm()` re-checks global cap before every LLM call.
5. Add dev-only `app/api/chatroom/reset/route.ts` mirroring `app/api/monono/reset/route.ts`.
6. Frontend handles `ended` events with a graceful end-of-session card; reset button visible only in dev.

**Milestone:** With `SESSION_LIMIT` forced to 1, second visit shows session-exhausted card. With `GLOBAL_SOFT_CAP_USD` forced to 0.01, the room ends mid-conversation with a global-cap card. Hitting the worker's WSS URL directly without a ticket → rejected. Reset endpoint clears your IP, you can play again.

### Phase 4 — The Leaderboard look (and feel alive)

1. `chatroom/page.module.css` ports color tokens + background gradient from `leaderboard/page.module.css`.
2. `AgentAvatar.tsx` reuses the gradient + inset-border treatment + initials fallback (`leaderboard/components/LeaderboardRow.tsx:10–12, 82–84`).
3. `MessageRow.tsx` reuses the 56 / 44 / 1fr / auto grid pattern from `LeaderboardRow.module.css`.
4. SPRING / SPRINGY presets ported from `leaderboard/types.ts:31–43`. Use `motion` `<AnimatePresence>` for message entrance — `opacity 0, y: 8` → `opacity 1, y: 0` with SPRING.
5. Composer with character counter and "X turns left" indicator.
6. Optional: agent-profile modal (port from `ProfileModal.tsx`). Defer if it gets heavy.
7. Generate three agent portraits via `/gen-image` into `public/design-experiments/chatroom/avatars/`.
8. Header: room topic chip, "join the conversation" subtitle.

**Milestone:** Side by side with the Leaderboard tab, the chatroom feels like the same designer made both. Messages enter with a satisfying spring. The room never feels dead — even idle, the agent typing indicator or a subtle pulse hints something is coming.

### Phase 5 — SEO, prod build, ship

1. SEO checklist (per `repos/sandbox/CLAUDE.md`):
   - `app/sitemap.ts` → add `/design-experiments/chatroom` to `staticRoutes`.
   - `public/llms.txt` and `public/llms-full.txt` → add entries.
   - `metadata` export in `chatroom/page.tsx`.
   - `docs/01-progress.md` → note the experiment + the Cloudflare extension.
2. `npm run build` must succeed (per CLAUDE.md). Fix any TS / lint errors.
3. `npx wrangler deploy`. Set production secrets: `VERCEL_AI_GATEWAY_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TICKET_SECRET`.
4. Set `NEXT_PUBLIC_CHATROOM_WSS_URL` and `TICKET_SECRET` in Vercel project env (production + preview).
5. Smoke test on the deployed URL from a fresh incognito browser: full session, refresh, second session.
6. Update this README's Status table to "Shipped — vN".
7. Run `/ship-experiment` (screenshot, gallery entry, commit, push) only after Josh has clicked around and signed off.

**Milestone:** Live on the deployed sandbox. Two strangers (different IPs / different incognito sessions) get isolated rooms. Cost dashboards show predictable spend. Nothing in this is babysat.

---

## Open questions (deferred)

- **Naming.** Working title is "Chatroom." Alternatives: **Salon** (intellectual conversation, fits the personas) or **Greenroom** (backstage chatter, you wandered in). Decide once the UI exists and we can feel which name lands.

---

## Reused patterns

| Need | Source | Why |
| --- | --- | --- |
| Visual language (color, type, spacing) | `leaderboard/page.module.css`, `LeaderboardRow.module.css` | Explicit goal — same designer fingerprint |
| Spring presets | `leaderboard/types.ts:31–43` | Already tuned, ports cleanly |
| Avatar treatment + initials fallback | `LeaderboardRow.tsx:10–12, 82–84` | Same gradient / inset border pattern |
| Row grid layout | `LeaderboardRow.module.css` (56 / 44 / 1fr / auto) | Maps directly to message rows |
| Sparkles / score-pop animations | `LeaderboardRow.tsx:14–29, 104–116` | Repurpose for "message arrived" |
| Cost gates | `lib/ai/rate-limit.ts:42–63, 86–107` and `app/api/monono/route.ts:13–16, 47–88` | Port semantics into `workers/chatroom/src/cost.ts` |
| Vercel AI Gateway client | `lib/ai/anthropic.ts` | Same baseURL + model id pattern, ported to `fetch` |
| Canned-copy fallback discipline | `monono/data/voice.ts` | Connection errors and cap hits use static copy, not LLM |

## References

- Cloudflare DO best practices: https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/
- Tutorial repo this is modeled on: https://github.com/jillesme/finally-durable-objects-click
- WebSocket Hibernation API: https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- SQLite-in-DO: https://developers.cloudflare.com/durable-objects/api/storage-api/#sqlite-storage-api
