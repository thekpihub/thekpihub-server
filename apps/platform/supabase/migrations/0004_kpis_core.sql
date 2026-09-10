-- KPI Monitor: the real data source publish-signals.ts / SIGNAL_WIRING_DESIGN_20260713.md
-- always assumed would live in an external kpihub-backend. It never got deployed, and
-- apps/platform's own schema had zero KPI tables (confirmed 2026-09-10 via direct query).
-- This migration adds that capability directly to the already-live product/database instead
-- of standing up a second backend to serve it — see CLAUDE.md's "Add KPI routes to
-- apps/platform" decision, 2026-09-10.
--
-- Scoped by user_id, not organization_id: confirmed live (2026-09-10) that this project has
-- exactly 1 real profile and 0 organizations, so an org-scoping requirement would be a dead
-- end for the only real user. organization_id is carried as an optional column for later, but
-- nothing requires it today.

create table if not exists public.kpis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  unit text,
  direction text not null default 'higher_is_better'
    check (direction in ('higher_is_better', 'lower_is_better', 'target_is_better')),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kpi_values (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  value numeric not null,
  period_start date not null default current_date,
  recorded_at timestamptz not null default now(),
  unique (kpi_id, period_start)
);

create table if not exists public.kpi_targets (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references public.kpis(id) on delete cascade,
  target_value numeric not null,
  target_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists kpi_values_kpi_id_period_idx on public.kpi_values (kpi_id, period_start desc);
create index if not exists kpi_targets_kpi_id_date_idx on public.kpi_targets (kpi_id, target_date desc);

alter table public.kpis enable row level security;
alter table public.kpi_values enable row level security;
alter table public.kpi_targets enable row level security;

-- Owner-only: a user manages only their own KPIs.
drop policy if exists "kpis_manage_own" on public.kpis;
create policy "kpis_manage_own"
  on public.kpis
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "kpi_values_manage_own" on public.kpi_values;
create policy "kpi_values_manage_own"
  on public.kpi_values
  for all
  using (exists (select 1 from public.kpis where public.kpis.id = public.kpi_values.kpi_id and public.kpis.user_id = auth.uid()))
  with check (exists (select 1 from public.kpis where public.kpis.id = public.kpi_values.kpi_id and public.kpis.user_id = auth.uid()));

drop policy if exists "kpi_targets_manage_own" on public.kpi_targets;
create policy "kpi_targets_manage_own"
  on public.kpi_targets
  for all
  using (exists (select 1 from public.kpis where public.kpis.id = public.kpi_targets.kpi_id and public.kpis.user_id = auth.uid()))
  with check (exists (select 1 from public.kpis where public.kpis.id = public.kpi_targets.kpi_id and public.kpis.user_id = auth.uid()));

-- Worker read (publish-signals.ts): the same narrowly-scoped Supabase Auth account migration
-- 0003 already granted global module_snapshots write to (uuid confirmed live 2026-09-10) also
-- needs to read every user's active KPIs to compute the global decision-feed signals — it
-- still can't write here, and still can't write anything org-scoped in module_snapshots.
drop policy if exists "kpis_select_worker" on public.kpis;
create policy "kpis_select_worker"
  on public.kpis
  for select
  to authenticated
  using (auth.uid() = '2ef527c0-0bf6-408e-a31a-ede0055de3b4'::uuid);

drop policy if exists "kpi_values_select_worker" on public.kpi_values;
create policy "kpi_values_select_worker"
  on public.kpi_values
  for select
  to authenticated
  using (auth.uid() = '2ef527c0-0bf6-408e-a31a-ede0055de3b4'::uuid);

drop policy if exists "kpi_targets_select_worker" on public.kpi_targets;
create policy "kpi_targets_select_worker"
  on public.kpi_targets
  for select
  to authenticated
  using (auth.uid() = '2ef527c0-0bf6-408e-a31a-ede0055de3b4'::uuid);
