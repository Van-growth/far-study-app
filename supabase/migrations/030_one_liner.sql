-- Migration 030: add one_liner column to concept_extractions
ALTER TABLE concept_extractions
  ADD COLUMN IF NOT EXISTS one_liner text;
