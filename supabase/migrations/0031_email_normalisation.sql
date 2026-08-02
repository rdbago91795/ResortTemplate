-- 0031_email_normalisation.sql — corrective, found by probing 0029
--
-- ======================================================================================
-- citext WAS SILENTLY CASE-SENSITIVE INSIDE EVERY `search_path = ''` FUNCTION.
-- ======================================================================================
--
-- 0001 installed citext with this stated intent:
--   "case-insensitive email columns, so `Ana@x.com` and `ana@x.com` are one guest"
--
-- That intent was not being delivered anywhere it mattered. Proven directly:
--
--   search_path = ''        'Maria@Example.com'::citext = 'maria@example.com'::citext  ->  FALSE
--   search_path = 'public'  same expression                                           ->  TRUE
--
-- OPERATORS ARE RESOLVED THROUGH search_path, JUST LIKE TABLES AND TYPES. citext lives in
-- `public`; every security-definer function is hardened with `set search_path = ''`; so the
-- citext `=` operator is invisible inside them. Postgres does not error - citext is binary-
-- coercible to text, so it silently falls back to `text = text`, which is case-SENSITIVE.
--
-- Found by the erasure probe: a guest with two bookings, a bounced email, and an enquiry was
-- erased by email address. It cleared email_deliveries (2 rows) and MISSED bookings (0) and
-- enquiries (0) - because the deliveries happened to be stored lowercase and the others were
-- not. A register-driven erasure that reaches the right tables and matches the wrong rows
-- looks exactly like one that works.
--
-- What was broken, in production terms:
--   * FR-013  a guest whose email was stored `Maria.S@x.com` could NEVER look up their booking.
--             get_booking_by_reference lowercases the input but not the stored value, so the
--             comparison could not match for any input the guest could type.
--   * FR-026  erase_guest_data silently under-erased. RA 10173 exposure.
--   * FR-028  export_guest_data silently under-reported what the resort holds.
--
-- ---- THIS IS THE SECOND TIME THIS CONDITION HAS CAUSED A BUG --------------------------
--
-- 0025 fixed a bare `::citext` cast that resolved to nothing under `search_path = ''`. Same
-- root condition - an extension in `public` used by functions that cannot see `public` - at a
-- different resolution site. Both were found by probing, neither by review. Fixing the second
-- site and leaving the condition would leave the trap armed for the third.
--
-- So the fix removes THE CONDITION, not the site:
--
--   Case-insensitivity stops being OPERATOR BEHAVIOUR (invisible, search_path-dependent,
--   silently degrading) and becomes a STORAGE INVARIANT (visible in the schema, enforced by
--   a CHECK constraint, impossible to lose quietly).
--
-- Emails are stored `text`, always lowercase and trimmed. `=` is then plain `text = text` from
-- pg_catalog, which resolves under any search_path including ''. The citext extension is
-- dropped in 0032, so no future function can reintroduce the fault.
--
-- Same reasoning as room_occupancy: make the database hold the guarantee, so no caller has to
-- remember it.

-- ---- 1. The normaliser ---------------------------------------------------------------
--
-- A trigger, not a CHECK-that-rejects. Enquiries are inserted DIRECTLY by anon under RLS-P3,
-- so a constraint that refused `Maria@X.com` would be a form error shown to a guest who typed
-- their own address correctly. The trigger normalises; the CHECK then asserts the trigger ran.
-- Belt and braces: the mechanism and the proof are separate.

create or replace function public.normalise_email()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_col text := tg_argv[0];
  v_val text;
begin
  v_val := to_jsonb(new) ->> v_col;
  if v_val is null then return new; end if;
  new := jsonb_populate_record(new, jsonb_build_object(v_col, lower(btrim(v_val))));
  return new;
end $$;

comment on function public.normalise_email() is
  'Lowercases and trims the email column named in TG_ARGV[0]. Replaces citext: the invariant is storage, not operator behaviour (0031).';

-- ---- 2. Convert the columns ----------------------------------------------------------
--
-- The anon insert policy reads enquiries.email, and Postgres refuses to alter the type of a
-- column a policy depends on. Dropped and recreated verbatim below, with the now-redundant
-- ::text cast removed.

drop policy if exists enquiries_insert_anon on public.enquiries;

alter table public.bookings
  alter column guest_email type text using lower(btrim(guest_email::text));
alter table public.enquiries
  alter column email type text using lower(btrim(email::text));
alter table public.email_deliveries
  alter column recipient type text using lower(btrim(recipient::text));
alter table public.site_settings
  alter column contact_email type text using lower(btrim(contact_email::text));

create policy enquiries_insert_anon on public.enquiries
  for insert to anon
  with check (
    status = 'new'
    and owner_note is null
    and char_length(full_name) between 1 and 120
    and char_length(message) between 1 and 2000
    and char_length(email) between 3 and 254
  );

-- ---- 3. The invariant, asserted ------------------------------------------------------

alter table public.bookings add constraint bookings_guest_email_normalised
  check (guest_email is null or guest_email = lower(btrim(guest_email)));
alter table public.enquiries add constraint enquiries_email_normalised
  check (email = lower(btrim(email)));
alter table public.email_deliveries add constraint email_deliveries_recipient_normalised
  check (recipient is null or recipient = lower(btrim(recipient)));
alter table public.site_settings add constraint site_settings_contact_email_normalised
  check (contact_email = lower(btrim(contact_email)));

-- ---- 4. The mechanism, attached ------------------------------------------------------

create trigger bookings_normalise_email before insert or update of guest_email
  on public.bookings for each row execute function public.normalise_email('guest_email');
create trigger enquiries_normalise_email before insert or update of email
  on public.enquiries for each row execute function public.normalise_email('email');
create trigger email_deliveries_normalise_recipient before insert or update of recipient
  on public.email_deliveries for each row execute function public.normalise_email('recipient');
create trigger site_settings_normalise_contact_email before insert or update of contact_email
  on public.site_settings for each row execute function public.normalise_email('contact_email');

-- ---- 5. Erasure must be allowed to null the email it keys on -------------------------
--
-- !! SECOND LATENT BUG, exposed by fixing the first. `bookings_email_required_online` says an
-- online booking must carry an email. Erasure nulls exactly that column. While the key
-- comparison was broken, erasure matched no online bookings and never hit this. The moment
-- matching works, erasing an online booking would violate the constraint and abort - the
-- privacy path would fail on precisely the bookings it most needs to reach.
--
-- The rule was never "always has an email", it was "was captured with one". `erased_at` is
-- what distinguishes a booking taken without an email from one deliberately stripped of it.

alter table public.bookings drop constraint bookings_email_required_online;
alter table public.bookings add constraint bookings_email_required_online
  check (origin <> 'online' or guest_email is not null or erased_at is not null);

comment on constraint bookings_email_required_online on public.bookings is
  'An online booking is captured with an email. Erasure is the one way it may later be absent (0031).';
