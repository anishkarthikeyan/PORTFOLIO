import { describe, expect, it } from "vitest";
import { buildJourneyMap, CHASE, chaseStep, crossedEvents, locate, localBeat, targetBeat } from "./chase";

const map = buildJourneyMap([
  { id: "b", start: 1500, end: 1800, total: 6 },
  { id: "a", start: 1000, end: 1400, total: 8 },
  { id: "c", start: 1700, end: 2400, total: 10, knots: [[1700, 0], [2000, 2], [2400, 10]] },
  { id: "d", start: 3000, end: 3300, total: 5 },
  { id: "e", start: 3400, end: 3800, total: 30 },
]);

/** Runs the chase at 60fps for `seconds` toward a fixed target. */
function run(displayed: number, target: number, seconds: number) {
  let d = displayed;
  for (let i = 0; i < seconds * 60; i++) {
    const r = chaseStep(map, d, target, 1 / 60);
    if ("warp" in r) return { d, warped: true, frames: i };
    d = r.beat;
    if (r.settled) return { d, warped: false, frames: i };
  }
  return { d, warped: false, frames: Infinity };
}

describe("journey map", () => {
  it("orders tracks by position and removes overlaps", () => {
    expect(map.tracks.map((t) => t.id)).toEqual(["a", "b", "c", "d", "e"]);
    expect(map.tracks[2].start).toBe(1800); // pushed after b
    expect(map.tracks.map((t) => t.offset)).toEqual([0, 8, 14, 24, 29]);
    expect(map.total).toBe(59);
  });

  it("target beat is monotonic in scroll and constant between tracks (inside a pipe)", () => {
    let prev = -1;
    for (let t = 800; t < 3500; t += 13) {
      const b = targetBeat(map, t);
      expect(b).toBeGreaterThanOrEqual(prev);
      prev = b;
    }
    expect(targetBeat(map, 2600)).toBe(targetBeat(map, 2900));
  });

  it("uses knots for vertical tracks", () => {
    const c = map.tracks[2];
    expect(localBeat(c, 2000)).toBeCloseTo(2);
    expect(localBeat(c, 2400)).toBe(10);
  });

  it("locates global beats", () => {
    expect(locate(map, 0)).toEqual({ index: 0, local: 0 });
    expect(locate(map, 9)).toEqual({ index: 1, local: 1 });
    expect(locate(map, 100).index).toBe(4);
  });
});

describe("chase", () => {
  it("keeps up exactly with slow scrolling", () => {
    const r = chaseStep(map, 2, 2.03, 1 / 60);
    expect("beat" in r && r.beat).toBeCloseTo(2.03);
  });

  it("moves at game speed, never instantly, for a normal scroll", () => {
    const r = chaseStep(map, 1, 4, 1 / 60);
    expect("beat" in r).toBe(true);
    if ("beat" in r) expect(r.beat - 1).toBeLessThan(0.2);
  });

  it("catches up within one to two seconds, sprinting when far behind", () => {
    for (const gap of [3, 6, 10]) {
      const r = run(1, 1 + gap, 3);
      expect(r.warped, `gap ${gap}`).toBe(false);
      expect(r.frames / 60, `gap ${gap}`).toBeLessThan(2.2);
    }
    const r = chaseStep(map, 1, 11, 1 / 60);
    expect("speed" in r && r.speed).toBeGreaterThan(CHASE.sprintAt);
  });

  it("walks (no sprint) when only slightly behind", () => {
    const r = chaseStep(map, 1, 2, 1 / 60);
    expect("speed" in r && r.speed).toBeLessThan(CHASE.sprintAt);
  });

  it("warps (through a pipe) only for big jumps", () => {
    expect("warp" in chaseStep(map, 30, 30 + CHASE.warpGap + 1, 1 / 60)).toBe(true);
    expect("warp" in chaseStep(map, 7.5, 29.5, 1 / 60)).toBe(true); // a → e: skips 4 tracks
    expect("warp" in chaseStep(map, 7.9, 14.1, 1 / 60)).toBe(false); // a → c: keeps going
    expect("warp" in chaseStep(map, 7, 9, 1 / 60)).toBe(false); // a → b, adjacent
  });

  it("chases backwards when scrolling up", () => {
    const r = run(6, 3, 3);
    expect(r.d).toBeCloseTo(3);
  });

  it("collects events only when moving forward", () => {
    const ev = [{ beat: 2 }, { beat: 4 }, { beat: 6 }];
    expect(crossedEvents(ev, 1, 4)).toEqual([{ beat: 2 }, { beat: 4 }]);
    expect(crossedEvents(ev, 5, 3)).toEqual([]);
  });
});
