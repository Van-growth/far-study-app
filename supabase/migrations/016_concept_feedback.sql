-- Migration 016: Add feedback and fix tracking columns to concept_extractions
ALTER TABLE concept_extractions
  ADD COLUMN IF NOT EXISTS feedback text,
  ADD COLUMN IF NOT EXISTS is_fixed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fixed_at timestamptz;
