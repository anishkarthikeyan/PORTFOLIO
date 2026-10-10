"use client";

import { useEffect, useRef, useState } from "react";
import type { TrackLayout } from "@/data/worlds";
import { journeyScale, registerTrack, type TrackHandle } from "./registry";

interface Geometry {
  /** Stage size in art px. */
  width: number;
  height: number;
  scale: number;
}

/**
 * Measures a track's stage, builds its layout (pure builder), and registers
 * it with the journey controller. Re-measures on resize and when observed
 * elements change size (e.g. a filtered card grid).
 */
export function useTrack(opts: {
  id: string;
  world: number;
  label: string;
  mode: TrackHandle["mode"];
  /** Builds the layout from the measured stage. Return null when it can't fit. */
  build: (geo: Geometry, stage: HTMLElement) => TrackLayout | null;
  /** Extra elements whose size changes should trigger a rebuild. */
  observe?: () => (Element | null)[];
  onBeat?: (beat: number) => void;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ layout: TrackLayout; scale: number } | null>(null);
  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || opts.enabled === false) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return setState(null);
      const scale = journeyScale();
      const layout = optsRef.current.build({ width: r.width / scale, height: r.height / scale, scale }, el);
      setState((prev) =>
        prev && prev.scale === scale && JSON.stringify(prev.layout) === JSON.stringify(layout)
          ? prev
          : layout
            ? { layout, scale }
            : null,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    optsRef.current.observe?.().forEach((o) => o && ro.observe(o));
    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [opts.enabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !state) return;
    const o = optsRef.current;
    return registerTrack({
      id: o.id,
      world: o.world,
      label: o.label,
      mode: o.mode,
      el,
      layout: state.layout,
      scale: state.scale,
      onBeat: o.onBeat,
    });
  }, [state]);

  return { ref, layout: state?.layout ?? null, scale: state?.scale ?? 0 };
}
