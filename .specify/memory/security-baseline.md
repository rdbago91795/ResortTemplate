# Security & Compliance Baseline

**File location:** `.specify/memory/security-baseline.md`
**Phase:** 0.4 — feeds 0.5 (design system), 1.1 (`/speckit-specify`), and every subsequent plan.
**Upstream:** `.specify/memory/product-brief.md`, `.specify/memory/constitution.md`

**Markers used in this document:**

- **⚖ VERIFY** — a legal point that needs counsel confirmation before launch. Collected in §10.
- **⚑ INFERRED** — a fact not supplied by the brief or constitution that I derived. Correct before it hardens.
- **△ CONSTITUTION** — something that should amend the constitution. Collected in §11.

**This document is not legal advice.** §7–§9 are an engineer's reading of the applicable regimes,
written to make the compliance surface visible and to scope the conversation with a lawyer. §10
names what must not ship on my reading alone.

**PWA / service worker: confirmed OUT of scope (2026-07-31).** An earlier draft of this baseline
covered service-worker caching rules, because the request that produced it described the product as
a PWA while the brief and constitution do not. That has been removed. **If a service worker is ever
added, this baseline must be revisited before it ships** — a cached availability grid produces a
double-booking that the exclusion constraint in §1.3 cannot prevent, because the write never
reaches the database. That is a new risk class, not a deployment detail.

---

## 0. What this system actually holds

Everything below follows from this table. It is short, and that is the point — the settled decision
that the system never touches money (constitution II) removes the entire regulated payments surface.

| Data | Class under RA 10173 | Where it lives | Notes |
|---|---|---|---|
| Guest full name | Personal information | `bookings`, `enquiries` | |
| Guest email, phone | Personal information | `bookings`, `enquiries` | |
| Stay dates, guest count | Personal information (identifiable in combination) | `bookings` | Reveals location + travel pattern |
| Free-text requests | Personal information; **unbounded** | `bookings`, `enquiries` | Guests will type things you did not ask for — see §4.4 |
| Payment reference number | Personal information, financial-adjacent | `bookings` | Not card data. Links to a real transaction |
| Amount received | Business record | `bookings` | Owner-entered, not guest-supplied |
| Owner login credentials | Personal information | Supabase `auth.users` | Hashed by Supabase |
| Property photography | Not personal data | Supabase Storage | Unless guests appear in it — see §5.5 |

**Not collected, and this must stay true:** card numbers, CVV, bank credentials, government IDs,
passport numbers, date of birth, nationality. **Government IDs and passport numbers are *sensitive
personal information* under RA 10173 §3(l)** — collecting them (e.g. for a check-in module) would
raise the consent standard, the breach-notification threshold, and the penalty exposure
substantially. That is a legal escalation, not a feature. △ CONSTITUTION §11.7.

---

## 1. RLS policy patterns

### 1.1 Ground rules that apply to every table

RLS is the row gate. `GRANT` is the table gate. **Both are required** — a table with perfect
policies but a blanket `GRANT ALL TO anon` still leaks via any operation your policies did not
anticipate, and a revoked grant with no policy is a table nobody can use.

```sql
-- Applies to EVERY table in public, without exception (constitution VIII).
alter table public.<t> enable row level security;
alter table public.<t> force row level security;  -- also applies to the table owner
revoke all on table public.<t> from anon, authenticated;
-- then grant only the verbs the patterns below actually need
```

Five rules, each of which is a real hole if skipped:

1. **One policy per command.** Write separate `for select` / `for insert` / `for update` /
   `for delete` policies. `for all` is forbidden: `USING` and `WITH CHECK` have different semantics
   per command, and a single `for all` policy reliably gets one of them wrong.
2. **Wrap `auth.uid()` in a subselect** — `(select auth.uid())` — so Postgres caches it as an
   InitPlan instead of re-evaluating per row. This is a 10–100× difference on list queries.
3. **Views bypass RLS by default.** A view runs with its owner's privileges unless created with
   `with (security_invoker = true)`. Every view over a protected table MUST set it. This is the
   most commonly missed Supabase footgun.
4. **`security definer` functions must pin their search path** — `set search_path = ''` and
   schema-qualify every identifier. Without it, a caller-controlled `search_path` can shadow your
   tables and the function runs privileged code against attacker-chosen objects.
5. **Multiple permissive policies OR together.** That is how P1 gives anon published rows and admin
   every row without a branch. Restrictive policies (`as restrictive`) AND together — use them for
   kill-switches, not for normal access.

### 1.2 The role helper

Single-tenant deployment (constitution I) means there is no `tenant_id` to scope on and the classic
`auth.uid() = row.user_id` owner pattern mostly does not apply — **"owner-only" here collapses to
"is an admin of this deployment."** The distinction matters if multi-property is ever un-deferred:
every policy below would need a tenant predicate added, and retrofitting that is exactly the kind
of change constitution I exists to prevent. △ CONSTITUTION §11.6.

```sql
create table public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner','staff')),
  disabled_at timestamptz
);
alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;
revoke all on table public.admin_users from anon, authenticated;
-- Deliberately NO client policies. Managed server-side only (pattern RLS-P4).

create or replace function public.has_role(p_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users au
    where au.user_id = (select auth.uid())
      and au.disabled_at is null
      and au.role = any(p_roles)
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.has_role(array['owner','staff']);
$$;

revoke all on function public.has_role(text[]), public.is_admin() from public, anon;
grant execute on function public.has_role(text[]), public.is_admin() to authenticated;
```

`security definer` is load-bearing: it lets the helper read `admin_users` without triggering that
table's own RLS, which would otherwise recurse infinitely when a policy calls it.

`staff` is defined now and unused in the MVP. It costs one column and makes the role-scoped pattern
real rather than hypothetical — un-deferring staff accounts later becomes a data change, not a
policy rewrite.

### 1.3 The six named patterns

A feature spec references these by name — `FR-014: the offers table uses RLS-P1` — and does not
restate the SQL.

| Pattern | Name | Anon | Authenticated non-admin | Admin | Use for |
|---|---|---|---|---|---|
| **RLS-P1** | `PUBLIC-READ-PUBLISHED` | read published only | read published only | full CRUD | room types, gallery, content pages, rate overrides |
| **RLS-P1s** | `SINGLETON-PUBLIC-READ` | read | read | update only | `site_settings`, `site_branding` — one row, always live, no publish gate |
| **RLS-P2** | `ADMIN-ONLY` | none | none | full CRUD | operational data the public never needs |
| **RLS-P3** | `ANON-INTAKE` | insert only, **no read** | none | read + update + delete | enquiry form |
| **RLS-P4** | `SERVER-ONLY` | none | none | **read only** | bookings, room units, availability blocks, `admin_users`, rate-limit counters |
| **RLS-P5** | `RPC-MEDIATED-WRITE` | execute only | — | execute only | **every** booking write — guest hold, owner create, owner modify |
| **RLS-P6** | `TOKENED-SELF-READ` | execute only | — | — | guest checking their own booking |
| **RLS-P7** | `APPEND-ONLY-AUDIT` | none | none | **read only** | `booking_events`, `email_deliveries` |

**Two patterns were added after the Phase 1.3 security review** (P1s, P7) and **P4 was narrowed from
"read + constrained update" to "read only"** — see §1.6 for why the old admin update policy on
`bookings` was withdrawn.

#### RLS-P1 — `PUBLIC-READ-PUBLISHED`

Anonymous visitors see published, unarchived rows. Admins see everything including drafts.

```sql
grant select on table public.room_types to anon, authenticated;
grant insert, update, delete on table public.room_types to authenticated;

create policy "room_types_select_public" on public.room_types
  for select to anon, authenticated
  using (published_at is not null and archived_at is null);

create policy "room_types_select_admin" on public.room_types
  for select to authenticated using ((select public.is_admin()));

create policy "room_types_insert_admin" on public.room_types
  for insert to authenticated with check ((select public.is_admin()));

create policy "room_types_update_admin" on public.room_types
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "room_types_delete_admin" on public.room_types
  for delete to authenticated using ((select public.is_admin()));
```

