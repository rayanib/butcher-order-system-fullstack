create table if not exists public.app_state (
  state_key text primary key,
  payload jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state enable row level security;

drop policy if exists "Allow public app_state access" on public.app_state;

create policy "Allow public app_state access"
on public.app_state
for all
using (true)
with check (true);
