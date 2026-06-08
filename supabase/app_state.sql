create table if not exists public.app_state (
  user_id uuid references auth.users(id) on delete cascade,
  state_key text not null,
  payload jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.app_state add column if not exists state_key text;
alter table public.app_state add column if not exists payload jsonb not null default 'null'::jsonb;
alter table public.app_state add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.app_state alter column state_key set not null;

alter table public.app_state drop constraint if exists app_state_pkey;
alter table public.app_state drop constraint if exists app_state_user_state_key_key;
alter table public.app_state add constraint app_state_user_state_key_key unique (user_id, state_key);

alter table public.app_state enable row level security;

drop policy if exists "Allow public app_state access" on public.app_state;
drop policy if exists "Public can read shop status" on public.app_state;
drop policy if exists "Users can read own app_state" on public.app_state;
drop policy if exists "Users can insert own app_state" on public.app_state;
drop policy if exists "Users can update own app_state" on public.app_state;
drop policy if exists "Users can delete own app_state" on public.app_state;

create policy "Public can read shop status"
on public.app_state
for select
to anon, authenticated
using (state_key = 'shopStatus');

create policy "Users can read own app_state"
on public.app_state
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own app_state"
on public.app_state
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own app_state"
on public.app_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own app_state"
on public.app_state
for delete
to authenticated
using (auth.uid() = user_id);
