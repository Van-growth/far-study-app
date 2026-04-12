-- Add elapsed_seconds column to quiz_logs for per-question timer tracking.
-- Null-safe: existing rows stay NULL, new rows from QuizView will populate it.

alter table public.quiz_logs
  add column if not exists elapsed_seconds integer;

-- Optional index for the WrongPage aggregation query (group by topic_id).
create index if not exists quiz_logs_user_topic_idx
  on public.quiz_logs (user_id, topic_id);
