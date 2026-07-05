-- 040_wrong_answers_reset_legacy_times_wrong.sql
-- 전수 검증 결과: times_wrong > 1인 3건 모두 question_id(question_text 전문 해시) 충돌 없음 —
-- 즉 question_id 로직 자체는 정상. 다만 이 3건의 times_wrong은 039 마이그레이션 이전,
-- topic_tag+question_number 기준의 옛 중복판정 시절에 누적된 값이라 실제 반복 여부를
-- 지금 스키마(updated_at 없음)로는 검증할 수 없다. question_id 기준으로 재확인 가능한
-- 진짜 반복이 아니므로 1로 재설정한다.

UPDATE wrong_answers
SET times_wrong = 1
WHERE id IN (
  '45eb89e6-3fdf-4410-a71d-dd1635a5c291', -- AFS dividend adjustment (Other/Q2, was 4)
  '74d24dce-06a8-49cb-9b82-54ef369e27ff', -- Party Supply inventory NRV (Inventory/Q7, was 2)
  '6b73fdad-0f0c-4d2b-b42e-c93771a3e8cd'  -- Stanton equity method JE (Equity Method/Q2, was 2)
);
