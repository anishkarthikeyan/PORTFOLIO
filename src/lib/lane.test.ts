import { describe, expect, it } from "vitest";
import { compileRoute, stateAtBeat } from "./journey";
import { buildLane, LANE } from "./lane";

const cases: [string, { width: number; height: number; anchors: number[] }][] = [
  ["narrow lane, few anchors", { width: 42, height: 400, anchors: [20, 120, 260] }],
  ["wide lane (capped), many anchors", { width: 120, height: 900, anchors: [18, 60, 70, 200, 330, 340, 600, 610, 800] }],
  ["no anchors (fillers only)", { width: 50, height: 600, anchors: [] }],
];

describe.each(cases)("lane: %s", (_name, input) => {
  const lane = buildLane(input)!;

  it("builds within the width cap", () => {
    expect(lane).not.toBeNull();
    expect(lane.width).toBeLessThanOrEqual(LANE.maxWidth);
  });

  it("orders ledges top→bottom with room for the character between them", () => {
    for (let i = 1; i < lane.ledges.length; i++) {
      expect(lane.ledges[i].y - lane.ledges[i - 1].y).toBeGreaterThanOrEqual(LANE.minGap - 0.001);
    }
  });

  it("lands on and leaves every ledge within its span", () => {
    for (const l of lane.ledges) {
      for (const x of [l.landX, l.edgeX]) {
        expect(x).toBeGreaterThanOrEqual(l.x0);
        expect(x).toBeLessThanOrEqual(l.x1);
      }
    }
  });

  it("route visits every ledge in order and ends inside the exit pipe", () => {
    const route = compileRoute(lane.layout);
    const landings = route.segments.filter((s) => ["jump", "slide", "climb"].includes(s.step.kind)).map((s) => s.to[1]);
    for (const l of lane.ledges) expect(landings).toContain(l.y);
    expect(route.endsInPipe).toBe(true);
    expect(stateAtBeat(route, route.total).visible).toBe(false);
  });
});

describe("lane variety", () => {
  it("rotates the way down so consecutive ledges never repeat a move", () => {
    const lane = buildLane({ width: 50, height: 900, anchors: [] })!;
    const downs = lane.ledges.map((l) => l.down).filter(Boolean);
    expect(new Set(downs).size).toBe(3);
    downs.slice(1).forEach((d, i) => expect(d).not.toBe(downs[i]));
  });
});

describe("lane limits", () => {
  it("refuses lanes too narrow for the character", () => {
    expect(buildLane({ width: 30, height: 800, anchors: [] })).toBeNull();
  });
  it("refuses spaces too short for a descent", () => {
    expect(buildLane({ width: 50, height: 100, anchors: [] })).toBeNull();
  });
});
