-- migration 019: backfill pattern_id in attempt_errors based on user_note text

-- 개념 미이해 계열
UPDATE attempt_errors
SET pattern_id = 'E_ROOT_01'
WHERE (
    user_note ILIKE '%개념 미이해%'
 OR user_note ILIKE '%개념이해%'
 OR user_note ILIKE '%몰랐%'
 OR user_note ILIKE '%이해 못%'
);

-- 계산 실수 계열
UPDATE attempt_errors
SET pattern_id = 'E_ROOT_02'
WHERE (
    user_note ILIKE '%계산 실수%'
 OR user_note ILIKE '%계산실수%'
 OR user_note ILIKE '%계산%틀%'
 OR user_note ILIKE '%숫자%'
);

-- 문제 해석 오류 계열
UPDATE attempt_errors
SET pattern_id = 'E_ROOT_03'
WHERE (
    user_note ILIKE '%해석%오류%'
 OR user_note ILIKE '%문제 해석%'
 OR user_note ILIKE '%독해%'
 OR user_note ILIKE '%읽%잘못%'
);
