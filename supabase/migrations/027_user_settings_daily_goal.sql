-- 027: user_settings — daily_goal 컬럼 추가
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS daily_goal integer NOT NULL DEFAULT 10;
