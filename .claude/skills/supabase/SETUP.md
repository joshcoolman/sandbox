# Project setup

Initialize and link a Supabase project. Use for new projects, cloning existing repos, or switching between projects.

## Steps

### 1. Initialize (if not already)

```bash
if [ ! -d "supabase" ]; then
  supabase init
  echo "Supabase project initialized"
else
  echo "Supabase already initialized"
fi
```

### 2. Start local services

```bash
supabase start
supabase status
```

`status` shows the local URLs and keys: Postgres (54322), PostgREST API (54321), Kong (8000), Studio (54323).

### 3. Link to remote

Use `AskUserQuestion` to gather the project ref:

- Enter project ref manually
- Skip linking for now

If they have a ref:

```bash
supabase link --project-ref <project-ref>
supabase projects list   # verify
```

Find the ref at `https://app.supabase.com` → project → Settings → General → Reference ID.

### 4. Pull remote schema

```bash
supabase db pull
```

This creates migration files in `supabase/migrations/` that mirror the remote state.

### 5. Generate initial types

```bash
# Detect path (see SKILL.md file conventions)
supabase gen types typescript --local > src/types/database.types.ts
```

### 6. Verify

```bash
supabase status            # services up?
supabase migration list    # migrations in sync?
ls -lh src/types/database.types.ts  # types present?
```
