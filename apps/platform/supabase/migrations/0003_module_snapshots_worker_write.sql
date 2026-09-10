-- ALREADY APPLIED IN PRODUCTION — confirmed live 2026-09-10 via a direct query against the
-- eeuwkislidznpgdbvvbo project (pg_policies / pg_indexes), not assumed from this file. This
-- file had been sitting at "DRAFT — NOT YET APPLIED" with the placeholder UUID below despite
-- the real thing being live for an unknown time before that — whoever/whatever applied it
-- never came back to update the source file. Keeping this file (idempotent: `drop policy if
-- exists` / `create index if not exists` throughout) as the accurate record of what's live,
-- rather than deleting it, so a future `supabase db push`-style diff doesn't reintroduce drift.
--
-- Adds the write-side surface needed for the scheduled signal-publishing
-- worker (GitHub Actions) to insert global (organization_id is null) rows
-- into module_snapshots, without granting it the service_role key.
--
-- WORKER_SUPABASE_USER_ID below is the real, live auth.users.id of the dedicated Supabase Auth
-- account (2ef527c0-0bf6-408e-a31a-ede0055de3b4) — confirmed to exist via the same direct
-- query. Its login credentials (SUPABASE_WORKER_EMAIL / SUPABASE_WORKER_PASSWORD, the two repo
-- secrets publish-signals.yml still needs) are not recorded anywhere in this repo or
-- Credentials/.env as of 2026-09-10 — still an open item, see servermemory.md.

-- One global snapshot per module per day. Without this, a re-run of the
-- worker on the same day would insert a duplicate row instead of updating
-- the existing one, and buildDecisionFeed (hub.ts) would show duplicate
-- entries until the old row ages out of the most-recent-50 window.
-- Partial index: only constrains rows where organization_id is null, since
-- Postgres unique constraints treat NULL as distinct from NULL and would
-- not otherwise catch this case.
create unique index if not exists module_snapshots_global_daily
  on public.module_snapshots (module_id, snapshot_date)
  where organization_id is null;

-- Narrow INSERT/UPDATE policy: only the worker's specific Supabase Auth
-- user may write, and only global (organization_id is null) rows. This is
-- deliberately not "any authenticated user" and not the service_role key —
-- a leaked worker credential can only ever write global signal rows, never
-- read/write anything org-scoped or touch any other table.
drop policy if exists "module_snapshots_insert_worker" on public.module_snapshots;
create policy "module_snapshots_insert_worker"
  on public.module_snapshots
  for insert
  to authenticated
  with check (
    organization_id is null
    and auth.uid() = '2ef527c0-0bf6-408e-a31a-ede0055de3b4'::uuid
  );

drop policy if exists "module_snapshots_update_worker" on public.module_snapshots;
create policy "module_snapshots_update_worker"
  on public.module_snapshots
  for update
  to authenticated
  using (
    organization_id is null
    and auth.uid() = '2ef527c0-0bf6-408e-a31a-ede0055de3b4'::uuid
  )
  with check (
    organization_id is null
    and auth.uid() = '2ef527c0-0bf6-408e-a31a-ede0055de3b4'::uuid
  );
