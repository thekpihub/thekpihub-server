-- Correction: migrations 0003 and 0004's "worker" RLS policies were pointed at uuid
-- 2ef527c0-0bf6-408e-a31a-ede0055de3b4, which turned out (discovered 2026-09-11, via the
-- Supabase dashboard's own Auth > Users list) to be the account owner's own real personal login
-- (hsharma.gxi@gmail.com) -- not a dedicated, narrowly-scoped service account as both
-- migrations' own comments and SIGNAL_WIRING_DESIGN_20260713.md claimed. Whoever originally
-- applied 0003 (untracked, outside any session recorded in this repo) took a shortcut: reused
-- an already-existing real user id instead of creating a proper dedicated one.
--
-- This mattered: SUPABASE_WORKER_EMAIL/PASSWORD (the two remaining GitHub secrets needed to
-- make publish-signals.yml write real data) would otherwise have had to be the account owner's
-- own real login credentials -- meaning a leaked GitHub secret would grant full access to their
-- actual personal account, not just the narrow "write one row type" blast radius the design
-- always claimed.
--
-- Fix: a genuinely dedicated Supabase Auth account was created via the dashboard
-- (publish-signals-worker@thekpihub.com, uuid 4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2, not a real
-- person, auto-confirmed). This migration repoints every "worker" policy from the old uuid to
-- the new one. Historical migrations 0003/0004 are left as-is (accurate record of what was
-- actually run at the time) rather than rewritten again.

drop policy if exists "module_snapshots_insert_worker" on public.module_snapshots;
create policy "module_snapshots_insert_worker"
  on public.module_snapshots
  for insert
  to authenticated
  with check (
    organization_id is null
    and auth.uid() = '4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2'::uuid
  );

drop policy if exists "module_snapshots_update_worker" on public.module_snapshots;
create policy "module_snapshots_update_worker"
  on public.module_snapshots
  for update
  to authenticated
  using (
    organization_id is null
    and auth.uid() = '4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2'::uuid
  )
  with check (
    organization_id is null
    and auth.uid() = '4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2'::uuid
  );

drop policy if exists "kpis_select_worker" on public.kpis;
create policy "kpis_select_worker"
  on public.kpis
  for select
  to authenticated
  using (auth.uid() = '4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2'::uuid);

drop policy if exists "kpi_values_select_worker" on public.kpi_values;
create policy "kpi_values_select_worker"
  on public.kpi_values
  for select
  to authenticated
  using (auth.uid() = '4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2'::uuid);

drop policy if exists "kpi_targets_select_worker" on public.kpi_targets;
create policy "kpi_targets_select_worker"
  on public.kpi_targets
  for select
  to authenticated
  using (auth.uid() = '4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2'::uuid);
