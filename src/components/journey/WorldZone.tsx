import { getBand } from "@/data/worlds";
import { FarLayer, WorldBand } from "./WorldBand";
import styles from "./Journey.module.css";

/**
 * A world zone: the world band (with its pipes) followed by the sections that
 * belong to that world, all set inside the same environment — starfield with
 * gentle parallax, accent light, distant silhouettes and a pixel ground at the
 * end. Content stays in normal document order and fully readable; the scenery
 * is decorative and hidden from assistive technology.
 *
 * On wide screens the JourneyController adds a ledge "lane" in the right
 * margin so the character descends alongside the content.
 */
export function WorldZone({ world, children }: { world: string; children: React.ReactNode }) {
  const band = getBand(world);
  if (!band) return <>{children}</>;
  return (
    <div
      className={styles.zone}
      data-zone={band.id}
      style={{ "--world-accent": band.accent } as React.CSSProperties}
    >
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.stars} data-depth />
        <div className={styles.horizon}>
          <FarLayer band={band} layout={band.wide} />
        </div>
        <div className={styles.ground} />
      </div>
      <WorldBand id={band.id} />
      {children}
    </div>
  );
}
