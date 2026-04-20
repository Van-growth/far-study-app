-- Add triggers jsonb column to concept_extractions
ALTER TABLE concept_extractions
  ADD COLUMN IF NOT EXISTS triggers jsonb NOT NULL DEFAULT '[]'::jsonb;
