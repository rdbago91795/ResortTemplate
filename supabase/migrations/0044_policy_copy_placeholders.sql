-- 0044_policy_copy_placeholders.sql — pre-flight sweep finding
--
-- The privacy policy seeded by 0038 contains `{Property Name}`, `{Address}` and
-- `{contact email}`. Those pages are seeded PUBLISHED, so on a deployment where the owner
-- never edits them, a guest reads:
--
--     "This site is operated by {Property Name}, {Address}."
--
-- Two problems. It looks broken, and under RA 10173 the privacy notice has to identify the
-- actual personal information controller — a brace is not an identification.
--
-- ── Why not just unpublish them until edited ─────────────────────────────────
--
-- Because FR-051 requires all three policies reachable from every page, and US11 scenario 5
-- asserts a guest finds them in the footer. Unpublishing removes them from navigation, so the
-- fix has to be the words themselves: the shipped default must be correct-as-written, not a
-- template awaiting substitution.
--
-- ── The better long-term answer, deliberately not done here ──────────────────
--
-- Render-time substitution from `site_settings` — the policy route reads property_name and
-- contact_email and fills them in. That keeps the policy in step with settings automatically
-- and is the right home for this. It belongs with the policy route in US11; there is no route
-- yet, and adding a substitution mechanism to `Prose` would put settings-awareness into a
-- component whose entire job is to render Markdown it was handed.
--
-- So: this migration makes the DEFAULT honest. US11 can still add substitution later, and
-- the text below is written so that doing so is an improvement rather than a correction.
--
-- ⚠ ONLY UNEDITED ROWS ARE TOUCHED. The `where` clause matches the placeholder text, so an
-- owner who has already rewritten their privacy policy keeps every word of it. Running this
-- against a live deployment cannot overwrite anyone's work.

update public.content_pages
set body_markdown = replace(
      replace(
        replace(body_markdown,
          'This site is operated by {Property Name}, {Address}. We are the personal information
controller for the data described below, as those terms are used in the Philippine Data
Privacy Act of 2012 (RA 10173).',
          'This site is operated by the property it describes, whose trading name, registered
address and contact details appear in the footer of every page and on the contact page. That
business is the personal information controller for the data described below, as those terms
are used in the Philippine Data Privacy Act of 2012 (RA 10173).

If you need those details in writing for a formal request, ask us using the contact details
below and we will provide them.'),
        'Write to
{contact email} and we will respond within a reasonable period.',
        'Write to us using the address on our contact page and we will respond within a
reasonable period.'),
      'you may complain to us at {contact email},
or to the National Privacy Commission at privacy.gov.ph.',
      'you may complain to us using the details on our contact page, or to the National
Privacy Commission at privacy.gov.ph.')
where slug = 'privacy-policy'
  and body_markdown like '%{Property Name}%';

-- Belt and braces: fail loudly if any brace placeholder survives in a PUBLISHED page, rather
-- than letting a near-miss in the replace above ship silently.
do $$
declare v_bad text;
begin
  select string_agg(slug, ', ') into v_bad
  from public.content_pages
  where published_at is not null
    and body_markdown ~ '\{[A-Za-z ]+\}';

  if v_bad is not null then
    raise exception 'unsubstituted placeholder remains in published page(s): %', v_bad;
  end if;
end $$;
