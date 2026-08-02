/**
 * The four logo slots from design-system.md §3.5, and the one derived decision that hangs off
 * them.
 *
 * Separate module so `Logo.tsx` exports only a component
 * (`react-refresh/only-export-components`), and so `SiteHeader` can ask the question without
 * importing the component.
 */
export type LogoAssets = {
  propertyName: string;
  wideUrl?: string | null;
  wideAlt?: string | null;
  inverseUrl?: string | null;
  markUrl?: string | null;
};

/**
 * §3.5: the header's transparent treatment is DERIVED from whether an inverse logo exists,
 * never passed in as a prop.
 *
 * A transparent header sits over a hero photograph, which is usually dark. A property that
 * has not uploaded an inverse logo has only its dark primary one, and rendering that on a
 * dark photograph makes the property's own name invisible on its own home page.
 *
 * Deriving it means no call site can opt into that by passing the wrong flag — the asset's
 * existence is the condition.
 */
export function canUseTransparentHeader(assets: LogoAssets): boolean {
  return Boolean(assets.inverseUrl);
}
