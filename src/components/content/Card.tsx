import type { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cardHover } from '../../motion/variants';
import * as s from './Card.css';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevation?: 'flat' | 'raised';
  /** Adds the hover/tap response. Does NOT make the card clickable — see the note below. */
  interactive?: boolean;
  children: ReactNode;
};

/**
 * The generic surface `RoomCard` and the admin panels build on.
 *
 * ⚠ `interactive` STYLES a card, it does not make one clickable. There is no `onClick` here
 * on purpose: a div with a click handler is invisible to the keyboard and unannounced to a
 * screen reader. Callers put a real `Button` or `Link` inside the card — and where the whole
 * card should be a target, the link stretches over it with a pseudo-element rather than the
 * card swallowing the event.
 *
 * The hover response is `scale` (`cardHover` variant), a transform — Principle VI. Animating
 * `box-shadow` is the usual choice and repaints on every frame.
 */
export function Card({
  elevation = 'flat',
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const classes = [s.card, s.elevation[elevation], interactive ? s.interactive : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  if (!interactive) {
    return (
      <div className={classes} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={classes}
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      {children}
    </motion.div>
  );
}
