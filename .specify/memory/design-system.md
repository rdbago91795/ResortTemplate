# Design System — Balai Amihan / Direkta

**File location:** `.specify/memory/design-system.md`
**Phase:** 0.5 — feeds 1.1 (`/speckit-specify`) and every implementation run.
**Upstream:** `product-brief.md`, `constitution.md` v1.1.0, `security-baseline.md`

**Single theme. No dark mode, no theme toggle** — confirmed as a deliberate scope decision. Section
numbering below skips 4 so that §5–§11 line up with the prompt's own item numbers.

**§3 is retained** because the theme contract is required independently of dark mode: constitution
Principle V binds every later phase to reference tokens by exact name, and the contract is the
mechanism by which per-client rebranding stays a configuration change (Principle I, metric S2). Its
purpose here is *client themes*, not colour schemes — see §3.

**Marker:** ⚑ INFERRED — my decision, not drawn from the brief. Correct before it hardens.

---

## 0. The design thesis

Philippine coastal vernacular has one unmistakable artifact: the **capiz ventanilla** — a sliding
window of translucent windowpane-oyster shell, set in a grid of dark wooden mullions. Light does not
pass through it so much as *diffuse* through it. It is specific to this market in a way that "palm
fronds and turquoise" never is.

**The capiz grid is the signature element of this system.** It is the layout logic of the gallery,
the reveal mechanism of the hero, the section divider, and the loading indicator. One idea doing
four jobs.

It earns its place on grounds beyond taste:

- **It costs almost nothing.** CSS grid plus `opacity`. No textures, no images, no library — which
  matters under Principle VII on a mid-range Android.
- **It satisfies Principle VI natively.** Panes animate on opacity alone. There is no version of
  this motif that needs to animate `width` or `filter`.
- **It degrades cleanly.** Under `prefers-reduced-motion` the panes are simply already visible. No
  information is lost, which is the test a decorative reveal usually fails.

Everything else in this system is deliberately quiet. The photography is the product (Principle IV);
the design's job is to frame it and get out of the way.

**⚑ Calibration note.** The obvious answer here — warm cream background, high-contrast serif
display, terracotta accent — is the house style of every AI-generated hospitality site, and it would
have made this look like a template at exactly the moment the brief needs it not to. This system
deliberately goes elsewhere: a *cool* shell-white with a green cast, an **expanded grotesque**
rather than a serif, and a petrol-teal accent drawn from water at depth.

---

## 1. Brand name

**Two different naming problems are bundled here, and only one of them needs a domain.**

The visual direction (§2) gets applied to the **demo resort**, which is fictional (brief §4.8) and
per-deployment configurable — a fictional property does not register a domain, and real clients use
their own (Principle I). The **template product** is the developer's commercial asset, and that is
what needs `.com` / `.ph`. Both are below. ⚑ This split is my reading of the prompt.

### 1a. The demo resort — primary

Constraints from brief §4.8: plausible, coherent identity, fictional, **plausible-generic rather
than modelled on any real property**, and no baked-in location.

| Name | Why it works | Risk |
|---|---|---|
| **Balai Amihan** | "Balai" is house/dwelling; "Amihan" is the cool northeast monsoon that defines peak travel season. A house, and the wind through its windows | Two Filipino words is a lot for a mixed-language audience |
| Amihan Bay | Names the season people actually travel in. Airy, calm, easy to say | "Amihan" is in use by real PH businesses and is a well-known *Encantadia* character; "Bay" mildly pins geography |
| Casa Ventanilla | Names the signature motif outright; Spanish-colonial resonance is authentic to PH architecture | "Casa" is heavily used in PH hospitality; reads formal and slightly inland for a beach property |
| Sinag Cove | "Sinag" is a ray of light — light through shell is the whole visual idea. Short, bright | "Cove" is generic English resort-speak; the PH/English mix is uneven |
| Hiraya | Single word, memorable, claims no geography, so it survives any configuration | Fashionable in PH branding right now; abstract for a physical place |

**Recommended: Balai Amihan.**

Four reasons, in order of weight. The target guest is a **domestic** traveller (brief §3), so
Filipino reads as authentic rather than exotic — this is the one place the domestic focus should
show in the product itself. "Balai" sizes the property **honestly**: a house, not a compound, which
is what 8–30 rooms actually is, and honesty about scale is the whole differentiator against OTA
listings. It hands the design its thematic anchor — a house, its windows, the light through them —
which is precisely the capiz direction. And it claims no geography, so the demo stays
plausible-generic as §4.8 requires.

### 1b. The template product — secondary

| Name | Why it works | Risk |
|---|---|---|
| **Direkta** | Says the value proposition in one word, in the market's language: booking direct, not through an OTA | Plain; a common adverb may be hard to protect as a mark |
| Ventanilla | The window — the product is a window onto a property | Obscure to buyers outside PH; long to type |
| Bakasyon | Warm, instantly understood, unmistakably local | Generic — describes the category, not the product |

**Recommended: Direkta.** It names the thing the owner is actually buying — commission-free direct
bookings — rather than describing the website. That is the sales conversation in one word.

### Domain availability

**I cannot verify this and have not guessed.** Availability changes hourly and no search result is
authoritative. Check `direkta.com`, `direkta.ph`, and `direkta.com.ph` at a registrar directly;
`.ph` registrations go through dot.ph and have their own rules for second-level `.ph` versus
`.com.ph`. Treat any answer that does not come from the registry as noise.

---

## 2. Visual direction

### The three options considered

**A — Editorial Coastal.** Magazine spread. Generous whitespace, large display type, full-bleed
photography, restrained palette. *Strength:* makes the photography the hero, which Principle IV
demands, and costs nothing to render fast. *Risk:* reads cold and luxury-distant; collapses entirely
if a client's photos are weak (brief §6.4c).

**B — Cinematic Dark.** Dark-first, high contrast, images glowing against near-black, heavy scroll
reveals. *Strength:* photos pop hardest; differentiates most violently from a Facebook page.
*Risk:* **a dark UI is genuinely hard to read on a phone in Philippine daylight.** Guests browse
outdoors. This is a market-specific failure, not a taste objection — and the same argument supports
shipping a single light theme rather than a dark alternate (§3).

**C — Capiz Vernacular.** Cool shell-white ground, modular pane grid as structure, expanded
grotesque display, petrol accent from water at depth, celadon translucence. *Strength:*
culturally specific; the structural motif *is* the brand; nearly free in bytes. *Risk:* if the pane
grid is applied everywhere it becomes wallpaper and the photography loses.

### Recommended: C — Capiz Vernacular, disciplined to three placements

A takes photography seriously but arrives at the same page as every other AI-designed resort site.
B fails a real environmental constraint. C keeps A's photography-first discipline while giving the
template something a Facebook page structurally cannot imitate — and the risk is manageable by
rule rather than by judgment.

**The rule: the pane grid appears in exactly three places.** Hero reveal, gallery layout, section
divider. Plus one functional reuse as the loading indicator. Anywhere else, it is wallpaper — cut it.

### Applied to Balai Amihan

- **Ground:** cool shell-white with a faint green cast (`#F4F6F4`) — light *through* shell, not
  parchment. The deliberate opposite of the warm-cream default.
- **Structure:** the ventanilla grid. Sections are separated by a **pane band** — a single row of
  ~12 narrow cells with alternating faint celadon fills, 8px tall on mobile, 12px on desktop. It
  does a hairline rule's job while being unmistakably this brand.
- **Display type:** **Archivo** on its width axis, set Expanded (~125) at hero with tight tracking.
  Wide horizontal proportions echo the banding of the window. Not a serif, on purpose.
