-- ============================================================================
-- BeTon — canonical database schema (Supabase / Postgres 17)
-- Mirrors the migrations applied to project tsnukavodlfpswqjrrhn.
-- Order: 01 core → 02 provisioning → 03 RLS → 04 views → 05 hardening → seed
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 01 — CORE SCHEMA
-- ----------------------------------------------------------------------------
create type public.muscle_group as enum ('Chest','Back','Shoulders','Biceps','Triceps','Legs','Abs','Cardio');
create type public.contest_status as enum ('draft','active','finished','archived');
create type public.participant_status as enum ('active','invited','left');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null,
  handle text unique,
  avatar_url text,
  theme text not null default 'dark' check (theme in ('dark','light')),
  reminders_enabled boolean not null default true,
  reminder_time time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.contests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  start_date date not null,
  end_date date not null,
  num_weeks int not null,
  weekly_gym_target int not null default 4,
  weekly_calorie_cap int not null default 14000,
  cheat_total_allowance int not null default 10,
  default_daily_calorie_goal int not null default 2000,
  checkin_weeks int[] not null default '{}',
  status public.contest_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_contests_updated before update on public.contests
  for each row execute function public.set_updated_at();

create table public.contest_participants (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  color text,
  status public.participant_status not null default 'active',
  joined_at timestamptz not null default now(),
  unique (contest_id, profile_id)
);
create index idx_participants_profile on public.contest_participants(profile_id);
create index idx_participants_contest on public.contest_participants(contest_id);

create table public.contest_invites (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  email text not null,
  color text,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (contest_id, email)
);
create index idx_invites_email on public.contest_invites(lower(email));

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  calories int not null default 0 check (calories >= 0),
  protein_g int not null default 0 check (protein_g >= 0),
  junk_calories int not null default 0 check (junk_calories >= 0),
  gym boolean not null default false,
  muscles public.muscle_group[] not null default '{}',
  cheat boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contest_id, profile_id, log_date)
);
create index idx_logs_contest_date on public.daily_logs(contest_id, log_date);
create index idx_logs_profile on public.daily_logs(profile_id);
create trigger trg_logs_updated before update on public.daily_logs
  for each row execute function public.set_updated_at();

create table public.calorie_goals (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  effective_from date not null,
  goal_calories int not null check (goal_calories >= 0),
  created_at timestamptz not null default now(),
  unique (contest_id, profile_id, effective_from)
);
create index idx_goals_lookup on public.calorie_goals(contest_id, profile_id, effective_from);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_no int not null,
  photo_url text,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (contest_id, profile_id, week_no)
);

