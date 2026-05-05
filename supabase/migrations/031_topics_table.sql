-- 031_topics_table.sql
-- FAR 토픽 SSOT 테이블 — professor_ssot.ts의 각 topic_id 블록을 구조화된 DB로 관리

CREATE TABLE IF NOT EXISTS topics (
  topic_id         TEXT PRIMARY KEY,
  category         TEXT NOT NULL,
  topic_name       TEXT NOT NULL,
  summary          TEXT,
  rule             TEXT,
  trigger_keywords TEXT[],
  trap             TEXT,
  example          TEXT,
  exam_section     TEXT DEFAULT 'FAR',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS topic_id TEXT REFERENCES topics(topic_id);

ALTER TABLE review_log
  ADD COLUMN IF NOT EXISTS topic_id TEXT REFERENCES topics(topic_id);
