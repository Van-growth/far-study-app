-- Allow users to delete their own concept_extractions rows.
-- Migration 004 only defined SELECT/INSERT policies — DELETE was implicitly
-- denied by RLS. The "이 기록 삭제" button on AnalyzePage needs this policy
-- to succeed.

create policy "concept_extractions_own_delete"
  on concept_extractions for delete
  using (auth.uid() = user_id);
