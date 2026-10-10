import { describe, expect, it } from "vitest";
import type { TrackLayout } from "@/data/worlds";
import { HERO_H, HERO_W } from "@/components/journey/heroSprite";
import { compileRoute, stateAtBeat, standingBeat } from "./journey";
import { buildLane } from "./lane";
import {
  battlementGaps,
  BLOCK,
  buildConveyor,
  buildCorridor,
  buildElevator,
  buildFinale,
  buildTree,
  vehicleAt,
} from "./tracks";

const block = (id: string) => ({ id, unlock: `u-${id}`, label: id });

const cases: [string, TrackLayout | null][] = [
  ["corridor: two blocks", buildCorridor({ width: 300, stops: [{ x: 80, kind: "block", block: block("a") }, { x: 220, kind: "block", block: block("b") }] })],
  ["corridor: narrow, one block, clamped stop", buildCorridor({ width: 120, stops: [{ x: 5, kind: "block", block: block("a") }] })],
  ["corridor: map nodes", buildCorridor({ width: 340, stops: [60, 130, 200, 270].map((x) => ({ x, kind: "node" as const })) })],
  ["corridor: pedestal + blocks", buildCorridor({ width: 320, stops: [{ x: 70, kind: "block", block: block("i1") }, { x: 140, kind: "block", block: block("i2") }, { x: 250, kind: "pedestal" }] })],
  ["corridor: castle battlements", buildCorridor({ width: 300, stops: [], gaps: battlementGaps(300), ground: "block" })],
  ["corridor: no pipes (static)", buildCorridor({ width: 200, stops: [], exit: false, entry: false })],
  ["tree: both sides", buildTree({ width: 48, height: 600, knots: [40, 150, 260, 380, 500], sides: [1, -1, 1, -1, 1], acorns: ["a", "b", "c", "d", "e"].map(block) })],
  ["tree: compact one side", buildTree({ width: 36, height: 520, knots: [50, 140, 240, 330, 430], sides: [1, 1, 1, 1, 1], acorns: ["a", "b", "c", "d", "e"].map(block) })],
  ["elevator", buildElevator({ width: 26, height: 500, floors: [70, 220, 360] })],
  ["conveyor", buildConveyor({ width: 260 })],
  ["finale: narrow", buildFinale({ width: 122 })],
  ["finale: wide", buildFinale({ width: 200 })],
  ["lane", buildLane({ width: 44, height: 700, anchors: [20, 200, 420] })?.layout ?? null],
];

function solids(layout: TrackLayout) {
  return [
    ...layout.platforms.map((p) => ({ x0: p.x, x1: p.x + p.w, y0: p.y, y1: p.h ? p.y + p.h : layout.height })),
    // Pipes stand on the platform beneath their center (as rendered).
    ...[layout.exitPipe, layout.entryPipe].filter(Boolean).map((p) => {
      const cx = p!.x + p!.w / 2;
      const under = layout.platforms.filter((pl) => pl.y > p!.y && cx >= pl.x && cx <= pl.x + pl.w).sort((a, b) => a.y - b.y)[0];
      return { x0: p!.x, x1: p!.x + p!.w, y0: p!.y, y1: under ? under.y : layout.height };
    }),
  ];
}

