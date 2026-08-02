import { motion, AnimatePresence } from 'framer-motion';
import { overlayFade, sheetUp } from '../../motion/variants';
import { Button } from '../primitives/Button';
import { useFocusTrap } from '../../lib/useFocusTrap';
import * as s from './feedback.css';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  /**
   * NAMES WHAT IS ABOUT TO HAPPEN, IN PLAIN WORDS — FR-067a.
   *
   * "Are you sure?" is not a confirmation, it is a speed bump. The body should say what will
   * be destroyed and what will not survive it: "Delete the Kubo Garden photograph? The file
   * is removed from storage as well, and cannot be recovered."
   */
  body: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Destructive confirmation — design-system.md §5.6, FR-067a.
 *
 * Focus trapped and Escape closes, both via `useFocusTrap` (shared with `MobileNav`).
 *
 * ⚠ CANCEL IS THE DEFAULT FOCUS, not confirm. The dialog exists because the action is hard to
 * undo; opening with the destructive button under the Enter key defeats the point for anyone
 * who confirms by reflex.
 *
 * A click on the scrim cancels, but only on the scrim itself — checking the event target
 * means a drag that starts inside the dialog and releases outside does not fire it.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useFocusTrap<HTMLDivElement>(open, onCancel);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={s.scrim}
          variants={overlayFade}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          <motion.div
            ref={ref}
            className={s.dialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-body"
            variants={sheetUp}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <h2 className={s.dialogTitle} id="confirm-title">
              {title}
            </h2>
            <p className={s.dialogBody} id="confirm-body">
              {body}
            </p>

            <div className={s.dialogActions}>
              {/* First in DOM order, so the focus trap lands here rather than on confirm. */}
              <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </Button>
              <Button type="button" variant={tone} onClick={onConfirm} loading={busy}>
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
