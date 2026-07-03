-- 037_enable_rls_feedback_logs_trap_patterns.sql
-- feedback_logs: 서버(service_role)만 접근 — 정책 없이 RLS만 활성화(anon/authenticated 전면 차단, 의도된 동작)
ALTER TABLE public.feedback_logs ENABLE ROW LEVEL SECURITY;

-- trap_patterns: topics/question_bank과 동일 컨벤션 (인증된 사용자만 읽기)
ALTER TABLE public.trap_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY authenticated_select ON public.trap_patterns
  FOR SELECT TO authenticated USING (true);
