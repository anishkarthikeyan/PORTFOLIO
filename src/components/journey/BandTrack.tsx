"use client";

import { useEffect, useRef } from "react";
import { getBand } from "@/data/worlds";
import { COMPACT_MAX, registerTrack } from "./registry";

/**
 * Registers a server-rendered world band with the journey controller,
 * using whichever layout (wide / compact) is currently displayed.
 */
export function BandTrack({ id }: { id: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const band = ref.current?.parentElement;
    const cfg = getBand(id);
    if (!band || !cfg) return;
    const mq = window.matchMedia(`(max-width: ${COMPACT_MAX}px)`);
    let unregister: (() => void) | undefined;

    const register = () => {
      unregister?.();
      const variant = mq.matches ? "compact" : "wide";
      const stage = band.querySelector(`[data-layout="${variant}"]`);
      const layout = cfg[variant];
      const width = stage?.getBoundingClientRect().width ?? 0;
      if (!stage || !width) return;
      const next = band.nextElementSibling;
      unregister = registerTrack({
        id: `band-${id}`,
        world: cfg.world,
        label: cfg.title,
        mode: "span",
        el: stage,
        layout,
        scale: width / layout.width,
        section: next instanceof HTMLElement && next.tagName === "SECTION" ? next : null,
        pre: 0.45,
      });
    };

    register();
    const ro = new ResizeObserver(register);
    ro.observe(band);
    mq.addEventListener("change", register);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", register);
      unregister?.();
    };
  }, [id]);

  return <span ref={ref} hidden />;
}
