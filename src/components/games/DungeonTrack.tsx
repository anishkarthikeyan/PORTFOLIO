"use client";

import { buildDungeon, DUNGEON_H, type DungeonMeta } from "@/lib/games";
import { BlockToasts, TrackScene } from "@/components/journey/TrackScene";
import { useTrack } from "@/components/journey/useTrack";
import styles from "./Games.module.css";

/** Dungeon (Education world, Zelda inspired): key → locked door → treasure chest. */
export function DungeonTrack({ id, prize }: { id: string; prize: string }) {
  const { ref, layout, scale } = useTrack({
    id,
    world: 5,
    label: "Academy dungeon",
    mode: "span",
    build: ({ width }) => buildDungeon({ width, id, prize }),
  });
  const m = layout?.meta?.dungeon as DungeonMeta | undefined;

  return (
    <div ref={ref} className={styles.stage} style={{ "--h": DUNGEON_H } as React.CSSProperties} data-track-stage={id} aria-hidden="true">
      {layout && m && (
        <>
          <TrackScene
            id={id}
            layout={layout}
            scale={scale}
            back={
              <g>
                {Array.from({ length: Math.ceil(layout.width / 16) }, (_, i) =>
                  [0, 1, 2].map((r) => (
                    <rect
                      key={`${i}-${r}`}
                      x={i * 16 + (r % 2) * 8}
                      y={6 + r * 9}
                      width={15}
                      height={8}
                      fill="#1a1f27"
                      stroke="#12161c"
                      strokeWidth={0.5}
                    />
                  )),
                )}
                {[0.14, 0.4, 0.64, 0.88].map((f) => (
                  <g key={f}>
                    <rect x={layout.width * f} y={14} width={2} height={6} fill="#5a3322" />
                    <rect x={layout.width * f - 1} y={10} width={4} height={4} fill="#e8b84f" className={styles.flame} />
                  </g>
                ))}
              </g>
            }
          />
          <BlockToasts layout={layout} scale={scale} />
        </>
      )}
    </div>
  );
}
