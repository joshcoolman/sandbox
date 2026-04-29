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
| 2. Agents arrive | Two agents converse on a tick, user can interject | **Done** |
| 3. Cost gates + ticket auth | Per-IP and global $ caps, signed WS upgrade | **Done** |
| 4. Leaderboard look + motion | Visual sibling of Leaderboard, springy entrance | **Done** |
| 4.5. Engagement-flow rework | Phase state machine, single auto-nudge, change-topic + ask-me-something buttons, dev-unlimited mode | **Done** |
| 5. SEO + ship | Production build, worker deploy, gallery entry | In progress (registry + SEO surface done, screenshot + push pending) |

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
├── page.tsx                       # server shell, registry-backed metadata
├── page.module.css                # background + layout (mirrors leaderboard)
├── types.ts                       # Wire events, message roles, SPRING/SPRINGY presets
├── data/
│   ├── agents.ts                  # display info for the 2 personas (no system prompts here)
│   ├── topics.ts                  # curated openers (mirrors workers/chatroom/src/topics.ts)
│   ├── userIcons.ts               # leaderboard avatars 03–08 + initials fallback for the visitor
│   └── userNames.ts               # ~30 friendly first names for default identity
├── hooks/
│   └── useIdentity.ts             # localStorage identity (name + avatarId), default generation
└── components/
    ├── Chatroom.tsx               # main client component, WS lifecycle, phase rendering
    ├── MessageRow.tsx             # agent + user rows + system-message divider variant
    ├── Composer.tsx               # textarea + turns-left + phase hint + ask-me-something button
    ├── AgentAvatar.tsx            # gradient + image-with-initials-fallback
    ├── IdentityChip.tsx           # visitor name + avatar + pencil → opens modal
    ├── IdentityModal.tsx          # name input + 7-cell avatar grid
    └── TopicChangeModal.tsx       # free-form topic input

app/api/chatroom/
├── session/route.ts               # gates + signed ticket + wssUrl + dev-mode detection
└── reset/route.ts                 # dev-only IP counter clear

workers/chatroom/
├── wrangler.jsonc                 # SQLite DO binding, secrets
├── package.json                   # wrangler only
├── tsconfig.json
├── worker-configuration.d.ts      # wrangler types output
└── src/
    ├── index.ts                   # ChatroomDO + router + LLM helpers (~800 lines; split deferred)
    ├── personas.ts                # Maya + Jordan system prompts (server-only)
    ├── topics.ts                  # curated openers
    ├── cost.ts                    # Upstash REST helpers, spend tracking
    ├── ticket.ts                  # HMAC sign/verify with dev/prod mode
    └── voice.ts                   # canned-copy fallback for the nudge phase
```

---

## Personas

Two characters — Maya Chen and Jordan Park — both intentionally loose: "AI enthusiast, woman/man in their 30s, talks about AI the way someone talks about their hobby." The original optimist/skeptic stance steering was rolled back during testing because it made replies feel canned; voice now emerges from the model interpreting the topic, not from an assigned framing. Names + display avatars are reused from leaderboard players (Maya = leaderboard 01, Jordan = leaderboard 02) so they're visually the same characters across both experiments.

System prompts live server-only in `workers/chatroom/src/personas.ts` and never ship to the browser. The frontend `data/agents.ts` mirrors only the display fields: `id`, `name`, `gradient`, `image`, one-line `bio`. `SHARED_RULES` enforces format ("1–2 sentences, plain text, no markdown, no preface, never start with your own name") — those are about voice in a group chat, not stance. Caching is `cache_control: { type: "ephemeral" }`, the same pattern monono uses.

If the conversation ever feels too agreeable or homogeneous, reintroduce **light** differentiation (one trait each) before reverting to the original two-paragraph stance prompts — that was the lesson from the rollback.

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

**Tunable constants** (`workers/chatroom/src/index.ts`, kept in sync with `app/api/chatroom/session/route.ts` by hand):

```ts
SESSION_LIMIT       = 6           // chatroom sessions per IP per month
GLOBAL_SOFT_CAP_USD = 8           // independent from monono
MAX_TURNS_PROD      = 80          // production turn cap
MAX_TURNS_DEV       = 200         // dev sanity cap (NODE_ENV=development)
MAX_OUTPUT_TOKENS   = 100         // per agent reply
NUDGE_OUTPUT_TOKENS = 60          // tighter for the "ask user a question" turn
MEMORY_WINDOW       = 14          // recent turns sent to LLM
WAIT_FOR_USER_MS    = 25_000      // silence allowance before auto-nudge
WAIT_AFTER_NUDGE_MS = 25_000      // silence allowance after the nudge before idle
RESPOND_TO_USER_DELAY_MS = 1_500  // first agent reply latency
RESPONDING_PAIR_DELAY_MS = 3_000  // between agent A and agent B replies to a user message
OPENING_BEAT_MS     = 2_000       // between the two opener turns
MAX_TOPIC_CHANGES   = 3           // user-initiated topic pivots per room
```

**Worst-case session math.** Per agent turn: ~150 input × $1/M (cached at 10% on subsequent turns) + ~80 output × $5/M ≈ **$0.0006/turn**. At `MAX_TURNS = 80` that's **~$0.05 per maxed session**. Cost ceiling for a non-engaging visitor (lands, never types): **3 LLM calls (2 openers + 1 nudge)** before the room goes idle. With `SESSION_LIMIT = 6` per IP and `GLOBAL_SOFT_CAP_USD = 8`, the worst case is ~160 maxed sessions before the global cap trips.

**Dev mode** (`NODE_ENV === "development"`): the session route skips both gates entirely (no Upstash writes, no `session_exhausted` errors), signs `mode: "dev"` into the HMAC ticket, and the worker honors that signal to lift `MAX_TURNS` to 200 and skip the global-cap re-check in `alarm()`. When the conversation crosses turn 80 in a dev room, the worker posts a one-time inline "Production cutoff — dev session continues" system message so the boundary is visible. Dev tickets cannot be forged client-side because the mode is part of the signed payload.

---

## DO behavior

`ChatroomDO extends DurableObject<Env>`. Reading order matters here because the hibernation contract is subtle, and the phase machine has several states.

**Constructor.**

- `ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"))` — the most load-bearing line in the file. The client sends a `ping` frame every ~25s; the runtime replies without waking the DO. Without this, hibernation provides no benefit.
- `ctx.blockConcurrencyWhile(...)` creates the SQLite tables on first wake (`messages`, `room`) and runs best-effort `ALTER TABLE` migrations for columns added over time (`phase`, `phase_turn`, `topic_title`, `topic_changes`, `user_name`, `user_avatar`, `mode`, `cutoff_inserted`, `auto_nudge_used`).
- If the `room` row is missing, bootstrap: pick `topic` from `topics.ts`, pick agents from `personas.ts`, INSERT the row with `phase = 'opening'`. **Don't** generate opener turns synchronously and **don't** insert a visible "topic opener" system message — the agent's first turn IS the visible opener, in their voice, with the curated `topic.opener` passed to the LLM as inspiration only.

