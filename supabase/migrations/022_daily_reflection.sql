-- migration 022: daily_reflection table for per-day study obstacle tracking
CREATE TABLE IF NOT EXISTS daily_reflection (
  id         bigserial    PRIMARY KEY,
  user_id    uuid         NOT NULL,
  date       date         NOT NULL DEFAULT CURRENT_DATE,
  content    text         NOT NULL,
  category   text         NOT NULL,
  created_at timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
