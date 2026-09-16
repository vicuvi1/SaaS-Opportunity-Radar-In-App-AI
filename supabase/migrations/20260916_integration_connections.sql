-- Migration: Integration Connections & Credentials Vault
-- Encrypted credentials store at rest with per-user isolation

create table if not exists public.integration_connections (
  id                    text        primary key,
  user_id               uuid        references auth.users (id) on delete cascade,
  provider              text        not null,
  status                text        not null default 'NOT_CONNECTED',
  category              text        not null default 'signal',
  account_name          text,
  account_metadata      jsonb       default '{}'::jsonb,
  encrypted_credentials text,
  last_tested_at        timestamptz,
  error_message         text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists idx_integration_connections_user on public.integration_connections (user_id);
create index if not exists idx_integration_connections_provider on public.integration_connections (user_id, provider);

alter table public.integration_connections enable row level security;

create policy "Users can read own integration connections"
  on public.integration_connections
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own integration connections"
  on public.integration_connections
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own integration connections"
  on public.integration_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own integration connections"
  on public.integration_connections
  for delete
  using (auth.uid() = user_id);
