"use client";

import { useEffect, useRef } from "react";
import { camAt, planPin, scrollForCam, type PinPlan } from "@/lib/pin";
import styles from "./PinnedScene.module.css";

/** Reading time per stop, as a fraction of the stage height in scroll px. */
const HOLD = 0.45;

/**
 * A "pinned scene": the section sticks to the screen while vertical scrolling
 * drives a camera across a wide strip, so the world travels sideways like a
 * side-scrolling level. Scrolling is never hijacked — the scene is simply as
 * tall as its sideways travel, and the strip's offset follows scroll position.
 *
 * The journey controller reads the same geometry (data-pin-*) to place the
 * character on tracks inside the strip.
 *
 * The camera holds on each `[data-pin-stop]` child (centered on screen) for
 * HOLD × the stage height of scroll — reading time — then pans on.
 *
 * Fallbacks: without JavaScript the strip scrolls sideways natively; with
 * reduced motion, or a screen too short to show a whole item under the
 * header (e.g. a phone in landscape), it wraps into a normal vertical layout.
 */
export function PinnedScene({ label, children }: { label: string; children: React.ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const stage = stageRef.current;
    const strip = stripRef.current;
    if (!scene || !stage || !strip) return;
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let travel = 0;
    let plan: PinPlan = planPin([], 0, 0);

    /** Camera offset for the current scroll position (0 … travel). */
    const camera = () => {
      const pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      return camAt(plan, pinTop - scene.getBoundingClientRect().top);
    };
    const apply = () => {
      strip.style.transform = travel ? `translate3d(${-camera().toFixed(1)}px, 0, 0)` : "";
    };
    const measure = () => {
      strip.style.transform = "";
      // Pin only if every item fits under the header, measured in the row
      // layout: first as is, then with data-fit="compact" (children may hide
      // secondary details); otherwise fall back to the vertical layout.
      scene.dataset.pinned = "true";
      const room = window.innerHeight - (parseFloat(getComputedStyle(stage).top) || 0);
      const fits = () => Math.max(0, ...Array.from(strip.children, (c) => (c as HTMLElement).offsetHeight)) <= room;
      let pinned = false;
      if (!reduceMq.matches) {
        scene.dataset.fit = "full";
        pinned = fits();
        if (!pinned) {
          scene.dataset.fit = "compact";
          pinned = fits();
        }
      }
      if (!pinned) scene.dataset.fit = "full";
      scene.dataset.pinned = pinned ? "true" : "false";
      travel = pinned ? Math.max(0, strip.scrollWidth - stage.clientWidth) : 0;
      // Rest the camera with each stop centered on screen.
      const left = strip.getBoundingClientRect().left;
      const stops = Array.from(strip.querySelectorAll<HTMLElement>("[data-pin-stop]"), (el) => {
        const r = el.getBoundingClientRect();
        const at = r.left - left + r.width / 2;
        return { at, cam: at - stage.clientWidth / 2 };
      });
      plan = planPin(travel ? stops : [], travel, stage.clientHeight * HOLD);
      scene.dataset.travel = String(travel);
      scene.dataset.pinPlan = JSON.stringify(plan);
      // Tall enough to scroll through the whole plan while the stage is pinned.
      scene.style.height = pinned ? `${stage.offsetHeight + plan.length}px` : "";
      apply();
    };

    // Focus on something off to the side (keyboard Tab): scroll the page so
    // the camera brings it into view, instead of letting the browser shift the stage.
    const onFocus = (e: FocusEvent) => {
      if (!travel) return;
      stage.scrollLeft = 0;
      const el = e.target as HTMLElement;
      const x = el.getBoundingClientRect().left - strip.getBoundingClientRect().left;
      const want = Math.min(travel, Math.max(0, x - stage.clientWidth * 0.2));
      const pinTop = parseFloat(getComputedStyle(stage).top) || 0;
      const sceneDocTop = scene.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: sceneDocTop - pinTop + scrollForCam(plan, want), behavior: "instant" });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(strip);
    ro.observe(stage);
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", measure);
    reduceMq.addEventListener("change", measure);
    stage.addEventListener("focusin", onFocus);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", measure);
      reduceMq.removeEventListener("change", measure);
      stage.removeEventListener("focusin", onFocus);
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.scene} data-pin-scene>
      <div ref={stageRef} className={styles.stage} data-pin-stage role="region" aria-label={label}>
        <div ref={stripRef} className={styles.strip} data-pin-strip>
          {children}
        </div>
      </div>
    </div>
  );
}
