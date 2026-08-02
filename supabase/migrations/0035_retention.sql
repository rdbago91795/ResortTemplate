-- 0035_retention.sql — T050 (retention half)
--
-- Retention is the same problem as erasure: "remove personal data from every place it lives".
-- Erasure keys on WHO, retention keys on HOW OLD. Both must reach every store, and both fail
-- the same way if a table is added later and someone forgets to update a function.
--
-- So retention extends the register rather than naming tables:
--
--   retention_column   the column that determines age
--   retention_setting  the site_settings column holding the cutoff, in months
--
-- ADDING A PERSONAL-DATA STORE IS STILL A ROW. Both apply_retention() and erase_guest_data()
-- pick it up with no code change.
--
-- NOTE - this extends personal_data_stores beyond what Gate 8 was described as containing.
-- The alternative was a hard-coded table list inside apply_retention, which is the exact
-- shape of the defect the register was built to prevent (it was found three times during
-- specification). Flagged rather than done quietly.
--
-- bookings age on CHECK_OUT, not created_at: a booking made two years ago for a stay next
-- week is not stale. The other two age on created_at, which is all they have.

alter table public.personal_data_stores
  add column if not exists retention_column  text,
  add column if not exists retention_setting text;

update public.personal_data_stores set retention_column = 'check_out',
  retention_setting = 'booking_retention_months' where table_name = 'bookings';
update public.personal_data_stores set retention_column = 'created_at',
  retention_setting = 'booking_retention_months' where table_name = 'email_deliveries';
update public.personal_data_stores set retention_column = 'created_at',
  retention_setting = 'enquiry_retention_months' where table_name = 'enquiries';

alter table public.personal_data_stores
  alter column retention_column  set not null,
  alter column retention_setting set not null;

comment on column public.personal_data_stores.retention_column is
  'The column that determines a row''s age. bookings uses check_out, not created_at: a booking made long ago for an upcoming stay is not stale.';

-- ---- The daily sweep -----------------------------------------------------------------
--
-- Idempotent by construction: the guard is `key_column is not null`, and the key column is
-- the email column that anonymisation nulls. A row already processed cannot be processed
-- again, so a job that runs twice costs nothing and a job that missed a day catches up.

create or replace function public.apply_retention()
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_store  record;
  v_months int;
  v_n      int;
  v_counts jsonb := '{}'::jsonb;
begin
  for v_store in select * from public.personal_data_stores loop
    execute format('select %I from public.site_settings where id', v_store.retention_setting)
      into v_months;

    -- 0 or null disables retention for that store rather than deleting everything.
    if v_months is null or v_months <= 0 then
      v_counts := v_counts || jsonb_build_object(v_store.table_name, 0);
      continue;
    end if;

    if v_store.disposition = 'delete' then
      execute format(
        'delete from public.%I where %I < (now() - make_interval(months => $1))',
        v_store.table_name, v_store.retention_column
      ) using v_months;
    else
      execute format(
        'update public.%I set %s %s where %I < (now() - make_interval(months => $1)) and %I is not null',
        v_store.table_name,
        (select string_agg(format('%I = null', col), ', ')
         from unnest(v_store.personal_columns) as col),
        -- bookings_email_required_online permits a null email only on an erased row, so
        -- retention must stamp it exactly as erasure does.
        case when v_store.table_name = 'bookings' then ', erased_at = now()' else '' end,
        v_store.retention_column,
        v_store.key_column
      ) using v_months;
    end if;

    get diagnostics v_n = row_count;
    v_counts := v_counts || jsonb_build_object(v_store.table_name, v_n);
  end loop;

  return jsonb_build_object('status', 'ok', 'affected', v_counts);
end $$;

revoke all on function public.apply_retention() from public, anon, authenticated;

comment on function public.apply_retention() is
  'Iterates personal_data_stores. Anonymises or deletes rows past the retention window named in site_settings. Idempotent: the key column it nulls is the guard it tests.';
