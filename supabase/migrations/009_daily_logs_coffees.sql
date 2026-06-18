-- Daily coffee count (target 3/day, weekly quota 21 — tracked in app, not scored on Versus).

alter table public.daily_logs
  add column if not exists coffees int not null default 0 check (coffees >= 0);