`WITH CHECK` on update is not optional. Without it an admin — or anything running with an admin
session — can update a row into a state the policy would have refused on insert.

#### RLS-P2 — `ADMIN-ONLY`

Identical to P1 minus the public select policy, and no `grant select to anon`. Use where the data
is operational rather than marketing: rate tables, availability blocks, the owner's own policy text
before it is published.

#### RLS-P3 — `ANON-INTAKE`

Anonymous users write and can never read — not their own row, not anyone's.

```sql
grant insert on table public.enquiries to anon;          -- note: no select
grant select, update, delete on table public.enquiries to authenticated;

create policy "enquiries_insert_anon" on public.enquiries
  for insert to anon
  with check (
    status = 'new'
    and created_at is null            -- forces the column default; blocks backdating
    and char_length(full_name) between 1 and 120
    and char_length(message)   between 1 and 2000
    and char_length(email)     between 3 and 254
  );

create policy "enquiries_select_admin" on public.enquiries
  for select to authenticated using ((select public.is_admin()));
-- + admin update/delete as in P1
```

**Gotcha that will bite in implementation:** with no anon `select` policy,
`supabase.from('enquiries').insert(x).select()` **fails**, because PostgREST's `RETURNING` needs
read access. Call `.insert(x)` with no `.select()` and have the client render success from the
absence of an error. Any spec using P3 must say so, or the feature ships broken.

The `with check` predicate is a second validation layer, not the primary one. §4 is the primary one.

#### RLS-P4 — `SERVER-ONLY`

RLS enabled, and **zero write policies for anyone** — not `anon`, not the admin. Nothing the browser
holds reaches these rows directly. Reads are admin-only; **every** write goes through P5.

```sql
grant select on table public.bookings to authenticated;
-- No update/insert/delete grant to any client role.

create policy "bookings_select_admin" on public.bookings
  for select to authenticated using ((select public.is_admin()));
-- No insert, update, or delete policy. Deliberate — see the withdrawal note below.
```

No delete policy, deliberately: bookings are cancelled, never erased (constitution IX). Guest data
erasure is a separate, narrower path — see §7.4.

> **⚠ WITHDRAWN — the previous admin update policy on `bookings`.** Earlier versions of this baseline
> carried `with check (... and status in ('confirmed','cancelled'))`, written when the owner could
> only verify or cancel. Spec clarifications C4 and C6 invalidated it in both directions: it
> **blocks** owner-created bookings, which are created directly in `confirmed`, and it **permits**
> unguarded date and room edits, because it constrains `status` and nothing else. Do not reinstate it.
>
> The replacement is not a better policy — it is no policy. **There are now three ways a booking gets
> written: a guest's hold, an owner-created booking, and an owner moving an existing booking.** The
> exclusion constraint in §1.3 protects overlap for all three because it lives in the database. The
> *state machine* has no such backstop. Expressing it as a table policy means writing it three times
> and load-testing one of them.
>
> **One `security definer` function owns every booking transition; three thin callers use it.** That
> is how constitution III stays true in the path nobody thought to test.

#### RLS-P5 — `RPC-MEDIATED-WRITE`

The pattern that discharges constitution III. The client never inserts a booking; it calls a
function, and **the database — not the function — is what makes double-booking impossible**:

```sql
create extension if not exists btree_gist;

alter table public.bookings
  add column stay_range daterange
  generated always as (daterange(check_in, check_out, '[)')) stored;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (room_unit_id with =, stay_range with &&)
  where (status in ('held','awaiting_verification','confirmed'));
```

That constraint is the guarantee. It holds under concurrency, under a buggy RPC, under a future
maintenance script, and under anything with the service role key. A `select ... where not exists`
check inside application code does not, because two sessions can pass the same check before either
inserts.

```sql
create or replace function public.create_booking_hold(
  p_room_type_id uuid, p_check_in date, p_check_out date,
  p_guests int, p_full_name text, p_email text, p_phone text, p_notes text
) returns table (booking_reference text, expires_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_unit uuid; v_ref text; v_exp timestamptz;
begin
  if p_check_out <= p_check_in then raise exception 'invalid_date_range'; end if;
  if p_check_in < current_date then raise exception 'check_in_in_past'; end if;
  if p_check_out - p_check_in > 30 then raise exception 'stay_too_long'; end if;
  if p_guests < 1 or p_guests > 20 then raise exception 'invalid_guest_count'; end if;
  if char_length(coalesce(p_notes,'')) > 1000 then raise exception 'notes_too_long'; end if;

  v_exp := now() + interval '30 minutes';
  v_ref := public.generate_booking_reference();   -- see §1.4

  for v_unit in
    select u.id from public.room_units u
    where u.room_type_id = p_room_type_id and u.active
    order by u.sort_order
  loop
    begin
      insert into public.bookings (
        room_unit_id, check_in, check_out, guests,
        guest_name, guest_email, guest_phone, notes,
        status, booking_reference, hold_expires_at
      ) values (
        v_unit, p_check_in, p_check_out, p_guests,
        public.clean_text(p_full_name), lower(trim(p_email)),
        public.clean_text(p_phone), public.clean_text(p_notes),
        'held', v_ref, v_exp
      );
      return query select v_ref, v_exp;
      return;
    exception when exclusion_violation then
      continue;              -- that unit is taken for these dates; try the next
    end;
  end loop;

  raise exception 'no_availability';
end $$;

revoke all on function public.create_booking_hold(uuid,date,date,int,text,text,text,text) from public;
grant execute on function public.create_booking_hold(uuid,date,date,int,text,text,text,text) to anon;
```

Hold expiry must be a scheduled job (`pg_cron`), not a client timer and not a lazy sweep on next
read — constitution III requires expiry without human action, and a lazy sweep means inventory stays
consumed for as long as nobody visits the page.

```sql
select cron.schedule('expire-holds', '*/5 * * * *', $$
  update public.bookings set status = 'expired'
  where status in ('held','awaiting_verification')
    and hold_expires_at < now();
$$);
```

**Note the `awaiting_verification` inclusion.** Constitution III says holds expire; the brief
(§6.4b) says fake reference numbers are handled by expiry. A booking sitting in
`awaiting_verification` forever with an invented reference would consume inventory permanently.
Give that state its own longer window (⚑ INFERRED: 48h) rather than the 30-minute hold window.

#### RLS-P6 — `TOKENED-SELF-READ`

A guest checking their booking is a read the guest must be able to do and no anon `select` policy
should permit. Route it through a function that requires two facts.

```sql
create or replace function public.get_booking_by_reference(p_reference text, p_email text)
returns table (booking_reference text, status text, check_in date, check_out date,
               room_type_name text, amount_received numeric, balance numeric)
language sql stable security definer set search_path = '' as $$
  select b.booking_reference, b.status, b.check_in, b.check_out,
         rt.name, b.amount_received, b.amount_expected - coalesce(b.amount_received,0)
  from public.bookings b
  join public.room_units ru on ru.id = b.room_unit_id
  join public.room_types rt on rt.id = ru.room_type_id
  where b.booking_reference = upper(trim(p_reference))
    and lower(b.guest_email) = lower(trim(p_email));
$$;
```

Two conditions make this safe, and it is unsafe without either:

1. **The reference must be high-entropy and non-sequential.** `BK-000123` turns this function into
   an enumeration oracle for every guest's stay dates. Use ≥10 characters from an unambiguous
   alphabet (Crockford base32 — no `I`, `L`, `O`, `U`), generated from `gen_random_bytes`.
2. **It must be rate limited** (§2.5). Reference + email is two secrets, but only one of them is
   really secret; unlimited attempts erode that.

Return only what a guest needs. Not `notes`, not `guest_phone`, not internal status history.

#### RLS-P1s — `SINGLETON-PUBLIC-READ`

One row, always live, no `published_at` to filter on — so P1's predicate does not apply. Used by
`site_settings` and `site_branding`.

```sql
grant select on table public.site_branding to anon, authenticated;
-- No write grant to any client role.

create policy "branding_public_read" on public.site_branding
  for select to anon, authenticated using (true);
-- No insert/update/delete policy. Writes go through a security definer RPC.
```

