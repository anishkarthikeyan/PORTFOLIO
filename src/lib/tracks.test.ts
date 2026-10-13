import { describe, expect, it } from "vitest";
import { getBand, type TrackLayout } from "@/data/worlds";
import { HERO_H, HERO_W } from "@/components/journey/heroSprite";
import { compileRoute, stateAtBeat, standingBeat } from "./journey";
import { buildLane } from "./lane";
import {
  battlementGaps,
  BLOCK,
  buildCorridor,
  buildFinale,
  buildTokenGate,
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
  ["corridor: castle with bugs", buildCorridor({ width: 320, stops: [{ x: 110, kind: "bug" }, { x: 230, kind: "bug" }], gaps: battlementGaps(320), ground: "block" })],
  ["corridor: island with bug + power-up", buildCorridor({ id: "isl", width: 320, stops: [{ x: 70, kind: "power", block: { id: "p", power: "coffee", label: "COFFEE" } }, { x: 150, kind: "bug" }, { x: 240, kind: "block", block: block("b") }] })],
  ["corridor: pac-man dots + pellets", buildCorridor({ id: "pac", width: 320, dots: true, stops: [{ x: 90, kind: "pellet", block: block("i1") }, { x: 170, kind: "pellet", block: block("i2") }, { x: 250, kind: "pedestal" }] })],
  ["corridor: no pipes (static)", buildCorridor({ width: 200, stops: [], exit: false, entry: false })],
  ["tree: both sides", buildTree({ width: 48, height: 600, knots: [40, 150, 260, 380, 500], sides: [1, -1, 1, -1, 1], acorns: ["a", "b", "c", "d", "e"].map(block) })],
  ["tree: compact one side", buildTree({ width: 36, height: 520, knots: [50, 140, 240, 330, 430], sides: [1, 1, 1, 1, 1], acorns: ["a", "b", "c", "d", "e"].map(block) })],
  ["token gate: three gates", buildTokenGate({ width: 300 })],
  ["token gate: narrow", buildTokenGate({ width: 160 })],
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

  it("hits every bumped block with its head", () => {
    const bumped = new Set(["question", "brick", "acorn", "power"]);
    for (const ev of route.events.filter((e) => e.kind === "block")) {
      const b = layout.blocks!.find((x) => x.id === ev.id)!;
      expect(b, ev.id).toBeDefined();
      if (!bumped.has(b.kind)) continue;
      const s = stateAtBeat(route, ev.beat);
      const head = s.y - HERO_H;
      expect(Math.abs(head - (b.y + BLOCK)), `${ev.id} head vs block`).toBeLessThan(2.5);
      expect(s.x + HERO_W / 2 > b.x && s.x - HERO_W / 2 < b.x + BLOCK, `${ev.id} under block`).toBe(true);
      expect(b.y).toBeGreaterThanOrEqual(0);
    }
  });

  it("lands on every enemy it stomps", () => {
    for (const ev of route.events.filter((e) => e.kind === "stomp")) {
      const b = layout.blocks!.find((x) => x.id === ev.id)!;
      const s = stateAtBeat(route, ev.beat);
      expect(Math.abs(s.y - b.y), `${ev.id} feet on bug`).toBeLessThan(1.5);
      expect(Math.abs(s.x - (b.x + BLOCK / 2)), `${ev.id} centred`).toBeLessThan(2);
    }
  });

  it("passes through every coin and pellet it shows", () => {
    const ids = new Set(route.events.map((e) => e.id));
    for (const c of (layout.blocks ?? []).filter((b) => b.kind === "coin" || b.kind === "pellet")) {
      expect(ids.has(c.id), c.id).toBe(true);
    }
  });

  it("has exactly one event per interactive block", () => {
    const ids = (layout.blocks ?? []).filter((b) => b.kind !== "star").map((b) => b.id).sort();
    expect(route.events.filter((e) => e.kind !== "item").map((e) => e.id).sort()).toEqual(ids);
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

  it("vehicles park before rides and follow them (mine cart)", () => {
    const layout = getBand("archive")!.wide;
    const route = compileRoute(layout);
    const ride = route.segments.find((s) => s.step.kind === "ride")!;
    expect(vehicleAt(route, 0)!.x).toBe(ride.from[0]);
    const mid = (ride.b0 + ride.b1) / 2;
    expect(stateAtBeat(route, mid).x).toBeCloseTo(vehicleAt(route, mid)!.x);
    expect(vehicleAt(route, route.total)!.x).toBe(ride.to[0]);
  });

  it("token gates: the throttled gate holds the request until a token refills", () => {
    const layout = buildTokenGate({ width: 300, id: "rl" })!;
    const route = compileRoute(layout);
    const waits = route.segments.filter((s) => s.step.kind === "idle");
    // Free gates: one short pause each. Throttled gate: a long wait, then the open.
    expect(waits.length).toBe(4);
    const opens = route.events.filter((e) => e.id.startsWith("rl-gate-")).map((e) => e.id);
    expect(opens).toEqual(["rl-gate-0", "rl-gate-1", "rl-gate-2"]);
    const throttled = layout.blocks!.find((b) => b.id === "rl-gate-1")!;
    expect(throttled.points).toBeGreaterThan(layout.blocks![0].points);
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

  it("tolerates sub-pixel measurement error (e.g. 47.998 for 48)", () => {
    expect(buildTree({ width: 47.998, height: 600, knots: [40, 200], sides: [1, -1], acorns: [] })).not.toBeNull();
    expect(buildFinale({ width: 119.996 })).not.toBeNull();
  });

  it("refuses spaces too small to play in", () => {
    expect(buildCorridor({ width: 60, stops: [] })).toBeNull();
    expect(buildFinale({ width: 100 })).toBeNull();
  });
});
