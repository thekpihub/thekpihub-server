-- Create profiles table in the public schema
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  first_name text,
  last_name text,
  org text,
  role text,
  plan text default 'starter'::text
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create Policies

-- 1. Allow public read access to profiles (or restrict to authenticated if preferred)
create policy "Allow public read access"
  on public.profiles for select
  using (true);

-- 2. Allow users to update their own profile
create policy "Allow individual updates"
  on public.profiles for update
  using (auth.uid() = id);

-- 3. Allow individual insert (or let trigger handle it)
create policy "Allow individual inserts"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 4. Enable service role full control
create policy "Service role full access"
  on public.profiles for all
  using (true)
  with check (true);

-- Trigger to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    'starter'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