**Why branding writes are RPC-only rather than an admin update policy.** The colour ramp is derived
and the contrast threshold enforced server-side (design system §3.4). A direct table update through
PostgREST walks straight past both, and the owner is already authenticated for it — so the one
control protecting a non-technical owner from an unreadable site would be advisory. The derived
columns must not be client-writable at all.

**`site_settings` needs a public/private split before it grows.** Everything in it today is public
(address, coordinates, contact, deposit guidance, hold duration). The moment someone adds an owner
notification address, an SMTP sender, or an API key, a blanket `using (true)` leaks it. Split the
table now, or column-grant deliberately — not after the leak.

#### RLS-P7 — `APPEND-ONLY-AUDIT`

For `booking_events` and `email_deliveries`. An audit trail anyone can edit is not an audit trail.

```sql
alter table public.booking_events enable row level security;
alter table public.booking_events force row level security;
revoke all on table public.booking_events from anon, authenticated;
grant select on table public.booking_events to authenticated;   -- read only, ever

create policy "booking_events_admin_read" on public.booking_events
  for select to authenticated using ((select public.is_admin()));
-- No insert, update, or delete policy for ANY client role.
-- Rows arrive only from a trigger or a security definer function.
```

**Two rules that keep erasure honest, and they differ between the two tables:**

- **`booking_events` stores no personal fields.** No name, email, phone, or requests — dates, room
  unit, state, actor, timestamp only (spec FR-022g). It therefore carries no erasure obligation, and
  an immutable table with no erasure obligation is a table that can safely be immutable.
- **`email_deliveries` necessarily stores the recipient address** — the owner must see the mistyped
  address to understand a bounce. So it **is** in erasure's scope (spec FR-027a). Clear the address
  on erasure while keeping which message was attempted and its outcome.

Getting this backwards is the failure mode that matters: erasure reports success while a copy of the
address sits in the delivery log.

### 1.4 Storage bucket policies

**Three buckets, not one. The third is private.**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-media',   'public-media',   true,  10485760,
     array['image/jpeg','image/png','image/webp','image/avif']),
  ('demo-assets',    'demo-assets',    true,  10485760,
     array['image/jpeg','image/png','image/webp','image/avif']),
  ('payment-assets', 'payment-assets', false, 2097152,
     array['image/jpeg','image/png','image/webp']);

create policy "public_media_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'public-media');

create policy "public_media_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'public-media' and (select public.is_admin()));
-- + update/delete admin policies, same shape

-- payment-assets: admin write only. NO anon or authenticated read policy at all.
create policy "payment_assets_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'payment-assets' and (select public.is_admin()));
```

**The payment QR lives in `payment-assets` and is never publicly readable** (spec C8, FR-009a). A
guest reaches it only through a short-lived signed URL, issued by the same `security definer`
function that returns their booking's payment step — and only while that booking is `held` or
`awaiting_verification`. Expire the URL with the hold, not on a fixed clock: a link that outlives the
booking it belongs to is the public bucket again, slower.

**Understand what this buys.** Every guest who has ever stayed has seen this code, and GCash and Maya
codes encode a merchant identity the resort hands out in person constantly. This raises the cost of
automated harvesting for an impersonation page; it does not make the code secret. Scraping friction,
not a confidentiality boundary.

`demo-assets` as a separate bucket is the machine-checkable half of constitution IV: the deployment
checklist item "no demo imagery remains" becomes "the `demo-assets` bucket is empty and no row in
any content table references it," which a script can verify instead of a human eyeballing a gallery.

### 1.5 The RLS audit query

Run in CI and before every deployment. Empty result required.

```sql
select c.relname, 'RLS not enabled' as problem
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
union all
select c.relname, 'RLS enabled but zero policies'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
union all
select c.relname, 'view without security_invoker'
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'v'
  and coalesce((c.reloptions::text like '%security_invoker=true%'), false) is not true;
```

"RLS enabled but zero policies" is on the list because it is a silent full-deny that presents as a
mysteriously empty page — a bug, not a breach, but one that costs an afternoon every time.

---

## 2. Auth hardening

### 2.1 The surface is small, and keeping it small is a control

Guest accounts are deferred (brief §8). **The only authenticated principal is the resort owner.**
No guest passwords, no guest password resets, no account-takeover surface across thousands of
users, no credential-stuffing target. Any proposal to un-defer guest accounts is a security change
before it is a feature change and must come back through this document.

### 2.2 Disable public signup — the single most important setting

Supabase projects allow open email signups by default. If left on, **anyone can create an
`authenticated` user**, and every policy in §1 keyed to `to authenticated` without an `is_admin()`
check becomes world-accessible. This is the failure mode where the policies look right and the
system is wide open.

| Supabase setting | Required value | Why |
|---|---|---|
| Allow new users to sign up | **Disabled** | The owner account is provisioned manually |
| Confirm email | Enabled | |
| Secure email change | Enabled | Requires confirmation on both old and new address |
| Prevent use of leaked passwords | Enabled | HIBP check at set-password time |
| Minimum password length | 12 | ⚑ INFERRED |
| Password requirements | Lower + upper + digit + symbol | ⚑ INFERRED |
| MFA (TOTP) enrolment | Enabled, **required for the owner** | The admin account is the whole property |
| JWT expiry | 3600 s | |
| Refresh token rotation | Enabled | |
| Reuse interval | 10 s | Tolerates races; still detects theft |
| Site URL / Redirect URLs | Exact allowlist, no wildcards | See §2.4 |

Owner provisioning is a documented deployment step: create the user via the Supabase dashboard or a
service-role script, insert the `admin_users` row, hand over via a password the owner immediately
changes, enrol MFA in the same session. Not a public form.

### 2.3 Session handling — and an honest limitation

`supabase-js` stores the session in `localStorage` by default. **In a client-only Vite SPA, this
means any successful XSS is a full session compromise**, and no amount of token expiry fixes that —
the attacker exfiltrates the refresh token and mints new access tokens.

There are three honest options:

| Option | Protection | Cost |
|---|---|---|
| localStorage + strict CSP (**recommended**) | CSP is the actual control; §4.5 | None beyond doing CSP properly |
| Cookie storage via `@supabase/ssr` | Marginal in an SPA — JS-readable cookies are equally exposed | Low, little gain |
| Admin behind a small server (BFF), `httpOnly` cookies | Real: token unreachable from JS | An added deployment surface, against "budget: none to minimal" |

**Take option 1 and treat §4.5's CSP as a security control rather than a hardening nicety.** That
is the honest framing: the constitution's XSS posture *is* the session-security posture. If the
admin ever grows beyond one owner — staff accounts, more sensitive data — revisit option 3.

Also required:

- `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: true`.
- On sign-out: `supabase.auth.signOut({ scope: 'global' })` to revoke refresh tokens everywhere.
- Idle timeout on the admin (⚑ INFERRED: 30 min) — resort front desks are shared spaces and the
  laptop stays logged in.
- Admin routes gated server-side by RLS, never by React route guards alone. A route guard is UX.

### 2.4 Password reset and the redirect allowlist

- **Email enumeration:** the reset form returns the same generic message for known and unknown
  addresses, in the same response time. Enable Supabase's email-enumeration protection.
- **Redirect allowlist:** every `redirectTo` must be an exact URL in Supabase's Redirect URLs list.
  Wildcards like `https://resort.com/**` are how reset tokens end up posted to an attacker's host
  via an open redirect. One entry per real callback path.
- Reset links: short expiry (⚑ INFERRED: 1 hour), single use, invalidated on use or on password
  change.
- Password change (from inside the session) requires the current password.
- All auth emails go to the owner's address only. There is no guest auth email.

### 2.5 Rate limiting

Supabase rate-limits its own auth endpoints, and that covers login, reset, and token refresh. **It
does not rate-limit your RPCs or your table writes.** Every public entry point needs its own limit.

