import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Traps focus inside a container while it is open, and restores it on close.
 *
 * Written once and shared by `ConfirmDialog` (FR-067a) and `MobileNav` (T063b). Both need
 * identical behaviour, and a focus trap reimplemented per component is a focus trap that is
 * correct in one place and subtly wrong in the other.
 *
 * Three obligations, all of which are easy to miss individually:
 *
 *   1. Move focus in. Without this the dialog opens and the keyboard is still on the page
 *      behind it, so Tab walks through content the user cannot see.
 *   2. Keep focus in. Tab from the last element wraps to the first; Shift+Tab from the first
 *      wraps to the last.
 *   3. PUT FOCUS BACK. This is the one that gets forgotten, and it is the one users notice —
 *      close a dialog and the keyboard is at the top of the document rather than on the
 *      button that opened it.
 *
 * The focusable list is queried on each Tab rather than cached, because dialog content
 * changes: a button that becomes enabled while the dialog is open must join the cycle.
 */
export function useFocusTrap<T extends HTMLElement>(open: boolean, onClose?: () => void) {
  const ref = useRef<T>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;

    const container = ref.current;
    if (!container) return;

    const first = container.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? container).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && onClose) {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const node = ref.current;
      if (!node) return;

      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      restoreTo.current?.focus();
    };
  }, [open, onClose]);

  return ref;
}
