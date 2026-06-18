-- Check-ins every 3 weeks (wk 3, 6, 9, 12, 15 for a 15-week contest).
-- Each check-in falls on the last day (Sunday) of that contest week.

update public.contests
set checkin_weeks = array[3, 6, 9, 12, 15]
where num_weeks = 15
  and (checkin_weeks = array[5, 10, 15] or checkin_weeks = '{}'::int[]);
