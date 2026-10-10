import styles from "./Journey.module.css";

/**
 * Game scoreboard pinned under the header. Purely a game score (points for
 * bumped blocks, distance travelled) — never a portfolio metric. Values are
 * written directly by the JourneyController; hidden from assistive tech.
 */
export function Hud() {
  return (
    <div className={styles.hud} data-hud aria-hidden="true">
      <span className={styles.hudItem}>
        <span className={styles.hudKey}>Score</span>
        <span data-hud-score>000000</span>
      </span>
      <span className={styles.hudItem}>
        <span className={styles.hudCoin} />
        <span data-hud-blocks>×00</span>
      </span>
      <span className={styles.hudItem}>
        <span className={styles.hudKey}>Dist</span>
        <span data-hud-distance>0000m</span>
      </span>
      <span className={`${styles.hudItem} ${styles.hudWorld}`}>
        <span className={styles.hudKey}>World</span>
        <span data-hud-world>1</span>
      </span>
    </div>
  );
}
