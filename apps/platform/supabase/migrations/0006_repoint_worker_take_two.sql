-- Second repoint, same day: after 0005 pointed the worker policies at
-- publish-signals-worker@thekpihub.com (uuid 4a07981a-b1d1-4e76-8d74-8b3fbfcccfb2), that
-- account's password turned out to be unrecoverable (it only ever existed in an OS clipboard
-- that got overwritten before the value was captured anywhere durable -- e.g. a GitHub secret).
-- Rather than guess or leave a dangling credential, that account was deleted via the Supabase
-- dashboard and recreated fresh (same email, new uuid 74e96360-1260-4329-8679-ad2e736c96ec),
-- this time setting SUPABASE_WORKER_EMAIL/PASSWORD as GitHub secrets from the same generated
-- value *before* using it to create the account, so the two can never drift apart again.
--
-- This migration repoints every "worker" policy to the new, final uuid.

drop policy if exists "module_snapshots_insert_worker" on public.module_snapshots;
create policy "module_snapshots_insert_worker"
  on public.module_snapshots
  for insert
  to authenticated
  with check (
    organization_id is null
    and auth.uid() = '74e96360-1260-4329-8679-ad2e736c96ec'::uuid
  );

drop policy if exists "module_snapshots_update_worker" on public.module_snapshots;
create policy "module_snapshots_update_worker"
  on public.module_snapshots
  for update
  to authenticated
  using (
    organization_id is null
    and auth.uid() = '74e96360-1260-4329-8679-ad2e736c96ec'::uuid
  )
  with check (
    organization_id is null
    and auth.uid() = '74e96360-1260-4329-8679-ad2e736c96ec'::uuid
  );

drop policy if exists "kpis_select_worker" on public.kpis;
create policy "kpis_select_worker"
  on public.kpis
  for select
  to authenticated
  using (auth.uid() = '74e96360-1260-4329-8679-ad2e736c96ec'::uuid);

drop policy if exists "kpi_values_select_worker" on public.kpi_values;
create policy "kpi_values_select_worker"
  on public.kpi_values
  for select
  to authenticated
  using (auth.uid() = '74e96360-1260-4329-8679-ad2e736c96ec'::uuid);

drop policy if exists "kpi_targets_select_worker" on public.kpi_targets;
create policy "kpi_targets_select_worker"
  on public.kpi_targets
  for select
  to authenticated
  using (auth.uid() = '74e96360-1260-4329-8679-ad2e736c96ec'::uuid);
