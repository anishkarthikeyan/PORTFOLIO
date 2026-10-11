import Link from "next/link";
import { WORLD_NAV } from "@/data/worldNav";
import styles from "./WorldMap.module.css";

/** Node positions on the map (percent of width / height), zig-zag path. */
const POS: [number, number][] = [
  [8, 72],
  [26, 30],
  [44, 70],
  [62, 28],
  [79, 68],
  [93, 30],
];

/**
 * Pixel overworld map of the six worlds. Every node is a real link to a
 * section; the controller marks visited worlds and the current one.
 * `variant="overlay"` also lists the sections inside each world.
 */
export function WorldMap({
  variant = "inline",
  onNavigate,
}: {
  variant?: "inline" | "overlay";
  onNavigate?: () => void;
}) {
  return (
    <div className={`${styles.map} ${variant === "overlay" ? styles.overlay : styles.inline}`}>
      <svg className={styles.path} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <polyline points={POS.map(([x, y]) => `${x},${y}`).join(" ")} />
      </svg>
      <ol className={styles.nodes} aria-label="Worlds">
        {WORLD_NAV.map((w, i) => (
          <li
            key={w.world}
            className={styles.node}
            style={{ "--x": `${POS[i][0]}%`, "--y": `${POS[i][1]}%`, "--accent": w.accent } as React.CSSProperties}
            data-world-node={w.world}
            data-anchor={variant === "inline" ? "" : undefined}
          >
            <Link href={w.href} className={styles.level} onClick={onNavigate}>
              <span className={styles.tile} aria-hidden="true">
                {w.world}
              </span>
              <span className={styles.label}>
                <span className={styles.title}>{w.title}</span>
                <span className={styles.name}>
                  World {w.world} · {w.name}
                </span>
              </span>
              <span className={styles.here} aria-hidden="true">
                You are here
              </span>
              <span className={styles.check} aria-hidden="true">
                ✓
              </span>
            </Link>
            {variant === "overlay" && w.sub.length > 0 && (
              <ul className={styles.sub}>
                {w.sub.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} onClick={onNavigate}>
                      {s.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
