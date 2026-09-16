-- SaaS Opportunity Radar schema migration
-- Supports persistent opportunities, AI priorities, human decision gate, and research scores

create table if not exists public.opportunities (
  id                      text        primary key,
  user_id                 uuid        references auth.users (id) on delete set null,
  title                   text        not null,
  description             text        not null default '',
  problem                 text        not null default '',
  target_customer         text        not null default '',
  industry                text        not null default '',
  current_workflow        text        default '',
  current_solutions       text        default '',
  why_interesting         text        default '',
  why_the_problem_matters text        default '',
  economic_impact         text        default '',
  market_size             text        default '',
  market_gap              text        default '',
  ai_opportunity          text        default '',
  ai_fit                  text        default 'MEDIUM',
  
  -- AI Priority & Scoring
  ai_priority             text        not null default 'MEDIUM_POTENTIAL',
  ai_priority_reasons     text[]      not null default '{}',
  ai_confidence           text        not null default 'MEDIUM',
  research_score          integer     not null default 50,
  research_score_factors  jsonb       not null default '{"problemSeverity":5,"problemFrequency":5,"economicValue":5,"willingnessToPay":5,"marketOpportunity":5,"competitionGap":5,"aiFit":5,"technicalFeasibility":5,"distributionPotential":5,"evidenceStrength":5}'::jsonb,
  evidence_strength       text        not null default 'MEDIUM',

  -- Independent Human Decision
  my_decision             text        not null default 'UNDECIDED',
  next_action             text        default '',
  my_thoughts             text        default '',

  -- MVP & Business Blueprint
  mvp_features            text[]      not null default '{}',
  excluded_features       text[]      not null default '{}',
  monetization_model      text        default '',
  pricing_idea            text        default '',
  distribution_channels   text[]      not null default '{}',
  execution_risks         jsonb       not null default '[]'::jsonb,

  -- Nested details (validation, competitors, sources, notes)
  validation              jsonb       not null default '{"interviewsCount":0,"interestedCustomersCount":0,"waitlistCount":0,"assumptions":[],"risks":[],"validationQuestions":[]}'::jsonb,
  competitors             jsonb       not null default '[]'::jsonb,
  sources                 jsonb       not null default '[]'::jsonb,
  notes                   jsonb       not null default '[]'::jsonb,

  -- Workflow & Classification
  status                  text        not null default 'NEW',
  is_user_generated       boolean     not null default false,
  created_by              text        not null default 'AI',
  source                  text        not null default 'Hermes',
  favorite                boolean     not null default false,
  saved                   boolean     not null default false,
  tags                    text[]      not null default '{}',
  
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Indexes for lightning-fast search and filtering
create index if not exists opportunities_status_idx on public.opportunities (status);
create index if not exists opportunities_priority_idx on public.opportunities (ai_priority);
create index if not exists opportunities_score_idx on public.opportunities (research_score desc);
create index if not exists opportunities_decision_idx on public.opportunities (my_decision);
create index if not exists opportunities_favorite_idx on public.opportunities (favorite);
create index if not exists opportunities_saved_idx on public.opportunities (saved);
create index if not exists opportunities_user_gen_idx on public.opportunities (is_user_generated);
create index if not exists opportunities_updated_at_idx on public.opportunities (updated_at desc);

-- Auto-update updated_at trigger
create or replace trigger opportunities_updated_at
  before update on public.opportunities
  for each row execute procedure public.touch_updated_at();

-- Grants
grant select, insert, update, delete on public.opportunities to anon, authenticated, service_role;

-- Row-level security: enable but permit open access for personal single-user or service key
alter table public.opportunities enable row level security;

drop policy if exists "opportunities: public read" on public.opportunities;
drop policy if exists "opportunities: public insert" on public.opportunities;
drop policy if exists "opportunities: public update" on public.opportunities;
drop policy if exists "opportunities: public delete" on public.opportunities;

create policy "opportunities: public read" on public.opportunities for select using (true);
create policy "opportunities: public insert" on public.opportunities for insert with check (true);
create policy "opportunities: public update" on public.opportunities for update using (true);
create policy "opportunities: public delete" on public.opportunities for delete using (true);
