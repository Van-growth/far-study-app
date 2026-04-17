-- Add question_hash column for exact-duplicate detection on concept_extractions.
-- Complements the existing Jaccard-overlap duplicate check: this guards
-- against re-analyzing the literal same question text (trimmed SHA-256).

alter table concept_extractions
  add column if not exists question_hash text;

create index if not exists idx_concept_extractions_hash
  on concept_extractions (user_id, question_hash);
