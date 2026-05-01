-- Migration 028: review_log 테이블
-- 복습 탭에서 카드 풀이 결과를 기록 (topic별 confused 패턴 감지용)

CREATE TABLE IF NOT EXISTS review_log (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id  uuid REFERENCES concept_extractions(id) ON DELETE CASCADE,
  topic_id    text,
  result      text CHECK (result IN ('known', 'confused')),
  reviewed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_log_user_reviewed ON review_log (user_id, reviewed_at);
CREATE INDEX IF NOT EXISTS review_log_user_topic    ON review_log (user_id, topic_id, reviewed_at);

ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_log_insert" ON review_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_log_select" ON review_log
  FOR SELECT USING (auth.uid() = user_id);
