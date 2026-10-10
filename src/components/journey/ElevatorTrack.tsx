"use client";

import { useEffect, useMemo, useRef } from "react";
import { compileRoute, type CompiledRoute } from "@/lib/journey";
import { buildElevator, vehicleAt } from "@/lib/tracks";
import type { TrackLayout } from "@/data/worlds";
import { TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import styles from "./Journey.module.css";

/**
 * Mine-shaft elevator beside the experience timeline. The cab stops at each
 * entry's floor ([data-floor] elements in the timeline).
 */
export function ElevatorTrack() {
  const cabRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<CompiledRoute | null>(null);
  const scaleRef = useRef(0);

  const { ref, layout, scale } = useTrack({
    id: "elevator",
    world: 5,
    label: "Experience archive",
    mode: "follow",
    observe: () => [ref.current?.parentElement ?? null],
    build: ({ width, height, scale: s }, stage) => {
      const top = stage.getBoundingClientRect().top;
      const floors = Array.from(stage.parentElement?.querySelectorAll<HTMLElement>("[data-floor]") ?? []).map(
        (f) => (f.getBoundingClientRect().top - top) / s + 14,
      );
      return buildElevator({ width, height, floors });
    },
    // Moves the cab with the character (direct style write, no re-render).
    onBeat: (beat) => {
      const cab = cabRef.current;
      const r = routeRef.current;
      if (!cab || !r) return;
      const v = vehicleAt(r, beat);
      if (v) cab.style.transform = `translate3d(0, ${(v.y * scaleRef.current).toFixed(1)}px, 0)`;
    },
  });
  const route = useMemo(() => (layout ? compileRoute(layout) : null), [layout]);
  useEffect(() => {
    routeRef.current = route;
    scaleRef.current = scale;
  }, [route, scale]);
  const parked = route ? vehicleAt(route, 0) : null;

  return (
    <div ref={ref} className={styles.shaftStage} aria-hidden="true">
      {layout && (
        <>
          <TrackScene id="elevator" layout={layout} scale={scale} back={<Shaft layout={layout} />} />
          <div
            ref={cabRef}
            className={styles.cab}
            style={{
              width: 22 * scale,
              left: (layout.width / 2 - 11) * scale,
              transform: `translate3d(0, ${((parked?.y ?? 0) * scale).toFixed(1)}px, 0)`,
            }}
          >
            <svg viewBox="0 0 22 6" width={22 * scale} height={6 * scale} shapeRendering="crispEdges">
              <rect x={0} y={0} width={22} height={2} fill="#a7adb8" />
              <rect x={0} y={2} width={22} height={3} fill="#3a4454" />
              <rect x={2} y={3} width={2} height={1} fill="#d9b26f" />
              <rect x={18} y={3} width={2} height={1} fill="#d9b26f" />
              <rect x={10} y={-0} width={2} height={1} fill="#eef1f5" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

function Shaft({ layout }: { layout: TrackLayout }) {
  const W = layout.width;
  const H = layout.height;
  return (
    <g>
      <rect x={1} y={0} width={1} height={H} fill="#5c6f88" />
      <rect x={W - 2} y={0} width={1} height={H} fill="#5c6f88" />
      {Array.from({ length: Math.floor(H / 12) }, (_, i) => (
        <rect key={i} x={2} y={i * 12 + 6} width={W - 4} height={1} fill="#1a1f27" />
      ))}
      <rect x={W / 2 - 0.5} y={0} width={1} height={H} fill="#2c3542" />
    </g>
  );
}
