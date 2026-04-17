-- Per-user cumulative accuracy tracking per concept/trap tag.
-- Incremented on every quiz answer submission (via concept_stats_increment RPC).
-- Source of tags: generator emits source_concepts[]/source_trap in its JSON
-- response (server/src/routes/quiz.ts), carried client-side into saveQuizLog.

create table concept_stats (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references auth.users(id) on delete cascade not null,
  tag            text not null,
  tag_type       text not null check (tag_type in ('concept', 'trap')),
  topic_id       text,
  total_count    int  not null default 0,
  correct_count  int  not null default 0,
  last_seen_at   timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id, tag, tag_type)
);

create index concept_stats_user_idx       on concept_stats (user_id);
create index concept_stats_user_topic_idx on concept_stats (user_id, topic_id);

alter table concept_stats enable row level security;

create policy "concept_stats_own_read"
  on concept_stats for select
  using (auth.uid() = user_id);

create policy "concept_stats_own_insert"
  on concept_stats for insert
  with check (auth.uid() = user_id);

create policy "concept_stats_own_update"
  on concept_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Atomic increment RPC: inserts on first sighting, otherwise bumps counts.
-- security definer so the client can call it with only the authenticated role,
-- but we still pin the user_id to auth.uid() inside the function so a caller
-- cannot spoof another user.
create or replace function concept_stats_increment(
  p_tag         text,
  p_tag_type    text,
  p_topic_id    text,
  p_is_correct  boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return;
  end if;

  insert into concept_stats (
    user_id, tag, tag_type, topic_id, total_count, correct_count, last_seen_at
  ) values (
    v_user_id, p_tag, p_tag_type, p_topic_id,
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

grant execute on function concept_stats_increment(text, text, text, boolean)
  to authenticated;
