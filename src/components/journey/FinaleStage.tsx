"use client";

import { buildFinale, FINALE_H, finaleGeometry } from "@/lib/tracks";
import type { ConfigurableLink } from "@/data/types";
import { TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import { HighScores } from "./HighScores";
import styles from "./Journey.module.css";

/**
 * Contact finale: three stair bricks → star → journey summary drop-down →
 * flagpole slide → portal. Configured contact links appear as labelled warp
 * pipes below (real, keyboard-accessible links); unset links never render.
 */
export function FinaleStage({ links }: { links: (ConfigurableLink & { href: string })[] }) {
  const { ref, layout, scale } = useTrack({
    id: "finale",
    world: 6,
    label: "Finale",
    mode: "span",
    build: ({ width }) => buildFinale({ width }),
  });
  const geo = layout ? finaleGeometry(layout.width) : null;

  return (
    <div className={styles.finale}>
      <div ref={ref} className={styles.finaleStage} style={{ "--h": FINALE_H } as React.CSSProperties} aria-hidden="true">
        {layout && geo && (
          <TrackScene
            id="finale"
            layout={layout}
            scale={scale}
            back={
              <g>
                {/* Portal */}
                <ellipse
                  cx={geo.portal.x + geo.portal.w / 2}
                  cy={geo.ground - 14}
                  rx={geo.portal.w}
                  ry={18}
                  fill="#a9bdd6"
                  opacity={0.08}
                  className={styles.portalGlow}
                />
                <rect x={geo.portal.x} y={geo.ground - 26} width={geo.portal.w} height={26} fill="#3a4250" />
                <rect x={geo.portal.x + 2} y={geo.ground - 24} width={geo.portal.w - 4} height={24} fill="#849bb8" />
                <rect x={geo.portal.x + 4} y={geo.ground - 22} width={geo.portal.w - 8} height={22} fill="#c9d7e8" className={styles.portalCore} />
                {/* Flagpole */}
                <rect x={geo.pole.x} y={geo.pole.top} width={1} height={geo.ground - geo.pole.top} fill="#a7adb8" />
                <rect x={geo.pole.x - 1} y={geo.pole.top - 2} width={3} height={2} fill="#f2d27a" />
                <g className={styles.goalFlag}>
                  <rect x={geo.pole.x + 1} y={geo.pole.top + 1} width={12} height={8} fill="#3a8346" />
                  <text x={geo.pole.x + 7} y={geo.pole.top + 6.6} textAnchor="middle" className={styles.flagText}>
                    GOAL
                  </text>
                </g>
                <rect x={geo.pole.x - 2} y={geo.ground - 2} width={5} height={2} fill="#3a414d" />
              </g>
            }
          />
        )}
      </div>
      {/* Fireworks + credits roll + high scores appear once the star is touched */}
      <div className={styles.fireworks} aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
          {/* Journey summary drop-down (filled + opened when the star is touched) */}
          <div className={styles.summary} data-journey-summary role="status" aria-live="polite">
            <p className={styles.summaryTitle}>
              <span aria-hidden="true">★</span> Your journey
            </p>
            <dl>
              <div>
                <dt>Points</dt>
                <dd data-sum="score">0</dd>
              </div>
              <div>
                <dt>Distance</dt>
                <dd data-sum="distance">0m</dd>
              </div>
              <div>
                <dt>Worlds</dt>
                <dd data-sum="worlds">0/6</dd>
              </div>
              <div>
                <dt>Blocks</dt>
                <dd data-sum="blocks">0</dd>
              </div>
              <div>
                <dt>Coins</dt>
                <dd data-sum="coins">0</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd data-sum="time">00:00</dd>
              </div>
            </dl>
            <p className={styles.badges}>
              <span className={styles.badgesKey}>Badges</span> <span data-sum-badges>—</span>
            </p>
          </div>
      <div className={styles.afterStar}>
        <div className={styles.credits} aria-hidden="true">
          <div className={styles.creditsRoll}>
            <p>★ Thank you for playing ★</p>
            <p>Starring</p>
            <p>Anish Karthikeyan</p>
            <p>Worlds</p>
            <p>Projects · About · Skills</p>
            <p>Experience · Contact</p>
            <p>Built with</p>
            <p>Next.js · React · TypeScript</p>
            <p>Original pixel art · SVG</p>
            <p>Press ` for the terminal</p>
          </div>
        </div>
        <HighScores />
      </div>
      {links.length > 0 && (
        <ul className={styles.warpLinks} aria-label="Contact links">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className={styles.warpLink}
                {...(/^https?:/.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span className={styles.warpPipe} aria-hidden="true" />
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
