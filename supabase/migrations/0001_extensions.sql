-- 0001_extensions.sql — T017
--
-- Four extensions, each earning its place:
--
--   btree_gist  the exclusion constraints in 0008 and 0011. GiST alone cannot index the
--               equality half of `(room_unit_id with =, stay_range with &&)`.
--   pg_cron     hold expiry, awaiting expiry, and retention (FR-006, FR-007, FR-028d).
--               Constitution III requires expiry with no human action.
--   citext      case-insensitive email columns, so `Ana@x.com` and `ana@x.com` are one guest
--               for lookup (FR-013) and erasure (FR-027).
--   pgcrypto    digest() for the salted IP hash in rate limiting. Already installed on this
--               project; the guard makes the migration reproducible on a fresh database.

create extension if not exists btree_gist;
create extension if not exists citext;
create extension if not exists pgcrypto with schema extensions;

create extension if not exists pg_cron;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;
