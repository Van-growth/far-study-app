-- 023: user_settings — 사용자별 설정 저장 (시험일 등)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id    uuid         PRIMARY KEY,
  exam_date  date         DEFAULT NULL,
  created_at timestamptz  NOT NULL DEFAULT now(),
  updated_at timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own" ON user_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
