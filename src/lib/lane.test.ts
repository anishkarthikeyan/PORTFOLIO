import { describe, expect, it } from "vitest";
import { HERO_H } from "@/components/journey/heroSprite";
import { buildLane, LANE, laneRestAt, laneStateAt, spriteBounds, type Lane } from "./lane";

const cases: [string, { width: number; height: number; anchors: number[] }][] = [
  ["narrow lane, few anchors", { width: 42, height: 400, anchors: [20, 120, 260] }],
  ["wide lane (capped), many anchors", { width: 120, height: 900, anchors: [18, 60, 70, 200, 330, 340, 600, 610, 800] }],
  ["no anchors (fillers only)", { width: 50, height: 600, anchors: [] }],
  ["anchors near the end are skipped", { width: 48, height: 300, anchors: [10, 280, 290] }],
];

function sample(lane: Lane, n = 3000) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = lane.startAt - 10 + ((lane.endAt - lane.startAt + 20) * i) / n;
    return { t, s: laneStateAt(lane, t) };
  });
}

describe.each(cases)("lane: %s", (_name, input) => {
  const lane = buildLane(input)!;

  it("builds", () => {
    expect(lane).not.toBeNull();
    expect(lane.width).toBeLessThanOrEqual(LANE.maxWidth);
  });

  it("orders ledges top→bottom with room for the character between them", () => {
    for (let i = 1; i < lane.ledges.length; i++) {
      expect(lane.ledges[i].y - lane.ledges[i - 1].y).toBeGreaterThanOrEqual(LANE.minGap - 0.001);
    }
    expect(lane.endAt).toBeLessThanOrEqual(lane.height);
  });

  it("lands on and leaves every ledge within its span", () => {
    for (const l of lane.ledges) {
      expect(l.landX).toBeGreaterThanOrEqual(l.x0);
      expect(l.landX).toBeLessThanOrEqual(l.x1);
      expect(l.edgeX).toBeGreaterThanOrEqual(l.x0);
      expect(l.edgeX).toBeLessThanOrEqual(l.x1);
    }
  });

  it("keeps the sprite inside the lane (never over content)", () => {
    for (const { t, s } of sample(lane)) {
      if (!s.visible) continue;
      const b = spriteBounds(s);
      expect(b.left, `left at t=${t}`).toBeGreaterThanOrEqual(0);
      expect(b.right, `right at t=${t}`).toBeLessThanOrEqual(lane.width);
      expect(b.top + s.clip, `top at t=${t}`).toBeGreaterThanOrEqual(-HERO_H);
    }
  });

  it("is hidden in the pipes before the start and after the end", () => {
    expect(laneStateAt(lane, lane.startAt - 1).visible).toBe(false);
    expect(laneStateAt(lane, lane.endAt).visible).toBe(false);
    expect(laneStateAt(lane, lane.endAt + 500).visible).toBe(false);
  });

  it("is pure: the same target line always gives the same state (reverse scroll)", () => {
    const ts = [lane.startAt + 5, lane.ledges[1].y + 3, lane.ledges[2].y - 2, lane.endAt - 4];
    const forward = ts.map((t) => laneStateAt(lane, t));
    const backward = [...ts].reverse().map((t) => laneStateAt(lane, t)).reverse();
    expect(backward).toEqual(forward);
  });

  it("stands on a ledge when the target line is exactly at it", () => {
    for (const l of lane.ledges.slice(0, -1)) {
      const s = laneStateAt(lane, l.y);
      expect(s.y).toBeCloseTo(l.y);
      expect(s.x).toBeCloseTo(l.landX);
    }
  });

  it("emerges from the first pipe and sinks into the last (clipped only there)", () => {
    const states = sample(lane).map((x) => x.s);
    expect(Math.max(...states.map((s) => s.puffExit))).toBeGreaterThan(0.5);
    expect(Math.max(...states.map((s) => s.puffEntry))).toBeGreaterThan(0.5);
    for (const s of states) if (s.clip > 0) expect(["pipe", "land", "fall"]).toContain(s.frame);
  });

  it("descends overall as the page scrolls down", () => {
    const ys = sample(lane, 60)
      .map((x) => x.s)
      .filter((s) => s.visible && s.clip === 0)
      .map((s) => s.y);
    expect(ys[ys.length - 1]).toBeGreaterThan(ys[0]);
  });

  it("has a reduced-motion pose on a ledge", () => {
    const mid = (lane.startAt + lane.endAt) / 2;
    const rest = laneRestAt(lane, mid);
    expect(rest.visible).toBe(true);
    expect(lane.ledges.some((l) => l.y === rest.y)).toBe(true);
  });
});

describe("lane limits", () => {
  it("refuses lanes too narrow for the character", () => {
    expect(buildLane({ width: 30, height: 800, anchors: [] })).toBeNull();
  });
  it("refuses zones too short for a descent", () => {
    expect(buildLane({ width: 50, height: 120, anchors: [] })).toBeNull();
  });
});