| Endpoint | Limit (⚑ INFERRED — tune from real traffic) | Mechanism |
|---|---|---|
| Sign-in | 5 / 5 min / IP | Supabase built-in, verify configured |
| Password reset request | 3 / hour / IP, 3 / hour / email | Supabase built-in + app counter |
| Token refresh | Supabase default | Built-in |
| Signup | **n/a — disabled** | §2.2 |
| Enquiry form (P3) | 3 / hour / IP | Turnstile + counter |
| `create_booking_hold` (P5) | 5 / hour / IP, 3 / hour / email | Turnstile + counter |
| `submit_payment_reference` | 5 / hour / booking | Counter |
| `get_booking_by_reference` (P6) | **10 / hour / IP** | Counter — enumeration defence |
| Any Storage upload | 20 / hour / admin | Counter |

Two mechanisms, both compatible with "budget: none to minimal":

**Cloudflare Turnstile** on every public form. Free, no user interaction in the common case, no
image grids for a guest on mobile data. Verify the token **server-side inside the Edge Function**
before touching the database — a client-side-only check is decorative.

**A counter table** for per-identifier limits, using P4:

```sql
create table public.rate_limit_events (
  id bigserial primary key,
  bucket text not null,          -- 'booking_hold' | 'enquiry' | 'ref_lookup' | ...
  identifier text not null,      -- hashed IP, or lower(email)
  created_at timestamptz not null default now()
);
create index on public.rate_limit_events (bucket, identifier, created_at desc);
alter table public.rate_limit_events enable row level security;
alter table public.rate_limit_events force row level security;
-- no client policies at all; touched only by security definer functions

create or replace function public.check_rate_limit(
  p_bucket text, p_identifier text, p_limit int, p_window interval
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.rate_limit_events
      where bucket = p_bucket and identifier = p_identifier
        and created_at > now() - p_window) >= p_limit then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  insert into public.rate_limit_events (bucket, identifier) values (p_bucket, p_identifier);
end $$;
```

**Store a hash of the IP, not the IP.** A raw IP log is itself personal data under RA 10173 and adds
a retention obligation for no benefit. `encode(digest(ip || <server-side salt>, 'sha256'), 'hex')`
gives the same rate-limiting behaviour with nothing identifying at rest. Prune rows older than the
longest window on the same `pg_cron` schedule as hold expiry.

---

## 3. Secrets checklist

### 3.1 The Vite rule that governs everything

**Any environment variable prefixed `VITE_` is inlined into the client bundle at build time.** It is
not hidden, not obfuscated, and not recoverable once shipped — it is published. There is no such
thing as a secret `VITE_` variable.

### 3.2 Classification

| Value | Classification | Where |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret — bypasses all RLS** | Edge Function / CI env only |
| Postgres connection string / DB password | **Secret** | CI + local `.env`, never in app |
| JWT secret | **Secret** | Supabase-managed; never copied out |
| Email provider API key (Resend/Postmark/SES) | **Secret** | Edge Function env |
| SMTP username / password | **Secret** | Supabase Auth SMTP config |
| Webhook signing secrets | **Secret** | Edge Function env |
| Turnstile **secret** key | **Secret** | Edge Function env |
| Rate-limit IP hash salt | **Secret** | Edge Function env |
| Owner bootstrap password | **Secret, single-use** | Never committed; rotated at handover |
| Any storage S3 credential | **Secret** | Server only |
| `VITE_SUPABASE_URL` | Public by design | Client bundle |
| `VITE_SUPABASE_ANON_KEY` (publishable) | Public by design | Client bundle |
| Turnstile **site** key | Public by design | Client bundle |
| `VITE_PROPERTY_*` config | Public by design | Client bundle |

The anon key being public is the whole premise of the model: **its safety comes entirely from RLS.**
If §1 is wrong anywhere, the anon key is an unauthenticated door to that table. This is why
constitution VIII is non-negotiable.

### 3.3 Places a secret must never reach

- The client bundle, including via `VITE_` and via any config object imported by client code
- **Production source maps** — set `build.sourcemap: false` for prod, or upload them privately
- The git history (`git add -p`, not `git add .` — and see the CI gate below)
- The seed script or demo dataset
- Error messages returned to the client — Edge Functions return an opaque error id; the detail goes
  to logs
- Log output, including Postgres `RAISE NOTICE`
- The demo QR code: **no real payment QR belonging to any person is committed to this repository.**
  Constitution IV requires the demo QR be obviously non-functional.

### 3.4 Gates

- `.env*` in `.gitignore`, except a committed `.env.example` with placeholder values only
- `gitleaks` (or `trufflehog`) in CI on every push, and as a pre-commit hook
- A post-build grep over `dist/` for the service role key prefix, any `sk_`/`re_`/`SG.` pattern, and
  the literal string `service_role`. Non-empty output fails the build.
- Rotation runbook: on suspected exposure of the service role key, rotate it in the Supabase
  dashboard, redeploy every Edge Function, and audit `postgres_logs` for use of the old key.
  Rotating the JWT secret invalidates all sessions — expect the owner to be logged out.

---

## 4. Input validation, injection, and XSS

### 4.1 Where validation actually lives

Three layers, and the middle one is the constraint:

1. **Client (Zod)** — UX only. Fast feedback. Assume it is bypassed.
2. **Server (Edge Function / `security definer` RPC)** — **the authority.** Every field, every time.
3. **Database (`check` constraints, `not null`, domains, the exclusion constraint)** — the backstop
   that holds even when a future migration script skips layer 2.

Share the Zod schema between layers 1 and 2. Do not share it *instead of* layer 2.

### 4.2 Field rules

| Field | Rule |
|---|---|
| `guest_name` | 1–120 chars; strip C0/C1 control chars; reject if it normalizes to empty |
| `guest_email` | ≤254 chars; RFC-shaped; **lowercased and trimmed before storage** |
| `guest_phone` | ≤32 chars; digits, space, `+`, `-`, `(`, `)` only |
| `notes` | ≤1000 chars; plain text; **never rendered as HTML** |
| `check_in` / `check_out` | ISO date; `check_out > check_in`; `check_in >= current_date`; span ≤30 nights |
| `guests` | integer 1..`room_type.max_occupancy` — validated against the DB row, not a client value |
| `payment_reference` | 4–40 chars; `[A-Za-z0-9-]` only; uppercased. **Displayed to the owner — see §4.4** |
| `amount_received` | `numeric(12,2)`, ≥0. Owner-entered only. **Never guest-supplied** (constitution II) |
| Any URL field | Scheme allowlist `https:` only. Blocks `javascript:` and `data:` |
| Any slug | `^[a-z0-9-]{1,80}$` |

Reject rather than coerce. Silent truncation of a name is a data-integrity bug that surfaces at the
front desk.

### 4.3 SQL injection

PostgREST parameterizes everything, so the client SDK is not the risk. **The risk is dynamic SQL
inside your own `security definer` functions**, which run privileged:

- No string concatenation into `execute`. If dynamic SQL is unavoidable, use `format()` with `%I`
  for identifiers and `%L` for literals — never `%s`.
- Every `security definer` function has `set search_path = ''` (§1.1 rule 4).
- Do not expose a generic "run this filter" RPC. Each function takes typed parameters.

### 4.4 XSS — where it can actually happen

React escapes interpolated values, so the default path is safe. The exceptions:

**(a) Owner-authored rich content — DECIDED: Markdown, raw HTML rejected at save (spec C7).**

Constitution IX gives the owner an admin for content pages. Had that stored HTML and rendered it with
`dangerouslySetInnerHTML`, it would be stored XSS — and per §2.3, XSS *is* session compromise of the
only account that exists.

The alternative considered and rejected was sanitising HTML on write **and** on render with a strict
allowlist. It works, but it means owning a sanitiser forever and staying ahead of its bypasses.
Rejecting HTML at the point of saving removes the class of bug instead of defending against it.

Two enforcement points, both required:

1. **Reject raw HTML when the page is saved**, with a message the owner can act on. Server-side.
2. **Configure the Markdown renderer with raw HTML passthrough disabled**, as a second line of
   defence for anything already in the database or inserted by a future migration.

**No `dangerouslySetInnerHTML` anywhere in this codebase.** Add it to the loose-ends sweep as a grep.

