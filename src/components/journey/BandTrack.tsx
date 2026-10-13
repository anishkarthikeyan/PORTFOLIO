"use client";

import { useEffect, useRef } from "react";
import { getBand, type TrackLayout } from "@/data/worlds";
import { compileRoute } from "@/lib/journey";
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
      const onBeat = beatAnimator(stage, layout);
      unregister = registerTrack({
        id: `band-${id}`,
        world: cfg.world,
        label: cfg.title,
        mode: "span",
        el: stage,
        layout,
        scale: width / layout.width,
        section: next instanceof HTMLElement && next.tagName === "SECTION" ? next : null,
        pre: 0.7,
        onBeat,
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

/**
 * Moves the band's vehicles with the character and sets data-cue-state
 * ("before" / "on" / "after") on props whose cue matches the playing step.
 * Pure function of the beat, so scrolling back replays it exactly.
 */
function beatAnimator(stage: Element, layout: TrackLayout) {
  const { segments } = compileRoute(layout);
  const movers = segments.flatMap((sg, i) => {
    const el = stage.querySelector<SVGGElement>(`[data-mover="${i}"]`);
    return el ? [{ el, sg }] : [];
  });
  const cues = segments.flatMap((sg) =>
    sg.step.cue ? Array.from(stage.querySelectorAll<SVGElement>(`[data-cue="${sg.step.cue}"]`), (el) => ({ el, sg })) : [],
  );
  return (beat: number) => {
    for (const { el, sg } of movers) {
      const t = Math.min(1, Math.max(0, (beat - sg.b0) / (sg.b1 - sg.b0 || 1)));
      el.setAttribute("transform", `translate(${sg.from[0] + (sg.to[0] - sg.from[0]) * t} ${sg.from[1] + (sg.to[1] - sg.from[1]) * t})`);
    }
    for (const { el, sg } of cues) {
      const state = beat < sg.b0 ? "before" : beat < sg.b1 ? "on" : "after";
      if (el.dataset.cueState !== state) el.dataset.cueState = state;
    }
  };
}