describe.each(cases)("%s", (_name, layout) => {
  it("builds", () => expect(layout).not.toBeNull());
  if (!layout) return;
  const route = compileRoute(layout);

  it("keeps the sprite inside the track and out of solid geometry", () => {
    const boxes = solids(layout);
    for (let i = 0; i <= 3000; i++) {
      const beat = (route.total * i) / 3000;
      const s = stateAtBeat(route, beat);
      if (!s.visible) continue;
      expect(s.x - HERO_W / 2, `left @${beat.toFixed(2)}`).toBeGreaterThanOrEqual(-0.01);
      expect(s.x + HERO_W / 2, `right @${beat.toFixed(2)}`).toBeLessThanOrEqual(layout.width + 0.01);
      expect(s.y - HERO_H + s.clip, `top @${beat.toFixed(2)}`).toBeGreaterThanOrEqual(-HERO_H);
      if (s.clip === 0) expect(s.y - HERO_H, `head @${beat.toFixed(2)}`).toBeGreaterThanOrEqual(-0.5);
      if (s.clip > 0 || ["climb1", "climb2"].includes(s.frame) || s.riding) continue;
      for (const b of boxes) {
        const inside = s.x > b.x0 + 0.5 && s.x < b.x1 - 0.5 && s.y > b.y0 + 0.5 && s.y < b.y1;
        expect(inside, `feet in solid @${beat.toFixed(2)} (${s.x.toFixed(1)}, ${s.y.toFixed(1)})`).toBe(false);
      }
    }
  });

  it("hits every block with its head at the bump", () => {
    for (const ev of route.events.filter((e) => e.kind === "block")) {
      const b = layout.blocks!.find((x) => x.id === ev.id)!;
      expect(b, ev.id).toBeDefined();
      const s = stateAtBeat(route, ev.beat);
      const head = s.y - HERO_H;
      expect(Math.abs(head - (b.y + BLOCK)), `${ev.id} head vs block`).toBeLessThan(2.5);
      expect(s.x + HERO_W / 2 > b.x && s.x - HERO_W / 2 < b.x + BLOCK, `${ev.id} under block`).toBe(true);
      expect(b.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("has one event per block, plus item grabs", () => {
    const blockIds = (layout.blocks ?? []).filter((b) => b.kind !== "star").map((b) => b.id).sort();
    expect(route.events.filter((e) => e.kind === "block").map((e) => e.id).sort()).toEqual(blockIds);
  });

  it("is pure (reverse scrolling replays the same poses)", () => {
    const beats = [0.1, 0.33, 0.5, 0.77, 0.95].map((f) => f * route.total);
    expect(beats.map((b) => stateAtBeat(route, b))).toEqual([...beats].reverse().map((b) => stateAtBeat(route, b)).reverse());
  });

  it("warp landings are never mid-air", () => {
    for (let i = 0; i <= 50; i++) {
      const b = standingBeat(route, (route.total * i) / 50);
      const s = stateAtBeat(route, b);
      expect(["jump", "fall"]).not.toContain(s.frame);
    }
  });
});

describe("specific worlds", () => {
  it("castle hops across every crenel", () => {
    const layout = buildCorridor({ width: 300, stops: [], gaps: battlementGaps(300), ground: "block" })!;
    const jumps = compileRoute(layout).segments.filter((s) => s.step.kind === "jump").length;
    expect(jumps).toBeGreaterThanOrEqual(battlementGaps(300).length);
  });

  it("tree climbs down through holes from branch to branch", () => {
    const layout = buildTree({ width: 48, height: 600, knots: [40, 150, 260, 380, 500], sides: [1, -1, 1, -1, 1], acorns: ["a", "b", "c", "d", "e"].map(block) })!;
    const kinds = compileRoute(layout).segments.map((s) => s.step.kind);
    expect(kinds.filter((k) => k === "emerge").length).toBe(5);
    expect(kinds.filter((k) => k === "enter").length).toBe(5);
    expect(kinds).toContain("climb");
  });

  it("tree drops branches too close together", () => {
    const layout = buildTree({ width: 48, height: 400, knots: [40, 60, 200], sides: [1, -1, 1], acorns: [] })!;
    expect(compileRoute(layout).segments.filter((s) => s.step.kind === "emerge").length).toBe(2);
  });

  it("elevator cab parks at floors and follows rides", () => {
    const layout = buildElevator({ width: 26, height: 500, floors: [70, 220, 360] })!;
    const route = compileRoute(layout);
    expect(vehicleAt(route, 0)!.y).toBe(70);
    const rides = route.segments.filter((s) => s.step.kind === "ride");
    expect(vehicleAt(route, rides[0].b1)!.y).toBeCloseTo(220);
    expect(vehicleAt(route, route.total)!.y).toBeCloseTo(layout.height - 4);
    // Character stands on the cab while riding
    const mid = (rides[0].b0 + rides[0].b1) / 2;
    expect(stateAtBeat(route, mid).y).toBeCloseTo(vehicleAt(route, mid)!.y);
  });

  it("finale climbs three bricks upward, grabs the star, slides the pole, ends visible", () => {
    const layout = buildFinale({ width: 160 })!;
    const route = compileRoute(layout);
    const jumps = route.segments.filter((s) => s.step.kind === "jump").slice(1, 4);
    expect(jumps.map((s) => s.to[1])).toEqual([...jumps.map((s) => s.to[1])].sort((a, b) => b - a));
    expect(route.events.map((e) => e.id)).toContain("star");
    expect(route.segments.some((s) => s.step.kind === "slide")).toBe(true);
    expect(stateAtBeat(route, route.total)).toMatchObject({ visible: true, frame: "celebrate" });
  });

  it("refuses spaces too small to play in", () => {
    expect(buildCorridor({ width: 60, stops: [] })).toBeNull();
    expect(buildFinale({ width: 100 })).toBeNull();
    expect(buildElevator({ width: 10, height: 400, floors: [] })).toBeNull();
  });
});