**(b) Email templates — the one that gets missed.** Guest name and payment reference go into an HTML
email. **React is not in that path**, so nothing escapes for you. A guest named
`<img src=x onerror=...>` sends the owner a mail client exploit attempt, and the owner's mail client
is outside your threat model but not outside their risk. Escape every interpolated value in email
HTML explicitly, or send plain text.

**(c) Email header injection.** If a guest-supplied value reaches a `Reply-To`, `Subject`, or any
header, strip `\r` and `\n` first. Prefer a provider SDK that takes structured fields over raw MIME.

**(d) `href` from data.** The owner's admin will eventually allow a link field. Validate the scheme
at write time and again at render — `javascript:alert(1)` in an `href` is XSS in every browser.

**(e) SVG uploads.** An SVG is a script carrier. Banned by the MIME allowlist in §5, and worth
restating: an SVG served from your origin executes with your origin's privileges.

### 4.5 Content Security Policy

Per §2.3 this is a primary control, not hardening. Set as response headers at the CDN/host — a
`<meta>` CSP cannot carry `frame-ancestors`.

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: blob: https://<project>.supabase.co;
  font-src 'self';
  connect-src 'self' https://<project>.supabase.co wss://<project>.supabase.co
              https://challenges.cloudflare.com;
  frame-src https://challenges.cloudflare.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'none';
  object-src 'none';
  upgrade-insecure-requests
```

Plus: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=()`.

Two notes specific to this stack:

- **Vanilla Extract makes `style-src 'self'` achievable.** It compiles to static CSS files at build
  time, so there is no runtime style injection and no need for `'unsafe-inline'`. A runtime CSS-in-JS
  library would have forced `'unsafe-inline'` on `style-src`, which substantially weakens the policy.
  The constitution's styling choice is doing security work here — worth knowing before anyone
  proposes swapping it.
- **Framer Motion and Lenis are CSP-clean.** They mutate `element.style` through the CSSOM, which
  CSP does not govern; only inline `<style>` blocks and `style=""` attributes in markup are covered.
  No `'unsafe-inline'` needed for animation.

### 4.6 Client-side storage

No service worker (see the header note). The only client-side persistence is the Supabase session in
`localStorage`, governed by §2.3.

Do not cache booking or enquiry data in `localStorage`, `sessionStorage`, or IndexedDB for
"performance." On a shared front-desk laptop that is personal data at rest surviving logout, with no
retention control and no erasure path — it would silently break §7.4. Keep server data in memory
(React Query / SWR cache) where it dies with the tab.

---

## 5. File uploads

### 5.1 Who uploads

**Only the authenticated owner, and only images.** Guests upload nothing — the brief specifies a
typed reference number, not a payment screenshot. That removes anonymous file upload entirely, which
is the single largest attack surface this product does not have.

⚑ INFERRED — **expect this to be requested.** Owners will want proof-of-payment screenshots. That is
a scope change with a real security cost: anonymous binary upload, plus screenshots that routinely
contain a bank balance and account number — data materially more sensitive than anything in §0. If
it is ever added: authenticate it behind a valid booking reference, keep it in a private bucket with
no public read, set a short retention (⚑ 90 days post-checkout), and re-run §7.

### 5.2 Rules

