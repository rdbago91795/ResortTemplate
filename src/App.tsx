import * as styles from './App.css';

/**
 * Phase 1 placeholder.
 *
 * Setup produces the token contract, motion config, and scroll setup — nothing renders yet.
 * Routes arrive with US1 (T071 onward); the guest shell arrives in Foundational (T063b–c).
 *
 * This exists so `pnpm build` exercises the theme contract: a wrong token name fails the
 * build here rather than looking subtly off later, which is the point of the typed contract.
 */
export function App() {
  return (
    <main className={styles.shell}>
      <p className={styles.eyebrow}>Balai Amihan</p>
      <h1 className={styles.heading}>Setup complete</h1>
      <div className={styles.band} aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className={styles.pane} />
        ))}
      </div>
      <p className={styles.body}>
        Theme contract, motion variants, and scroll behaviour are wired. Routes arrive with the
        first user story.
      </p>
    </main>
  );
}
