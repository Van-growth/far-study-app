-- migration 024: add error_type, fix_applied, fix_applied_at to feedback_logs
ALTER TABLE feedback_logs
  ADD COLUMN IF NOT EXISTS error_type text CHECK (error_type IN ('explanation', 'answer', 'option')),
  ADD COLUMN IF NOT EXISTS fix_applied boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS fix_applied_at timestamptz;
