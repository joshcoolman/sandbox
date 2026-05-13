# Type generation (standalone)

Regenerate TypeScript types without creating a migration. Useful when:

- Pulling remote schema changes made by someone else
- Types file was deleted or got out of sync
- Switching branches with different schemas

## Steps

### 1. Detect target path

```bash
if [ -d "src" ]; then
  TYPES_PATH="src/types/database.types.ts"
elif [ -d "lib" ]; then
  TYPES_PATH="lib/types/database.types.ts"
else
  TYPES_PATH="types/database.types.ts"
fi
```

### 2. Generate

```bash
mkdir -p "$(dirname "$TYPES_PATH")"
supabase gen types typescript --local > "$TYPES_PATH"
```

### 3. Verify

```bash
if [ -f "$TYPES_PATH" ]; then
  echo "Types generated at $TYPES_PATH"
  wc -l "$TYPES_PATH"
else
  echo "Type generation failed."
  echo "Ensure local services are running: supabase start"
  exit 1
fi
```

## Notes

- `--local` reads from the local Postgres container. If you want types from remote schema, use `--project-id <ref>` instead.
- If the local schema is stale, run `supabase db pull` then `supabase db reset` before regenerating.
