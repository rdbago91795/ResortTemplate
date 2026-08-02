import { Children } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { paneReveal } from '../../motion/variants';
import * as s from './layout.css';

export type PaneGridProps = {
  cols: number;
  rows?: number;
  /** Milliseconds between cells. The variant's own delay is 70ms; this scales it. */
  stagger?: number;
  children: ReactNode;
  className?: string;
};

/**
 * The signature reveal/layout grid — one of the three sanctioned uses of the pane motif
 * (design-system.md §4). Cells light in sequence, opacity only.
 *
 * The stagger is computed per child rather than by `staggerChildren`, because the reveal
 * reads as light spreading across the shells: index-driven delay gives that, where
 * `staggerChildren` in a wrapped grid staggers in DOM order and looks like a typewriter.
 */
export function PaneGrid({ cols, rows, stagger = 70, children, className }: PaneGridProps) {
  const items = Children.toArray(children);

  return (
    <motion.div
      className={[s.paneGrid, className ?? ''].filter(Boolean).join(' ')}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        ...(rows ? { gridTemplateRows: `repeat(${rows}, 1fr)` } : {}),
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {items.map((child, i) => (
        <motion.div key={i} variants={paneReveal} custom={(i * stagger) / 70}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
