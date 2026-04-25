-- migration 000: migration tracking table
CREATE TABLE IF NOT EXISTS migration_history (
  filename     text PRIMARY KEY,
  executed_at  timestamptz DEFAULT now()
);