-- ----------------------------------------------------------------------------
-- 02 — AUTH PROVISIONING (profile + invite acceptance on signup)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, initcap(split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  for inv in
    select * from public.contest_invites
    where lower(email) = lower(new.email) and accepted_at is null
  loop
    insert into public.contest_participants (contest_id, profile_id, color, status)
    values (inv.contest_id, new.id, inv.color, 'active')
    on conflict (contest_id, profile_id) do nothing;
    update public.contest_invites set accepted_at = now() where id = inv.id;
  end loop;

  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 03 — ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
create or replace function public.is_contest_member(_contest_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.contest_participants
    where contest_id = _contest_id and profile_id = auth.uid());
$$;

create or replace function public.shares_contest_with(_other uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.contest_participants a
    join public.contest_participants b on a.contest_id = b.contest_id
    where a.profile_id = auth.uid() and b.profile_id = _other);
$$;

create or replace function public.is_contest_owner(_contest_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.contests where id = _contest_id and created_by = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.contests enable row level security;
alter table public.contest_participants enable row level security;
alter table public.contest_invites enable row level security;
alter table public.daily_logs enable row level security;
alter table public.calorie_goals enable row level security;
alter table public.checkins enable row level security;

create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_contest_with(id));
create policy "profiles_insert_self" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "contests_select" on public.contests for select to authenticated
  using (created_by = auth.uid() or public.is_contest_member(id));
create policy "contests_insert" on public.contests for insert to authenticated
  with check (created_by = auth.uid());
create policy "contests_update_owner" on public.contests for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "contests_delete_owner" on public.contests for delete to authenticated
  using (created_by = auth.uid());

create policy "participants_select" on public.contest_participants for select to authenticated
  using (public.is_contest_member(contest_id));
create policy "participants_insert" on public.contest_participants for insert to authenticated
  with check (profile_id = auth.uid() or public.is_contest_owner(contest_id));
create policy "participants_update" on public.contest_participants for update to authenticated
  using (profile_id = auth.uid() or public.is_contest_owner(contest_id));
create policy "participants_delete" on public.contest_participants for delete to authenticated
  using (profile_id = auth.uid() or public.is_contest_owner(contest_id));

create policy "invites_select" on public.contest_invites for select to authenticated
  using (public.is_contest_member(contest_id) or public.is_contest_owner(contest_id)
         or lower(email) = lower(auth.jwt() ->> 'email'));
create policy "invites_insert" on public.contest_invites for insert to authenticated
  with check (public.is_contest_member(contest_id) or public.is_contest_owner(contest_id));
create policy "invites_update_owner" on public.contest_invites for update to authenticated
  using (public.is_contest_owner(contest_id)) with check (public.is_contest_owner(contest_id));
create policy "invites_delete_owner" on public.contest_invites for delete to authenticated
  using (public.is_contest_owner(contest_id));

create policy "logs_select_member" on public.daily_logs for select to authenticated
  using (public.is_contest_member(contest_id));
create policy "logs_insert_own" on public.daily_logs for insert to authenticated
  with check (profile_id = auth.uid() and public.is_contest_member(contest_id));
create policy "logs_update_own" on public.daily_logs for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "logs_delete_own" on public.daily_logs for delete to authenticated
  using (profile_id = auth.uid());

create policy "goals_select_member" on public.calorie_goals for select to authenticated
  using (public.is_contest_member(contest_id));
create policy "goals_insert_own" on public.calorie_goals for insert to authenticated
  with check (profile_id = auth.uid() and public.is_contest_member(contest_id));
create policy "goals_update_own" on public.calorie_goals for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "goals_delete_own" on public.calorie_goals for delete to authenticated
  using (profile_id = auth.uid());

create policy "checkins_select_member" on public.checkins for select to authenticated
  using (public.is_contest_member(contest_id));
create policy "checkins_insert_own" on public.checkins for insert to authenticated
  with check (profile_id = auth.uid() and public.is_contest_member(contest_id));
create policy "checkins_update_own" on public.checkins for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "checkins_delete_own" on public.checkins for delete to authenticated
  using (profile_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 04 — PROGRESS VIEWS (security_invoker so RLS applies to the caller)
-- ----------------------------------------------------------------------------
create view public.v_weekly_participant_summary with (security_invoker = on) as
select
  dl.contest_id,
  dl.profile_id,
  (floor((dl.log_date - c.start_date) / 7) + 1)::int as week_no,
  count(*)::int as days_logged,
  coalesce(sum(dl.calories), 0)::int as total_calories,
  coalesce(sum(dl.protein_g), 0)::int as total_protein,
  coalesce(sum(dl.junk_calories), 0)::int as total_junk,
  coalesce(sum((dl.gym)::int), 0)::int as gym_sessions,
  coalesce(sum((dl.cheat)::int), 0)::int as cheats,
  coalesce(round(avg(nullif(dl.protein_g, 0))), 0)::int as avg_protein
from public.daily_logs dl
join public.contests c on c.id = dl.contest_id
where dl.log_date >= c.start_date and dl.log_date <= c.end_date
group by dl.contest_id, dl.profile_id, week_no;

create view public.v_weekly_scored with (security_invoker = on) as
select
  s.contest_id, s.profile_id, s.week_no, s.days_logged,
  s.total_calories, s.total_protein, s.total_junk,
  s.gym_sessions, s.cheats, s.avg_protein,
  c.weekly_gym_target, c.weekly_calorie_cap,
  (s.gym_sessions >= c.weekly_gym_target) as gym_hit,
  (s.days_logged = 7 and s.total_calories <= c.weekly_calorie_cap) as cal_hit,
  ((case when s.gym_sessions >= c.weekly_gym_target then 1 else 0 end)
   + (case when s.days_logged = 7 and s.total_calories <= c.weekly_calorie_cap then 1 else 0 end)) as points,
  (s.days_logged = 7) as complete
from public.v_weekly_participant_summary s
join public.contests c on c.id = s.contest_id;

create view public.v_weekly_results with (security_invoker = on) as
with scored as (
  select ws.*,
    (select count(*) from public.contest_participants cp
       where cp.contest_id = ws.contest_id and cp.status = 'active') as total_participants,
    sum((ws.complete)::int) over (partition by ws.contest_id, ws.week_no) as complete_count,
    rank() over (partition by ws.contest_id, ws.week_no
                 order by ws.points desc, ws.total_calories asc) as rnk
  from public.v_weekly_scored ws
)
select
  contest_id, week_no, profile_id, points, total_calories,
  gym_hit, cal_hit, complete,
  (total_participants > 0 and complete_count = total_participants) as week_decided,
  (rnk = 1 and total_participants > 0 and complete_count = total_participants) as is_winner
from scored;

create view public.v_series_standings with (security_invoker = on) as
select
  cp.contest_id,
  cp.profile_id,
  coalesce(sum((r.is_winner)::int), 0)::int as rounds_won
from public.contest_participants cp
left join public.v_weekly_results r
  on r.contest_id = cp.contest_id and r.profile_id = cp.profile_id and r.week_decided
where cp.status = 'active'
group by cp.contest_id, cp.profile_id;

-- ----------------------------------------------------------------------------
-- 05 — HARDENING (limit who can execute helper functions via the API)
-- ----------------------------------------------------------------------------
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_contest_member(uuid) from public, anon;
revoke all on function public.is_contest_owner(uuid) from public, anon;
revoke all on function public.shares_contest_with(uuid) from public, anon;
grant execute on function public.is_contest_member(uuid) to authenticated;
grant execute on function public.is_contest_owner(uuid) to authenticated;
grant execute on function public.shares_contest_with(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 06 — CHALLENGE FLOW (create + invite + accept/decline)
-- ----------------------------------------------------------------------------
-- Only a contest OWNER may insert participants directly; invitees join via accept_invite().
drop policy if exists "participants_insert" on public.contest_participants;
create policy "participants_insert_owner" on public.contest_participants for insert to authenticated
  with check (public.is_contest_owner(contest_id));

create or replace function public.get_my_challenges()
returns table (invite_id uuid, contest_id uuid, contest_name text, inviter_name text, color text, created_at timestamptz)
language sql security definer stable set search_path = public as $$
  select i.id, i.contest_id, c.name, p.display_name, i.color, i.created_at
  from public.contest_invites i
  join public.contests c on c.id = i.contest_id
  left join public.profiles p on p.id = i.invited_by
  where lower(i.email) = lower(auth.jwt() ->> 'email') and i.accepted_at is null;
$$;

create or replace function public.accept_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select * into inv from public.contest_invites
  where id = p_invite_id and lower(email) = lower(auth.jwt() ->> 'email') and accepted_at is null;
  if not found then raise exception 'Invite not found or not addressed to you'; end if;
  insert into public.contest_participants (contest_id, profile_id, color, status)
  values (inv.contest_id, auth.uid(), inv.color, 'active')
  on conflict (contest_id, profile_id) do nothing;
  update public.contest_invites set accepted_at = now() where id = inv.id;
end; $$;

create or replace function public.decline_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.contest_invites
  where id = p_invite_id and lower(email) = lower(auth.jwt() ->> 'email') and accepted_at is null;
end; $$;

revoke all on function public.get_my_challenges() from public, anon;
revoke all on function public.accept_invite(uuid) from public, anon;
revoke all on function public.decline_invite(uuid) from public, anon;
grant execute on function public.get_my_challenges() to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;
grant execute on function public.decline_invite(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- SEED (run once, after the first users exist or via invite-on-signup)
-- ----------------------------------------------------------------------------
-- with c as (
--   insert into public.contests
--     (name, start_date, end_date, num_weeks, weekly_gym_target, weekly_calorie_cap,
--      cheat_total_allowance, default_daily_calorie_goal, checkin_weeks, status)
--   values ('BeTon — Csongor vs Peter (Summer 2026)', date '2026-06-15', date '2026-09-26',
--           15, 4, 14000, 10, 2000, '{5,10,15}', 'active')
--   returning id
-- )
-- insert into public.contest_invites (contest_id, email, color)
-- select id, 'iamcsongor@gmail.com', 'blue' from c;
--   -- TODO: add Peter's invite: select id, '<peter-email>', 'red' from contests where name = '...';
