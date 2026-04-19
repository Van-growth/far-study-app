-- Enable pg_net for async HTTP calls (used internally by Supabase Database Webhooks).
-- The webhooks themselves are configured in the Supabase Dashboard (see setup guide below).

create extension if not exists pg_net with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: concept_stats_increment_for_user
--
-- Service-role variant of concept_stats_increment.
-- The original RPC uses auth.uid() which is null when called with service_role,
-- so Edge Functions must use this version instead, passing user_id explicitly.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function concept_stats_increment_for_user(
  p_user_id    uuid,
  p_tag        text,
  p_tag_type   text,
  p_topic_id   text,
  p_is_correct boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into concept_stats (
    user_id, tag, tag_type, topic_id, total_count, correct_count, last_seen_at
  ) values (
    p_user_id, p_tag, p_tag_type, p_topic_id,
    1,
    case when p_is_correct then 1 else 0 end,
    now()
  )
  on conflict (user_id, tag, tag_type) do update set
    total_count   = concept_stats.total_count + 1,
    correct_count = concept_stats.correct_count
                    + case when p_is_correct then 1 else 0 end,
    topic_id      = coalesce(p_topic_id, concept_stats.topic_id),
    last_seen_at  = now();
end;
$$;

grant execute on function concept_stats_increment_for_user(uuid, text, text, text, boolean)
  to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: refresh_pattern_stats_for_user
--
-- Service-role variant of refresh_pattern_stats.
-- The original RPC uses auth.uid() which is null in Edge Function context.
-- Recalculates recent_rate (last 7 days ratio) and improvement (vs prior week)
-- for all of the given user's pattern_stats rows.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function refresh_pattern_stats_for_user(
  p_user_id uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_recent int;
  v_total_prev   int;
  rec            record;
  v_recent_cnt   int;
  v_prev_cnt     int;
  v_rate         float;
  v_imp          float;
begin
  if p_user_id is null then
    return;
  end if;

  select count(*) into v_total_recent
  from attempt_errors
  where user_id = p_user_id
    and created_at >= now() - interval '7 days';

  select count(*) into v_total_prev
  from attempt_errors
  where user_id = p_user_id
    and created_at >= now() - interval '14 days'
    and created_at <  now() - interval '7 days';

  for rec in
    select id, pattern_id
    from pattern_stats
    where user_id = p_user_id
  loop
    select count(*) into v_recent_cnt
    from attempt_errors
    where user_id = p_user_id
      and pattern_id = rec.pattern_id
      and created_at >= now() - interval '7 days';

    select count(*) into v_prev_cnt
    from attempt_errors
    where user_id = p_user_id
      and pattern_id = rec.pattern_id
      and created_at >= now() - interval '14 days'
      and created_at <  now() - interval '7 days';

    v_rate := case when v_total_recent > 0
      then v_recent_cnt::float / v_total_recent
      else 0 end;

    v_imp := (case when v_total_prev > 0
        then v_prev_cnt::float / v_total_prev
        else 0 end)
      - (case when v_total_recent > 0
        then v_recent_cnt::float / v_total_recent
        else 0 end);

    update pattern_stats
    set recent_rate = v_rate,
        improvement = v_imp,
        updated_at  = now()
    where id = rec.id;
  end loop;
end;
$$;

grant execute on function refresh_pattern_stats_for_user(uuid)
  to service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Dashboard Webhook Setup Guide
-- ─────────────────────────────────────────────────────────────────────────────
--
-- After deploying the Edge Functions and applying this migration, configure
-- two webhooks in the Supabase Dashboard:
--
--   Dashboard > Database > Webhooks > Create a new webhook
--
-- ── Webhook 1: on-concept-saved ──────────────────────────────────────────────
--   Name:    on-concept-saved
--   Table:   public.concept_extractions
--   Events:  INSERT
--   Type:    Supabase Edge Functions
--   Function: on-concept-saved
--   HTTP Headers (add):
--     Authorization: Bearer <your-service-role-key>
--
-- ── Webhook 2: on-error-tagged ───────────────────────────────────────────────
--   Name:    on-error-tagged
--   Table:   public.attempt_errors
--   Events:  INSERT
--   Type:    Supabase Edge Functions
--   Function: on-error-tagged
--   HTTP Headers (add):
--     Authorization: Bearer <your-service-role-key>
--
-- Service Role Key 위치:
--   Dashboard > Project Settings > API > service_role (secret)
-- ─────────────────────────────────────────────────────────────────────────────
