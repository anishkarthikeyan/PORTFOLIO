"use client";

import { buildTokenGate, GATE_H, type GateMeta } from "@/lib/tracks";
import { BlockToasts, TrackScene } from "@/components/journey/TrackScene";
import { useTrack } from "@/components/journey/useTrack";
import styles from "./Games.module.css";

/**
 * Token-bucket rate limiter (System design): the character is a request
 * passing API gates. Each gate's bucket holds a token; the throttled gate's
 * bucket is empty, so it shows 429 until a token drips in and the barrier
 * lifts. Gate state follows the shared block hit flag (data-hit).
 */
export function TokenGateTrack({ id }: { id: string }) {
  const { ref, layout, scale } = useTrack({
    id,
    world: 4,
    label: "Rate limiter",
    mode: "span",
    build: ({ width }) => buildTokenGate({ width, id }),
  });
  const meta = layout?.meta?.gate as GateMeta | undefined;

  return (
    <div ref={ref} className={styles.stage} style={{ "--h": GATE_H } as React.CSSProperties} data-track-stage={id} aria-hidden="true">
      {layout && meta && (
        <>
          <TrackScene
            id={id}
            layout={layout}
            scale={scale}
            back={
              <g>
                <text x={layout.width / 2} y={7} textAnchor="middle" className={styles.gateTitle}>
                  TOKEN BUCKET · 1 REQUEST = 1 TOKEN
                </text>
                {meta.gates.map((gt) => (
                  <Gate key={gt.id} x={gt.x} g={meta.ground} id={gt.id} throttled={gt.throttled} />
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

function Gate({ x, g, id, throttled }: { x: number; g: number; id: string; throttled: boolean }) {
  const top = g - 30;
  return (
    <g data-block-id={id} data-kind="gate" className={styles.gate} data-throttled={throttled || undefined}>
      {/* Bucket on a mast, with the token it holds (or the one that refills it) */}
      <rect x={x - 1} y={top + 6} width={2} height={g - top - 6} fill="#3a4454" />
      <rect x={x - 6} y={top} width={12} height={6} fill="#2c3542" />
      <rect x={x - 6} y={top} width={1} height={6} fill="#5c6f88" />
      <rect x={x + 5} y={top} width={1} height={6} fill="#5c6f88" />
      <rect x={x - 6} y={top + 5} width={12} height={1} fill="#5c6f88" />
      <g className={styles.token}>
        <rect x={x - 2} y={top + 1} width={4} height={4} fill="#f2d27a" />
        <rect x={x - 1} y={top + 2} width={1} height={2} fill="#c99a3a" />
      </g>
      {/* Status light: 429 while throttled, 200 once through */}
      <text x={x} y={top - 3} textAnchor="middle" className={styles.code429}>
        429
      </text>
      <text x={x} y={top - 3} textAnchor="middle" className={styles.code200}>
        200
      </text>
      {/* Barrier: posts + striped arm that lifts when the gate is passed */}
      <rect x={x + 7} y={g - 12} width={3} height={12} fill="#3a4454" />
      <rect x={x + 7} y={g - 12} width={3} height={1} fill="#849bb8" />
      <g className={styles.barrier} style={{ transformOrigin: `${x + 8.5}px ${g - 10}px` }}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={x - 9 + i * 4} y={g - 11} width={4} height={2} fill={i % 2 ? "#eef1f5" : "#c86b5e"} />
        ))}
      </g>
    </g>
  );
}
