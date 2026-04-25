-- migration 021: journal_entry, formula, related_concepts columns for concept_extractions
ALTER TABLE concept_extractions
  ADD COLUMN IF NOT EXISTS journal_entry   text,
  ADD COLUMN IF NOT EXISTS formula         text,
  ADD COLUMN IF NOT EXISTS related_concepts jsonb;
