import { setElementVars } from '@vanilla-extract/dynamic';
import { vars } from '../styles/contract.css';

/**
 * The colour half of `site_branding`. Shape matches the table (migration 0005) exactly, so a
 * row can be handed straight in.
 */
export type Branding = {
  primary_hex: string;
  primary_hover_hex: string;
  primary_active_hex: string;
  primary_text_hex: string;
  primary_subtle_hex: string;
  on_primary_hex: string;
  on_primary_subtle_hex: string;
  secondary_hex: string;
  secondary_subtle_hex: string;
  on_secondary_hex: string;
};

/**
 * ══════════════════════════════════════════════════════════════════════════════════
 * `setElementVars`, NEVER `assignInlineVars` — constitution IX, design-system §3.4.
 * ══════════════════════════════════════════════════════════════════════════════════
 *
 * The two look interchangeable and are not:
 *
 *   `assignInlineVars` returns an object destined for React's `style` prop, which renders as
 *   a `style="..."` ATTRIBUTE. A `style-src 'self'` policy with no `'unsafe-inline'` blocks
 *   style attributes, so every brand variable silently resolves to nothing. The failure looks
 *   like "the colours are wrong" rather than "the CSP blocked something", and it does not
 *   reproduce in dev where the CSP header is usually absent.
 *
 *   `setElementVars` sets the same custom properties through the CSSOM
 *   (`element.style.setProperty`), which is a script action, not a parsed style attribute.
 *   `style-src` does not apply. Same result, and it survives the policy.
 *
 * `eslint.config.js` bans the `assignInlineVars` import repo-wide, because this is exactly the
 * kind of substitution that looks harmless in review.
 *
 * ── Why these values are not tokens ──────────────────────────────────────────
 *
 * The brand colours are DATA (the owner sets them; the product is deployed per client), so
 * they cannot live in the theme file. Everything else — surfaces, content, borders, status,
 * booking states — stays static, because those are what the contrast guarantees rest on and
 * green-means-confirmed is functional semantics rather than brand.
 *
 * ── Where the derived shades come from ───────────────────────────────────────
 *
 * All ten arrive already computed. The owner picks primary and secondary; hover, active,
 * subtle, and the on-* pairs are derived SERVER-SIDE with contrast enforced before the write
 * (the `save-branding` Edge Function). Deriving them here would put the contrast guarantee in
 * the client, where it can be skipped by writing to the table directly.
 */
export function applyBranding(branding: Branding, element: HTMLElement = document.documentElement) {
  setElementVars(element, {
    [vars.color.brand.primary]: branding.primary_hex,
    [vars.color.brand.primaryHover]: branding.primary_hover_hex,
    [vars.color.brand.primaryActive]: branding.primary_active_hex,
    [vars.color.brand.primaryText]: branding.primary_text_hex,
    [vars.color.brand.primarySubtle]: branding.primary_subtle_hex,
    [vars.color.brand.onPrimary]: branding.on_primary_hex,
    [vars.color.brand.onPrimarySubtle]: branding.on_primary_subtle_hex,
    [vars.color.brand.secondary]: branding.secondary_hex,
    [vars.color.brand.secondarySubtle]: branding.secondary_subtle_hex,
    [vars.color.brand.onSecondary]: branding.on_secondary_hex,

    // The capiz signature is derived from secondary rather than stored separately: the pane
    // motif IS the secondary colour, and letting them drift apart would break the one visual
    // idea the design system says everything else hangs off (§0).
    [vars.color.pane.fill]: branding.secondary_subtle_hex,
    [vars.color.pane.edge]: branding.secondary_hex,
    [vars.color.pane.glow]: branding.primary_subtle_hex,
  });
}

/**
 * Renders the same custom properties as a CSS text block for the document `<head>`.
 *
 * Used to avoid the flash of unbranded colour: `applyBranding` runs after React mounts, so
 * the first paint would otherwise use whatever the contract falls back to. Injecting this as
 * a `<style>` ELEMENT is CSP-safe in a way a style ATTRIBUTE is not — `style-src 'self'`
 * permits stylesheets from the origin, and a server-rendered style element is one.
 *
 * If a nonce-based policy is used instead, the nonce goes on this element.
 */
export function brandingCss(branding: Branding): string {
  const declarations: string[] = [
    `${vars.color.brand.primary}:${branding.primary_hex}`,
    `${vars.color.brand.primaryHover}:${branding.primary_hover_hex}`,
    `${vars.color.brand.primaryActive}:${branding.primary_active_hex}`,
    `${vars.color.brand.primaryText}:${branding.primary_text_hex}`,
    `${vars.color.brand.primarySubtle}:${branding.primary_subtle_hex}`,
    `${vars.color.brand.onPrimary}:${branding.on_primary_hex}`,
    `${vars.color.brand.onPrimarySubtle}:${branding.on_primary_subtle_hex}`,
    `${vars.color.brand.secondary}:${branding.secondary_hex}`,
    `${vars.color.brand.secondarySubtle}:${branding.secondary_subtle_hex}`,
    `${vars.color.brand.onSecondary}:${branding.on_secondary_hex}`,
    `${vars.color.pane.fill}:${branding.secondary_subtle_hex}`,
    `${vars.color.pane.edge}:${branding.secondary_hex}`,
    `${vars.color.pane.glow}:${branding.primary_subtle_hex}`,
  ];

  return `:root{${declarations.join(';')}}`;
}

/**
 * Rejects anything that is not a 6-digit hex.
 *
 * The database already enforces this (`site_branding_*_hex_check` on all ten columns), so
 * this is not the gate — it is a guard against writing malformed CSS into the document if a
 * value ever arrives from somewhere unexpected. A bad value here would break the whole
 * declaration block, taking every colour after it with it.
 */
const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isValidBranding(branding: Branding): boolean {
  return Object.values(branding).every((value) => typeof value === 'string' && HEX.test(value));
}
