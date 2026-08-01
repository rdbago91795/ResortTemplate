import { createTheme } from '@vanilla-extract/css';
import { vars } from './contract.css';
import { fontFamily } from './fonts.css';

/**
 * The Balai Amihan theme — design-system.md §3.1 and §3.2.
 *
 * One theme file per deployment. Rebranding a client means writing another file that
 * satisfies the same contract: no component changes, no search-and-replace. That is
 * metric S2 made mechanical, and it is the reason the contract exists (Principle I).
 *
 * The `color.brand.*` and `color.pane.*` values below are the deployment's BAKED DEFAULTS.
 * First paint uses them, so there is no flash of unbranded content and no blocking fetch.
 * When the owner has changed a colour since the last deploy, `applyBranding` overrides them
 * at runtime — a single frame shift, not unbranded-to-branded.
 */
export const themeClass = createTheme(vars, {
  color: {
    // ── Baked brand defaults — overridden at runtime from site_branding ──────
    brand: {
      primary: '#0A4E58', // petrol teal: water with depth in it, not postcard turquoise
      primaryHover: '#073B43',
      primaryActive: '#052C32',
      primaryText: '#0A4E58',
      primarySubtle: '#DCE9E9',
      onPrimary: '#FFFFFF',
      onPrimarySubtle: '#073B43',
      secondary: '#C9DCD4', // capiz celadon
      secondarySubtle: '#EDF3F0',
      onSecondary: '#151A18',
    },
    pane: {
      fill: 'rgba(201, 220, 212, 0.28)',
      edge: 'rgba(255, 255, 255, 0.55)',
      glow: 'rgba(201, 220, 212, 0.55)',
    },

    // ── Static ───────────────────────────────────────────────────────────────
    surface: {
      base: '#F4F6F4', // cool shell white — light THROUGH shell, not parchment
      raised: '#FFFFFF',
      sunken: '#E6EBE7',
      overlay: 'rgba(21, 26, 24, 0.72)',
      inverse: '#151A18',
      scrim: 'rgba(21, 26, 24, 0.48)',
    },
    content: {
      primary: '#151A18',
      secondary: '#4A5551',
      tertiary: '#6B7671',
      inverse: '#F4F6F4',
    },
    border: {
      subtle: '#DFE5E1',
      default: '#C7D0CB',
      strong: '#97A29C',
      focus: '#0A4E58',
    },
    status: {
      successFg: '#1B6B3A',
      successBg: '#E3F1E8',
      warningFg: '#8A5A00',
      warningBg: '#FBF0DC',
      dangerFg: '#A32020',
      dangerBg: '#FBE6E6',
      infoFg: '#10527A',
      infoBg: '#E2EEF6',
    },
    booking: {
      heldFg: '#8A5A00', // amber — provisional
      heldBg: '#FBF0DC',
      awaitingFg: '#10527A', // blue — the owner is being asked to act
      awaitingBg: '#E2EEF6',
      confirmedFg: '#1B6B3A',
      confirmedBg: '#E3F1E8',
      cancelledFg: '#4A5551',
      cancelledBg: '#E6EBE7',
      expiredFg: '#6B7671',
      expiredBg: '#EFF2F0',
    },
  },

  space: {
    none: '0',
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
    huge: '96px',
  },

  // Tight by design: the ventanilla is a rectilinear grid and soft corners fight it.
  radius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    pill: '999px',
    circle: '50%',
  },

  font: {
    family: fontFamily,
    size: {
      caption: 'clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem)',
      small: 'clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem)',
      body: 'clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)',
      lead: 'clamp(1.125rem, 1.05rem + 0.35vw, 1.375rem)',
      h4: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
      h3: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
      h2: 'clamp(2rem, 1.6rem + 2vw, 3rem)',
      h1: 'clamp(2.5rem, 1.8rem + 3.5vw, 4.5rem)',
      display: 'clamp(3rem, 2rem + 6vw, 7rem)',
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.05',
      snug: '1.2',
      normal: '1.5',
      relaxed: '1.65',
    },
    tracking: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.06em',
    },
    width: {
      normal: '100',
      expanded: '125',
    },
  },

  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(21, 26, 24, 0.06)',
    md: '0 2px 8px rgba(21, 26, 24, 0.08)',
    lg: '0 8px 32px rgba(21, 26, 24, 0.12)',
    focus: '0 0 0 3px rgba(10, 78, 88, 0.32)',
  },

  zIndex: {
    base: '0',
    sticky: '10',
    header: '20',
    overlay: '30',
    modal: '40',
    toast: '50',
  },

  duration: {
    instant: '0ms',
    fast: '120ms',
    base: '200ms',
    slow: '320ms',
    slower: '480ms',
    scene: '800ms',
  },

  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    entrance: 'cubic-bezier(0.22, 1, 0.36, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    emphasis: 'cubic-bezier(0.34, 1.26, 0.64, 1)',
  },

  size: {
    touchTarget: '44px',
    headerHeight: '64px',
    containerMax: '1240px',
    proseMax: '68ch',
  },
});
