-- Error Pattern Library: 3-layer ontology for structured error tagging.
-- Tables: error_patterns (master), attempt_errors (per-user), pattern_stats (rollup).
-- RPCs: tag_attempt_error, refresh_pattern_stats.
-- View: global_pattern_stats (cross-user aggregates).

create table if not exists error_patterns (
  id            uuid default gen_random_uuid() primary key,
  pattern_id    text unique not null,
  layer         text not null check (layer in ('root', 'exec', 'outcome')),
  name          text not null,
  description   text,
  linked_topics text[] default '{}',
  created_at    timestamptz default now()
);

create table if not exists attempt_errors (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  quiz_log_id   uuid references quiz_logs(id) on delete cascade,
  pattern_id    text not null references error_patterns(pattern_id) on delete restrict,
  topic         text,
  user_note     text,
  ai_diagnosis  text,
  created_at    timestamptz default now()
);

create table if not exists pattern_stats (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  pattern_id    text not null references error_patterns(pattern_id) on delete restrict,
  occurrence    int not null default 0,
  recent_rate   float not null default 0,
  improvement   float not null default 0,
  last_seen     timestamptz,
  updated_at    timestamptz default now(),
  unique (user_id, pattern_id)
);

alter table error_patterns enable row level security;
alter table attempt_errors enable row level security;
alter table pattern_stats enable row level security;

drop policy if exists "error_patterns_public_read" on error_patterns;
create policy "error_patterns_public_read" on error_patterns
  for select using (true);

drop policy if exists "attempt_errors_own_read" on attempt_errors;
create policy "attempt_errors_own_read" on attempt_errors
  for select using (auth.uid() = user_id);

drop policy if exists "attempt_errors_own_insert" on attempt_errors;
create policy "attempt_errors_own_insert" on attempt_errors
  for insert with check (auth.uid() = user_id);

drop policy if exists "pattern_stats_own_read" on pattern_stats;
create policy "pattern_stats_own_read" on pattern_stats
  for select using (auth.uid() = user_id);

create index if not exists idx_attempt_errors_user on attempt_errors(user_id);
create index if not exists idx_attempt_errors_pattern on attempt_errors(pattern_id);
create index if not exists idx_attempt_errors_user_created on attempt_errors(user_id, created_at desc);
create index if not exists idx_pattern_stats_user on pattern_stats(user_id);

create or replace function tag_attempt_error(
  p_quiz_log_id  uuid,
  p_pattern_id   text,
  p_topic        text,
  p_user_note    text,
  p_ai_diagnosis text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_new_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if not exists (select 1 from error_patterns where pattern_id = p_pattern_id) then
    raise exception 'unknown pattern_id: %', p_pattern_id;
  end if;

  insert into attempt_errors (
    user_id, quiz_log_id, pattern_id, topic, user_note, ai_diagnosis
  ) values (
    v_user_id, p_quiz_log_id, p_pattern_id, p_topic, p_user_note, p_ai_diagnosis
  )
  returning id into v_new_id;

  insert into pattern_stats (user_id, pattern_id, occurrence, last_seen, updated_at)
  values (v_user_id, p_pattern_id, 1, now(), now())
  on conflict (user_id, pattern_id) do update set
    occurrence = pattern_stats.occurrence + 1,
    last_seen = now(),
    updated_at = now();

  return v_new_id;
end;
$$;

grant execute on function tag_attempt_error(uuid, text, text, text, text) to authenticated;

create or replace function refresh_pattern_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_total_recent int;
  v_total_prev int;
  rec record;
  v_recent_cnt int;
  v_prev_cnt int;
  v_rate float;
  v_imp float;
begin
  if v_user_id is null then
    return;
  end if;

  select count(*) into v_total_recent
  from attempt_errors
  where user_id = v_user_id
    and created_at >= now() - interval '7 days';

  select count(*) into v_total_prev
  from attempt_errors
  where user_id = v_user_id
    and created_at >= now() - interval '14 days'
    and created_at <  now() - interval '7 days';

  for rec in
    select id, pattern_id
    from pattern_stats
    where user_id = v_user_id
  loop
    select count(*) into v_recent_cnt
    from attempt_errors
    where user_id = v_user_id
      and pattern_id = rec.pattern_id
      and created_at >= now() - interval '7 days';

    select count(*) into v_prev_cnt
    from attempt_errors
    where user_id = v_user_id
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

grant execute on function refresh_pattern_stats() to authenticated;

drop view if exists global_pattern_stats;
create view global_pattern_stats as
select
  pattern_id,
  count(distinct user_id) as user_count,
  count(*) as total_occurrence,
  avg(case when created_at >= now() - interval '7 days' then 1.0 else 0.0 end) as recent_share,
  max(created_at) as last_seen
from attempt_errors
group by pattern_id;

alter view global_pattern_stats set (security_invoker = false);
grant select on global_pattern_stats to authenticated, anon;

insert into error_patterns (pattern_id, layer, name, description, linked_topics) values
  ('E_ROOT_01', 'root', '개념 미이해', '원리 자체를 모름', array['ASC842','BOND','NFP','FX','LIFO']),
  ('E_ROOT_02', 'root', '공식 암기 오류', '개념은 아는데 계산 틀림', array['BOND','LEASE','CIP']),
  ('E_ROOT_03', 'root', '독해 실수', '문제 조건 잘못 읽음', array['ALL']),
  ('E_EXEC_01', 'exec', '리스 분류 혼동', 'ASC 842 운용 vs 금융 리스', array['F4_LEASE']),
  ('E_EXEC_02', 'exec', '채권 상각 계산 오류', '유효이자율법 계산', array['F4_BOND']),
  ('E_EXEC_03', 'exec', 'NFP 제한 분류 실수', 'donor restriction 판단', array['F6_NFP']),
  ('E_EXEC_04', 'exec', 'FX 환산 시점 혼동', '거래일 vs 결산일', array['F5_FX']),
  ('E_EXEC_05', 'exec', 'LIFO 레이어 계산', 'Dollar-value LIFO', array['F3_LIFO']),
  ('E_EXEC_06', 'exec', 'CIP 자본화 판단', '차입원가 자본화 요건', array['F3_CIP']),
  ('E_EXEC_07', 'exec', 'SCF 분류 오류', '영업/투자/재무 활동 분류', array['F5_SCF']),
  ('E_EXEC_08', 'exec', 'ROU 자산 측정 오류', '리스 초기 측정 구성요소', array['F4_LEASE']),
  ('E_OUT_01', 'outcome', '모듈 정확도 정체', '특정 모듈 60% 이하 고착', array['ALL']),
  ('E_OUT_02', 'outcome', '시험 위험 토픽', '반복 오답 3회 이상', array['ALL']),
  ('E_OUT_03', 'outcome', '학습 효율 저하', '시간 대비 개선율 낮음', array['ALL'])
on conflict (pattern_id) do update set
  layer = excluded.layer,
  name = excluded.name,
  description = excluded.description,
  linked_topics = excluded.linked_topics;
