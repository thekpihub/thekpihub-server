-- DRAFT — NOT YET APPLIED. See SIGNAL_WIRING_DESIGN_20260713.md.
--
-- Adds the write-side surface needed for the scheduled signal-publishing
-- worker (GitHub Actions) to insert global (organization_id is null) rows
-- into module_snapshots, without granting it the service_role key.
--
-- Before applying: replace WORKER_SUPABASE_USER_ID below with the actual
-- auth.users.id of the dedicated Supabase Auth account created for the
-- worker (see design doc §6). Do not apply until that account exists.

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
    and auth.uid() = 'WORKER_SUPABASE_USER_ID'::uuid
  );

drop policy if exists "module_snapshots_update_worker" on public.module_snapshots;
create policy "module_snapshots_update_worker"
  on public.module_snapshots
  for update
  to authenticated
  using (
    organization_id is null
    and auth.uid() = 'WORKER_SUPABASE_USER_ID'::uuid
  )
  with check (
    organization_id is null
    and auth.uid() = 'WORKER_SUPABASE_USER_ID'::uuid
  );
