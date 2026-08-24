create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  first_name text,
  last_name text,
  org text,
  role text,
  plan text not null default 'starter',
  default_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.recommendations (
  id text primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  module_id text not null,
  title text not null,
  rank integer,
  confidence integer,
  impact integer,
  effort integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  recommendation_id text references public.recommendations(id) on delete set null,
  module_id text not null,
  headline text not null,
  category text not null check (category in ('risk', 'opportunity', 'recommendation')),
  severity text not null check (severity in ('high', 'medium', 'low')),
  detail text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'snoozed', 'dismissed')),
  source_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decision_outcomes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null unique references public.decisions(id) on delete cascade,
  result text not null check (result in ('success', 'partial_success', 'failed')),
  notes text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.recommendation_accuracy (
  recommendation_id text primary key references public.recommendations(id) on delete cascade,
  success_count integer not null default 0,
  partial_success_count integer not null default 0,
  failed_count integer not null default 0,
  score numeric(5,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.module_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  module_id text not null,
  snapshot_date date not null default current_date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text not null,
  status text not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.recommendations (
  id,
  module_id,
  title,
  rank,
  confidence,
  impact,
  effort,
  metadata
)
values
  (
    'rec-pricing-corridor',
    'recommendation-engine',
    'Tighten pricing corridor for SMB tier',
    1,
    81,
    84,
    38,
    '{"category":"Pricing"}'::jsonb
  ),
  (
    'rec-forecasting-renewals',
    'forecasting-center',
    'Intervene on renewal cohort at risk',
    2,
    74,
    77,
    34,
    '{"category":"Retention"}'::jsonb
  ),
  (
    'rec-market-shift-onboarding',
    'market-shift',
    'Refresh onboarding narrative for new vertical demand',
    3,
    72,
    69,
    29,
    '{"category":"Go-to-Market"}'::jsonb
  ),
  (
    'rec-enterprise-onboarding-bundle',
    'recommendation-engine',
    'Bundle implementation services for enterprise deals',
    4,
    66,
    71,
    45,
    '{"category":"Expansion"}'::jsonb
  ),
  (
    'rec-self-serve-team-invites',
    'recommendation-engine',
    'Ship self-serve team invitations',
    5,
    80,
    65,
    18,
    '{"category":"Product"}'::jsonb
  )
on conflict (id) do update set
  module_id = excluded.module_id,
  title = excluded.title,
  rank = excluded.rank,
  confidence = excluded.confidence,
  impact = excluded.impact,
  effort = excluded.effort,
  metadata = excluded.metadata,
  updated_at = now();

alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.recommendations enable row level security;
alter table public.decisions enable row level security;
alter table public.decision_outcomes enable row level security;
alter table public.recommendation_accuracy enable row level security;
alter table public.module_snapshots enable row level security;
alter table public.subscriptions enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "decisions_manage_own" on public.decisions;
create policy "decisions_manage_own"
  on public.decisions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "decision_outcomes_manage_own" on public.decision_outcomes;
create policy "decision_outcomes_manage_own"
  on public.decision_outcomes
  for all
  using (
    exists (
      select 1
      from public.decisions
      where public.decisions.id = public.decision_outcomes.decision_id
        and public.decisions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.decisions
      where public.decisions.id = public.decision_outcomes.decision_id
        and public.decisions.user_id = auth.uid()
    )
  );

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, org, role, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'org', ''),
    coalesce(new.raw_user_meta_data->>'role', 'executive'),
    'starter'
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    org = excluded.org,
    role = excluded.role;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
