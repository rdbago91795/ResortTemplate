import { useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '../primitives/Button';
import * as s from './admin.css';

export type FormPanelProps = {
  title: string;
  /** Shown beside the title — "Editing Kubo Garden", a record id, a status. */
  meta?: ReactNode;
  onSubmit: () => void;
  onCancel?: () => void;
  /** Unsaved changes exist. Drives both the label and the leave warning. */
  dirty?: boolean;
  submitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  /** Extra actions on the left of the bar — usually Delete. */
  secondaryActions?: ReactNode;
  children: ReactNode;
};

/**
 * The create/edit wrapper every admin route shares — design-system.md §5.6.
 *
 * ⚠ CONTENT-AGNOSTIC. It owns the frame, the sticky action bar, the dirty tracking, and the
 * leave warning. It owns no field and no copy, because 11 of the open items in
 * `checklists/flows.md` are update-flow questions still unanswered — what a concurrent edit
 * shows, what happens to a half-finished form on failure, whether a cancel confirms. Those
 * get decided per route, in the user-story phase.
 *
 * `beforeunload` is the one protection available without a router. It covers closing the tab
 * and reloading; it does NOT cover in-app navigation, which needs the router's own blocker —
 * and no router is chosen yet (plan.md names none). Flagged rather than silently half-done:
 * FR-048 requires the content editor not to lose work, and this is only half of that.
 */
export function FormPanel({
  title,
  meta,
  onSubmit,
  onCancel,
  dirty = false,
  submitting = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  secondaryActions,
  children,
}: FormPanelProps) {
  useEffect(() => {
    if (!dirty) return;

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Browsers ignore custom text now and show their own, but returnValue must be set.
      event.returnValue = '';
    }

    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className={s.panel} onSubmit={handleSubmit} noValidate>
      <div className={s.panelHeader}>
        <h1 className={s.panelTitle}>{title}</h1>
        {meta}
      </div>

      <div className={s.panelBody}>{children}</div>

      <div className={s.panelActions}>
        {secondaryActions}
        {dirty && (
          <span className={s.dirtyFlag} role="status">
            Unsaved changes
          </span>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
