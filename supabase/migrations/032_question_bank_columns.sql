-- Migration 032: question_bank 컬럼 추가
-- question_id, question_hash, area_id, source

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS question_id   text,
  ADD COLUMN IF NOT EXISTS question_hash text,
  ADD COLUMN IF NOT EXISTS area_id       text,
  ADD COLUMN IF NOT EXISTS source        integer;

COMMENT ON COLUMN question_bank.question_id   IS 'Human-readable ID, e.g. LIAB_ST_001_Q1';
COMMENT ON COLUMN question_bank.question_hash IS 'Join key for question_analytics / question_stats';
COMMENT ON COLUMN question_bank.area_id       IS 'Topic prefix, e.g. LIAB (derived from topic_id)';
COMMENT ON COLUMN question_bank.source        IS '1 = Becker, 2 = AICPA Released';
