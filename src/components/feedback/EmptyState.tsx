import type { ReactNode } from 'react';
import * as s from './feedback.css';

export type EmptyStateProps = {
  title: string;
  body: string;
  /** Usually a `Button` — the thing that would fill this space. */
  action?: ReactNode;
  illustration?: ReactNode;
};

/**
 * Nothing here yet — design-system.md §5.4.
 *
 * ⚠ CONTENT-AGNOSTIC BY DESIGN. Every string is a prop; this component owns no copy.
 *
 * §6 fixes the actual wording per surface ("No rooms open for those dates. Try shifting a
 * night either way."), and 11 of the 57 open items in `checklists/flows.md` are empty-state
 * questions still unanswered. Baking a default message in here would resolve those questions
 * silently and in the wrong place. Each screen states its own, in the user-story phase where
 * the question actually gets decided.
 *
 * §5.4 calls empty states invitations rather than apologies — the `action` slot is what makes
 * that possible, so callers should nearly always fill it.
 */
export function EmptyState({ title, body, action, illustration }: EmptyStateProps) {
  return (
    <div className={[s.state, s.stateEmpty].join(' ')}>
      {illustration && <div aria-hidden="true">{illustration}</div>}
      <p className={s.stateTitle}>{title}</p>
      <p className={s.stateBody}>{body}</p>
      {action}
    </div>
  );
}
