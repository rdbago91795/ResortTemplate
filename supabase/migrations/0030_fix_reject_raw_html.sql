-- 0030_fix_reject_raw_html.sql — corrective, found by probing 0028
--
-- ══════════════════════════════════════════════════════════════════════════════════════
-- THE HTML GATE FIRED BUT COULD NOT SAY WHY.
-- ══════════════════════════════════════════════════════════════════════════════════════
--
-- 0028 used a CAPTURING group for the optional attribute run:
--
--     '</?[a-zA-Z][a-zA-Z0-9-]*(\s[^>]*)?/?>'
--                              ^^^^^^^^^^^^
--
-- In Postgres, `substring(text from pattern)` and `regexp_match(...)[1]` return the FIRST
-- PARENTHESISED SUBEXPRESSION when one exists — not the whole match. For `<script>` there are
-- no attributes, so group 1 is NULL, so `detail` was NULL, so:
--
--     raise exception 'html_not_allowed' using detail = <null>
--       → ERROR: RAISE statement option cannot be null
--
-- The save still aborted, so nothing unsafe was ever stored. But the SQLSTATE the client saw
-- was 22004, not the P0001/'html_not_allowed' the interface matches on — so the editor could
-- only have shown a generic failure, never "line 12 contains <script>, which isn't allowed
-- here." FR-045a asks for the tag back. `<img src=x onerror=...>` was worse: it reported the
-- ATTRIBUTES (" src=x onerror=alert(1)") as though they were the offending tag.
--
-- Fix: non-capturing `(?:...)`, so both calls return the whole match. Same detection, same
-- rejections — this changes only what the function can tell you about them.
--
-- Probed against: `<script>` (no attrs, was NULL), `<img src=x onerror=alert(1)>` (attrs, was
-- truncated), and three false-positive candidates that must pass: a `>` blockquote, `3 < 5`,
-- an autolink-looking `<a@b.com>`, and inline `` `code < 3` ``.

create or replace function public.reject_raw_html(p_text text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_match text;
begin
  if p_text is null then return; end if;

  -- (?:...) — non-capturing. substring() now returns the tag, not the attribute run.
  v_match := substring(p_text from '</?[a-zA-Z][a-zA-Z0-9-]*(?:\s[^>]*)?/?>');

  if v_match is not null then
    raise exception 'html_not_allowed'
      using detail = v_match,
            hint   = 'This field is Markdown. Raw HTML is rejected at save so it never needs sanitising at render.';
  end if;
end $$;

revoke all on function public.reject_raw_html(text) from public, anon, authenticated;

comment on function public.reject_raw_html(text) is
  'The Markdown/HTML gate (C7, FR-045a). Detection is unchanged from 0028; this revision fixes a capturing group that made DETAIL null and broke the error contract.';
