-- Track daily flashcard review results per user.
-- Uses upsert (user_id + log_date unique) so increments are safe from any device.

CREATE TABLE IF NOT EXISTS daily_review_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date      date        NOT NULL DEFAULT CURRENT_DATE,
  knew_count    integer     NOT NULL DEFAULT 0,
  confused_count integer    NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE daily_review_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_review_log_own_select" ON daily_review_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "daily_review_log_own_insert" ON daily_review_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_review_log_own_update" ON daily_review_log
  FOR UPDATE USING (auth.uid() = user_id);
