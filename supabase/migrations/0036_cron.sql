-- 0036_cron.sql — T050 (scheduling half)
--
-- ======================================================================================
-- THESE JOBS TIDY. THEY DO NOT GUARANTEE ANYTHING.
-- ======================================================================================
--
-- If pg_cron never runs — and on a free-tier project that pauses after 7 days idle, it will
-- not — no guest sees a wrong answer:
--
--   expiry     0033/0034 already release lapsed holds on read and on write. Cron only stops
--              dead room_occupancy rows from accumulating between writes.
--   retention  0035 is idempotent and works on age, not on when it last ran. A sweep missed
--              for a week catches up in full on the next run.
--
-- TWO JOBS, NOT FOUR. T050 specified four: hold expiry, awaiting expiry, booking
-- anonymisation, enquiry deletion. They collapse in pairs because of how the schema turned
-- out, not to save effort:
--
--   * `held` and `awaiting_verification` both expire off hold_expires_at (submit_reference
--     re-stamps it with awaiting_hours), so one function and one job cover both. Two jobs
--     would run the same query twice.
--   * booking anonymisation and enquiry deletion are both rows in personal_data_stores, and
--     apply_retention iterates the register. Splitting them would put table names back into
--     the scheduler — the exact coupling the register exists to remove.
--
-- Flagged in the completion report as a deviation from the task text.

-- Idempotent: cron.schedule upserts on job name, but unscheduling first keeps a renamed or
-- retired job from being left behind on re-run.
do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname in ('expire-stale-holds', 'apply-retention');
exception when others then
  null;  -- no cron.job rows yet on a fresh project
end $$;

-- Every 5 minutes. Matches the shortest hold window worth reclaiming promptly; anything
-- finer just polls an empty table.
select cron.schedule(
  'expire-stale-holds',
  '*/5 * * * *',
  $job$select public.expire_stale_holds();$job$
);

-- 03:15 UTC = 11:15 Asia/Manila. Deliberately not midnight: retention touches the same rows
-- the booking list reads, and 11am local is quiet for a resort but not asleep, so a failure
-- is noticed the same day rather than the next morning.
select cron.schedule(
  'apply-retention',
  '15 3 * * *',
  $job$select public.apply_retention();$job$
);
