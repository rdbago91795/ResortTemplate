import { motion } from 'framer-motion';
import { bandDraw, paneReveal } from '../../motion/variants';
import * as s from './layout.css';

export type PaneBandProps = {
  cells?: number;
  height?: 'sm' | 'md';
  animate?: boolean;
  className?: string;
};

/**
 * THE SIGNATURE DIVIDER — design-system.md §0 and §4.
 *
 * A row of capiz-shell cells standing in for a hairline rule. §4 restricts the pane grid to
 * exactly three places (hero reveal, gallery layout, section divider) so it stays a signature
 * and does not decay into a background texture.
 *
 * PRINCIPLE VI, THE PART THAT IS EASY TO GET WRONG: the band draws in with `scaleX` from the
 * left, not `width`. Animating `width` forces layout on every frame; `scaleX` is composited.
 * The cells only ever animate opacity (`paneReveal`).
 *
 * `aria-hidden` throughout: this is ornament. A screen reader announcing twelve empty spans
 * between every section would be actively worse than silence.
 *
 * Under reduced motion `MotionConfig reducedMotion="user"` (src/motion/config.tsx) drops the
 * transforms and keeps opacity, so the band appears without drawing.
 */
export function PaneBand({ cells = 12, height = 'sm', animate = true, className }: PaneBandProps) {
  const classes = [s.paneBand, s.paneBandHeight[height], className ?? ''].filter(Boolean).join(' ');
  const style = { gridTemplateColumns: `repeat(${cells}, 1fr)` };

  if (!animate) {
    return (
      <div className={classes} style={style} aria-hidden="true">
        {Array.from({ length: cells }, (_, i) => (
          <span key={i} className={s.pane} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={classes}
      style={style}
      aria-hidden="true"
      variants={bandDraw}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
    >
      {Array.from({ length: cells }, (_, i) => (
        <motion.span key={i} className={s.pane} variants={paneReveal} custom={i} />
      ))}
    </motion.div>
  );
}
