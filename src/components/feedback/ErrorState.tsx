import * as s from './feedback.css';
import { Button } from '../primitives/Button';
import { Link } from '../primitives/Link';

export type ErrorStateProps = {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Shown when retrying will not help — an email or phone number the guest can use. */
  supportContact?: { label: string; href: string };
};

/**
 * Something failed — design-system.md §5.4.
 *
 * ⚠ CONTENT-AGNOSTIC BY DESIGN, same as `EmptyState`. §6 fixes per-surface copy, and 14 of
 * the open items in `checklists/flows.md` are error-path questions — including the one that
 * matters most here, CHK001: whether a guest can tell "we could not reach the system" apart
 * from "the system refused you". Those two need different words and different actions, and
 * this component cannot know which it is being handed.
 *
 * `role="alert"` so a failure replacing content mid-flow is announced rather than silently
 * swapped in under a screen-reader user who is reading something else.
 *
 * §5.4's voice rule: errors explain what happened and what to do; they do not apologise.
 */
export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = 'Try again',
  supportContact,
}: ErrorStateProps) {
  return (
    <div className={[s.state, s.stateError].join(' ')} role="alert">
      <p className={s.stateTitle}>{title}</p>
      <p className={s.stateBody}>{body}</p>

      {onRetry && (
        <Button type="button" variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}

      {supportContact && <Link href={supportContact.href}>{supportContact.label}</Link>}
    </div>
  );
}
