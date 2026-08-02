/**
 * The single source of the `aria-describedby` string.
 *
 * `FormField` renders the hint and error elements with these exact ids; every control points
 * at them by calling this. Two places computing one id string is how a control ends up
 * describing an element that does not exist — announced as nothing, and invisible in review
 * because the visual result is identical.
 *
 * Lives in its own module rather than beside `FormField` so that file exports only
 * components, which is what `react-refresh/only-export-components` asks for.
 */
export function describedBy(
  id: string,
  parts: { hint?: string; error?: string },
): string | undefined {
  const ids = [parts.hint ? `${id}-hint` : null, parts.error ? `${id}-error` : null].filter(
    Boolean,
  );
  return ids.length > 0 ? ids.join(' ') : undefined;
}
