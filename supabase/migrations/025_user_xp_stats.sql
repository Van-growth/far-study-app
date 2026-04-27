-- user_xp: XP 이벤트 로그 (정답/오답/완료/스트릭)
CREATE TABLE IF NOT EXISTS user_xp (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp_amount    INTEGER     NOT NULL,
  reason       TEXT        CHECK (reason IN ('correct_answer', 'wrong_answer', 'review_complete', 'streak')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);

-- user_stats: 유저별 누적 XP + 레벨 + 스트릭
CREATE TABLE IF NOT EXISTS user_stats (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp         INTEGER DEFAULT 0,
  level            TEXT    DEFAULT '수험생',
  streak_days      INTEGER DEFAULT 0,
  last_study_date  DATE,
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_xp    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_xp_own"    ON user_xp    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_stats_own" ON user_stats FOR ALL USING (auth.uid() = user_id);