**`fetch()` — WS upgrade.**

- Read `X-Chatroom-Mode` from the request (set by the worker entry after ticket verification). One-shot lock: if header is `"dev"` and the room's stored mode is still `"prod"`, update once. After that the row is locked dev for its lifetime — subsequent connections can't downgrade.
- `ctx.acceptWebSocket(server)` (hibernation API — *not* `server.accept()`, which silently disables hibernation).
- Send `{ type: "hello", topic, agents, messages, status, turnsUsed, maxTurns, phase, mode }` on connect.
- If no alarm scheduled, set one ~600ms out so the room doesn't sit silent on first connect.

**`webSocketMessage(ws, data)`** dispatches on `parsed.type`:

- `"say"` — INSERT user message, mark `auto_nudge_used = 1` (first user-type implicitly consumes the slot), set phase = `responding`, set alarm `RESPOND_TO_USER_DELAY_MS`. Server caps content at 8000 chars.
- `"identify"` — store `user_name` + `user_avatar` on the room row so nudge / button prompts can address the user by name.
- `"change_topic"` — validate (≤ 60 chars, ≤ `MAX_TOPIC_CHANGES` per room), update `topic_title`, post a system message ("Topic changed to: X"), force phase = `opening`, override alarm to `TOPIC_PIVOT_DELAY_MS` so the conversation pivots fast.
- `"ask_me_something"` — only honored when `phase ∈ {awaiting_user, idle}`. Mark `auto_nudge_used = 1`, enter `nudging` with `phaseTurn = 0`, set alarm 600ms out (deferred so the UI updates before the LLM call lands).

**`alarm()` — the phase state machine.**

```
opening (×2)            → awaiting_user
awaiting_user           → !auto_nudge_used: nudging        (one-shot)
                        →  auto_nudge_used: idle           (no LLM, no alarm)
nudging (phaseTurn=0)   → produce nudge turn, advancePhase → phaseTurn=1, alarm=WAIT_AFTER_NUDGE_MS
nudging (phaseTurn=1)   → idle (silent past nudge)
responding (×2)         → awaiting_user
idle                    → terminal until user typing or button click
```

Pre-flight on every alarm fire: deathwatch (no clients + no user activity for `DEATHWATCH_MS` → no reschedule), and global $ cap check (skipped in dev mode).

`pickSpeaker` randomizes for the first agent turn (no agents have spoken since the most recent prompt boundary), then picks the agent who spoke least recently and never the same agent twice in a row.

The first agent turn carries `kind = "opener"`, which augments the prompt with the curated `topic.opener` as inspiration (paraphrase, don't quote). After topic-changes, the system message acts as the "conversation prompt" headline that the next agent reacts to. Nudge turns carry `kind = "nudge"` and have a tighter `max_tokens = 60`. All other turns are `kind = "normal"`.

**Engagement floor.** A non-engaging visitor gets at most **3 LLM calls** total: 2 openers + 1 auto-nudge. After the auto-nudge slot is consumed (by the visitor typing OR by the silence timer firing), no more auto-prompts — the room transitions silence → idle. The "Ask Me Something" button is the user's manual lever for re-engagement; it bypasses the auto-nudge logic entirely and uses the same `nudging` phase with `phaseTurn = 0` to defer the LLM call.

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
