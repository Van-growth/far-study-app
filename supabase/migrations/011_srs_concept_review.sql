-- Migration 011: SRS review columns for concept_extractions
-- Adds next_review_at, review_interval, review_count to support
-- spaced repetition on analyzed concepts (replaces quiz-based DUE system).

alter table concept_extractions
  add column if not exists next_review_at timestamptz,
  add column if not exists review_interval int not null default 0,
  add column if not exists review_count int not null default 0;

-- Index for efficient DUE queries (user_id + due date filter)
create index if not exists idx_concept_extractions_due
  on concept_extractions (user_id, next_review_at)
  where next_review_at is not null;

-- Backfill: schedule all existing rows for review 1 day after creation
update concept_extractions
  set next_review_at = created_at + interval '1 day'
where next_review_at is null;
