-- migration 018: link attempt_errors to concept_extractions
-- Also rebuilds tag_attempt_error RPC to accept extraction_id.

ALTER TABLE attempt_errors
  ADD COLUMN IF NOT EXISTS extraction_id uuid
  REFERENCES concept_extractions(id);

-- Drop old 5-param signature and recreate with optional extraction_id.
DROP FUNCTION IF EXISTS tag_attempt_error(uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION tag_attempt_error(
  p_quiz_log_id    uuid,
  p_pattern_id     text,
  p_topic          text,
  p_user_note      text,
  p_ai_diagnosis   text,
  p_extraction_id  uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_new_id  uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM error_patterns WHERE pattern_id = p_pattern_id) THEN
    RAISE EXCEPTION 'unknown pattern_id: %', p_pattern_id;
  END IF;

  INSERT INTO attempt_errors (
    user_id, quiz_log_id, pattern_id, topic,
    user_note, ai_diagnosis, extraction_id
  ) VALUES (
    v_user_id, p_quiz_log_id, p_pattern_id, p_topic,
    p_user_note, p_ai_diagnosis, p_extraction_id
  )
  RETURNING id INTO v_new_id;

  INSERT INTO pattern_stats (user_id, pattern_id, occurrence, last_seen, updated_at)
  VALUES (v_user_id, p_pattern_id, 1, now(), now())
  ON CONFLICT (user_id, pattern_id) DO UPDATE SET
    occurrence  = pattern_stats.occurrence + 1,
    last_seen   = now(),
    updated_at  = now();

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION tag_attempt_error(uuid, text, text, text, text, uuid) TO authenticated;
