---
name: supabase
description: Manage Supabase projects - schema migrations, type generation, edge functions, and database operations
---

# supabase

Opinionated, safe workflows for Supabase CLI operations: migrations, types, edge functions, project setup.

## When to use

- Generate database migrations and TypeScript types
- Create or deploy edge functions
- Set up or link a Supabase project
- Inspect database schema or migration history
- Validate schema changes for best practices

## Integration

Always invoke `postgres-best-practices:supabase-postgres-best-practices` on new migration files before pushing. Catches missing indexes on foreign keys, RLS gaps, SQL injection risks, and inefficient patterns.

## Usage

```bash
/supabase migrate "add user profiles table"   # full schema change pipeline
/supabase types                               # regenerate types only
/supabase function new <name>                 # create edge function
/supabase function deploy <name>              # deploy edge function
/supabase init                                # initialize project
/supabase link                                # link to remote
/supabase inspect                             # inspect schema/migrations
```

## File conventions

- Types: `src/types/database.types.ts` or `lib/types/database.types.ts` (auto-detected by presence of `src/` vs `lib/`)
- Migrations: `supabase/migrations/`
- Functions: `supabase/functions/`
- Config: `supabase/config.toml`

## Workflows (load on demand)

Read the relevant file when the workflow is active. Do not preload them all.

- **Schema changes / migrations** — see [MIGRATIONS.md](MIGRATIONS.md). Generate the migration, validate for breaking changes, run best-practices check, dry-run locally, regenerate types, push to remote.
- **Type generation (standalone)** — see [TYPES.md](TYPES.md). Useful when pulling remote changes, switching branches, or recovering a deleted types file.
- **Edge functions** — see [EDGE-FUNCTIONS.md](EDGE-FUNCTIONS.md). Create, deploy, list, log, delete.
- **Project setup** — see [SETUP.md](SETUP.md). `init`, `start`, `link`, pull remote schema, generate initial types.
- **Database inspection** — see [INSPECTION.md](INSPECTION.md). Schema, migration history, RLS, connection.
- **Errors and recovery** — see [TROUBLESHOOTING.md](TROUBLESHOOTING.md). CLI not installed, drift, conflicts, type-gen failures, missing services.
- **Advanced** — see [ADVANCED.md](ADVANCED.md). Rollback, env-specific migrations, custom paths, seed data.

## Tool rules

- Bash for all CLI commands.
- Read for inspecting migration files before validation.
- AskUserQuestion for: breaking-change confirmation, remote push confirmation, project ref input.
- Never skip migration validation steps; safety matters for database operations.

## Quick command reference

| Command | Description |
|---|---|
| `supabase init` | Initialize new project |
| `supabase start` / `stop` / `status` | Local services |
| `supabase link --project-ref <ref>` | Link to remote project |
| `supabase db diff -f <name>` | Generate migration from schema changes |
| `supabase db push` / `pull` | Push or pull migrations |
| `supabase db reset` | Reset local DB, apply migrations and seed |
| `supabase gen types typescript --local` | Generate TypeScript types |
| `supabase migration list` | Show migration history |
| `supabase functions new <name>` | Create edge function |
| `supabase functions deploy <name>` | Deploy edge function |
| `supabase inspect db` | Inspect database schema |
