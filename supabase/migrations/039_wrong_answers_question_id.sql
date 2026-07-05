-- 039_wrong_answers_question_id.sql
-- question_number("Q1","Q2" 등)는 사용자가 그때그때 붙이는 화면표시용 라벨이라
-- 여러 세션에서 재사용되면 서로 다른 문제가 반복오답으로 잘못 묶일 수 있었음.
-- question_text를 정규화(공백 정리 + 소문자) 후 SHA-256 앞 16자로 해시한 question_id를
-- 실제 식별자로 분리하고, question_number는 순수 표시용 라벨로만 남긴다.

ALTER TABLE wrong_answers ADD COLUMN question_id text;

UPDATE wrong_answers
SET question_id = substr(
  encode(
    extensions.digest(
      lower(regexp_replace(regexp_replace(question_text, '^\s+|\s+$', '', 'g'), '\s+', ' ', 'g')),
      'sha256'
    ),
    'hex'
  ),
  1, 16
);

ALTER TABLE wrong_answers ALTER COLUMN question_id SET NOT NULL;
ALTER TABLE wrong_answers ADD CONSTRAINT wrong_answers_question_id_key UNIQUE (question_id);

COMMENT ON COLUMN wrong_answers.question_id IS 'question_text 정규화 후 SHA-256 앞 16자 해시 — 반복오답 판단/그룹핑의 실제 식별자.';
COMMENT ON COLUMN wrong_answers.question_number IS '사용자가 붙이는 화면표시용 라벨(Q1, Q2 등) — 세션 간 재사용되므로 식별자로 쓰면 안 됨. 실제 식별자는 question_id.';
