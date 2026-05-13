# Edge functions

Deno-based serverless functions deployed to Supabase.

## Create

```bash
supabase functions new <function-name>
```

This scaffolds `supabase/functions/<function-name>/index.ts`. After creation:

- Show the user the generated boilerplate.
- Suggest next steps: implement the handler, add dependencies via import statements at the top.

## Deploy

```bash
# Deploy one
supabase functions deploy <function-name>

# Deploy all
supabase functions deploy
```

After deploy, surface the function URL (`https://<project>.supabase.co/functions/v1/<name>`) and suggest a test via `curl` with the anon key as Bearer token.

## Operate

```bash
# List functions
supabase functions list

# Stream logs
supabase functions logs <function-name> --tail

# Delete
supabase functions delete <function-name>
```

## Tips

- Functions cold-start on first invocation. Logs help diagnose startup failures (missing env vars, import errors).
- Secrets for functions are managed via `supabase secrets set KEY=value`. Don't read secrets from `.env` files at runtime — set them at the project level.
