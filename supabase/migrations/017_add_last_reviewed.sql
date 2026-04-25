-- migration 017: add last_reviewed_at column for review tracking
-- Separate from reviewed_at (migration 014) to serve as canonical
-- "when did this card last get reviewed" timestamp used by stats queries.
ALTER TABLE concept_extractions
  ADD COLUMN IF NOT EXISTS last_reviewed_at timestamptz;
