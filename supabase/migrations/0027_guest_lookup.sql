-- 0027_guest_lookup.sql — T046
--
-- RLS-P6 TOKENED-SELF-READ. A guest checking their booking is a read the guest must be able
-- to do and no anon SELECT policy should permit.
--
-- ⚠ AN EXPLICIT ALLOWED-FIELD LIST (FR-013a), stated positively so a column added later is
-- excluded by default rather than included by oversight. NOT returned: guest_phone,
-- guest_notes, owner_notes, state history, or the room unit assigned.
--
-- ⚠ FAILURE IS INDISTINGUISHABLE between "no such reference" and "that email does not match"
-- (FR-013b). Both return an empty result through the same path, so the form cannot be used to
-- discover which references exist. Response time is uniform because both cases execute the
-- same single query.
--
-- Two conditions make this safe and it is unsafe without either:
--   1. The reference is high-entropy and non-sequential (FR-005a) — otherwise this is an
--      enumeration oracle for every guest's stay dates.
--   2. It is rate limited (FR-014) — reference plus email is two secrets, but only one is
--      really secret, and unlimited attempts erode that.

create or replace function public.get_booking_by_reference(
  p_reference text,
  p_email     text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row record;
begin
  select
    b.booking_reference,
    b.status,
    b.check_in,
    b.check_out,
    rt.name as room_type_name,
    b.stay_total,
    b.amount_received,
    b.stay_total - coalesce(b.amount_received, 0) as balance
  into v_row
  from public.bookings b
  join public.room_units ru on ru.id = b.room_unit_id
  join public.room_types rt on rt.id = ru.room_type_id
  where b.booking_reference = upper(trim(p_reference))
    and b.guest_email = lower(trim(p_email))::public.citext
    and b.erased_at is null;

  if not found then
    -- Same shape for both failure modes. Nothing distinguishes them.
    return jsonb_build_object('status', 'not_found');
  end if;

  return jsonb_build_object(
    'status',            'ok',
    'booking_reference', v_row.booking_reference,
    'booking_status',    v_row.status,
    'check_in',          v_row.check_in,
    'check_out',         v_row.check_out,
    'room_type_name',    v_row.room_type_name,
    'stay_total',        v_row.stay_total,
    'amount_received',   v_row.amount_received,
    'balance',           v_row.balance
  );
end $$;

revoke all on function public.get_booking_by_reference(text, text) from public;
grant execute on function public.get_booking_by_reference(text, text) to anon, authenticated;

comment on function public.get_booking_by_reference(text, text) is
  'RLS-P6. Requires reference AND email. Returns only the FR-013a field list; failure is indistinguishable between wrong reference and wrong email (FR-013b).';
