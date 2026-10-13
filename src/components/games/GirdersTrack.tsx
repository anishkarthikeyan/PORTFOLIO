"use client";

import { useRef } from "react";
import { PixelGroup } from "@/components/pixel/PixelSprite";
import { APE_PALETTE, APE_POUND, APE_THROW } from "@/components/pixel/sprites";
import { buildGirders, type GirderMeta } from "@/lib/games";
import { TrackScene } from "@/components/journey/TrackScene";
import { useTrack } from "@/components/journey/useTrack";
import { place, useRouteRef } from "./useRoute";
import styles from "./Games.module.css";

/**
 * Girders and ladders (Experience world, Donkey Kong inspired): each girder
 * below the top is one experience entry. "Big Deadline", an ape on the top
 * girder, hurls barrels that the character jumps on the way down.
 */
export function GirdersTrack({ id, labels }: { id: string; labels: string[] }) {
  const barrels = useRef<(SVGGElement | null)[]>([]);
  const floors = Math.max(2, Math.min(5, labels.length + 1));

  const { ref, layout, scale } = useTrack({
    id,
    world: 5,
    label: "Girder works",
    mode: "span",
    build: ({ width }) => buildGirders({ width, floors, id }),
    onBeat: (beat) => {
      const d = routeRef.current;
      if (!d) return;
      const meta = d.layout.meta!.girders as GirderMeta;
      meta.barrels.forEach((b, i) => {
        const at = d.route.events.find((e) => e.id === b.id)?.beat ?? 0;
        const x = b.x + b.dir * (beat - at) * 26;
        const g = meta.girders.find((gd) => gd.y === b.y)!;
        place(barrels.current[i], x, b.y - 4, Math.abs(beat - at) < 3 && x > g.x0 + 4 && x < g.x1 - 4);
      });
    },
  });
  const routeRef = useRouteRef(layout);
  const meta = layout?.meta?.girders as GirderMeta | undefined;
  const H = 38 + (floors - 1) * 40 + 8;

  return (
    <div ref={ref} className={styles.stage} style={{ "--h": H } as React.CSSProperties} data-track-stage={id} aria-hidden="true">
      {layout && meta && (
        <TrackScene
          id={id}
          layout={layout}
          scale={scale}
          showPlatforms={false}
          back={
            <g>
              {/* Ladders */}
              {meta.ladders.map((l, i) => (
                <g key={`l${i}`}>
                  <rect x={l.x - 6} y={l.y0} width={1} height={l.y1 - l.y0} fill="#5c6f88" />
                  <rect x={l.x + 5} y={l.y0} width={1} height={l.y1 - l.y0} fill="#5c6f88" />
                  {Array.from({ length: Math.floor((l.y1 - l.y0) / 5) }, (_, k) => (
                    <rect key={k} x={l.x - 6} y={l.y0 + 3 + k * 5} width={12} height={1} fill="#849bb8" />
                  ))}
                </g>
              ))}
              {/* Steel girders with truss pattern */}
              {meta.girders.map((g, i) => (
                <g key={`g${i}`}>
                  <rect x={g.x0} y={g.y} width={g.x1 - g.x0} height={4} fill="#8c3f35" />
                  <rect x={g.x0} y={g.y} width={g.x1 - g.x0} height={1} fill="#c86b5e" />
                  <rect x={g.x0} y={g.y + 3} width={g.x1 - g.x0} height={1} fill="#5a2620" />
                  {Array.from({ length: Math.floor((g.x1 - g.x0) / 8) }, (_, k) => (
                    <rect key={k} x={g.x0 + k * 8 + 3} y={g.y + 1} width={2} height={2} fill="#5a2620" />
                  ))}
                  {i > 0 && labels[i - 1] && (
                    <text x={i % 2 ? g.x1 - 4 : g.x0 + 4} y={g.y + 10} textAnchor={i % 2 ? "end" : "start"} className={styles.girderLabel}>
                      {`FLOOR ${i} · ${labels[i - 1]}`}
                    </text>
                  )}
                </g>
              ))}
              {/* "Big Deadline" — an original ape on the top girder: pounds its chest, then hurls barrels */}
              <g transform={`translate(${layout.width - 27} ${meta.girders[0].y - 22})`}>
                <g className={styles.apePound}>
                  <PixelGroup rows={APE_POUND} palette={APE_PALETTE} />
                </g>
                <g className={styles.apeThrow}>
                  <PixelGroup rows={APE_THROW} palette={APE_PALETTE} />
                  <g transform="translate(9 -6)">
                    <rect x={0} y={0} width={8} height={7} fill="#8c5439" />
                    <rect x={0} y={2} width={8} height={1} fill="#4a2a1c" />
                    <rect x={0} y={5} width={8} height={1} fill="#4a2a1c" />
                  </g>
                </g>
                <text x={13} y={-3} textAnchor="middle" className={styles.girderLabel}>
                  BIG DEADLINE
                </text>
              </g>
            </g>
          }
          front={
            <g>
              {meta.barrels.map((b, i) => (
                <g
                  key={b.id}
                  ref={(el) => {
                    barrels.current[i] = el;
                  }}
                  style={{ visibility: "hidden" }}
                >
                  <g className={styles.barrel}>
                    <rect x={-4} y={-3} width={8} height={7} fill="#8c5439" />
                    <rect x={-4} y={-1} width={8} height={1} fill="#4a2a1c" />
                    <rect x={-4} y={2} width={8} height={1} fill="#4a2a1c" />
                    <rect x={-3} y={-3} width={2} height={7} fill="#a0623f" />
                  </g>
                </g>
              ))}
            </g>
          }
        />
      )}
    </div>
  );
}
