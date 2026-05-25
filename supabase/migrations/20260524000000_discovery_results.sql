-- Add discovery_results table to persist Create/Find mode output per thread.
-- Mirrors the structure of idea_reports.

create table if not exists public.discovery_results (
  id         uuid        primary key default gen_random_uuid(),
  thread_id  uuid        not null unique references public.threads (id) on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  payload    jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discovery_results_thread_idx
  on public.discovery_results (thread_id);

create or replace trigger discovery_results_updated_at
  before update on public.discovery_results
  for each row execute procedure public.touch_updated_at();

grant select, insert, update, delete
  on public.discovery_results
  to authenticated;

alter table public.discovery_results enable row level security;

drop policy if exists "discovery: own read"   on public.discovery_results;
drop policy if exists "discovery: own insert" on public.discovery_results;
drop policy if exists "discovery: own update" on public.discovery_results;
drop policy if exists "discovery: own delete" on public.discovery_results;

create policy "discovery: own read"
  on public.discovery_results for select using (auth.uid() = user_id);
create policy "discovery: own insert"
  on public.discovery_results for insert with check (auth.uid() = user_id);
create policy "discovery: own update"
  on public.discovery_results for update using (auth.uid() = user_id);
create policy "discovery: own delete"
  on public.discovery_results for delete using (auth.uid() = user_id);
