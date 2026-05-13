# Database inspection

Read-only views into schema, migrations, and connection status. Nothing here mutates the database.

## Schema overview

```bash
supabase inspect db                       # full schema
supabase inspect db --table <table-name>  # one table
supabase inspect db --schema public       # all tables in schema
```

## Migration history

```bash
supabase migration list           # both local and remote
cat supabase/migrations/<file>.sql
```

## Connection status

```bash
supabase status
psql "$(supabase db url)" -c "SELECT version();"
```

## Useful one-liners

```bash
# Tables with row counts
supabase db dump --data-only --schema public | grep "COPY"

# Index coverage
supabase inspect db --schema public | grep -i "index"

# All RLS policies
psql "$(supabase db url)" -c "SELECT * FROM pg_policies;"
```