- **Accent:** petrol-teal `#0A4E58` — water with depth in it, not postcard turquoise.
- **Glow:** celadon `#C9DCD4` at low alpha, used only for pane fills and edges. Never a button.

**Hero, mobile:**

```
┌──────────────────────────────┐
│ ░░░░  ░░░░  ░░░░  ░░░░       │  capiz panes over the photograph,
│ ░░░░  ░░░░  ░░░░  ░░░░       │  fading in 4×2, staggered 70ms
│                              │
│  BALAI                       │  Archivo Expanded, tracking -0.02em
│  AMIHAN                      │
│  ▚▞▚▞▚▞▚▞▚▞▚▞                │  pane band
│  Fourteen rooms on the water │  Public Sans, content.secondary
│                              │
│ ┌──────────────────────────┐ │
│ │ Check in    Check out    │ │  availability search — the one
│ │ Guests            Search │ │  interactive thing above the fold
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

The hero's single job is: *is this place worth my money, and are my dates open.* Photograph answers
the first, the search answers the second. Nothing else competes.

---

## 3. Theme contract

**This is the section every later phase reads.** Principle V makes these names binding: a wrong name
fails `npm run build` rather than looking subtly off, which is exactly why it is worth being fussy
here.

**Brand colour is data, not code.** The primary and secondary colours are stored in the database and
editable by the owner in the admin — they are content in the same sense that room rates are. This is
Principle I applied to the palette: rebranding a deployment must not require a code change, and it
must not require the developer at all.

That splits the contract in two, and the split is the most important thing in this section:

| Group | Source | Owner-editable |
|---|---|---|
| `color.brand.*` | **Database, applied at runtime** | **Yes** — primary and secondary; the rest derived |
| `color.pane.*` | Derived from `brand.secondary` | Indirectly |
| `color.surface.*`, `color.content.*`, `color.border.*` | Static, in the theme file | No |
| `color.status.*`, `color.booking.*` | Static, in the theme file | **No — see below** |
| every non-colour scale | Static | No |

**Status and booking colours are deliberately not editable.** Green-means-confirmed and
amber-means-held are functional semantics, not brand expression. An owner who sets "cancelled" to
green has created an operational hazard on the one state machine that governs money — and they will
not realise they have done it. This is a case where taking a choice away is the design decision.

**Surfaces and content colours are not editable either.** They are what the contrast guarantees in
§11.1 are built on. Two owner-chosen colours can be validated on save; an owner-chosen background
invalidates every pair in the table at once.

The contract remains what makes Principle V enforceable: components reference
`vars.color.brand.primary` by name and never see a hex, whether the value arrives from a theme file
or from a database row.

```ts
// src/styles/contract.css.ts
import { createThemeContract } from '@vanilla-extract/css';

export const vars = createThemeContract({
  color: {
    // ── DYNAMIC: assigned at runtime from the database (§3.4) ──────────────
    brand: {
      primary: null,        // fills, buttons, active states
      primaryHover: null,   // derived
      primaryActive: null,  // derived
      primaryText: null,    // derived — contrast-safe on surface.base; links, focus rings
      primarySubtle: null,  // derived — tinted background
      onPrimary: null,      // derived — auto black/white by contrast
      onPrimarySubtle: null,// derived
      secondary: null,
      secondarySubtle: null,// derived
      onSecondary: null,    // derived
    },
    pane: { fill: null, edge: null, glow: null },  // derived from brand.secondary
    // ── STATIC: theme file only ────────────────────────────────────────────
    surface: { base: null, raised: null, sunken: null, overlay: null, inverse: null, scrim: null },
    content: { primary: null, secondary: null, tertiary: null, inverse: null },
    border:  { subtle: null, default: null, strong: null, focus: null },
    status:  { successFg: null, successBg: null, warningFg: null, warningBg: null,
               dangerFg: null,  dangerBg: null,  infoFg: null,    infoBg: null },
    booking: { heldFg: null,      heldBg: null,
               awaitingFg: null,  awaitingBg: null,
               confirmedFg: null, confirmedBg: null,
               cancelledFg: null, cancelledBg: null,
               expiredFg: null,   expiredBg: null },
  },
  space:  { none: null, xxs: null, xs: null, sm: null, md: null, lg: null,
            xl: null, xxl: null, xxxl: null, huge: null },
  radius: { none: null, sm: null, md: null, lg: null, pill: null, circle: null },
  font: {
    family:     { display: null, body: null, mono: null },
    size:       { caption: null, small: null, body: null, lead: null,
                  h4: null, h3: null, h2: null, h1: null, display: null },
    weight:     { regular: null, medium: null, semibold: null, bold: null },
    lineHeight: { tight: null, snug: null, normal: null, relaxed: null },
    tracking:   { tight: null, normal: null, wide: null },
    width:      { normal: null, expanded: null },
  },
  shadow:   { none: null, sm: null, md: null, lg: null, focus: null },
  zIndex:   { base: null, sticky: null, header: null, overlay: null, modal: null, toast: null },
  duration: { instant: null, fast: null, base: null, slow: null, slower: null, scene: null },
  easing:   { standard: null, entrance: null, exit: null, emphasis: null },
  size:     { touchTarget: null, headerHeight: null, containerMax: null, proseMax: null },
});
```

**Naming decision worth knowing:** the space scale uses `xxs…huge` rather than `2xs…4xl` so every
token is reachable by dot access — `vars.space.xxl`, never `vars.space['2xl']`. Bracket access
invites typos that the type system catches late and reads badly at every call site.

### 3.1 The Balai Amihan theme — `theme.balaiAmihan.css.ts`

| Token | Value | Note |
|---|---|---|
| `color.surface.base` | `#F4F6F4` | cool shell white |
| `color.surface.raised` | `#FFFFFF` | cards, sheets |
| `color.surface.sunken` | `#E6EBE7` | wells, table stripes |
| `color.surface.overlay` | `rgba(21,26,24,0.72)` | modal backdrop |
| `color.surface.inverse` | `#151A18` | inverted sections |
| `color.surface.scrim` | `rgba(21,26,24,0.48)` | text-over-photo scrim |
| `color.content.primary` | `#151A18` | near-black, green undertone |
| `color.content.secondary` | `#4A5551` | |
| `color.content.tertiary` | `#6B7671` | **large text and non-essential only** — see §11 |
| `color.content.inverse` | `#F4F6F4` | |
| `color.border.subtle` | `#DFE5E1` | |
| `color.border.default` | `#C7D0CB` | |
| `color.border.strong` | `#97A29C` | |
| `color.border.focus` | *= `brand.primaryText`* | follows the brand |

**Brand tokens — baked defaults for Balai Amihan.** These are the values shipped in the theme file
and the values seeded into `site_branding`. At runtime the database wins (§3.4).

