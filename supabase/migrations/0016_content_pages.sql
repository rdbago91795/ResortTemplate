-- 0016_content_pages.sql — T032
--
-- C7: bodies are MARKDOWN. Raw HTML is rejected when the page is saved, not sanitised
-- afterwards — so there is no sanitiser to keep patched and no `dangerouslySetInnerHTML`
-- anywhere in the render path.
--
-- The database cannot detect HTML in a text column; save_content_page() does that (Gate 7).
-- The column type is honest about what it holds and the comment says where the guarantee lives.
--
-- `page_kind` governs deletability (FR-049a): ONLY the three policy pages are undeletable,
-- because only they are legally required. Amenities and activities ship seeded and published
-- but are ordinary deletable pages. Undeletable means legally required, and nothing else.
--
-- C9: `menu_position` and `menu_label` live HERE, on the page. There is no separate
-- menu-management screen to find, learn, or keep in step with the pages.

create table public.content_pages (
  id   uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),

  page_kind text not null default 'content' check (page_kind in ('content', 'policy')),

  title         text not null check (char_length(title) between 1 and 200),
  menu_label    text check (menu_label is null or char_length(menu_label) between 1 and 40),
  menu_position int not null default 0,

  body_markdown text not null default '',

  published_at timestamptz,
  updated_at   timestamptz not null default now()
);

create index content_pages_menu_idx on public.content_pages (menu_position)
  where published_at is not null;

comment on table public.content_pages is
  'Markdown bodies (C7). Amenities, activities, and the three policies are all content pages; only the policies cannot be deleted (FR-049a).';

comment on column public.content_pages.body_markdown is
  'Markdown. Raw HTML is rejected by save_content_page() — the database cannot enforce this, so the guarantee lives entirely in that function (FR-045a).';

comment on column public.content_pages.menu_position is
  'Set on the page itself (C9, FR-051b). Publishing a page puts it in the navigation automatically; there is no menu screen.';
