"use client";

import { useRef } from "react";
import { buildInvaders, INVADERS_H, type InvaderMeta } from "@/lib/games";
import { vehicleAt } from "@/lib/tracks";
import { BlockToasts, TrackScene } from "@/components/journey/TrackScene";
import { useTrack } from "@/components/journey/useTrack";
import { place, useRouteRef } from "./useRoute";
import styles from "./Games.module.css";

/**
 * Space-invaders strip (Achievements world): an invader hovers above each
 * card; the character rides a ship below and shoots each one, revealing it.
 */
export function InvadersTrack({ id, labels }: { id: string; labels: string[] }) {
  const ship = useRef<SVGGElement>(null);
  const bullets = useRef<(SVGGElement | null)[]>([]);

  const { ref, layout, scale } = useTrack({
    id,
    world: 5,
    label: "Trophy invaders",
    mode: "span",
    observe: () => [ref.current?.parentElement ?? null],
    build: ({ width, scale: s }, stage) => {
      const left = stage.getBoundingClientRect().left;
      const cards = Array.from(stage.parentElement?.querySelectorAll<HTMLElement>("[data-unlock-id^='tr-']") ?? []);
      let xs = cards.map((c) => {
        const r = c.getBoundingClientRect();
        return (r.left + r.width / 2 - left) / s;
      });
      // One column (phones): spread the invaders across the strip.
      if (new Set(xs.map((x) => Math.round(x / 20))).size < xs.length) xs = xs.map((_, i) => 44 + ((width - 88) * (i + 0.5)) / xs.length);
      return buildInvaders({
        width,
        id,
        targets: xs.map((x, i) => ({ x, id: `${id}-${i}`, unlock: `tr-${i}`, label: labels[i] })),
      });
    },
    onBeat: (beat) => {
      const d = routeRef.current;
      if (!d) return;
      const meta = d.layout.meta!.invaders as InvaderMeta;
      const v = vehicleAt(d.route, beat);
      if (v) place(ship.current, v.x, meta.shipY);
      meta.invaders.forEach((inv, i) => {
        const at = d.route.events.find((e) => e.id === inv.id)?.beat ?? 0;
        const k = (beat - (at - 0.3)) / 0.3;
        place(bullets.current[i], inv.x, meta.shipY - 26 + (inv.y + 8 - (meta.shipY - 26)) * k, k >= 0 && k < 1);
      });
    },
  });
  const routeRef = useRouteRef(layout);
  const meta = layout?.meta?.invaders as InvaderMeta | undefined;

  return (
    <div ref={ref} className={styles.stage} style={{ "--h": INVADERS_H } as React.CSSProperties} data-track-stage={id} aria-hidden="true">
      {layout && meta && (
        <>
          <TrackScene
            id={id}
            layout={layout}
            scale={scale}
            back={
              <g>
                {Array.from({ length: Math.floor(layout.width / 9) }, (_, i) => (
                  <rect key={i} x={(i * 37) % layout.width} y={(i * 13) % (INVADERS_H - 20)} width={1} height={1} fill="#eef1f5" opacity={0.35} />
                ))}
              </g>
            }
            front={
              <g>
                <g ref={ship}>
                  <rect x={-10} y={0} width={20} height={3} fill="#849bb8" />
                  <rect x={-8} y={3} width={16} height={2} fill="#5c6f88" />
                  <rect x={-1} y={-2} width={2} height={2} fill="#a9bdd6" />
                  <rect x={-6} y={5} width={3} height={1} fill="#e8b84f" className={styles.blink} />
                  <rect x={3} y={5} width={3} height={1} fill="#e8b84f" className={styles.blink} />
                </g>
                {meta.invaders.map((inv, i) => (
                  <g
                    key={inv.id}
                    ref={(el) => {
                      bullets.current[i] = el;
                    }}
                    style={{ visibility: "hidden" }}
                  >
                    <rect x={0} y={-3} width={1} height={4} fill="#f2d27a" />
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
