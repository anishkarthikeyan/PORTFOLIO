"use client";

import { buildJetpack, JETPACK_H } from "@/lib/tracks";
import { BlockToasts, TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import styles from "./Journey.module.css";

/**
 * Machine-room jetpack run: bump the "?" for a jetpack, then fly over the
 * floor between zapper beams collecting a line of coins.
 */
export function JetpackTrack({ id, label }: { id: string; label: string }) {
  const { ref, layout, scale } = useTrack({
    id,
    world: 4,
    label,
    mode: "span",
    build: ({ width }) => buildJetpack({ width, id }),
  });

  return (
    <div ref={ref} className={styles.corridor} style={{ "--h": JETPACK_H } as React.CSSProperties} data-track-stage={id} aria-hidden="true">
      {layout && (
        <>
          <TrackScene
            id={id}
            layout={layout}
            scale={scale}
            back={
              <g>
                {/* Ceiling rail and zapper beams (kept above the flight path) */}
                <rect x={0} y={0} width={layout.width} height={2} fill="#2c3542" />
                {Array.from({ length: Math.floor((layout.width - 140) / 50) }, (_, i) => {
                  const x = 90 + i * 50;
                  return (
                    <g key={i}>
                      <rect x={x - 2} y={2} width={5} height={2} fill="#5c6f88" />
                      <rect x={x} y={4} width={1} height={5} fill="#f2d27a" className={styles.zapper} />
                      <rect x={x - 1} y={9} width={3} height={1} fill="#e8b84f" className={styles.zapper} />
                    </g>
                  );
                })}
                {/* Machinery silhouettes */}
                {Array.from({ length: Math.floor(layout.width / 70) }, (_, i) => (
                  <g key={`m${i}`} opacity={0.45}>
                    <rect x={30 + i * 70} y={JETPACK_H - 20} width={14} height={16} fill="#232a35" />
                    <rect x={33 + i * 70} y={JETPACK_H - 17} width={8} height={2} fill="#3a8346" />
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
