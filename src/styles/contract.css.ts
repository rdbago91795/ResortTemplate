import { createThemeContract } from '@vanilla-extract/css';

/**
 * The theme contract — design-system.md §3.
 *
 * Constitution Principle V binds every later phase to these names. A wrong name fails
 * `pnpm build` rather than rendering something subtly off, which is the entire point of
 * the typed contract.
 *
 * TWO GROUPS, and the distinction matters:
 *
 *   `color.brand.*` and `color.pane.*` are DYNAMIC — assigned at runtime from the database
 *   via `setElementVars` (src/brand/applyBranding.ts). The owner sets primary and secondary;
 *   the rest are derived server-side with contrast enforced before the write.
 *
 *   Everything else is STATIC, defined in the theme file. Surfaces, content, borders, status,
 *   and booking colours are deliberately NOT owner-editable — they are what the contrast
 *   guarantees rest on, and green-means-confirmed is functional semantics rather than brand.
 *
 * NOT IN THIS CONTRACT: breakpoints. CSS custom properties do not work inside media query
 * conditions — a token there silently never matches. See ./breakpoints.ts.
 */
export const vars = createThemeContract({
  color: {
    // ── DYNAMIC: assigned at runtime from site_branding ──────────────────────
    brand: {
      primary: null,
      primaryHover: null,
      primaryActive: null,
      /** Contrast-safe on surface.base. Links, focus rings — never `primary` for text. */
      primaryText: null,
      primarySubtle: null,
      onPrimary: null,
      onPrimarySubtle: null,
      secondary: null,
      secondarySubtle: null,
      onSecondary: null,
    },
    /** Derived from brand.secondary — the capiz signature. */
    pane: {
      fill: null,
      edge: null,
      glow: null,
    },

    // ── STATIC: theme file only ──────────────────────────────────────────────
    surface: {
      base: null,
      raised: null,
      sunken: null,
      overlay: null,
      inverse: null,
      scrim: null,
    },
    content: {
      primary: null,
      secondary: null,
      /** Large text and non-essential content only — marginal contrast by design. */
      tertiary: null,
      inverse: null,
    },
    border: {
      subtle: null,
      default: null,
      strong: null,
      focus: null,
    },
    status: {
      successFg: null,
      successBg: null,
      warningFg: null,
      warningBg: null,
      dangerFg: null,
      dangerBg: null,
      infoFg: null,
      infoBg: null,
    },
    /**
     * Booking state colours are tokens, not per-component choices. The five states appear
     * in the admin table, the admin detail panel, and the guest status tracker; left to each
     * surface they drift, and drift on a state machine that governs money is a support call.
     */
    booking: {
      heldFg: null,
      heldBg: null,
      awaitingFg: null,
      awaitingBg: null,
      confirmedFg: null,
      confirmedBg: null,
      cancelledFg: null,
      cancelledBg: null,
      expiredFg: null,
      expiredBg: null,
    },
  },

  /** 4px base. Named xxs…huge rather than 2xs…4xl so every token is reachable by dot access. */
  space: {
    none: null,
    xxs: null,
    xs: null,
    sm: null,
    md: null,
    lg: null,
    xl: null,
    xxl: null,
    xxxl: null,
    huge: null,
  },

  radius: {
    none: null,
    sm: null,
    md: null,
    lg: null,
    pill: null,
    circle: null,
  },

  font: {
    family: {
      display: null,
      body: null,
      mono: null,
    },
    size: {
      caption: null,
      small: null,
      body: null,
      lead: null,
      h4: null,
      h3: null,
      h2: null,
      h1: null,
      display: null,
    },
    weight: {
      regular: null,
      medium: null,
      semibold: null,
      bold: null,
    },
    lineHeight: {
      tight: null,
      snug: null,
      normal: null,
      relaxed: null,
    },
    tracking: {
      tight: null,
      normal: null,
      wide: null,
    },
    /** Archivo's `wdth` axis. Expanded at hero echoes the ventanilla's horizontal banding. */
    width: {
      normal: null,
      expanded: null,
    },
  },

  shadow: {
    none: null,
    sm: null,
    md: null,
    lg: null,
    focus: null,
  },

  zIndex: {
    base: null,
    sticky: null,
    header: null,
    overlay: null,
    modal: null,
    toast: null,
  },

  duration: {
    instant: null,
    fast: null,
    base: null,
    slow: null,
    slower: null,
    scene: null,
  },

  easing: {
    standard: null,
    entrance: null,
    exit: null,
    emphasis: null,
  },

  size: {
    touchTarget: null,
    headerHeight: null,
    containerMax: null,
    proseMax: null,
  },
});
