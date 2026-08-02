import { motion, AnimatePresence } from 'framer-motion';
import { overlayFade } from '../../motion/variants';
import { IconButton } from '../primitives/IconButton';
import { useFocusTrap } from '../../lib/useFocusTrap';
import type { NavItem } from './navigation';
import * as s from './navigation.css';

export type MobileNavProps = {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  currentPath?: string;
  title?: string;
};

/**
 * The drawer, below 768px — design-system.md §5.6.
 *
 * Focus trapped and Escape-to-close via `useFocusTrap`, the same hook `ConfirmDialog` uses.
 * A drawer that leaves focus on the page behind it is a keyboard trap in reverse: Tab walks
 * through links the user cannot see, underneath a scrim.
 *
 * Slides on `translateX`, never `left` or `width` (Principle VI). Under reduced motion
 * `MotionConfig reducedMotion="user"` drops the transform, so the drawer appears rather than
 * sliding — which is the correct fallback, not a degraded one.
 */
export function MobileNav({ open, onClose, items, currentPath, title }: MobileNavProps) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={s.drawerScrim}
            variants={overlayFade}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={ref}
            className={s.drawer}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Menu'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={s.drawerHeader}>
              <span>{title ?? 'Menu'}</span>
              <IconButton type="button" label="Close menu" onClick={onClose}>
                ✕
              </IconButton>
            </div>

            <nav className={s.drawerNav} aria-label="Site">
              {items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={s.drawerLink}
                  aria-current={currentPath === item.href ? 'page' : undefined}
                  onClick={onClose}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
