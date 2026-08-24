-- ─── The KPI Hub · Supabase Schema ──────────────────────────────────────────
-- Run this entire file once in the Supabase SQL editor.
-- Safe to re-run: all objects use CREATE IF NOT EXISTS / OR REPLACE.

-- ── 1. profiles table ──────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                    uuid        primary key references auth.users(id) on delete cascade,
  first_name            text,
  last_name             text,
  email                 text,
  org                   text,
  role                  text        check (role in ('executive', 'manager', 'contributor', 'analyst')),
  plan                  text        not null default 'starter'
                                    check (plan in ('starter', 'growth', 'enterprise')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── 2. Row-Level Security ───────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Users can only read their own row
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can only update their own row
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Service role (used by PHP backend) bypasses RLS automatically

-- ── 3. Auto-create profile on sign-up ──────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ── 4. Auto-update updated_at ───────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- ── 5. Indexes ──────────────────────────────────────────────────────────────
create index if not exists profiles_plan_idx  on public.profiles (plan);
create index if not exists profiles_role_idx  on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

-- ── 6. Grant public schema usage to authenticated role ─────────────────────
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