| Token | Seed value | Origin |
|---|---|---|
| `color.brand.primary` | `#0A4E58` | **owner-set** — petrol teal |
| `color.brand.primaryHover` | `#073B43` | derived |
| `color.brand.primaryActive` | `#052C32` | derived |
| `color.brand.primaryText` | `#0A4E58` | derived — darkened until ≥4.5:1 on `surface.base` |
| `color.brand.primarySubtle` | `#DCE9E9` | derived |
| `color.brand.onPrimary` | `#FFFFFF` | derived — chosen by contrast |
| `color.brand.onPrimarySubtle` | `#073B43` | derived |
| `color.brand.secondary` | `#C9DCD4` | **owner-set** — capiz celadon |
| `color.brand.secondarySubtle` | `#EDF3F0` | derived |
| `color.brand.onSecondary` | `#151A18` | derived — chosen by contrast |
| `color.pane.fill` | `rgba(201,220,212,0.28)` | derived — `secondary` at 28% |
| `color.pane.edge` | `rgba(255,255,255,0.55)` | static |
| `color.pane.glow` | `rgba(201,220,212,0.55)` | derived — `secondary` at 55% |
| `color.status.successFg` / `Bg` | `#1B6B3A` / `#E3F1E8` | |
| `color.status.warningFg` / `Bg` | `#8A5A00` / `#FBF0DC` | |
| `color.status.dangerFg` / `Bg` | `#A32020` / `#FBE6E6` | |
| `color.status.infoFg` / `Bg` | `#10527A` / `#E2EEF6` | |
| `color.booking.heldFg` / `Bg` | `#8A5A00` / `#FBF0DC` | amber — provisional |
| `color.booking.awaitingFg` / `Bg` | `#10527A` / `#E2EEF6` | blue — action needed from owner |
| `color.booking.confirmedFg` / `Bg` | `#1B6B3A` / `#E3F1E8` | green |
| `color.booking.cancelledFg` / `Bg` | `#4A5551` / `#E6EBE7` | neutral |
| `color.booking.expiredFg` / `Bg` | `#6B7671` / `#EFF2F0` | muted |

**Booking-state colours are tokens, not per-component choices.** The five states in Principle III
appear in the admin table, the admin detail panel, and the guest status tracker. Left to each
surface they drift, and drift on a state machine that governs money is a support call.

### 3.2 Non-colour scales

**Space** — 4px base: `none 0` · `xxs 2px` · `xs 4px` · `sm 8px` · `md 12px` · `lg 16px` ·
`xl 24px` · `xxl 32px` · `xxxl 48px` · `huge 96px`

**Radius** — `none 0` · `sm 2px` · `md 4px` · `lg 8px` · `pill 999px` · `circle 50%`

Radii stay tight deliberately. The ventanilla is a rectilinear grid; soft corners fight it.

**Type** — fluid, `clamp()`:

| Token | Value |
|---|---|
| `font.size.caption` | `clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)` |
| `font.size.small` | `clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem)` |
| `font.size.body` | `clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)` |
| `font.size.lead` | `clamp(1.125rem, 1.05rem + 0.35vw, 1.375rem)` |
| `font.size.h4` | `clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)` |
| `font.size.h3` | `clamp(1.5rem, 1.3rem + 1vw, 2rem)` |
| `font.size.h2` | `clamp(2rem, 1.6rem + 2vw, 3rem)` |
| `font.size.h1` | `clamp(2.5rem, 1.8rem + 3.5vw, 4.5rem)` |
| `font.size.display` | `clamp(3rem, 2rem + 6vw, 7rem)` |

`font.weight` — `regular 400` · `medium 500` · `semibold 600` · `bold 700`
`font.lineHeight` — `tight 1.05` · `snug 1.2` · `normal 1.5` · `relaxed 1.65`
`font.tracking` — `tight -0.02em` · `normal 0` · `wide 0.06em`
`font.width` — `normal 100` · `expanded 125` *(Archivo `wdth` axis)*

**Families:**

| Token | Face | Where | Budget |
|---|---|---|---|
| `font.family.display` | **Archivo Variable** (`wght`, `wdth`) | h1, h2, display only | ~34KB woff2, Latin subset |
| `font.family.body` | **Public Sans Variable** | everything else | ~30KB, **preloaded** |
| `font.family.mono` | **DM Mono** | payment references, rates, dates, admin tables | ~18KB, **admin + confirmation routes only** |

Three families is a real cost on mobile data. It is paid for by **route-scoped loading**: body is
preloaded everywhere; display loads with `font-display: swap` on marketing routes; **mono never
loads on a browse-only guest session.** Self-hosted, per CSP `font-src 'self'` (security baseline
§4.5).

Mono is not decorative. A payment reference is a code the guest reads off one app and types into
another, and the owner then compares against a third — monospace with tabular figures is the
difference between `0`/`O` and a support message. Admin rates and dates get tabular figures for the
same reason: columns that align are columns you can scan.

**Motion:** `duration.instant 0ms` · `fast 120ms` · `base 200ms` · `slow 320ms` · `slower 480ms` ·
`scene 800ms`
`easing.standard cubic-bezier(0.2,0,0,1)` · `entrance cubic-bezier(0.22,1,0.36,1)` ·
`exit cubic-bezier(0.4,0,1,1)` · `emphasis cubic-bezier(0.34,1.26,0.64,1)`

**Shadow:** `none` · `sm 0 1px 2px rgba(21,26,24,0.06)` · `md 0 2px 8px rgba(21,26,24,0.08)` ·
`lg 0 8px 32px rgba(21,26,24,0.12)` · `focus 0 0 0 3px <brand.primaryText at 32%>`

**zIndex:** `base 0` · `sticky 10` · `header 20` · `overlay 30` · `modal 40` · `toast 50`

**Size:** `touchTarget 44px` · `headerHeight 64px` · `containerMax 1240px` · `proseMax 68ch`

### 3.3 Applying brand colour at runtime

A Vanilla Extract contract compiles to CSS custom properties, so the values *can* be replaced at
runtime even though the CSS is static. Two mechanisms exist and **only one of them is usable here.**

```tsx
// ✅ USE THIS — setElementVars writes through the CSSOM
import { setElementVars } from '@vanilla-extract/dynamic';
import { vars } from '@/styles/contract.css';

setElementVars(document.documentElement, {
  [vars.color.brand.primary]:      branding.primaryHex,
  [vars.color.brand.primaryHover]: branding.primaryHoverHex,
  // …all ten brand tokens + the two derived pane tokens
});
```

```tsx
// ❌ DO NOT USE — assignInlineVars emits a style="" attribute
<div style={assignInlineVars({ [vars.color.brand.primary]: hex })}>
```

**The reason is CSP, and it is easy to get wrong.** Security baseline §4.5 sets `style-src 'self'`
with no `'unsafe-inline'`. An inline `style=""` attribute **is** covered by `style-src` and would be
blocked — the page renders with unstyled brand colours and no obvious error. `setElementVars` calls
`element.style.setProperty()` through the CSSOM, which CSP does not govern at all. This is the same
exemption that makes Framer Motion and Lenis CSP-clean.

So: `assignInlineVars` is banned in this codebase. `setElementVars` is the only path.

**No flash of unbranded content.** The theme file ships the client's current brand as its baked
default, so first paint is already correct with zero network round-trips. The runtime override only
does work when the owner has changed a colour since the last deploy — and then it is a single frame
shift, not unbranded-to-branded. Apply it as early as possible in `main.tsx`, before the first
render, from the site-config fetch that the app needs anyway.

### 3.4 Where the values live, and who derives them

```sql
create table public.site_branding (
  id                    boolean primary key default true check (id),  -- singleton row
  primary_hex           text not null,
  secondary_hex         text not null,
  -- derived on write by an Edge Function; never computed in the client
  primary_hover_hex     text not null,
  primary_active_hex    text not null,
  primary_text_hex      text not null,
  primary_subtle_hex    text not null,
  on_primary_hex        text not null,
  on_primary_subtle_hex text not null,
  secondary_subtle_hex  text not null,
  on_secondary_hex      text not null,
  -- logo and share identity (§3.5)
  logo_wide_path        text,          -- horizontal lockup; header and footer
  logo_wide_alt         text,          -- defaults to resort name, never blank
  logo_inverse_path     text,          -- optional light-on-dark variant
  logo_mark_path        text,          -- optional square mark; drives the favicon
  og_image_path         text,          -- social share card
  updated_at            timestamptz not null default now(),
  updated_by            uuid references auth.users(id)
);
```

The `check (id)` singleton pattern suits one-property-per-deployment (Principle I) and removes a
whole class of "which branding row is live" bugs.

