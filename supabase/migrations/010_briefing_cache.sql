-- Daily AI briefing cache. One row per user, upserted by the daily-briefing
-- Edge Function each morning (KST 07:00 via GitHub Actions schedule).
-- The client reads this on mount to skip the Claude API call entirely.

create table briefing_cache (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users not null,
  content         text not null,        -- JSON: { summary, actions[], dayEstimate }
  generated_at    timestamptz not null default now(),
  context_snapshot jsonb,               -- concept_stats snapshot at generation time
  unique(user_id)
);

alter table briefing_cache enable row level security;

create policy "briefing_cache_own_read"
  on briefing_cache for select
  using (auth.uid() = user_id);

-- Only service_role (Edge Function) may insert/update.
-- No client-side insert policy needed.

create index briefing_cache_user_idx on briefing_cache (user_id);
