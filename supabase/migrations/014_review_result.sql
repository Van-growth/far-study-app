-- Add review_result and reviewed_at to concept_extractions for per-card result tracking
ALTER TABLE concept_extractions
  ADD COLUMN IF NOT EXISTS review_result text CHECK (review_result IN ('known', 'confused')),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_concept_extractions_reviewed_at
  ON concept_extractions (user_id, reviewed_at)
  WHERE reviewed_at IS NOT NULL;
