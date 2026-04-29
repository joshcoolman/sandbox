Continuing work on the **Chatroom** design experiment at `app/design-experiments/(experiments)/chatroom/`. The README at that path is the source of truth — read it first; it has the full architecture, persona/topic catalog, cost guardrails, all six phase specs, and the current Status table.

## What this is

A small chatroom where three AI agents (Mira/optimist, Caleb/skeptic, June/philosopher) converse on a server-driven tick about one of six curated topics. Visitor joins as the fourth participant. Built on a **Cloudflare Hibernatable Durable Object** (deployed at `https://sandbox-chatroom.joshcoolman.workers.dev`) holding per-room state in SQLite, with a **Vercel Next.js** frontend at `/design-experiments/chatroom`. Refresh on the bare URL = brand-new room.

## Current state

Phases 0–3 done and pushed to `origin/chatroom`. Working tree clean. Recent commits:

- `0ca2783` — Phase 3: cost gates + ticket auth
- `73cb971` — Phase 2: three agents converse on a tick
- `6afd05c` — Phase 0 + 1: scaffold + tutorial-shaped echo room

| Phase | State |
| --- | --- |
| 0. Scaffold | Done |
| 1. Echo room | Done |
| 2. Agents | Done |
| 3. Cost gates + ticket auth | Done |
| 4. Visual polish (Leaderboard look) | **Next — start here** |
| 5. SEO + ship | After 4 |

## What Phase 4 is

Pull the Leaderboard design language onto the chatroom UI. The README has the full task list. Specifically:

- `chatroom/page.module.css` ports color tokens + background gradient from `app/design-experiments/(experiments)/leaderboard/page.module.css`
- `AgentAvatar.tsx` reuses the gradient + inset-border + initials fallback pattern from `leaderboard/components/LeaderboardRow.tsx:10–12, 82–84`
- `MessageRow.tsx` reuses the 56 / 44 / 1fr / auto grid from `leaderboard/components/LeaderboardRow.module.css`
- Spring presets ported from `leaderboard/types.ts:31–43` (SPRING, SPRINGY)
- `motion` `<AnimatePresence>` for message entrance — `opacity 0, y: 8` → `opacity 1, y: 0` with SPRING
- Composer with character counter + "X turns left" indicator
- Optional: agent profile modal (port from `leaderboard/components/ProfileModal.tsx`); defer if heavy
- Generate three agent portraits via `/gen-image` skill into `public/design-experiments/chatroom/avatars/{mira,caleb,june}.jpg`
- Header with topic chip

Current frontend at `app/design-experiments/(experiments)/chatroom/components/Chatroom.tsx` is intentionally bare — inline styles only. The wire format and event handling are settled (`hello | message | ended` events, ticket auth on WS open, dev-only reset button on session_exhausted). Phase 4 is purely visual + motion polish on top of that.

## Conventions established

- Each visitor gets a fresh `roomId` (UUID) from `app/api/chatroom/session/route.ts`. Tabs with `?roomId=X` re-attach to that room (SQLite history rehydrates). Intentional — same path the DO uses to wake from hibernation.
- Worker code in `workers/chatroom/src/` is a single `index.ts` (~430 lines) plus split helpers `personas.ts`, `topics.ts`, `cost.ts`, `ticket.ts`. README's split rule says extract `chatroom-do.ts` + `llm.ts` when index passes ~400 lines — we're at the line, fine to defer until Phase 5 cleanup.
- Cost protection uses Upstash REST from the worker (raw fetch, no SDK), namespace `chatroom`. Independent from monono. Tunable constants live at the top of `workers/chatroom/src/index.ts` and `app/api/chatroom/session/route.ts` (kept in sync by hand: `GLOBAL_SOFT_CAP_USD = 4` in both).
- Persona/topic data is mirrored: server-only with system prompts in `workers/chatroom/src/{personas,topics}.ts`, display-only mirror in `app/design-experiments/(experiments)/chatroom/data/{agents,topics}.ts`.
- Worker secrets: `VERCEL_AI_GATEWAY_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `TICKET_SECRET`. Same `TICKET_SECRET` on Vercel side via `.env.local`.
- Dev workflow: `pnpm dev` at repo root for Next; `npx wrangler deploy` from `workers/chatroom/` for worker changes. `wrangler dev` works locally too, but deployed worker is fine for everyday dev — Phase 4 is mostly frontend so few worker deploys needed.

## Gotcha worth knowing

Twice during this build, Cloudflare Worker secrets appeared in `wrangler secret list` while being **undefined at runtime** — once for `TICKET_SECRET`, once for `UPSTASH_REDIS_REST_URL`/`TOKEN`. Re-running `wrangler secret put <NAME>` fixed both times. If anything that depends on a secret silently no-ops (e.g., `addSpend` not actually writing → spend stays at $0 → caps never trip), suspect this. Fastest reproduction: temporarily add a `/__debug/spend` route to the worker that returns `{hasUrl: !!env.UPSTASH_REDIS_REST_URL, hasToken: !!env.UPSTASH_REDIS_REST_TOKEN, hasGateway: !!env.VERCEL_AI_GATEWAY_KEY, hasTicket: !!env.TICKET_SECRET}` and curl it. Remove before commit.

## Branch + push policy

On `chatroom` branch (tracks `origin/chatroom`). Solo-dev workflow per repo CLAUDE.md: `commit` means `git add -A && git commit && git push`. No PRs. Each phase has been one commit; the same shape works for Phase 4.
