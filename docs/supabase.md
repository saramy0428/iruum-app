# Supabase setup

Phase 1 Week 1 plumbing. Do these once per environment (local + Vercel prod).

## 1. Create the Supabase project

1. Go to https://supabase.com → New project
2. Name: `iruum` (or whatever)
3. Region: pick the one closest to your users. International audience → `us-east-1` is the safe default
4. Database password: save it in a password manager — Supabase shows it once
5. Wait ~2 minutes for provisioning

## 2. Grab the keys

Project Settings → API. You need three values:

| Env var | Where |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon / public" key |
| `SUPABASE_SERVICE_ROLE_KEY` | "service_role" key — **never commit, never ship to client** |

Copy `.env.local.example` to `.env.local` and paste them in.

## 3. Install the Supabase CLI

```powershell
# Windows (Scoop)
scoop install supabase

# or via npm if you prefer
npm install -g supabase
```

Verify: `supabase --version`

## 4. Link the project & run the migration

From the repo root:

```powershell
supabase login                              # one-time, opens browser
supabase link --project-ref <your-ref>      # ref is in the dashboard URL: https://supabase.com/dashboard/project/<ref>
supabase db push                            # applies migrations in supabase/migrations/
```

Verify in the Supabase dashboard → Table editor that you see:
- `profiles`, `saju_results`, `products`, `orders`, `order_items`, `webhook_events`

The `products` table should already have one row: the $9 PDF Infographic.

## 5. Smoke test

```powershell
npm run dev
```

Open http://localhost:3000, fill out the form, generate a name. Then in the Supabase dashboard → Table editor → `saju_results`, you should see a fresh row with `user_id = NULL` (anonymous) and the full result payload in jsonb columns.

If the row doesn't appear: the generator still returns a name (persistence is non-blocking by design), but check the dev server logs for `saju_results insert failed:` — usually a missing/wrong env var.

## 6. Vercel production

When deploying this branch:
- Vercel → Project → Settings → Environment Variables
- Add all three vars (same values as `.env.local`)
- Redeploy

## Schema notes

- **Anonymous results** are kept (`user_id = NULL`) so we can claim them in Week 2 by matching `session_seed` when a user signs up.
- **RLS is on for everything**. The `/api/name` route uses the service-role client which bypasses RLS — that's intentional, all anonymous writes happen server-side.
- **Service role key never reaches the browser** — only `lib/supabase/server.js` reads it, and that file is only imported from API routes.
- **`webhook_events.id`** uses Stripe's event id as the primary key — guarantees idempotent webhook processing in Week 4.
