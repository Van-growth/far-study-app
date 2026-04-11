-- FAR Study App — Supabase Migration
-- Run this in Supabase SQL Editor

-- 토픽 진도
create table topic_progress (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  topic_id    text not null,
  interval    int default 0,
  next_review timestamptz default now(),
  streak      int default 0,
  attempts    int default 0,
  correct     int default 0,
  updated_at  timestamptz default now(),
  unique(user_id, topic_id)
);

-- 퀴즈 기록
create table quiz_logs (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  topic_id    text not null,
  topic_label text not null,
  question    text not null,
  options     jsonb not null,
  correct     boolean not null,
  selected    int not null,
  answer      int not null,
  created_at  timestamptz default now()
);

-- 학습 세션 (캘린더 히트맵용)
create table study_sessions (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references auth.users(id) on delete cascade,
  date          date not null,
  quiz_count    int default 0,
  correct_count int default 0,
  updated_at    timestamptz default now(),
  unique(user_id, date)
);

-- RLS 활성화
alter table topic_progress enable row level security;
alter table quiz_logs enable row level security;
alter table study_sessions enable row level security;

-- 본인 데이터만 접근
create policy "own progress" on topic_progress
  for all using (auth.uid() = user_id);
create policy "own quiz logs" on quiz_logs
  for all using (auth.uid() = user_id);
create policy "own sessions" on study_sessions
  for all using (auth.uid() = user_id);

-- updated_at 자동 갱신
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_topic_progress
  before update on topic_progress
  for each row execute function update_updated_at();

create trigger trg_study_sessions
  before update on study_sessions
  for each row execute function update_updated_at();

-- 세션 upsert용 함수
create or replace function upsert_study_session(
  p_user_id uuid,
  p_date date,
  p_correct boolean
) returns void as $$
begin
  insert into study_sessions (user_id, date, quiz_count, correct_count)
  values (p_user_id, p_date, 1, case when p_correct then 1 else 0 end)
  on conflict (user_id, date) do update
  set quiz_count = study_sessions.quiz_count + 1,
      correct_count = study_sessions.correct_count +
        case when p_correct then 1 else 0 end;
end;
$$ language plpgsql security definer;

-- 인덱스
create index idx_tp_user on topic_progress(user_id);
create index idx_ql_user on quiz_logs(user_id);
create index idx_ql_user_correct on quiz_logs(user_id, correct);
create index idx_ss_user on study_sessions(user_id);
create index idx_ss_user_date on study_sessions(user_id, date);
