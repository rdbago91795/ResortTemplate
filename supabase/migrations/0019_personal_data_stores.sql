-- 0019_personal_data_stores.sql — T035
--
-- ══════════════════════════════════════════════════════════════════════════════════════
-- THE REGISTER. FR-026a.
-- ══════════════════════════════════════════════════════════════════════════════════════
--
-- Erasure and export were found incomplete THREE separate times during specification —
-- first missing email_deliveries, then missing enquiries. Each obvious fix was to add the
-- missing table name to the two requirements, and each would have failed again on the fourth
-- store.
--
-- FR-026b says a rule naming individual stores instead of the register is defective by
-- construction. That is only true if the register is a REAL OBJECT. A register that exists as
-- prose in a specification is one someone forgets to update — which is exactly how the defect
-- recurred. Making it data means erase_guest_data() and export_guest_data() are written once
-- and never edited when a store is added.
--
-- Adding a personal-data column means adding a row here, in the same migration.
--
-- The dispositions differ by table and the difference matters:
--   bookings         anonymise — the reservation record survives for inventory and accounting
--   email_deliveries anonymise — message kind and outcome survive, the address does not
--   enquiries        delete    — no business record to preserve

create table public.personal_data_stores (
  table_name       text primary key,
  personal_columns text[] not null check (array_length(personal_columns, 1) > 0),
  disposition      text not null check (disposition in ('anonymise', 'delete')),
  key_column       text not null
);

insert into public.personal_data_stores (table_name, personal_columns, disposition, key_column) values
  ('bookings',         array['guest_name', 'guest_email', 'guest_phone', 'guest_notes'], 'anonymise', 'guest_email'),
  ('email_deliveries', array['recipient'],                                               'anonymise', 'recipient'),
  ('enquiries',        array['full_name', 'email', 'message'],                           'delete',    'email');

comment on table public.personal_data_stores is
  'FR-026a. Erasure, export, and retention iterate this rather than naming tables. A register in prose is one someone forgets to update — this one fails CI if a store skips it.';

comment on column public.personal_data_stores.disposition is
  'anonymise keeps the row and clears the columns; delete removes the row. Bookings survive erasure for inventory and accounting; enquiries do not.';
