"use client";

import { useEffect, useMemo, useRef } from "react";
import type { TrackLayout } from "@/data/worlds";
import { compileRoute, type CompiledRoute } from "@/lib/journey";

/** Compiled route + layout kept in a ref, for actors updated from onBeat. */
export function useRouteRef(layout: TrackLayout | null) {
  const route = useMemo(() => (layout ? compileRoute(layout) : null), [layout]);
  const ref = useRef<{ route: CompiledRoute; layout: TrackLayout } | null>(null);
  useEffect(() => {
    ref.current = route && layout ? { route, layout } : null;
  }, [route, layout]);
  return ref;
}

/** Set an SVG element's transform (no-op when missing). */
export function place(el: SVGGElement | null | undefined, x: number, y: number, show = true) {
  if (!el) return;
  el.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  el.style.visibility = show ? "visible" : "hidden";
}