**Access:** public read, admin write — security baseline **RLS-P1** with the published predicate
dropped, since branding is always live. The guest site reads this anonymously on every visit.

**Derivation happens server-side, in an Edge Function, on write.** Three reasons, in order:

1. **Contrast can be enforced at the point of choice.** This is the whole argument. A non-technical
   owner will pick a pale yellow, and if derivation is client-side and advisory, the site silently
   fails §11.1. Server-side, the write is rejected.
2. **No colour-maths library in the client bundle.** Deriving a perceptual ramp needs OKLCH
   conversion; shipping that to every guest on mobile data fights Principle VII for no benefit.
3. **Constitution VIII** — derived values are computed values, and computed values that matter are
   computed server-side.

Derivation rules (⚑ inferred; tune against real owner choices):

| Derived token | Rule |
|---|---|
| `primaryHover` | OKLCH lightness −0.06 |
| `primaryActive` | OKLCH lightness −0.12 |
| `primaryText` | darken in OKLCH until ≥4.5:1 against `surface.base`, then stop |
| `primarySubtle` | OKLCH L→0.94, chroma ×0.25 |
| `onPrimary` | `#FFFFFF` or `content.primary`, whichever scores higher against `primary` |
| `onPrimarySubtle` | same test against `primarySubtle` |
| `secondarySubtle` | OKLCH L→0.96, chroma ×0.4 |
| `onSecondary` | contrast test as `onPrimary` |
| `pane.fill` / `pane.glow` | `secondary` at 28% / 55% alpha |

**`primaryText` is the token that saves this design from its owner.** A brand colour good enough for
a button fill is frequently too pale to be a link on a near-white ground. Deriving a separate,
contrast-guaranteed text variant means the owner picks the colour they want and the links stay
readable — rather than the system either rejecting their brand or shipping unreadable text.

**Validation rejected on save, with a reason the owner understands:**

- `primary` must reach ≥3:1 against `surface.base` — below that, buttons have no visible edge
- `onPrimary` must reach ≥4.5:1 against `primary` after auto-selection; if neither white nor near-black
  clears it, reject
- `secondary` must reach ≥3:1 against `surface.base` when used at full opacity
- Both must parse as 6-digit hex; no named colours, no `rgb()`, no gradients

### 3.5 Logo and share identity

Four image slots, all optional, all degrading to something that still looks intentional. A resort
that never uploads a logo must not look broken — many owners genuinely do not have one.

| Slot | Purpose | Fallback when absent |
|---|---|---|
| `logo_wide` | Header, footer, email header | **Wordmark** — resort name set in Archivo Expanded, `brand.primaryText` |
| `logo_inverse` | Light-on-dark variant, over photography | Header becomes solid instead of transparent — see below |
| `logo_mark` | Square mark; source for the favicon | Generated monogram — first letter, `onPrimary` on `primary` |
| `og_image` | Facebook / Messenger share card | The hero image, cropped 1200×630, with the wordmark composited |

#### SVG is banned, and owners will try to upload one

Security baseline §5.2 bans SVG uploads — an SVG is a script carrier, and one served from your
origin executes with your origin's privileges. **Logos are natively SVG**, so this is the single
constraint owners will actually hit.

Accepted: **PNG or WebP, with alpha.** Never JPEG for a logo — no transparency. The re-encode step
in security baseline §5.2 must **preserve the alpha channel**; a naive `sharp` pipeline that
normalises everything to JPEG puts a white box behind every logo, and it will not be noticed until a
client sees their own site.

Limits: **2 MB**, max 2000px on the long edge. A logo has no business being 10 MB.

Admin copy, written for someone who has never heard of a raster format:

> **Upload a PNG with a transparent background.** If your designer sent you an SVG file, ask them
> for a PNG at 1000 pixels wide.

⚑ Accepting sanitised SVG is possible but is a deliberate future decision requiring its own security
review — it means adding an SVG sanitiser and owning a new attack surface, against a one-person team
and a minimal budget. Not in the MVP.

#### The transparent-header problem, resolved without asking the owner

The hero design wants a transparent header over photography. A dark logo vanishes on a bright sky; a
light logo vanishes on white sand. The usual fix — asking for two logo variants — will be skipped by
most owners, and then the header is broken for exactly the people least able to diagnose it.

**The system picks the treatment from what was uploaded, rather than exposing a setting:**

- `logo_inverse` present → transparent header over the hero, top gradient scrim
  (`surface.scrim` → transparent, 96px), inverse logo. Solid header after 64px of scroll, primary logo.
- `logo_inverse` absent → **solid `surface.base` header at all times**, primary logo, hero begins
  below it.

Both are deliberate designs. Neither requires the owner to understand the tradeoff, which is the
point — every setting offered to this persona is a setting that gets left wrong.

#### Favicon and share card

The favicon is **derived server-side** from `logo_mark` at 32/180/512px in the same Edge Function
that handles the upload — not a separate upload, because owners do not have favicons and asking
produces an empty field.

`og_image` matters more here than it would elsewhere. The brief's §1 premise is that these resorts
live on Facebook, so **the most common way this site gets seen is as a link shared into Messenger**.
A missing or badly cropped share card costs bookings in the exact channel the product is trying to
win. Enforce 1200×630, and preview it in the admin as it will actually appear.

### 3.6 What is *not* dynamic, and why the line is there

Typography stays fixed per deployment. Fonts are subset, preloaded, and route-scoped (§3.2); making
the family a database value breaks all three and hands a non-designer a control that can undo the
entire visual direction in one click. If a client needs a different face, that is a build change —
which is honest, because it *is* one.

Spacing, radii, motion, and shadow stay fixed for the same reason: they are the system, not the
brand.

### 3.7 Breakpoints are NOT tokens

```ts
// src/styles/breakpoints.ts — plain constants, deliberately outside the contract
export const bp = { sm: 480, md: 768, lg: 1024, xl: 1280 } as const;
```

**CSS custom properties do not work inside media query conditions.** A contract token in an
`@media` test silently never matches, and the failure looks like "the responsive layout is broken"
rather than "the token is invalid." Anything consumed by `@media` or `@supports` — breakpoints,
container query thresholds — is a TS constant. This is the one place Principle V's "reference the
token" instruction must not be followed, and it needs saying out loud.

---

## 5. Component inventory

Props shown are the load-bearing ones. Everything accepts `className` for Vanilla Extract composition
and forwards refs.

### 5.1 Primitives

| Component | Purpose | Key props |
|---|---|---|
| `Button` | The one action control | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `size: 'sm'\|'md'\|'lg'`, `loading?`, `disabled?`, `fullWidth?`, `iconStart?`, `iconEnd?` |
| `IconButton` | Icon-only action | `label` **(required — SR text)**, `variant`, `size`, `disabled?` |
| `Link` | Navigation | `href`, `external?`, `underline?: 'always'\|'hover'` |
| `Input` | Single-line text | `id`, `label`, `hint?`, `error?`, `required?`, `inputMode?`, `autoComplete?` |
| `Textarea` | Multi-line | as `Input` + `rows`, `maxLength` |
| `Select` | Native select | `id`, `label`, `options: {value,label}[]`, `error?` |
| `Stepper` | Guest count | `value`, `onChange`, `min`, `max`, `label` |
| `Checkbox` / `Radio` / `Switch` | Boolean and choice | `id`, `label`, `checked`, `onChange`, `error?` |
| `FormField` | Label + control + hint + error wrapper | `id`, `label`, `hint?`, `error?`, `required?` |
| `FieldError` | One error, wired to `aria-describedby` | `id`, `children` |

`Button` has no `type="submit"` default — it is set explicitly at each call site. A button that
submits a form nobody expected is the most common form bug in this kind of app.