| Rule | Value |
|---|---|
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp`, `image/avif` |
| Banned | **SVG** (script carrier), HEIC, GIF, anything non-image |
| Max size | 10 MB per file; 50 files per batch |
| Type detection | **Magic bytes server-side.** Never trust the extension or the client `Content-Type` |
| Filename | Server-generated UUID + derived extension. The original name is never used in a path |
| Processing | Re-encode server-side (sharp) — normalizes format, strips EXIF, neutralizes polyglots |
| EXIF | Stripped. Property photos carry GPS; guest-submitted photos would carry more |
| Location | Supabase Storage, `public-media` (site) / `demo-assets` (demo, per constitution IV) |
| Serving | `*.supabase.co` — a different origin from the app, so a stored payload cannot reach app cookies or `localStorage` |
| Headers | `X-Content-Type-Options: nosniff`; `Content-Disposition: inline` only for the allowlisted types |

Re-encoding is the highest-value rule and the easiest to skip. It also serves constitution VII —
AVIF/WebP derivatives and responsive sizes are generated in the same pass.

**If a custom domain ever proxies Storage**, the same-origin protection above is lost and stored-XSS
via a crafted image becomes reachable. Use a dedicated subdomain outside the app's cookie scope.

---

## 6. Webhook handling

### 6.1 Where webhooks appear

The MVP's likely inbound webhook is **email delivery/bounce events** from the provider. Payment
webhooks do not exist and must not (constitution II). Supabase Database Webhooks → Edge Functions
are outbound-to-your-own-function and skip §6.2's signature step, but not §6.3's idempotency.

### 6.2 Verification — mandatory, in this order

1. **Read the raw body as bytes.** Compute the HMAC over the exact received bytes. The classic
   failure is parsing JSON and re-serializing it before signing — key order and whitespace change,
   the signature never matches, and someone "fixes" it by skipping verification.
2. **Constant-time compare.** `crypto.timingSafeEqual`, never `===`.
3. **Check the timestamp** in the signature header; reject anything older than 5 minutes. Signature
   verification alone does not stop replay.
4. **Only then parse the body.**

```ts
// supabase/functions/email-events/index.ts
Deno.serve(async (req) => {
  const raw = new Uint8Array(await req.arrayBuffer());
  const sig = req.headers.get("webhook-signature") ?? "";
  const ts  = Number(req.headers.get("webhook-timestamp") ?? 0);

  if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return new Response("stale", { status: 400 });
  if (!(await verifyHmac(raw, ts, sig, Deno.env.get("WEBHOOK_SECRET")!)))
    return new Response("bad signature", { status: 401 });

  const event = JSON.parse(new TextDecoder().decode(raw));
  // ... idempotent handling, §6.3
  return new Response(null, { status: 204 });
});
```

**Supabase-specific and easy to get wrong:** a webhook endpoint must be reachable without a Supabase
JWT, so the function is deployed with `verify_jwt = false`. That makes it a fully public endpoint,
and **the signature check is now the only authentication it has.** Deploying with `verify_jwt = false`
and an unfinished signature check is an open, unauthenticated write path.

### 6.3 Idempotency

Providers retry. Assume every event arrives more than once and out of order.

```sql
create table public.webhook_events (
  provider     text not null,
  event_id     text not null,
  received_at  timestamptz not null default now(),
  payload      jsonb not null,
  primary key (provider, event_id)
);
alter table public.webhook_events enable row level security;
alter table public.webhook_events force row level security;
-- no client policies; service role only
```

Insert first, let the primary key reject duplicates, and treat a conflict as success — return 2xx so
the provider stops retrying. Do the insert and the side effect **in one transaction**, or a crash
between them loses the effect while marking the event processed.

Return 2xx within a couple of seconds; queue slow work. Never return a 5xx for a business-logic
rejection — that triggers retries forever.

**Apply idempotency to the guest-facing booking submission too.** A guest on flaky mobile data
double-tapping "Reserve" must not create two holds. Have the client generate an idempotency key per
booking attempt, and make `create_booking_hold` return the existing hold when it sees a key it has
already used.

---

## 7. Applicable law

**⚖ Everything in §7–§9 is an engineer's reading. §10 lists what must not ship on it alone.**

### 7.1 RA 10173 — Data Privacy Act of 2012 (Philippines) — **applies, certainly**

Personal information of Philippine data subjects, processed by a Philippine business. Not optional.

**Roles.** Per deployment, **the resort is the Personal Information Controller (PIC)** and **you are
the Personal Information Processor (PIP)**. The constitution already states this. Consequences:

- **§43–44 of the IRR require a written outsourcing/processing agreement** between PIC and PIP with
  specific clauses (scope, duration, security measures, sub-processing, breach notification, return
  or deletion at termination). ⚖ VERIFY — this is a contract, not a code artifact, and it is a
  concrete deliverable before the first client deployment.
- Acting outside the controller's instructions can make you a controller in your own right, with the
  full obligation set. Keep the instructions written.

**Data subject rights** (§16, §18) the product must be able to satisfy:

| Right | Product implication |
|---|---|
| To be informed | Privacy notice at collection — §8.1, linked from the booking form |
| To object | Marketing must be opt-in, unticked; the booking flow must work without opting in |
| To access | The owner must be able to export one guest's data — an admin action, not a DB query |
| To rectification | Owner edits guest details on a booking |
| To erasure / blocking | §7.4 |
| To damages | Insurance/contract question, not a code one |
| To data portability | Export in a "commonly used, machine-readable format" — CSV or JSON |
| To file a complaint | Privacy notice names the NPC |

**Consent is not the only lawful basis, and it is the wrong one here.** Processing a booking is
"necessary for the fulfilment of a contract with the data subject" (§12(b)) — no consent needed for
the booking itself, and a pre-ticked consent box would be invalid anyway. **Marketing email is
separate and does need consent**: unticked, granular, withdrawable, and never a condition of booking.

**NPC registration and DPO.** A PIC must designate a Data Protection Officer. Registration of the
data processing system with the NPC is required above certain thresholds (headcount, volume of
sensitive personal information, risk, and whether processing is "not occasional"). A resort taking
online bookings year-round is plainly not occasional. **⚖ VERIFY — thresholds, current forms, and
whether a given resort must register.** Both DPO designation and registration are the resort's
obligation, not yours, but they belong in the client onboarding checklist because owners will not
know they exist.

### 7.2 Cross-border transfer — **applies, and is easy to miss**

Supabase will host this outside the Philippines (Singapore is the nearest region). RA 10173 permits
transfer, but **the PIC remains accountable for data transferred abroad** and must ensure comparable
protection contractually. ⚖ VERIFY. Practically:

- Choose the region deliberately and record it per deployment (△ CONSTITUTION §11.4).
- Name the transfer and its destination in the privacy notice (§8.1 does).
- Carry the safeguards into the PIC–PIP agreement.

### 7.3 GDPR — **probably does not apply, and the test matters**

Extraterritorial reach (Art. 3(2)) turns on **targeting**, not accessibility. A site being reachable
from the EU is not enough. Indicators of targeting: EU languages, prices in EUR, EU country codes in
phone fields, marketing spend aimed at EU travellers, EU-specific transport directions.

**On the brief's stated target — domestic Philippine travellers — GDPR most likely does not apply.**
⚖ VERIFY per client. It flips if a resort adds EUR pricing or European-language pages, and since
constitution I makes languages and currency configuration, **it could flip without a code change.**
That is worth knowing: a config-only change can alter which law governs.

If it flips: lawful basis records, DPIA, possible EU representative (Art. 27), 72-hour breach
notification to a supervisory authority, and a transfer mechanism for PH→EU. Materially more work.
The design in §1 (data minimisation, no guest accounts, no card data) is already close.

### 7.4 Erasure vs. retention — the genuine conflict

Constitution IX requires a delete path per entity. Constitution IV/§1.3 forbids deleting bookings.
RA 10173 requires retention no longer than necessary and grants erasure. These resolve as:

- **Cancellation** is a booking state change. The record survives. Inventory and history intact.
- **Erasure** anonymizes the personal fields *in place*, preserving the row for inventory and
  accounting: name → `[erased]`, email/phone → `null`, notes → `null`, reference retained (it is a
  business record of a real transaction, arguably no longer identifying once the name and contact
  are gone — ⚖ VERIFY that judgment).
- **Retention default** ⚑ INFERRED: personal fields auto-anonymized 24 months after checkout;
  enquiries deleted after 12 months. Both configurable per deployment, both enforced by `pg_cron`,
  not by the owner remembering.
- Erasure may be refused where retention is legally required (tax records — BIR generally requires
  books and records be preserved for 10 years, ⚖ VERIFY). The privacy notice must say so.

△ CONSTITUTION §11.5 — the constitution currently mandates an erasure path but sets no retention
limit, which is half the obligation.

### 7.5 Other Philippine regimes

- **RA 11967, Internet Transactions Act of 2023** — ⚖ VERIFY, including current IRR status. A resort
  selling directly online is plausibly an "online merchant," which brings disclosure duties
  (identity, contact, business registration), obligations to honour transactions as advertised, and
  DTI oversight. Practical effect: the site must clearly display the resort's registered business
  name, address, and contact — which §8 already requires and which is cheap to satisfy now.
- **RA 8792, E-Commerce Act** — electronic contracts and signatures are valid. Supports treating an
  online booking as binding once confirmed.
- **RA 7394, Consumer Act** — governs advertising accuracy and limits how far liability disclaimers
  can go. Directly relevant to constitution IV: photographs that misrepresent a room are not only a
  truthfulness violation, they are a consumer-protection exposure.
- **RA 10175, Cybercrime Prevention Act** — relevant if you are breached, and it raises penalties for
  offences committed through ICT.
- **CCPA/CPRA (California)** — thresholds are ~$25M annual revenue, 100k consumers/households, or
  50%+ of revenue from selling personal information. **A small resort meets none.** Does not apply.
  ⚖ VERIFY if a client is unusually large or part of a group.
- **PCI DSS** — **does not apply.** No card data is transmitted, processed, or stored (constitution
  II). This is the single largest compliance cost the architecture avoids, and it is worth naming
  every time someone proposes adding a payment gateway "for convenience."

---

## 8. Draft privacy policy and terms

**⚖ These are drafts for a lawyer to review, not finished documents.** Per constitution I they ship
as seeded, editable content with `{{PLACEHOLDERS}}` — never hardcoded in a component.

### 8.1 Privacy policy (plain language)

> # Privacy Policy
>
> **Last updated: {{POLICY_DATE}}**
>
> This policy explains what {{RESORT_NAME}} does with your personal information when you use this
> website. We have tried to write it in plain language.
>
> ## Who we are
>
> {{RESORT_LEGAL_NAME}}, {{RESORT_ADDRESS}}. We are the **data controller** — we decide what happens
> to your information and we are responsible for it.
>
> Questions or requests: **{{PRIVACY_EMAIL}}** or **{{RESORT_PHONE}}**.
> {{#DPO_NAME}}Our Data Protection Officer is {{DPO_NAME}}, {{DPO_EMAIL}}.{{/DPO_NAME}}
>
> ## What we collect, and why
>
> **When you make a booking:** your name, email address, phone number, the dates of your stay, the
> number of guests, any special requests you type, and the payment reference number you give us.
> We need these to hold your room, confirm your booking, contact you about it, and check that your
> payment arrived.
>
> **When you send an enquiry:** your name, email address, and your message. We use these only to
> reply.
>
> **Automatically:** basic technical information needed to keep the site working and to stop abuse
> of our forms. We store a scrambled version of your IP address, not the address itself.
>
> **We do not collect payment card details.** Payments are made directly to us through your own
> banking or e-wallet app. **This website never sees your card number, your bank login, or your
> account balance.** All we receive is the reference number you type in.
>
> ## Why we are allowed to use it
>
> Mostly because we need it to provide the booking you asked for. For marketing emails, we rely on
> your consent, which you give by ticking the box — and you can withdraw it at any time.
>
> ## Who else sees it
>
> - **{{HOSTING_PROVIDER}}** stores our website and database on our behalf.
> - **{{EMAIL_PROVIDER}}** sends our confirmation emails on our behalf.
> - **{{DEVELOPER_NAME}}** maintains this website and may see your information while fixing problems.
> - Government agencies, if we are legally required to disclose.
>
> We do not sell your information. We do not share it with advertisers.
>
> ## Where it is stored
>
> Our database is hosted in **{{DATA_REGION}}**, which is outside the Philippines. We remain
> responsible for your information wherever it is stored, and we require our providers to protect it
> to the standard Philippine law requires.
>
> ## How long we keep it
>
> Booking records are kept for **{{RETENTION_MONTHS}} months** after your stay, after which your name
> and contact details are permanently removed. Enquiries are deleted after **12 months**. Some
> records must be kept longer where tax or accounting law requires it.
>
> ## Your rights
>
> Under the Data Privacy Act of 2012 (RA 10173) you can ask us to:
>
> - tell you what information we hold about you
> - correct anything that is wrong
> - delete your information, or stop using it
> - give you a copy in a format you can take elsewhere
> - stop sending you marketing
>
> Email **{{PRIVACY_EMAIL}}** and we will respond within **{{RESPONSE_DAYS}} days**. There is no
> charge. We may need to confirm your identity first.
>
> Sometimes we cannot delete everything — for example, we must keep certain financial records. If
> that happens we will tell you which parts we kept and why.
>
> ## Complaints
>
> If you are unhappy with how we have handled your information, please tell us first. You also have
> the right to complain to the **National Privacy Commission** (privacy.gov.ph).
>
> ## Cookies
>
> We use only the cookies needed to make the site work. We do not use advertising or tracking
> cookies.
>
> ## Changes
>
> If we change this policy we will update the date at the top. If the change is significant we will
> say so on the site.

### 8.2 Terms of service (plain language)

> # Terms of Service
>
> **Last updated: {{TERMS_DATE}}**
>
> These terms apply when you book a stay at {{RESORT_NAME}} through this website.
>
> ## How booking works — please read this part
>
> Booking here happens in three steps, and **it is not confirmed until step 3**:
>
> 1. **You reserve.** Choose your dates and room and give us your details. We hold that room for you
>    for **{{HOLD_MINUTES}} minutes** while you pay.
> 2. **You pay us directly.** Scan our QR code with your own banking or e-wallet app and send the
>    amount shown. Then type the reference number your app gives you into our form.
> 3. **We confirm.** We check that your payment arrived and then email you a confirmation.
>
> **Your booking is confirmed only when you receive our confirmation email.** Submitting a reference
> number is not a confirmation. We check payments by hand, so this usually takes
> {{VERIFY_HOURS}} hours and is not instant.
>
> If we cannot find your payment, we will contact you before cancelling.
>
> ## About payment
>
> **We do not take payments through this website.** You pay us directly through your own app, exactly
> as you would pay any other person or business. This website only records the reference number you
> tell us.
>
> This means: **no refund can be issued through this website.** If you are owed money back, we
> arrange it with you directly — see cancellations below.
>
> The amount shown at booking is our guidance on what to send to secure your room. If anything is
> unclear, contact us before paying.
>
> ## Holds expire
>
> If you do not submit a payment reference within {{HOLD_MINUTES}} minutes, your reservation is
> released and the room becomes available to others. Nothing is charged and you can start again.
>
> ## Cancellations
>
> {{CANCELLATION_POLICY}}
>
> To cancel, contact us at {{RESORT_EMAIL}} or {{RESORT_PHONE}} with your booking reference. Any
> refund you are owed is arranged directly between us — by the same method you paid, or another we
> agree. **It will not appear automatically.**
>
> ## Prices and availability
>
> Prices are in Philippine Pesos and include {{TAX_NOTE}}. We try to keep rates and availability
> accurate. If an obvious error means we cannot honour a booking, we will tell you promptly and
> refund anything you have paid in full.
>
> ## Photographs
>
> The photographs on this site show our actual property. Rooms vary slightly, and things like sea
> views or weather cannot be guaranteed.
>
> ## Behaviour and house rules
>
> {{HOUSE_RULES}}
>
> ## What we are responsible for
>
> We are responsible for providing the accommodation you booked. We are not responsible for things
> outside our control — weather, transport delays, power interruptions, or events of that kind.
> Nothing in these terms removes any right you have under Philippine consumer law.
>
> ## Using this website
>
> Please do not attempt to break into, overload, or scrape this site, or make bookings you do not
> intend to honour. We may cancel bookings we reasonably believe are not genuine.
>
> ## Governing law
>
> These terms are governed by the laws of the Republic of the Philippines.
>
> ## Contact
>
> {{RESORT_LEGAL_NAME}} · {{RESORT_ADDRESS}} · {{RESORT_EMAIL}} · {{RESORT_PHONE}}
> {{BUSINESS_REGISTRATION_LINE}}

The last line matters for §7.5 — the Internet Transactions Act disclosure duties are satisfied by
displaying registered business identity, and it costs one templated field.

---

## 9. Breach notification

### 9.1 RA 10173 / NPC Circular 16-03 — the 72-hour rule

Notify **both** the National Privacy Commission **and** every affected data subject **within 72
hours of knowing, or having reasonable belief, that a notifiable breach occurred.** ⚖ VERIFY current
circular text and submission channel.

A breach is notifiable when **all three** conditions hold:

1. It involves **sensitive personal information**, or information that **may enable identity fraud**;
2. There is reason to believe it **was acquired by an unauthorised person**;
3. It is likely to give rise to a **real risk of serious harm** to the affected data subjects.

**Applying this honestly to §0's data:** we hold no sensitive personal information as RA 10173
defines it. But full name + email + phone + stay dates + payment reference, in combination, is a
credible identity-fraud and targeted-phishing kit — and stay dates disclose when a guest's home is
empty, which is a physical-safety harm that a purely financial reading of "serious harm" misses.
**⚖ My reading is that a full-table disclosure of `bookings` would be notifiable.** Confirm with
counsel now, while it is hypothetical, rather than during the 72 hours.

The clock starts at *reasonable belief*, not at confirmation. Investigating first and starting the
clock later is the mistake that turns a breach into a breach plus a reporting violation.

### 9.2 What a notification must contain

- Nature of the breach: what happened, when, how discovered
- The personal data possibly involved
- Measures taken to address it and to reduce harm
- Name and contact details of the DPO
- For data subjects: what they should do (change passwords elsewhere, watch for phishing
  referencing their stay)

Also required: **maintain a breach register of all incidents, including non-notifiable ones**, and
file the **annual security incident report** to the NPC. ⚖ VERIFY the annual report's current form
and deadline. The register is the part everyone forgets until they need it.

### 9.3 GDPR, if §7.3 flips

72 hours to the supervisory authority; data subjects "without undue delay" where risk is high. The
threshold is lower than RA 10173's — GDPR notifies unless the breach is *unlikely* to result in risk.

### 9.4 The processor's obligation — the one that binds you

**You are the processor. You will usually detect the breach before the resort owner does.** They
cannot meet 72 hours if you take three days to tell them.

The PIC–PIP agreement (§7.1) must require: **written notice from you to the resort within 24 hours of
becoming aware**, plus reasonable assistance with their investigation and notification. ⚑ INFERRED
timing — 24 hours leaves the controller 48 to assess and file.

### 9.5 Runbook

| Phase | Target | Actions |
|---|---|---|
| **Detect** | — | Supabase log alerts; failed-auth spikes; anomalous `service_role` use; owner report |
| **Contain** | ≤2 h | Rotate service role key + JWT secret; force global sign-out; disable the affected RPC; snapshot logs **before** they roll off |
| **Assess** | ≤24 h | What tables, how many rows, which fields, whose. Apply §9.1's three tests |
| **Notify controller** | ≤24 h | Written notice to the resort — your contractual obligation |
| **Notify NPC + subjects** | ≤72 h | Controller files; you supply the technical facts |
| **Record** | ≤7 d | Breach register entry, root cause, remediation, whether notification was required and why |

Preserve logs first. Supabase log retention is finite and the containment steps you take under
pressure are exactly what overwrites the evidence you need.

---

## 10. What genuinely needs a lawyer

Everything above is buildable on this document. These are not:

| # | Item | Why it cannot ship on my reading |
|---|---|---|
| 1 | **PIC–PIP outsourcing agreement** | RA 10173 IRR §43–44 mandate specific clauses. Statutorily required, and a contract, not code. **The single hardest blocker before client #1.** |
| 2 | **Final privacy policy and ToS** | §8 is a plain-language draft. Liability limits, the cancellation clause, and consumer-law interaction need review |
| 3 | **NPC registration and DPO** | Whether a given resort must register; who is DPO. Thresholds and forms change |
| 4 | **The §9.1 notifiability judgment** | I read a `bookings` disclosure as notifiable. That reading should be a lawyer's, made in advance |
| 5 | **Cross-border transfer to {{DATA_REGION}}** | §7.2's safeguards must be contractual and adequate. Region choice has legal consequences |
| 6 | **GDPR applicability per client** | The targeting test is fact-specific — and a config change can flip it (§7.3) |
| 7 | **Internet Transactions Act obligations** | RA 11967 is recent; IRR and enforcement posture need current advice |
| 8 | **Liability limitation vs RA 7394** | Consumer law limits how far §8.2's disclaimers can go. An unenforceable clause is worse than none |
| 9 | **Retention periods** | §7.4's 24 months is inferred. Tax/BIR retention may override |
| 10 | **Your own exposure as developer** | Whether you could be deemed a joint controller; whether you need professional indemnity cover |

**Sequencing:** items 1 and 2 gate the first client deployment. Items 3–5 gate that client going
live. Items 6–10 can follow, but 10 is worth asking about before you sign anything.

---

## 11. Constraints on the constitution

**✅ ALL APPLIED — constitution v1.1.0, 2026-07-31.** The table below is retained as the rationale
record; the constitution is now the authority. A tenth item (service-worker caching) was withdrawn
when PWA was confirmed out of scope — see the header note.

Amendment IDs in the constitution's Sync Impact Report map to this table as A1…A9 in row order.

| # | Target | Change | Why |
|---|---|---|---|
| **11.1** | Principle VIII | **Public signup MUST be disabled.** The owner account is provisioned manually | "RLS enabled" is worthless if anyone can self-serve an `authenticated` role. The highest-severity gap in VIII as written (§2.2) |
| **11.2** | Principle VIII | Extend "RLS on every table" to **views (`security_invoker = true`) and `security definer` functions (`set search_path = ''`)** | Both are documented bypass routes around a correct policy set. VIII says "table" and means "data" (§1.1) |
| **11.3** | Compliance section | **Data region is a recorded per-deployment decision**, named in the privacy notice | Cross-border transfer keeps the controller accountable; region must be deliberate, not a default (§7.2) |
| **11.4** | Compliance section | **Default retention: personal fields anonymized 24 months post-checkout; enquiries 12 months. Enforced by scheduled job** | The constitution mandates an erasure path but no retention limit — that is half of RA 10173's requirement (§7.4) |
| **11.5** | Principle I | If multi-property is ever un-deferred, **every RLS policy needs a tenant predicate** — flag as a security-review trigger, not a feature | Single-tenant collapses "owner-only" into "is admin." Retrofitting tenancy into policies is exactly what I exists to prevent (§1.2) |
| **11.6** | Principle II or Compliance | **Government IDs, passport numbers, and dates of birth MUST NOT be collected** without a compliance review first | Sensitive personal information under RA 10173 §3(l) — raises consent standard, breach threshold, and penalties. A check-in module would walk into this (§0) |
| **11.7** | Principle VIII | **A Content-Security-Policy without `unsafe-inline` is a core requirement**, not hardening | In a client-only SPA with localStorage sessions, CSP *is* the session-security control (§2.3, §4.5) |
| **11.8** | Principle VIII or IX | **Output encoding applies outside React** — email templates and any non-React render path escape every interpolated value | VIII covers input validation; nothing covers output encoding where React is absent (§4.4b) |
| **11.9** | Development Workflow | **State the full chain order** — specify → clarify (loop) → security review → plan → checklist → tasks → analyze (loop) → implement (staged) → loose-ends → converge (loop) | The constitution's order-of-work line omits clarify, the security review, checklist, analyze, converge, and the loose-ends sweep. `/speckit-analyze` treats the constitution as authority, so an understated workflow lets a mandatory step be skipped without flagging (chain doc §1) |

**One thing the constitution already gets right and should not be traded:** constitution II's "never
touch money" removes PCI DSS entirely (§7.5). Any future proposal to add a payment gateway is a
compliance-scope change of a different order from a feature change, and this baseline is the reason.

---

## 12. Pre-launch checklist

Per deployment. Every line is verified, not assumed.

**Database**

- [ ] §1.5 audit query returns zero rows
- [ ] Every table `enable` **and** `force` row level security
- [ ] Separate policy per command; no `for all`
- [ ] Every `update` policy has `WITH CHECK`, not only `USING`
- [ ] Every view sets `security_invoker = true`
- [ ] Every `security definer` function sets `search_path = ''`
- [ ] `bookings_no_overlap` exclusion constraint exists and is enforced (`where` clause correct)
- [ ] Concurrency test: simultaneous requests for the same unit and overlapping dates → exactly one hold
- [ ] `pg_cron` hold-expiry job scheduled and observed firing
- [ ] Booking reference is high-entropy and non-sequential

**Auth**

- [ ] **Public signup disabled**
- [ ] Leaked-password protection on; minimum length 12
- [ ] MFA enrolled for the owner
- [ ] Redirect URL allowlist exact, no wildcards
- [ ] Refresh token rotation on
- [ ] Email enumeration protection on

**Secrets**

- [ ] `grep -r "service_role" dist/` returns nothing
- [ ] No secret carries a `VITE_` prefix
- [ ] Production source maps disabled or private
- [ ] `gitleaks` clean over full history
- [ ] Demo QR is obviously non-functional and belongs to nobody

**Application**

- [ ] CSP served as a header, no `unsafe-inline` in `script-src`
- [ ] HSTS, `nosniff`, `Referrer-Policy`, `frame-ancestors 'none'`
- [ ] Turnstile verified **server-side** on every public form
- [ ] Rate limits present on all §2.5 endpoints and manually exercised
- [ ] Content bodies are Markdown; raw HTML rejected at save **and** renderer passthrough disabled
- [ ] `grep -r "dangerouslySetInnerHTML" src/` returns nothing
- [ ] Payment QR is in the private bucket, reachable only via a hold-scoped signed URL
- [ ] `booking_events` contains no personal fields; erasure clears `email_deliveries` addresses
- [ ] Email templates escape every interpolated value
- [ ] Uploads: magic-byte checked, re-encoded, EXIF stripped, SVG rejected
- [ ] No booking or enquiry data persisted to `localStorage` / `sessionStorage` / IndexedDB
- [ ] No service worker registered (out of scope — see header note)

**Compliance**

- [ ] Privacy policy and ToS reviewed by counsel and published
- [ ] PIC–PIP agreement signed
- [ ] DPO designated; NPC registration resolved
- [ ] Data region recorded and named in the privacy notice
- [ ] Retention jobs scheduled and verified
- [ ] Access-export and erasure paths tested against a real booking
- [ ] Breach runbook (§9.5) shared with the owner, with contact numbers filled in
- [ ] **No demo imagery remains** (constitution IV) — `demo-assets` bucket empty, no references

---

## 13. Revision log

**1.1.0 — 2026-07-31.** Amended after the Phase 1.3 security review of
`specs/001-resort-direct-booking`. These are feature-driven changes the original baseline could not
have anticipated, because the decisions post-dated it:

| Change | Driver |
|---|---|
| **Added RLS-P1s** singleton public-read | `site_settings` and `site_branding` have no publish gate |
| **Added RLS-P7** append-only audit | `booking_events`, `email_deliveries` — entities added by spec iteration 4 |
| **Narrowed RLS-P4** from "read + constrained update" to "read only" | Every booking write now goes through P5 |
| **Withdrew the `bookings` admin UPDATE policy** | Spec C4 and C6 made it both too narrow and too permissive — §1.3 |
| **Added the private `payment-assets` bucket** | Spec C8 — the QR is no longer publicly readable |
| **§4.4(a) decided**: Markdown, raw HTML rejected at save | Spec C7 |
| **§12 checklist** gained four items | All of the above |

**The withdrawn policy is the one to carry forward.** It is not replaced by a better policy but by
*no* policy: three write paths into one state machine belong in one `security definer` function, not
in a table rule written three times and load-tested once.

**Baseline version**: 1.1.0 | **Date**: 2026-07-31 | **Constitution**: v1.1.0 (amendments applied, §11)
