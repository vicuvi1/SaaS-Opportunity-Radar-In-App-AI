-- Persists Launch Plan blueprints per thread.
-- payload stores { planGoal, data } so the goal selector restores on load.

create table if not exists public.blueprint_results (
  id         uuid        primary key default gen_random_uuid(),
  thread_id  uuid        not null unique references public.threads (id) on delete cascade,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  payload    jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blueprint_results_thread_idx
  on public.blueprint_results (thread_id);

create or replace trigger blueprint_results_updated_at
  before update on public.blueprint_results
  for each row execute procedure public.touch_updated_at();

grant select, insert, update, delete
  on public.blueprint_results
  to authenticated;

alter table public.blueprint_results enable row level security;

drop policy if exists "blueprint: own read"   on public.blueprint_results;
drop policy if exists "blueprint: own insert" on public.blueprint_results;
drop policy if exists "blueprint: own update" on public.blueprint_results;
drop policy if exists "blueprint: own delete" on public.blueprint_results;

create policy "blueprint: own read"
  on public.blueprint_results for select using (auth.uid() = user_id);
create policy "blueprint: own insert"
  on public.blueprint_results for insert with check (auth.uid() = user_id);
create policy "blueprint: own update"
  on public.blueprint_results for update using (auth.uid() = user_id);
create policy "blueprint: own delete"
  on public.blueprint_results for delete using (auth.uid() = user_id);

-- Reload PostgREST schema cache so the FK join in loadThreads works immediately.
notify pgrst, 'reload schema';
