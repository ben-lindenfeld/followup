# FollowUp source branch

Full Next.js source for the FollowUp CRM (Hebrew RTL SaaS for independent service providers).
Production site (GitHub Pages, from branch `main` which holds the static export): https://ben-lindenfeld.github.io/followup/

## Stack
- Next.js 16, static export (`output: "export"`, basePath `/followup`), Tailwind, TypeScript
- Supabase (email auth, Postgres, RLS) - project ref `rfjtvbouncwulrvgfbmm` (EU)
- Client bundle talks to Supabase with the publishable anon key only; all isolation is enforced by RLS policies.

## Build and deploy
1. `cp .env.example .env.local`
2. `npm install`
3. `npm run build` -> static site in `out/`
4. Publish the contents of `out/` to the root of branch `main` (keep `.nojekyll`; additive deploys recommended so stale cached HTML never meets missing chunks).

## Database
- `supabase-migration.sql` - full schema (business_profiles, customers, leads, tasks, notes, activity_logs, notifications), triggers (business profile auto-create on signup), RLS policies, indexes, notification dedupe unique key.
- `supabase-fix-fk-ownership.sql` - follow-up hardening: policies on leads/tasks/notes/activity_logs require referenced parent rows (customer_id/lead_id/task_id) to belong to auth.uid(), blocking cross-tenant foreign-key attachment.
- Apply both in the Supabase SQL editor (dashboard project rfjtvbouncwulrvgfbmm). Email confirmation is OFF in auth settings; Site URL = the Pages URL.
