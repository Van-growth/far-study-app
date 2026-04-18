-- Error Pattern Library — Spendit Finance Ops Ontology 이식.
-- "왜 틀렸는가"를 구조화해서 쌓는 3-layer(root/exec/outcome) 구조.
--
-- 테이블 3개:
--   error_patterns  — 마스터 (모든 사용자 공유, read-only)
--   attempt_errors  — 오답 태깅 (quiz_logs 에 1:1 혹은 1:N)
--   pattern_stats   — per-user 집계 (occurrence, recent_rate, improvement)
--
-- 사용 흐름:
--   1. 학생이 문제 틀림 → QuizView 에서 3-root 버튼 노출
--   2. 선택 시 client 가 /api/error-patterns/diagnose 호출 → ai_diagnosis 수신
--   3. client 가 RPC tag_attempt_error(p_quiz_log_id, p_pattern_id, p_topic,
--      p_user_note, p_ai_diagnosis) 호출 → attempt_errors insert +
--      pattern_stats upsert 가 한 트랜잭션에서 일어난다.

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

-- ── RLS ──────────────────────────────────────────────────────
alter table error_patterns enable row level security;
alter table attempt_errors enable row level security;
alter table pattern_stats enable row level security;

-- error_patterns: 모든 authenticated 유저가 읽기 가능 (마스터 데이터).
-- 쓰기는 막아둔다 (seed 이후 변경 없음; 관리자는 service role 로 직접).
drop policy if exists "error_patterns_public_read" on error_patterns;
create policy "error_patterns_public_read" on error_patterns
  for select using (true);

-- attempt_errors: 본인 것만 read/insert.
drop policy if exists "attempt_errors_own_read" on attempt_errors;
create policy "attempt_errors_own_read" on attempt_errors
  for select using (auth.uid() = user_id);
drop policy if exists "attempt_errors_own_insert" on attempt_errors;
create policy "attempt_errors_own_insert" on attempt_errors
  for insert with check (auth.uid() = user_id);

-- pattern_stats: 본인 것만 read. insert/update 는 RPC 가 security definer 로 수행.
drop policy if exists "pattern_stats_own_read" on pattern_stats;
create policy "pattern_stats_own_read" on pattern_stats
  for select using (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_attempt_errors_user on attempt_errors(user_id);
create index if not exists idx_attempt_errors_pattern on attempt_errors(pattern_id);
create index if not exists idx_attempt_errors_user_created on attempt_errors(user_id, created_at desc);
create index if not exists idx_pattern_stats_user on pattern_stats(user_id);

-- ── tag_attempt_error RPC ────────────────────────────────────
-- attempt_errors insert + pattern_stats upsert 를 atomic 하게.
-- recent_rate / improvement 은 별도 refresh 함수에서 주기적으로 갱신;
-- 여기서는 occurrence bump + last_seen 만 즉시 반영.
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

  -- pattern_id 실재 확인 — FK 위반으로 NOT NULL 에러 나기 전에 명확한 메시지.
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

-- ── refresh_pattern_stats RPC ────────────────────────────────
-- recent_rate = 최근 7일 오답 중 해당 pattern 이 차지한 비율.
-- improvement = 지난 7일 발생률 - 그 전 7일 발생률 (음수 = 덜 발생 = 좋아짐).
--              리포트 표시에서는 -improvement 를 쓰면 "개선율" 이 된다.
-- 대시보드 로드 시 호출. 비싸지 않게 per-user 로 제한.
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
begin
  if v_user_id is null then
    return;
  end if;

  select count(*) into v_total_recent
  from attempt_errors
  where user_id = v_user_id and created_at >= now() - interval '7 days';

  select count(*) into v_total_prev
  from attempt_errors
  where user_id = v_user_id
    and created_at >= now() - interval '14 days'
    and created_at <  now() - interval '7 days';

  update pattern_stats ps set
    recent_rate = coalesce((
      select case when v_total_recent > 0
        then count(*)::float / v_total_recent
        else 0 end
      from attempt_errors ae
      where ae.user_id = v_user_id
        and ae.pattern_id = ps.pattern_id
        and ae.created_at >= now() - interval '7 days'
    ), 0),
    improvement = coalesce((
      select (
        case when v_total_prev > 0
          then (select count(*) from attempt_errors where user_id = v_user_id
                and pattern_id = ps.pattern_id
                and created_at >= now() - interval '14 days'
                and created_at <  now() - interval '7 days')::float / v_total_prev
          else 0 end
      ) - (
        case when v_total_recent > 0
          then (select count(*) from attempt_errors where user_id = v_user_id
                and pattern_id = ps.pattern_id
                and created_at >= now() - interval '7 days')::float / v_total_recent
          else 0 end
      )
    ), 0),
    updated_at = now()
  where ps.user_id = v_user_id;
end;
$$;

grant execute on function refresh_pattern_stats() to authenticated;

-- ── global_pattern_stats 뷰 ─────────────────────────────────
-- 전체 수험생 집계 (RLS 없이 모두 읽기 가능 — 개인 데이터는 드러나지 않음:
-- user_count 와 total_occurrence 만 노출, 개별 user_id 는 외부로 나가지 않는다).
-- 클라이언트의 "나 vs 평균" 비교 카드용.
drop view if exists global_pattern_stats;
create view global_pattern_stats as
select
  pattern_id,
  count(distinct user_id)            as user_count,
  count(*)                           as total_occurrence,
  avg(
    case when created_at >= now() - interval '7 days' then 1.0 else 0.0 end
  )                                  as recent_share,
  max(created_at)                    as last_seen
from attempt_errors
group by pattern_id;

-- 뷰는 기반 테이블(attempt_errors)의 RLS 를 그대로 상속하면 본인 행밖에
-- 못 읽어서 "전체 평균" 의미가 없어진다. security invoker off 로 뷰 자체를
-- definer 권한으로 실행시켜 집계만 노출. 어떤 user_id 인지는 반환하지 않는다.
alter view global_pattern_stats set (security_invoker = off);
grant select on global_pattern_stats to authenticated, anon;

-- ── Seed error_patterns ──────────────────────────────────────
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