### 5.2 Layout

| Component | Purpose | Key props |
|---|---|---|
| `Container` | Max-width + gutters | `size: 'prose'\|'default'\|'wide'\|'full'` |
| `Stack` | Vertical rhythm | `gap: keyof space`, `align?`, `as?` |
| `Row` | Horizontal, wraps | `gap`, `align?`, `justify?`, `wrap?` |
| `Section` | Page section + vertical padding | `tone: 'base'\|'sunken'\|'inverse'`, `divider?: boolean` |
| **`PaneBand`** | **Signature divider** | `cells?: number = 12`, `height?: 'sm'\|'md'`, `animate?: boolean` |
| **`PaneGrid`** | **Signature reveal/layout grid** | `cols`, `rows`, `stagger?: number = 70`, `children` |

### 5.3 Content

| Component | Purpose | Key props |
|---|---|---|
| `Heading` | Semantic + visual level decoupled | `level: 1-6`, `size?: keyof font.size`, `family?: 'display'\|'body'` |
| `Text` | Body copy | `size?`, `tone?: 'primary'\|'secondary'\|'tertiary'`, `as?` |
| `Prose` | Renders owner-authored **Markdown** | `markdown` — **never `html`.** Raw HTML is rejected when the page is saved (spec C7), so nothing arriving here can contain markup |
| **`MarkdownEditor`** | Owner-authored Markdown input — the write side of `Prose` | `value`, `onChange`, `toolbar` (headings, bold, italic, lists, links). Rejects pasted raw HTML as a first line; **the server rejection is the gate** (FR-045a). Shared by the content editor and the settings screen — never reimplemented per route |
| **`Image`** | **The performance workhorse** | `src`, `alt` **(required)**, `sizes`, `aspect`, `priority?`, `placeholder?: 'blur'\|'none'`, `fit?` |
| `Gallery` | Categorised pane grid | `items: GalleryItem[]`, `category?`, `columns?` |
| `Lightbox` | Full-screen viewer | `items`, `index`, `onClose`, `onIndexChange` |
| `Card` | Generic surface | `elevation?: 'flat'\|'raised'`, `interactive?` |
| `RoomCard` | Room type summary | `roomType`, `nightlyRate`, `available?`, `onSelect` |
| `StatusBadge` | Booking state | `state: BookingState`, `size?` — renders **icon + text**, never colour alone |
| `PriceTag` | Money, tabular figures | `amount`, `currency = 'PHP'`, `suffix?: 'per night'` |
| **`Logo`** | Logo with wordmark fallback (§3.5) | `variant: 'primary'\|'inverse'\|'mark'`, `height`, `linkToHome?` — falls back to the wordmark on its own, callers never branch |

**`Prose` must never grow an `html` escape hatch.** The entire safety argument for it is that raw HTML
was refused at save time, so there is no sanitiser here and no sanitiser to keep patched. A single
`dangerouslySetInnerHTML` added later "just for one page" reinstates stored XSS — and per §2.3 of the
security baseline, that means the owner's session, which is the only account there is. The Markdown
renderer must be configured with raw HTML passthrough disabled as a second line of defence.

**`Image` is the most important component in the system.** Principle VII makes the image pipeline a
core requirement, and every gallery-heavy page's performance is decided by whether this component is
used consistently or bypassed "just this once." It owns: AVIF → WebP → JPEG `<source>` ordering,
`srcset` generation, `loading="lazy"` (except `priority`), `decoding="async"`, explicit
`width`/`height` to reserve layout, and the blur-up placeholder. **`alt` is a required prop with no
default** — see §11.3, which turns this into a database requirement.

### 5.4 Feedback — the four states

| Component | Purpose | Key props |
|---|---|---|
| `Skeleton` | Loading placeholder matching final layout | `variant: 'text'\|'block'\|'card'\|'row'`, `count?` |
| `Spinner` | In-action only, never page-level | `size?`, `label?` |
| `EmptyState` | Nothing here yet | `title`, `body`, `action?`, `illustration?` |
| `ErrorState` | Something failed | `title`, `body`, `onRetry?`, `supportContact?` |
| `InlineAlert` | In-context notice | `tone: 'info'\|'success'\|'warning'\|'danger'`, `title?`, `children` |
| `Toast` | Transient confirmation | `tone`, `message`, `duration = 5000` |
| `RateLimitNotice` | Too many attempts | `retryAfterMinutes`, `fallbackContact` |
| `LockoutNotice` | Auth lockout | `retryAfterMinutes` |

### 5.5 Booking flow

| Component | Purpose | Key props |
|---|---|---|
| `AvailabilitySearch` | Hero search | `defaultCheckIn?`, `defaultCheckOut?`, `defaultGuests?`, `onSearch` |
| `DateRangeField` | Check-in/out | `value`, `onChange`, `minDate`, `maxNights = 30`, `blockedRanges` |
| `BookingSummary` | What you're reserving | `roomType`, `range`, `guests`, `guidanceAmount?` |
| `QRPaymentPanel` | Owner's QR + instructions | `qrImageUrl`, `guidanceText`, `resortName` |
| `ReferenceInput` | Reference entry | `value`, `onChange`, `pattern`, `maxLength = 40` — **mono, uppercased** |
| **`HoldTimer`** | Countdown on the hold | `expiresAt`, `onExpire`, `warnAtMinutes = 5` |
| `BookingStatusTracker` | Guest-facing progress | `state: BookingState`, `submittedAt?`, `verifiedAt?` |

**`HoldTimer` has a Principle VI constraint that will otherwise be discovered late.** The obvious
design is an SVG ring counting down, which animates `stroke-dashoffset` — **not** a transform or an
opacity, and therefore forbidden. Use a **horizontal bar driven by `scaleX` with
`transform-origin: left`**, which is compliant, cheaper, and reads more clearly on a narrow phone
anyway. Under reduced motion the bar does not animate continuously; it re-renders at 30-second
granularity with the numeric time remaining as the primary signal.

### 5.6 Navigation and admin

| Component | Purpose | Key props |
|---|---|---|
| `SiteHeader` | Guest header | `sticky?` — **`transparent` is derived from whether `logo_inverse` exists (§3.5), not passed in** |
| `MobileNav` | Drawer | `open`, `onClose`, `items` |
| `SiteFooter` | Contact, policies, business identity | `resort`, `policies` |
| `AdminShell` | Admin frame: sidebar + header + content | `nav`, `user`, `children` |
| `DataTable` | Admin lists | `columns`, `rows`, `loading`, `empty`, `error`, `onRowClick`, `sort`, `pagination` |
| `FilterBar` | Table filters | `filters`, `values`, `onChange`, `onClear` |
| `FormPanel` | Admin create/edit | `title`, `onSubmit`, `onCancel`, `dirty`, `submitting` |
| `ConfirmDialog` | Destructive confirmation | `title`, `body`, `confirmLabel`, `tone`, `onConfirm` |
| `ImageUploader` | Gallery upload | `bucket`, `accept`, `maxSizeMB = 10`, `onUploaded`, **`requireAltText: true`** |
| **`BrandColorPicker`** | Owner sets primary / secondary (§3.4) | `role: 'primary'\|'secondary'`, `value`, `onChange`, `contrastAgainst`, `minRatio`, `presets` |
| `BrandPreview` | Live preview of colour and logo | `branding`, `surfaces: ('header'\|'button'\|'link'\|'badge'\|'paneBand'\|'shareCard')[]` |
| **`LogoUploader`** | The four image slots (§3.5) | `slot: 'wide'\|'inverse'\|'mark'\|'og'`, `value`, `onUploaded`, `accept = 'image/png,image/webp'`, `maxSizeMB = 2`, `requireAlt` *(wide only)* |
| `AvailabilityCalendar` | Month grid, blocks and bookings | `month`, `blocks`, `bookings`, `onBlockToggle` |
| `VerifyPaymentForm` | The owner's core daily action | `booking`, `onVerify(amountReceived, note)`, `onReject` |

