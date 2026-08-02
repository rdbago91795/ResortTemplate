import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toastEnter } from '../../motion/variants';
import { IconButton } from '../primitives/IconButton';
import * as s from './feedback.css';

export type ToastMessage = {
  id: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
  message: string;
  duration?: number;
};

export type ToastProps = ToastMessage & { onDismiss: (id: string) => void };

/**
 * Transient confirmation — design-system.md §5.4.
 *
 * A toast must never be the only place something is said. It disappears, it can be missed
 * entirely by someone using a screen magnifier on another part of the page, and it is gone
 * before a slow reader reaches it. Anything that must be acted on belongs in an
 * `InlineAlert`; anything that must be kept belongs on the page.
 *
 * Dismissible by hand as well as by timer, because `duration` is a guess about reading speed.
 */
export function Toast({ id, tone, message, duration = 5000, onDismiss }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      className={[s.toast, s.alertTone[tone]].join(' ')}
      variants={toastEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <span style={{ flex: 1 }}>{message}</span>
      <IconButton type="button" label="Dismiss" size="sm" onClick={() => onDismiss(id)}>
        ✕
      </IconButton>
    </motion.div>
  );
}

export type ToastRegionProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

/**
 * The live region wrapper.
 *
 * `aria-live` lives on the container, which is rendered whether or not there are toasts.
 * A live region added to the DOM at the same moment as its content is frequently not
 * announced at all — the region has to already exist for the insertion to be noticed.
 */
export function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  return (
    <div className={s.toastRegion} role="status" aria-live="polite" aria-atomic="false">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}
