# Advanced

Less-common operations. Reach for these only when the standard workflow doesn't fit.

## Custom type-generation path

If the project's structure doesn't match `src/` or `lib/`:

```bash
supabase gen types typescript --local > custom/path/to/types.ts
```

## Migration rollback (local only)

```bash
supabase migration repair --status reverted <timestamp>
supabase db reset
```

Note: remote rollback usually means writing a forward migration that undoes the change, not "rewinding."

## Environment-specific migrations

```bash
# Generate from a non-default branch
supabase db diff -f migration_name --branch staging

# Push to a specific environment
supabase db push --branch production
```

## Seed data

```bash
# Define seed
echo "INSERT INTO users (email) VALUES ('test@example.com');" > supabase/seed.sql

# Apply (db reset runs seed.sql automatically)
supabase db reset
```

Seed runs after migrations on every reset. Keep it idempotent: `INSERT ... ON CONFLICT DO NOTHING` is your friend.
