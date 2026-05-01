-- Migration 029: tutor_sessions 테이블
-- AI 튜터 일일 브리핑 세션 (was_clicked 추적으로 어제 제안 실행 여부 파악)

CREATE TABLE IF NOT EXISTS tutor_sessions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date           date DEFAULT CURRENT_DATE,
  briefing_text  text,
  suggested_mode text,
  was_clicked    boolean DEFAULT false,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tutor_sessions_all" ON tutor_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
