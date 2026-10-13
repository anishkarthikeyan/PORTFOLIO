"use client";

import { useState } from "react";
import { buildLane, type Lane } from "@/lib/lane";
import { TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import styles from "./Journey.module.css";

/**
 * Zig-zag ledge tower in the right margin beside a block of content
 * (desktop only — hidden by CSS below 1100px, which unregisters it).
 * Ledges line up with the headings and right-column cards of its parent.
 */
export function LaneTrack({ id, world, label }: { id: string; world: number; label: string }) {
  const [lane, setLane] = useState<Lane | null>(null);
  const { ref, layout, scale } = useTrack({
    id,
    world,
    label,
    mode: "follow",
    observe: () => [ref.current?.parentElement ?? null],
    build: ({ width, height, scale: s }, stage) => {
      const host = stage.parentElement;
      if (!host) return null;
      const top = stage.getBoundingClientRect().top;
      const hostRight = host.getBoundingClientRect().right;
      const anchors = Array.from(host.querySelectorAll<HTMLElement>("h3, [data-reveal], [data-anchor]"))
        .filter((el) => el.tagName === "H3" || el.hasAttribute("data-reveal") || el.getBoundingClientRect().right >= hostRight - 6)
        .map((el) => (el.getBoundingClientRect().top - top) / s);
      const built = buildLane({ width, height, anchors });
      setLane(built);
      return built?.layout ?? null;
    },
  });

  return (
    <div ref={ref} className={styles.laneStage} aria-hidden="true">
      {layout && lane && (
        <TrackScene
          id={id}
          layout={layout}
          scale={scale}
          back={
            <g>
              {/* Poles and ladders hanging from a ledge's edge down to the next ledge */}
              {lane.ledges.map((l, i) => {
                const next = lane.ledges[i + 1];
                if (!next || l.down === "hop") return null;
                const h = next.y - l.y;
                return l.down === "pole" ? (
                  <g key={`d${i}`}>
                    <rect x={l.edgeX - 1} y={l.y} width={2} height={h} fill="#a7adb8" />
                    <rect x={l.edgeX - 1} y={l.y} width={1} height={h} fill="#eef1f5" />
                    <rect x={l.edgeX - 2} y={l.y - 2} width={4} height={2} fill="#e8b84f" />
                  </g>
                ) : (
                  <g key={`d${i}`}>
                    <rect x={l.edgeX - 5} y={l.y} width={1} height={h} fill="#8c5439" />
                    <rect x={l.edgeX + 4} y={l.y} width={1} height={h} fill="#8c5439" />
                    {Array.from({ length: Math.floor(h / 4) }, (_, k) => (
                      <rect key={k} x={l.edgeX - 4} y={l.y + 2 + k * 4} width={8} height={1} fill="#c27a4f" />
                    ))}
                  </g>
                );
              })}
              {lane.ledges.map((l, i) =>
                l.anchored ? (
                  <g key={i}>
                    <rect x={l.x0} y={l.y + 4} width={2} height={6} fill="#3a4454" />
                    <rect x={l.x0 + 2} y={l.y + 4} width={2} height={3} fill="#3a4454" />
                  </g>
                ) : i < lane.ledges.length - 1 ? (
                  <rect key={i} x={l.x1 - 4} y={l.y - 14} width={1} height={14} fill="#2c3542" />
                ) : null,
              )}
            </g>
          }
        />
      )}
    </div>
  );
}