`DataTable` takes `loading`, `empty`, **and** `error` as first-class props rather than leaving them
to each caller. Principle IX requires all four states everywhere; making them props means the
compiler asks for them.

---

## 6. The four states, with actual copy

Copy is design material here, not filler — these strings ship. Voice: plain, active, sentence case.
Errors explain what happened and what to do; they do not apologise. Empty states are invitations.

### 6.1 Guest surfaces

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Availability results | Skeleton room cards ×3 | "No rooms open for those dates. Try shifting a night either way." + date suggestions | "We couldn't check availability just now. Try again in a moment." + Retry | Room cards with rates |
| Room detail gallery | Blur-up placeholders in pane grid | "Photos coming soon." | "Some photos didn't load." + Retry | Full gallery |
| Booking hold | Button spinner, "Holding your room…" | — | **"Those dates were taken while you were booking. Here's what's still open for {dates}."** | "Room held for 30 minutes. Pay below and enter your reference to confirm." |
| Reference submission | Button spinner | — | "That reference doesn't look right. Check the number in your banking app and try again." | "Reference received. {{RESORT}} will confirm once they've checked the payment — usually within {{VERIFY_HOURS}} hours." |
| Booking lookup | Skeleton | "No booking found with that reference and email." | "We couldn't look that up right now. Try again shortly." | Status tracker |
| Enquiry form | Button spinner | — | "Your message didn't send. Try again, or call us at {{PHONE}}." | "Message sent. We usually reply within a day." |

The booking-hold error is the user-facing face of the race condition in Principle III. It will
happen — two guests, same room, same dates, seconds apart — and the design decision is that it
**offers alternatives rather than dead-ending**. A generic "something went wrong" here loses a
booking that was still winnable.

### 6.2 Admin surfaces

| Surface | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Bookings list | Skeleton rows ×5 | "No bookings yet. When a guest reserves, it appears here." | "Couldn't load bookings." + Retry | Table |
| Room types | Skeleton cards | "No room types yet. Add your first room to start taking bookings." + **Add room type** | "Couldn't load room types." + Retry | Cards |
| Gallery | Skeleton pane grid | **"No photos yet. Guests decide from photos — add at least six."** + Upload | "Couldn't load the gallery." + Retry | Pane grid |
| Availability calendar | Skeleton month | Month with no blocks (normal, not empty) | "Couldn't load the calendar." + Retry | Month grid |
| Verify payment | Button spinner | — | "Couldn't save that. Check your connection and try again." | Toast: "Booking confirmed. The guest has been emailed." |
| Content page editor | Skeleton | "Nothing written yet." | "Couldn't save. Your text is still here — try again." | Toast: "Page saved." |
| **Branding — colour** | Skeleton swatches | Seeded, never empty | **"That colour is too light for white text to read on. Try a deeper shade — the preview shows what guests will see."** | Toast: "Brand colours updated." |
| **Branding — logo** | Skeleton | "No logo yet. Your resort name is shown instead — that's fine, and you can add a logo any time." | "That file won't work. Upload a PNG with a transparent background — if your designer sent an SVG, ask them for a PNG at 1000 pixels wide." | Toast: "Logo updated." |

The gallery empty state does a second job: it tells a non-technical owner *why* the task matters and
*how many* is enough. "No photos yet" alone gets a resort launched with two.

The editor error keeps a promise — it says the text is still there, so it must actually be true.
Don't clear the form on a failed save.

### 6.3 Lockout and rate-limit messaging

Numbers come from security baseline §2.5. Every message gives a wait time and a human fallback.

| Trigger | Component | Copy |
|---|---|---|
| Admin sign-in, 5 fails / 5 min | `LockoutNotice` | "Too many sign-in attempts. Try again in 5 minutes." |
| Password reset request, 3 / hour | `RateLimitNotice` | "Too many reset requests. Try again in an hour." |
| **Password reset, any outcome** | `InlineAlert info` | **"If that address has an account, a reset link is on its way."** |
| Enquiry form, 3 / hour | `RateLimitNotice` | "You've sent a few messages already. Try again in an hour, or call us at {{PHONE}}." |
| Booking hold, 5 / hour | `RateLimitNotice` | "You've started several bookings recently. Try again in an hour, or call us at {{PHONE}}." |
| Reference lookup, 10 / hour | `RateLimitNotice` | "Too many lookups. Try again in an hour, or email {{EMAIL}} with your reference." |
| Upload, 20 / hour | `InlineAlert warning` | "Upload limit reached for this hour. Your existing photos are unaffected." |

The password-reset string is identical for a known and an unknown address, by design — security
baseline §2.4 requires enumeration protection, and the interface is where that requirement is either
honoured or quietly broken. **It must also return in the same time**, which is a backend concern
this copy depends on.

Rate-limit messages never say "you have been blocked" or name a threshold. They give a wait and a
way through.

---

## 7. Motion

**Constraint from Principle VI: `transform` and `opacity` only.** Every variant below obeys it; none
is a judgement call at implementation time.

```tsx
// src/motion/config.tsx
import { MotionConfig } from 'framer-motion';
// reducedMotion="user" makes Framer drop transform animations and keep opacity automatically.
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```

```ts
// src/motion/variants.ts
export const ease = {
  standard: [0.2, 0, 0, 1],
  entrance: [0.22, 1, 0.36, 1],
  exit:     [0.4, 0, 1, 1],
  emphasis: [0.34, 1.26, 0.64, 1],
} as const;

/** SIGNATURE — capiz panes light up in sequence. Opacity only. */
export const paneReveal = {
  hidden:  { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.44, delay: i * 0.07, ease: ease.entrance },
  }),
};

/** Section content arriving on scroll. */
export const sectionReveal = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: ease.entrance } },
};

export const staggerParent = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

/** Route change. Short — this is between the guest and what they came for. */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease: ease.entrance } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.16, ease: ease.exit } },
};

export const cardHover = {
  rest:  { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: ease.standard } },
  tap:   { scale: 0.985, transition: { duration: 0.12, ease: ease.standard } },
};

export const pressable = {
  whileHover: { scale: 1.015 },
  whileTap:   { scale: 0.97 },
  transition: { duration: 0.12, ease: ease.standard },
};

/** Image arrival. Scale masks placeholder→full swap; never animate `filter`. */
export const blurUp = {
  hidden:  { opacity: 0, scale: 1.04 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: ease.entrance } },
};

/** Mobile booking sheet. */
export const sheetUp = {
  hidden:  { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: 0,      transition: { duration: 0.32, ease: ease.entrance } },
  exit:    { opacity: 0, y: '100%', transition: { duration: 0.2,  ease: ease.exit } },
};

export const overlayFade = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: ease.standard } },
};

export const toastEnter = {
  hidden:  { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.24, ease: ease.emphasis } },
  exit:    { opacity: 0, y: 8,  transition: { duration: 0.16, ease: ease.exit } },
};

/** PaneBand draw-in. scaleX from left — a transform, not a width. */
export const bandDraw = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.64, ease: ease.entrance } },
};

/** Skeletons. Opacity loop only. */
export const skeletonPulse = {
  animate: {
    opacity: [0.45, 0.85, 0.45],
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
};
```

**Orchestration, not scatter.** There is exactly one composed moment: the hero load sequence —
panes light 4×2 over ~560ms, then the headline arrives, then the pane band draws, then the search
card. Everything after that is quiet: `sectionReveal` on scroll, `pressable` on controls, and
nothing else. Extra animation is what makes a page feel machine-made.

