-- Run this ONCE in Supabase SQL Editor after creating migration_history table.
-- Marks all already-applied migrations as done so the auto-runner skips them.
--
-- Step 1: CREATE TABLE IF NOT EXISTS migration_history (filename text PRIMARY KEY, executed_at timestamptz DEFAULT now());
-- Step 2: Run this file.
-- Step 3: Deploy server — auto-runner will only execute new migrations going forward.

INSERT INTO migration_history (filename) VALUES
  ('000_migration_history.sql'),
  ('001_init.sql'),
  ('002_quiz_logs_elapsed_seconds.sql'),
  ('003_topic_progress_upsert_fix.sql'),
  ('004_concept_extractions.sql'),
  ('005_concept_extractions_delete_policy.sql'),
  ('006_concept_stats.sql'),
  ('007_concept_extractions_question_hash.sql'),
  ('008_error_patterns.sql'),
  ('009_webhooks.sql'),
  ('010_briefing_cache.sql'),
  ('011_srs_concept_review.sql'),
  ('012_daily_review_log.sql'),
  ('013_example_question.sql'),
  ('014_review_result.sql'),
  ('015_concept_triggers.sql'),
  ('016_concept_feedback.sql'),
  ('017_add_last_reviewed.sql'),
  ('018_attempt_errors_extraction.sql'),
  ('019_backfill_pattern_ids.sql'),
  ('020_feedback_logs_link.sql'),
  ('021_journal_formula_related.sql')
ON CONFLICT DO NOTHING;
