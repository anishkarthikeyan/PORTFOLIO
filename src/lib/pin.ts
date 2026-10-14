/**
 * Camera plan for pinned (sideways) scenes. Pure functions only.
 *
 * Scrolling through a pinned scene moves its camera from 0 to `travel` (px of
 * sideways offset). The camera pans 1:1 with scroll, but *holds* on each stop
 * (a card centered on screen) for `hold` px of scroll — reading time — before
 * panning on. Near the ends, where the camera can't center a card, it stays
 * put while the character walks on to the next stop. Both the scene (to move
 * the strip) and the journey controller (to keep the character in step) use
 * the same plan.
 */

export interface PinPlan {
  /** [scroll offset past the pin point, camera] — piecewise linear. */
  knots: [number, number][];
  /** Scroll ranges where the camera rests at `cam`; `at` is the stop's strip x. */
  holds: { cam: number; at: number; from: number; to: number }[];
  /** Total scroll the scene consumes (its extra height). */
  length: number;
  travel: number;
}

/**
 * Plans the camera for stops: `at` is the stop's center in strip px, `cam` the
 * camera that centers it (clamped to [0, travel]).
 */
export function planPin(stops: { at: number; cam: number }[], travel: number, hold: number): PinPlan {
  const sorted = [...stops].sort((a, b) => a.at - b.at);
  const knots: [number, number][] = [[0, 0]];
  const holds: PinPlan["holds"] = [];
  let s = 0;
  let cam = 0;
  let prevAt: number | null = null;
  for (const st of sorted) {
    const c = Math.round(Math.min(travel, Math.max(0, st.cam)));
    if (c > cam) {
      s += c - cam;
      cam = c;
      knots.push([s, cam]);
    } else if (prevAt !== null && st.at > prevAt) {
      // Camera can't move further: scroll while the character walks to this stop.
      s += st.at - prevAt;
      knots.push([s, cam]);
    }
    prevAt = st.at;
    if (hold > 0) {
      holds.push({ cam, at: st.at, from: s, to: s + hold });
      s += hold;
      knots.push([s, cam]);
    }
  }
  if (travel > cam) {
    s += travel - cam;
    knots.push([s, travel]);
  }
  return { knots, holds, length: s, travel };
}

/** Camera for a scroll offset past the pin point (0 before, `travel` after). */
export function camAt(plan: PinPlan, s: number): number {
  const k = plan.knots;
  if (s <= 0) return 0;
  for (let i = 1; i < k.length; i++) {
    if (s <= k[i][0]) {
      const [s0, c0] = k[i - 1];
      const [s1, c1] = k[i];
      return s1 === s0 ? c1 : c0 + ((c1 - c0) * (s - s0)) / (s1 - s0);
    }
  }
  return plan.travel;
}

/**
 * Scroll offset where the *view* reaches camera position `cam`, extended 1:1
 * outside [0, travel] (before pinning the scene scrolls in; after, it scrolls
 * out). For a camera that is held, the start of the hold.
 */
export function scrollForCam(plan: PinPlan, cam: number): number {
  if (cam <= 0) return cam;
  if (cam >= plan.travel) return plan.length + (cam - plan.travel);
  const k = plan.knots;
  for (let i = 1; i < k.length; i++) {
    const [s0, c0] = k[i - 1];
    const [s1, c1] = k[i];
    if (cam <= c1 && c1 > c0) return s0 + ((cam - c0) * (s1 - s0)) / (c1 - c0);
  }
  return plan.length;
}
