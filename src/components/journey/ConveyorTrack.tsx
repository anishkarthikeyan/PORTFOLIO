"use client";

import { buildConveyor, CONVEYOR_H } from "@/lib/tracks";
import { TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import styles from "./Journey.module.css";

/** Machine-room conveyor: the character rides the belt between two pipes. */
export function ConveyorTrack({ id, label }: { id: string; label: string }) {
  const { ref, layout, scale } = useTrack({
    id,
    world: 4,
    label,
    mode: "span",
    build: ({ width }) => buildConveyor({ width }),
  });
  const g = CONVEYOR_H - 4;

  return (
    <div ref={ref} className={styles.corridor} style={{ "--h": CONVEYOR_H } as React.CSSProperties} aria-hidden="true">
      {layout && (
        <TrackScene
          id={id}
          layout={layout}
          scale={scale}
          back={
            <g>
              {/* Gears and pipes on the machine-room wall */}
              {Array.from({ length: Math.floor(layout.width / 60) }, (_, i) => (
                <g key={i} opacity={0.5}>
                  <rect x={40 + i * 60} y={10} width={10} height={10} fill="#2c3542" />
                  <rect x={43 + i * 60} y={13} width={4} height={4} fill="#101419" />
                  <rect x={50 + i * 60} y={14} width={10} height={2} fill="#3a8346" opacity={0.6} />
                </g>
              ))}
            </g>
          }
          front={
            <g>
              {/* Moving belt stripes + rollers */}
              <svg x={28} y={g} width={layout.width - 56} height={4} overflow="hidden">
                <g className={styles.belt}>
                  {Array.from({ length: Math.ceil((layout.width - 56) / 4) + 2 }, (_, i) => (
                    <rect key={i} x={i * 4 - 4} y={1} width={2} height={1} fill="#101419" />
                  ))}
                </g>
              </svg>
              {Array.from({ length: Math.floor((layout.width - 56) / 14) }, (_, i) => (
                <rect key={`r${i}`} x={32 + i * 14} y={g + 3} width={4} height={1} fill="#a7adb8" opacity={0.6} />
              ))}
            </g>
          }
        />
      )}
    </div>
  );
}
