import { getBand } from "@/data/worlds";
import { FarLayer, WorldBand } from "./WorldBand";
import { CLOUDS, type CloudKey } from "./clouds";
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
  profile: "sparkle",
  skills: "fireflies",
  archive: "dust",
  contact: "sunset",
};

/** Cloud placements (% of the zone), varied per world by an offset. */
const CLOUD_SLOTS: { shape: "a" | "b" | "c"; left: number; top: number; px: number; opacity: number; dur: number }[] = [
  // Mostly in the side margins so they frame the content rather than sit behind text.
  { shape: "a", left: -4, top: 4, px: 6, opacity: 0.9, dur: 52 },
  { shape: "c", left: 74, top: 16, px: 5, opacity: 0.75, dur: 64 },
  { shape: "b", left: -2, top: 34, px: 5, opacity: 0.6, dur: 46 },
  { shape: "a", left: 80, top: 50, px: 4, opacity: 0.55, dur: 70 },
  { shape: "c", left: -6, top: 66, px: 4.5, opacity: 0.6, dur: 58 },
  { shape: "b", left: 76, top: 84, px: 6, opacity: 0.8, dur: 48 },
];
const ZONE_INDEX: Record<string, number> = { spawn: 0, projects: 1, profile: 2, skills: 3, archive: 4, contact: 5 };

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
        <div className={styles.stars} data-depth>
          {/* Drifting pixel swirl clouds (sunset palette in the finale) */}
          {CLOUD_SLOTS.map((c, i) => {
            const shift = (ZONE_INDEX[world] ?? 0) * 17;
            const key = `${world === "contact" ? "sunset" : "steel"}_${c.shape}` as CloudKey;
            const sprite = CLOUDS[key];
            return (
              <span
                key={i}
                className={styles.cloud}
                style={
                  {
                    left: `${c.left + (shift % 6)}%`,
                    top: `${c.top}%`,
                    width: `${sprite.w * c.px}px`,
                    height: `${sprite.h * c.px}px`,
                    backgroundImage: `url("${sprite.uri}")`,
                    opacity: c.opacity,
                    "--dur": `${c.dur}s`,
                  } as React.CSSProperties
                }
              />
            );
          })}
          {/* Four-point twinkle stars */}
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={`s${i}`}
              className={styles.twinkle}
              style={{ left: `${(i * 41 + 7) % 96}%`, top: `${(i * 23 + 11) % 94}%`, "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
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
