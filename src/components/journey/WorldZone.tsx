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
export type Atmosphere = "clouds" | "sparkle" | "fireflies" | "dust" | "sunset";

/** Default atmosphere per world (decorative particles, CSS only). */
const ATMOSPHERE: Record<string, Atmosphere | undefined> = {
  projects: "clouds",
  profile: "sparkle",
  skills: "fireflies",
  archive: "dust",
  contact: "sunset",
};

export function WorldZone({ world, lane = false, children }: { world: string; lane?: boolean; children: React.ReactNode }) {
  const band = getBand(world);
  if (!band) return <>{children}</>;
  return (
    <div
      className={styles.zone}
      data-zone={band.id}
      data-lane={lane || undefined}
      style={{ "--world-accent": band.accent } as React.CSSProperties}
    >
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.stars} data-depth />
        <div className={styles.horizon}>
          <FarLayer band={band} layout={band.wide} />
        </div>
        <div className={styles.ground} />
        {ATMOSPHERE[world] && (
          <div className={styles.atmo} data-atmo={ATMOSPHERE[world]}>
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ "--i": i, top: `${(i * 37) % 90}%` } as React.CSSProperties} />
            ))}
          </div>
        )}
      </div>
      <WorldBand id={band.id} />
      {children}
    </div>
  );
}
