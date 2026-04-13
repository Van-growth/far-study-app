-- Becker concept extractions — metadata only, no original question text.
-- One row per /api/extract-concepts call, saved from the client after the
-- server response so we keep Supabase as source of truth for admin analytics
-- while the local JSON file remains the server-side prompt-injection source.

create table concept_extractions (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade,
  topic_id       text,
  concepts       jsonb not null default '[]'::jsonb,
  asc_references jsonb not null default '[]'::jsonb,
  topic_tags     jsonb not null default '[]'::jsonb,
  trap_pattern   text,
  was_wrong      boolean,
  created_at     timestamptz default now()
);

create index concept_extractions_user_idx on concept_extractions (user_id, created_at desc);
create index concept_extractions_day_idx  on concept_extractions (date_trunc('day', created_at));

alter table concept_extractions enable row level security;

-- Owners can read/insert their own rows.
create policy "concept_extractions_own_read"
  on concept_extractions for select
  using (auth.uid() = user_id);

create policy "concept_extractions_own_insert"
  on concept_extractions for insert
  with check (auth.uid() = user_id);
