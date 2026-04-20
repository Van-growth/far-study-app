-- Add example_question column to concept_extractions for auto-generated practice questions
ALTER TABLE concept_extractions
  ADD COLUMN IF NOT EXISTS example_question jsonb DEFAULT NULL;
