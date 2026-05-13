# Migrations

The primary workflow for schema changes. Generate, validate, dry-run, regenerate types, push.

## Pipeline

### 1. Generate migration

```bash
# User provides a short description; you generate a timestamped migration
supabase db diff -f <YYYYMMDDHHMMSS_description>

# Example
supabase db diff -f 20260208143022_add_user_profiles
```

### 2. Scan for breaking changes

```bash
grep -iE "(DROP\s+COLUMN|DROP\s+TABLE|ALTER\s+TYPE|TRUNCATE|DROP\s+INDEX)" <migration-file>
```

If anything matches:

- Warn the user with a clear message about potential data loss.
- Show the specific lines that contain the breaking changes.
- Use `AskUserQuestion` to require explicit confirmation before proceeding.

Patterns to detect and what they mean:

- `DROP COLUMN` — permanent data loss for that column
- `DROP TABLE` — entire table gone
- `ALTER TYPE` — can break existing data depending on conversion
- `TRUNCATE` — all rows deleted
- `DROP INDEX` — can severely impact query performance

### 3. Postgres best practices check

```bash
/postgres-best-practices:supabase-postgres-best-practices <path-to-migration-file>
```

Surface every recommendation to the user. Common issues caught:

- Missing indexes on foreign key columns
- Tables without RLS policies enabled
- `SELECT *` inside functions
- Inefficient join patterns
- Missing `ON DELETE CASCADE` on related tables

Allow the user to edit the migration in response, then re-run validation if they did.

### 4. Dry-run locally

```bash
supabase db reset

# Verify exit code
echo $?  # 0 means success
```

If it fails, show the SQL error and ask the user to fix the migration before continuing.

### 5. Regenerate TypeScript types

```bash
# Detect project structure
if [ -d "src" ]; then
  TYPES_PATH="src/types/database.types.ts"
elif [ -d "lib" ]; then
  TYPES_PATH="lib/types/database.types.ts"
else
  TYPES_PATH="types/database.types.ts"
fi

mkdir -p "$(dirname "$TYPES_PATH")"
supabase gen types typescript --local > "$TYPES_PATH"

if [ -f "$TYPES_PATH" ]; then
  echo "Types generated at $TYPES_PATH"
else
  echo "Type generation failed"
  exit 1
fi
```

### 6. Confirm push

Use `AskUserQuestion` with options like:

- Yes, push now (Recommended)
- No, I'll review first

If confirmed:

```bash
supabase db push
```

### 7. Verify

```bash
supabase migration list
```

Confirm the new migration shows applied on both local and remote.

## Idempotency

Migrations should be safe to apply multiple times. Patterns:

- `CREATE TABLE IF NOT EXISTS ...`
- `DROP TABLE IF EXISTS ...`
- `CREATE OR REPLACE FUNCTION ...`
- `CREATE INDEX IF NOT EXISTS ...`

Verify by running `supabase db reset` twice in a row. Both runs should succeed.

## Validation gates summary

Before `db push` is allowed:

1. Breaking-change scan run, user confirmed if any matched.
2. `postgres-best-practices` ran, recommendations surfaced.
3. `db reset` succeeded locally (dry run).
4. Types regenerated to the standard path.
5. User explicitly confirmed the push.
