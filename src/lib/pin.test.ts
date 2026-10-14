import { describe, expect, it } from "vitest";
import { camAt, planPin, scrollForCam } from "./pin";

describe("pinned scene camera plan", () => {
  const stop = (cam: number) => ({ at: cam + 200, cam });
  const plan = planPin([stop(0), stop(300), stop(700)], 1000, 200);

  it("pans 1:1 with scroll and holds on every stop", () => {
    expect(plan.holds.map((h) => h.cam)).toEqual([0, 300, 700]);
    // 1000 px of panning + 3 holds of 200 px.
    expect(plan.length).toBe(1600);
    for (const h of plan.holds) {
      expect(camAt(plan, h.from)).toBeCloseTo(h.cam);
      expect(camAt(plan, (h.from + h.to) / 2)).toBeCloseTo(h.cam);
      expect(camAt(plan, h.to)).toBeCloseTo(h.cam);
    }
  });

  it("is monotonic and clamped", () => {
    let prev = -1;
    for (let s = -100; s <= 1800; s += 7) {
      const c = camAt(plan, s);
      expect(c).toBeGreaterThanOrEqual(prev);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(1000);
      prev = c;
    }
  });

  it("inverts: the scroll for a camera position lands on that position", () => {
    for (const cam of [50, 299, 450, 900]) expect(camAt(plan, scrollForCam(plan, cam))).toBeCloseTo(cam);
    // Outside the scene the camera keeps moving with the page.
    expect(scrollForCam(plan, -40)).toBe(-40);
    expect(scrollForCam(plan, 1100)).toBe(1700);
    // A held camera maps to the start of its hold.
    expect(scrollForCam(plan, 300)).toBeCloseTo(plan.holds[1].from);
  });

  it("gives every stop its own hold, even where the camera is clamped at an end", () => {
    // Two cards fit on screen at the end: both want a camera beyond the travel.
    const p = planPin([{ at: 300, cam: 100 }, { at: 1100, cam: 900 }, { at: 1500, cam: 1300 }], 800, 100);
    expect(p.holds.map((h) => [h.cam, h.at])).toEqual([[100, 300], [800, 1100], [800, 1500]]);
    // While clamped, the camera stays put for as long as the walk to the next stop.
    expect(p.holds[2].from - p.holds[1].to).toBe(400);
    expect(camAt(p, (p.holds[1].to + p.holds[2].from) / 2)).toBe(800);
  });
});
