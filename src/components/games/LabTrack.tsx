"use client";

import { useRef } from "react";
import { buildLab, LAB_H, type LabMeta } from "@/lib/games";
import { stateAtBeat } from "@/lib/journey";
import { BlockToasts, TrackScene } from "@/components/journey/TrackScene";
import { useTrack } from "@/components/journey/useTrack";
import { place, useRouteRef } from "./useRoute";
import styles from "./Games.module.css";

/**
 * Jetpack lab (System design world): grab the jetpack, then thrust and fall
 * between zapper beams at different heights, collecting coin trails. A
 * missile flashes a warning, then streaks past at the other height.
 */
export function LabTrack({ id }: { id: string }) {
  const missile = useRef<SVGGElement>(null);
  const warning = useRef<SVGGElement>(null);

  const { ref, layout, scale } = useTrack({
    id,
    world: 4,
    label: "Jetpack lab",
    mode: "span",
    build: ({ width }) => buildLab({ width, id }),
    onBeat: (beat) => {
      const d = routeRef.current;
      if (!d) return;
      const flights = d.route.segments.filter((s) => s.step.kind === "fly");
      if (!flights.length) return;
      const mid = flights[Math.floor(flights.length / 2)];
      const bm = (mid.b0 + mid.b1) / 2;
      const at = stateAtBeat(d.route, bm);
      const W = d.layout.width;
      // The missile flies in the lane the character is NOT in when they cross.
      const lane = at.y < LAB_H / 2 + 6 ? LAB_H - 18 : 16;
      const x = at.x + (bm - beat) * 45;
      place(missile.current, x, lane, x > -12 && x < W + 4);
      place(warning.current, W - 8, lane, x >= W && x < W + 70);
    },
  });
  const routeRef = useRouteRef(layout);
  const lab = layout?.meta?.lab as LabMeta | undefined;

  return (
    <div ref={ref} className={styles.stage} style={{ "--h": LAB_H } as React.CSSProperties} data-track-stage={id} aria-hidden="true">
      {layout && lab && (
        <>
          <TrackScene
            id={id}
            layout={layout}
            scale={scale}
            back={
              <g>
                {/* Lab wall: panels, pipes, hazard stripes */}
                <rect x={0} y={0} width={layout.width} height={lab.ceiling} fill="#2c3542" />
                {Array.from({ length: Math.ceil(layout.width / 32) }, (_, i) => (
                  <g key={i}>
                    <rect x={i * 32} y={lab.ceiling} width={1} height={lab.floor - lab.ceiling} fill="#161b22" />
                    <rect x={i * 32 + 6} y={lab.floor - 10} width={18} height={6} fill="#1a1f27" />
                    <rect x={i * 32 + 8} y={lab.floor - 8} width={4} height={2} fill={i % 3 ? "#3a8346" : "#c86b5e"} className={styles.blink} />
                  </g>
                ))}
                {Array.from({ length: Math.ceil(layout.width / 8) }, (_, i) => (
                  <rect key={`h${i}`} x={i * 8} y={lab.ceiling} width={4} height={2} fill={i % 2 ? "#e8b84f" : "#101419"} opacity={0.6} />
                ))}
                {/* Zappers: emitter heads + crackling beam */}
                {lab.zappers.map((z, i) => (
                  <g key={`z${i}`}>
                    <rect x={z.x - 3} y={z.y0 - 3} width={7} height={3} fill="#5c6f88" />
                    <rect x={z.x - 3} y={z.y1} width={7} height={3} fill="#5c6f88" />
                    <rect x={z.x} y={z.y0} width={1} height={z.y1 - z.y0} fill="#f2d27a" className={styles.beam} />
                    <rect x={z.x - 1} y={z.y0} width={3} height={z.y1 - z.y0} fill="#f2d27a" opacity={0.2} className={styles.beam} />
                  </g>
                ))}
              </g>
            }
            front={
              <g>
                <g ref={warning} className={styles.warning}>
                  <rect x={-6} y={-6} width={10} height={12} fill="#c86b5e" />
                  <rect x={-2} y={-4} width={2} height={5} fill="#eef1f5" />
                  <rect x={-2} y={3} width={2} height={2} fill="#eef1f5" />
                </g>
                <g ref={missile}>
                  <rect x={0} y={-2} width={10} height={4} fill="#a7adb8" />
                  <rect x={-2} y={-1} width={2} height={2} fill="#c86b5e" />
                  <rect x={10} y={-3} width={3} height={6} fill="#5c6f88" />
                  <rect x={13} y={-1} width={6} height={2} fill="#e8b84f" className={styles.blink} />
                </g>
              </g>
            }
          />
          <BlockToasts layout={layout} scale={scale} />
        </>
      )}
    </div>
  );
}