**Reduced motion.** `MotionConfig reducedMotion="user"` handles the DOM automatically. Two things it
does not cover, which must be handled by hand: **Lenis must be destroyed** (§8), and
**`HoldTimer` must stop its continuous bar** (§5.5). Both are explicit implementation tasks, not
side effects.

---

## 8. Scroll behaviour

```ts
// src/scroll/lenis.ts
export const lenisOptions = {
  duration: 1.1,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  syncTouch: false,   // see below
  wheelMultiplier: 1,
  gestureOrientation: 'vertical',
} as const;
```

**Lenis is OFF in three cases, and each is a deliberate decision:**

1. **`prefers-reduced-motion: reduce`** — destroyed entirely, not shortened. Principle VI states
   this explicitly. Call `lenis.destroy()` and never construct it; do not merely set `duration: 0`,
   which leaves the wheel handler installed and still intercepting.
2. **Touch-primary devices** (`syncTouch: false`) — smoothed touch scrolling fights native momentum,
   and on a mid-range Android it reads as *lag*, not polish. Under Principle VII, mobile perception
   wins over desktop refinement.
3. **All `/admin` routes** — the admin is a tool. Nobody wants their bookings table to glide. It also
   makes long tables feel slower to reach, which is the opposite of the daily-triage job.

So in practice Lenis runs on **desktop guest marketing pages only**. That is a small surface, and
worth it there.

### 8.1 `position: sticky` — flagged deliberately

Lenis v1 scrolls the window by default, so sticky generally survives. **It breaks when Lenis is
given a custom `wrapper`/`content` element that carries a transform** — a transformed ancestor
becomes the containing block and sticky silently stops sticking. It fails quietly, looks like a
CSS bug, and costs an afternoon.

Rules:

- Use default window scrolling. Do not wrap the app in a transformed Lenis container.
- Every `position: sticky` element is **verified with Lenis active** before its story is complete —
  it goes on the loose-ends sweep (chain doc §1.10 already lists it).
- Sticky elements in this system: `SiteHeader` (sticky variant), the desktop booking summary rail,
  and the pinned hero's inner layer.

### 8.2 The one pinned scene

**Desktop only, hero only, one per site.** Pinned scenes are expensive to get right and each one is
a place the page can jank.

| Property | Value |
|---|---|
| Outer wrapper height | **220vh** — this sets the pacing; 100vh of scroll travel maps to the full effect, with 20vh of settle |
| Inner layer | `position: sticky; top: 0; height: 100vh` |
| Progress source | `useScroll({ target, offset: ['start start', 'end start'] })` |
| Hero image | `scale` 1 → 1.06 across progress 0 → 1 |
| Scrim | `opacity` 0 → 0.55 across 0 → 0.7 |
| Headline | `y` 0 → -40px, `opacity` 1 → 0 across 0.15 → 0.6 |
| Pane grid | `opacity` 1 → 0 across 0 → 0.35 (panes dissolve, photo takes over) |

All four animated properties are transform or opacity. Under reduced motion the wrapper collapses to
`height: 100vh`, the sticky layer becomes static, and nothing animates.

**Mobile has no pinned scene at all.** The hero is a static 78vh image with the pane reveal on load.
220vh of scroll before content on a phone is a bounce.

---

## 9. 3D scene specification

**The 3D layer is OFF. No scene is specified, and none may be built.**

Constitution VI: Three.js, React Three Fiber, drei, and postprocessing MUST NOT be installed or
imported unless a plan explicitly enables them. No plan exists. The prompt's §9 is conditional on the
layer being on; it is not.

**The configurable hero baseline (brief §4.5) is not the 3D layer.** Three treatments ship, selected
by config:

| Treatment | Implementation | Notes |
|---|---|---|
| `image` | `Image` + `paneReveal` | Default. Cheapest, works everywhere |
| `video` | Muted, looped, `playsinline`, poster frame | Desktop autoplays; **mobile shows the poster and requires a tap** — autoplaying video on metered mobile data is hostile |
| `depthParallax` | **2–3 layered images, CSS transforms** | **DOM, not WebGL** |

`depthParallax` moves layered cut-out images at different rates using `translate3d` driven by scroll
progress. It is transform-only, needs no library, and **does not engage the 3D layer** — the name is
about the visual effect, not the rendering technology. Worth stating plainly: a plan reading
"depth-parallax hero" must not conclude it needs R3F.

### If 3D is ever enabled

The enabling plan must state, before any code: **payload budget in MB**, the **mobile fallback
designed alongside** (never retrofitted), and these ceilings. ⚑ Numbers inferred as a starting
point for that conversation:

| Ceiling | Value |
|---|---|
| Total scene payload | ≤ 2.5 MB gzipped, Draco geometry + KTX2/Basis textures |
| Draw calls | ≤ 80 |
| Texture memory | ≤ 96 MB |
| Triangles | ≤ 150k |
| Target | 60fps desktop / 30fps floor on a mid-range Android |
| Fallback switch | No WebGL2, `deviceMemory < 4`, or `hardwareConcurrency < 4` → `image` hero |

**The admin remains permanently excluded** under Principle VI regardless of any plan.

The `r3f-best-practices` and `three-best-practices` skills are installed and will trigger on that
work — but they should not fire during MVP implementation, because none of it is 3D.

---

## 10. Mobile versus desktop

Mobile is the design target; desktop is the enhancement (Principle VII).

| Area | Mobile (< 768px) | Desktop (≥ 1024px) |
|---|---|---|
| Hero | 78vh static, pane reveal on load | 100vh pinned, 220vh wrapper (§8.2) |
| Availability search | Card below hero; opens a full-screen sheet on tap | Inline horizontal bar in the hero |
| Navigation | Hamburger → `MobileNav` drawer | Inline links in `SiteHeader` |
| Date picker | One month, full-screen sheet | Two months side by side, popover |
| Gallery | 2-column pane grid, tap → `Lightbox` | 4-column pane grid with 2×2 spans, hover → `cardHover` |
| Room detail | Stacked; sticky "Check availability" bar at the bottom | Two columns; sticky booking rail on the right |
| Booking flow | Full-screen sheets, one step per screen | Inline panel, all steps visible |
| Lenis | **Off** (§8) | On |
| Pinned scenes | **None** | One |
| Image sizes | 480 / 768 wide | 1024 / 1440 / 1920 wide |
| Typography | Bottom of every `clamp()` | Top of every `clamp()` |
| Touch targets | 44px minimum, `space.md` between | 32px acceptable |

### 10.1 The admin, specifically

The owner's usage splits cleanly and the design should follow it (brief §3: checks bookings daily,
adjusts rates seasonally):

- **Mobile admin is for daily triage** — see today's bookings, open one, verify a payment, block a
  date. These are optimised: large tap targets, `VerifyPaymentForm` reachable in two taps from the
  bookings list, no horizontal scrolling in `DataTable` (it becomes stacked cards below 768px).
- **Desktop admin is for the seasonal sit-down** — rate tables, bulk gallery upload, editing content
  pages.

**Every CRUD operation remains available at every viewport** — Principle IX is about the system, not
the screen. Complex forms on mobile open as full-screen sheets rather than cramped inline layouts.
Nothing is desktop-only; some things are merely desktop-*pleasant*.

---

## 11. Accessibility baseline

### 11.1 Contrast

Targets: **4.5:1** for body text, **3:1** for large text (≥ 24px or ≥ 19px bold) and for UI
component boundaries and focus indicators.

