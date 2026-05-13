# Troubleshooting

Common errors and the fastest path back to a working state.

## CLI not installed

```
Error: supabase: command not found
```

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows
scoop install supabase

# npm (any platform)
npm install -g supabase

# verify
supabase --version
```

## Not in a Supabase project

```
Error: Cannot find supabase/config.toml
```

```bash
supabase init
```

This creates `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`.

## Not linked to remote

```
Error: Project ref not found
```

```bash
supabase link --project-ref <your-project-ref>
```

Find the ref at app.supabase.com → project → Settings → General → Reference ID.

## Local services not running

```
Error: Connection refused to localhost:54322
```

```bash
supabase start
supabase status
```

Starts: PostgreSQL (54322), PostgREST (54321), Kong (8000), Studio (54323).

## Migration timestamp collision

```
Error: Migration <timestamp> already exists
```

```bash
ls -l supabase/migrations/
```

If it's a duplicate, delete the new one. If it's different work, rename with a fresh timestamp:

```bash
mv <old-file> <new-timestamp>_<name>.sql
```

## Type generation fails

Checklist:

1. Local services running? `supabase status`
2. Local DB up to date? `supabase db reset`
3. SQL error in a migration? `supabase migration list` then inspect the latest file
4. Fallback to remote: `supabase gen types typescript --project-id <ref> > types.ts`

## Push fails due to schema drift

```
Error: Database has diverged from migrations
```

```bash
supabase db pull   # pull remote changes
# resolve conflicts in migration files
supabase db reset  # rebuild local
supabase db push   # try again
```
