-- migration 020: link feedback_logs to attempt_errors and concept_extractions

ALTER TABLE feedback_logs
  ADD COLUMN IF NOT EXISTS attempt_error_id uuid
    REFERENCES attempt_errors(id),
  ADD COLUMN IF NOT EXISTS extraction_id uuid
    REFERENCES concept_extractions(id);