| Pair | Values | Required |
|---|---|---|
| `content.primary` on `surface.base` | `#151A18` on `#F4F6F4` | 4.5:1 — comfortable |
| `content.secondary` on `surface.base` | `#4A5551` on `#F4F6F4` | 4.5:1 |
| **`content.tertiary` on `surface.base`** | `#6B7671` on `#F4F6F4` | **Marginal — restricted to large text and non-essential content. Never a form hint, never an error.** |
| **`brand.onPrimary` on `brand.primary`** | seed `#FFFFFF` on `#0A4E58` | 4.5:1 — **enforced on save**, §3.4 |
| **`brand.primaryText` on `surface.base`** | seed `#0A4E58` on `#F4F6F4` | 4.5:1 — **derived to guarantee it**, §3.4 |
| **`brand.primary` on `surface.base`** | seed `#0A4E58` on `#F4F6F4` | 3:1 — **enforced on save** (button edges) |
| **`brand.onSecondary` on `brand.secondary`** | seed `#151A18` on `#C9DCD4` | 4.5:1 — **enforced on save** |
| `content.inverse` on `surface.inverse` | `#F4F6F4` on `#151A18` | 4.5:1 |
| Every `booking.*Fg` on its `*Bg` | see §3.1 | 4.5:1 |
| `border.focus` on `surface.base` | `#0A4E58` on `#F4F6F4` | 3:1 |
| Text over photography | `content.inverse` over `surface.scrim` | 4.5:1 **at the scrim's minimum opacity** |

**These are design targets, not measured results.** ⚑ I selected the values to clear the thresholds
but have not run a contrast checker on every pair. **Add an automated contrast assertion over the
token pairs above to CI** — it runs in milliseconds and it is the only way this stays true after
someone nudges a hex six months from now. The `content.tertiary` restriction exists precisely
because that pair is the one closest to the line.

**The last row is the one that will actually fail.** Hero and gallery captions sit on photographs,
where the effective background is whatever the image happens to be. Verify against the *lightest*
plausible photograph, not a mid-grey — a white-sand noon shot is the worst case and it is also the
most likely hero image a resort will supply.

**The static pairs are a CI assertion. The brand pairs are a runtime gate.** Because brand colour is
owner-editable data (§3.4), no build-time check can protect it — the failing value gets entered
eighteen months after launch by someone who liked how it looked. The four brand rows above are
enforced by the Edge Function on write, and the admin picker shows the live ratio as the owner
drags. **Contrast is a save-time validation in this product, not a design review.**

### 11.2 Keyboard

- Visible focus on every interactive element: `shadow.focus` (3px ring, `brand.primaryText` at 32%) plus a
  1px `border.focus` edge. **Never `outline: none` without a replacement** — the ring is a token so
  there is no reason to invent one.
- Skip link to `#main`, first in tab order, visible on focus.
- Logical tab order follows DOM order. No positive `tabindex`.
- `MobileNav`, `Lightbox`, `ConfirmDialog`, and all sheets: focus trapped while open, focus returned
  to the trigger on close, `Escape` closes.
- `DateRangeField`: arrow keys move by day, `PageUp`/`PageDown` by month, `Enter` selects,
  `Escape` closes. It must be operable without a pointer — it is the gate to the entire booking flow.
- `DataTable` rows that are clickable are `<button>` or `<a>`, not a `<tr>` with an `onClick`.

### 11.3 Screen readers — and the database consequence

- **`Image` requires `alt` with no default.** Decorative images pass `alt=""` explicitly.
- **The logo's alt defaults to the resort name and is never blank** (§3.5). A logo is the site's
  identity, not decoration — `alt=""` on it leaves a screen-reader user with an unnamed page. When
  the wordmark fallback renders, it is real text and needs no alt at all.
- **Therefore alt text must be a column in the gallery and room-image tables, and a required field
  in `ImageUploader`.** This is the finding in this section that reaches furthest: if Phase 1.1 does
  not spec an alt-text field, the owner has no way to supply one and every property image ships
  unlabelled. **Add `alt_text` to the image entities in the spec.**
- The capiz pane overlay is decorative: `aria-hidden="true"`, not focusable.
- `StatusBadge` renders icon **and** text. Booking state is never conveyed by colour alone.
- `HoldTimer` is `aria-live="polite"`, announcing at 5 minutes and 1 minute only — not every second.
- Form errors: `aria-describedby` → `FieldError`, `aria-invalid` on the control, and focus moves to
  the first invalid field on submit.
- Toasts: `role="status"` for success, `role="alert"` for errors.
- Every `IconButton` has a required `label`.
- Page `<title>` and a single `<h1>` per route.
- Language: `<html lang="en">` — the MVP is English-only, multi-language is deferred (brief §8).

### 11.4 Reduced motion

Under `prefers-reduced-motion: reduce`:

| Element | Behaviour |
|---|---|
| All Framer variants | `MotionConfig reducedMotion="user"` — transforms dropped, opacity kept |
| Capiz pane reveal | Panes are already visible. No stagger |
| Lenis | **Destroyed, not shortened** (§8) |
| Pinned hero | Wrapper collapses to 100vh; static |
| `HoldTimer` bar | No continuous animation; 30-second re-render, number is the signal |
| `Skeleton` pulse | Static at 0.6 opacity |
| Toasts, sheets | Appear and disappear without translation |
| Autoplay video hero | Does not autoplay. Poster + play control |

The last row matters: a video hero that ignores reduced motion is the largest possible violation of
it, and it is easy to miss because the video element does the animating rather than the CSS.

---

## 12. What Phase 1.1 must carry forward

Four things in this document create spec requirements that would otherwise be discovered late:

1. **`site_branding` is an entity with full CRUD** (§3.4, §3.5) — a singleton row, public-read via
   RLS-P1, admin-write, carrying two owner-set colours, ten derived colour columns, and five image
   fields. Derivation and favicon generation run in an Edge Function on write. It is the mechanism
   by which brand identity is data rather than code, and it does not exist unless the spec says so.
   **Delete, for a singleton, means reset-to-seed rather than drop the row** — state that explicitly
   or Principle IX's CRUD table gets an awkward blank.
2. **Contrast validation is a server-side write gate, not a design review** (§3.4, §11.1) — the
   Edge Function rejects a primary that cannot carry readable text, with an owner-legible reason.
   This is the only thing standing between a non-technical owner and an unreadable site.
3. **`alt_text` is a required field on every image entity** (§11.3) — otherwise the product cannot be
   made accessible after the fact.
4. **`HoldTimer` uses a `scaleX` bar, not an SVG ring** (§5.5) — otherwise the natural implementation
   violates Principle VI.
5. **Every `position: sticky` element is verified with Lenis active** (§8.1) — otherwise it fails
   silently and looks like a CSS bug.
6. **Contrast of caption text over photography is verified against a white-sand image** (§11.1) —
   the one contrast pair with no fixed background.
7. **`assignInlineVars` is banned; use `setElementVars`** (§3.3) — the former emits a `style=""`
   attribute that `style-src 'self'` blocks, and the failure is silent.
8. **Logo re-encoding must preserve alpha** (§3.5) — the security baseline's re-encode rule, applied
   naively, flattens transparency and puts a white box behind every logo.
9. **`og_image` is a first-class field, not a nicety** (§3.5) — the brief's own premise is that these
   resorts live on Facebook, so a shared link *is* the primary impression.

One requirement was **removed** by the single-theme decision: with no theme resolution needed before
first paint, there is no inline theme-bootstrap script, and therefore no need to hash-allowlist one
in the CSP. `script-src 'self'` stands with nothing appended, and security baseline §4.5 needs no
amendment.

---

**Design system version**: 1.0.0 | **Date**: 2026-07-31 | **Constitution**: v1.1.0
