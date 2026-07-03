-- 033_wrong_answers_model_tracking.sql
-- wrong_answers에 트리거 문구 + 모델 추적 컬럼 3개 추가

ALTER TABLE wrong_answers
  ADD COLUMN IF NOT EXISTS trigger_phrase text,
  ADD COLUMN IF NOT EXISTS model_used text,
  ADD COLUMN IF NOT EXISTS resolved_via_model text;

COMMENT ON COLUMN wrong_answers.trigger_phrase IS '문제 문장에서 실제로 놓친 트리거 문구 원문';
COMMENT ON COLUMN wrong_answers.model_used IS '이 오답 대화가 처리된 모델 (haiku/sonnet5)';
COMMENT ON COLUMN wrong_answers.resolved_via_model IS '최종 이해에 도달한 모델 (재질문 후 해결된 모델 추적용)';
