-- 0029_privacy.sql — T048
--
-- ══════════════════════════════════════════════════════════════════════════════════════
-- ERASURE AND EXPORT ITERATE THE REGISTER. They name no table (FR-026b).
-- ══════════════════════════════════════════════════════════════════════════════════════
--
-- This defect was found three times during specification — erasure missing email_deliveries,
-- then missing enquiries — and each obvious fix was to add the missing name to two
-- requirements. Each would have failed again on the fourth store.
--
-- Adding a personal-data store means adding a ROW to personal_data_stores. These two
-- functions never change.
--
-- Keyed on EMAIL ADDRESS, not on a booking (FR-027): a guest who booked twice and enquired
-- once is one person and must be one action.
--
-- `p_identity_verified` must be true. The system cannot prove who is asking — the owner
-- attests it and the attestation is recorded (FR-027b, FR-028a). A check that pretends
-- otherwise would look like security and not be it.

create or replace function public.erase_guest_data(
  p_email             text,
  p_identity_verified boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_store   record;
  v_email   public.citext := lower(trim(p_email))::public.citext;
  v_counts  jsonb := '{}'::jsonb;
  v_n       int;
  v_booking record;
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;
  if not p_identity_verified then raise exception 'identity_not_attested'; end if;

  -- Journal before erasing, on every affected booking. booking_events holds no personal
  -- fields, so this entry survives erasure without defeating it (FR-022g).
  for v_booking in
    select id from public.bookings where guest_email = v_email
  loop
    insert into public.booking_events (booking_id, actor_id, event_type, new_values)
    values (v_booking.id, (select auth.uid()), 'guest_erased',
            jsonb_build_object('identity_attested', true, 'at', now()));
  end loop;

  for v_store in select * from public.personal_data_stores loop
    if v_store.disposition = 'delete' then
      execute format('delete from public.%I where %I = $1', v_store.table_name, v_store.key_column)
        using v_email;
      get diagnostics v_n = row_count;

    else
      -- Anonymise: null every registered column, and stamp erased_at where it exists.
      execute format(
        'update public.%I set %s %s where %I = $1',
        v_store.table_name,
        (select string_agg(format('%I = null', col), ', ')
         from unnest(v_store.personal_columns) as col),
        case when v_store.table_name = 'bookings' then ', erased_at = now()' else '' end,
        v_store.key_column
      ) using v_email;
      get diagnostics v_n = row_count;
    end if;

    v_counts := v_counts || jsonb_build_object(v_store.table_name, v_n);
  end loop;

  return jsonb_build_object('status', 'erased', 'affected', v_counts);
end $$;

revoke all on function public.erase_guest_data(text, boolean) from public, anon;
grant execute on function public.erase_guest_data(text, boolean) to authenticated;

comment on function public.erase_guest_data(text, boolean) is
  'Iterates personal_data_stores rather than naming tables (FR-026b). Adding a store is a row, not an edit to this function.';

-- ── Export — the same reach as erasure (FR-028b) ──────────────────────────────
create or replace function public.export_guest_data(
  p_email             text,
  p_identity_verified boolean
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_store  record;
  v_email  public.citext := lower(trim(p_email))::public.citext;
  v_out    jsonb := '{}'::jsonb;
  v_rows   jsonb;
begin
  if not coalesce((select public.is_admin()), false) then raise exception 'not_authorised'; end if;
  if not p_identity_verified then raise exception 'identity_not_attested'; end if;

  for v_store in select * from public.personal_data_stores loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where t.%I = $1',
      v_store.table_name, v_store.key_column
    ) into v_rows using v_email;

    v_out := v_out || jsonb_build_object(v_store.table_name, v_rows);
  end loop;

  return jsonb_build_object('status', 'ok', 'email', v_email, 'data', v_out);
end $$;

revoke all on function public.export_guest_data(text, boolean) from public, anon;
grant execute on function public.export_guest_data(text, boolean) to authenticated;

comment on function public.export_guest_data(text, boolean) is
  'Same register, same key as erasure (FR-028b). An export that misses a store misreports what the resort holds.';
