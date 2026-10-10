import { describe, expect, it } from "vitest";
import { WORLD_BANDS, type BandLayout } from "@/data/worlds";
import { HERO_FRAMES, HERO_H, HERO_W } from "@/components/journey/heroSprite";
import {
  bandProgress,
  characterAt,
  compileRoute,
  parallaxOffset,
  pickActiveBand,
  restState,
  ROUTE_END,
  ROUTE_START,
  routeProgress,
} from "./journey";

const layouts: [string, BandLayout][] = WORLD_BANDS.flatMap((b) => [
  [`${b.id}/wide`, b.wide] as [string, BandLayout],
  [`${b.id}/compact`, b.compact] as [string, BandLayout],
]);

/** Is the point (feet) resting on a platform or pipe rim? */
function onSurface(layout: BandLayout, x: number, y: number) {
  const surfaces = [
    ...layout.platforms.map((p) => ({ x: p.x, w: p.w, y: p.y })),
    ...[layout.exitPipe, layout.entryPipe].filter(Boolean).map((p) => ({ x: p!.x, w: p!.w, y: p!.y })),
  ];
  return surfaces.some((s) => Math.abs(s.y - y) < 0.01 && x >= s.x && x <= s.x + s.w);
}

/** Solid rectangles the feet must never be inside. */
function solids(layout: BandLayout) {
  const bottom = layout.height;
  return [
    ...layout.platforms.map((p) => ({ x0: p.x, x1: p.x + p.w, y0: p.y, y1: p.h ? p.y + p.h : bottom })),
    ...[layout.exitPipe, layout.entryPipe].filter(Boolean).map((p) => ({ x0: p!.x, x1: p!.x + p!.w, y0: p!.y, y1: bottom })),
  ];
}

describe("hero sprite", () => {
  it("has every animation state at a fixed size", () => {
    const required = ["idle", "blink", "walk1", "walk2", "walk3", "walk4", "run1", "run2", "run3", "run4", "jump", "fall", "land", "pipe", "celebrate", "climb1", "climb2", "wave"];
    for (const name of required) {
      const frame = HERO_FRAMES[name as keyof typeof HERO_FRAMES];
      expect(frame, name).toBeDefined();
      expect(frame.length).toBe(HERO_H);
      frame.forEach((row) => expect(row.length).toBe(HERO_W));
    }
  });
});

describe("band progress", () => {
  it("is 0 when the band enters and 1 when it leaves its window", () => {
    const vh = 1000;
    const top = 5000;
    const h = 250;
    // p = 0 when band top is at 85% of viewport
    expect(bandProgress(top - 850, vh, top, h)).toBeCloseTo(0);
    // p = 1 when band bottom is at 15% of viewport
    expect(bandProgress(top + h - 150, vh, top, h)).toBeCloseTo(1);
  });

  it("is monotonic in scroll position", () => {
    let prev = -Infinity;
    for (let y = 0; y < 3000; y += 37) {
      const p = bandProgress(y, 800, 1500, 200);
      expect(p).toBeGreaterThan(prev);
      prev = p;
    }
  });

  it("maps band progress to route progress with idle margins", () => {
    expect(routeProgress(ROUTE_START)).toBe(0);
    expect(routeProgress(ROUTE_END)).toBe(1);
    expect(routeProgress(-5)).toBe(0);
    expect(routeProgress(5)).toBe(1);
  });

  it("picks the in-window band closest to its midpoint", () => {
    expect(pickActiveBand([-0.2, 0.3, 0.9, 1.4])).toBe(1);
    expect(pickActiveBand([-1, -0.1, 1.2])).toBe(-1);
  });

  it("parallax is centered and bounded", () => {
    expect(parallaxOffset(0.5)).toBe(0);
    expect(Math.abs(parallaxOffset(-3))).toBeLessThanOrEqual(7);
  });
});

describe.each(layouts)("route %s", (_name, layout) => {
  const route = compileRoute(layout);

  it("starts and ends at the right places", () => {
    expect(route.segments.length).toBeGreaterThan(2);
    expect(route.segments[0].start).toBe(0);
    expect(route.segments.at(-1)!.end).toBeCloseTo(1);
  });

  it("lands every move on a platform or pipe rim", () => {
    for (const s of route.segments) {
      if (s.step.kind === "enter") continue; // ends inside the pipe
      expect(onSurface(layout, s.to[0], s.to[1]), `${s.step.kind} → ${s.to}`).toBe(true);
    }
  });

  it("never passes through platforms or pipes, and stays inside the band", () => {
    const boxes = solids(layout);
    for (let i = 0; i <= 2000; i++) {
      const p = ROUTE_START + ((ROUTE_END - ROUTE_START) * i) / 2000;
      const st = characterAt(route, layout, p);
      if (!st.visible) continue;
      // sprite bounds (pipe travel is clipped, so only the visible part counts)
      expect(st.y - HERO_H, `top at p=${p}`).toBeGreaterThanOrEqual(-0.5);
      expect(st.x - HERO_W / 2).toBeGreaterThanOrEqual(0);
      expect(st.x + HERO_W / 2).toBeLessThanOrEqual(layout.width);
      if (st.clip > 0) continue; // inside a pipe opening
      for (const b of boxes) {
        const inside = st.x > b.x0 + 0.5 && st.x < b.x1 - 0.5 && st.y > b.y0 + 0.5 && st.y < b.y1;
        expect(inside, `feet inside solid at p=${p.toFixed(4)} (${st.x.toFixed(1)}, ${st.y.toFixed(1)})`).toBe(false);
      }
    }
  });

  it("is a pure function of progress (reverse scroll replays the same states)", () => {
    const forward = [0.05, 0.2, 0.4, 0.6, 0.8, 0.95].map((p) => characterAt(route, layout, p));
    const backward = [0.95, 0.8, 0.6, 0.4, 0.2, 0.05].map((p) => characterAt(route, layout, p)).reverse();
    expect(backward).toEqual(forward);
  });

  it("hides the character inside pipes before/after the route", () => {
    if (route.startsInPipe) expect(characterAt(route, layout, 0).visible).toBe(false);
    else expect(characterAt(route, layout, 0)).toMatchObject({ visible: true, frame: "idle" });
    expect(characterAt(route, layout, 1).visible).toBe(!route.endsInPipe);
  });

  it("clips the sprite while emerging and entering, never otherwise", () => {
    for (let i = 0; i <= 400; i++) {
      const st = characterAt(route, layout, i / 400);
      if (st.clip > 0) expect(st.frame === "pipe" || st.frame === "land" || st.frame === "fall").toBe(true);
    }
  });

  it("reveals the section heading after landing, and stays revealed past the band", () => {
    expect(characterAt(route, layout, 0).arrived).toBe(false);
    expect(characterAt(route, layout, ROUTE_END).arrived).toBe(true);
    expect(characterAt(route, layout, 1.5).arrived).toBe(true);
  });

  it("has a reduced-motion rest pose on a surface", () => {
    const rest = restState(route, layout);
    expect(rest.visible).toBe(true);
    expect(onSurface(layout, rest.x, rest.y)).toBe(true);
  });
});

describe("pipe transitions", () => {
  it("every band warps onward through a pipe; every band except the spawn emerges from one", () => {
    WORLD_BANDS.forEach((b, i) => {
      for (const layout of [b.wide, b.compact]) {
        const r = compileRoute(layout);
        expect(r.endsInPipe, `${b.id} enters`).toBe(true);
        expect(r.startsInPipe, `${b.id} emerges`).toBe(i > 0);
      }
    });
  });

  it("puffs only around pipe travel", () => {
    const layout = WORLD_BANDS[1].wide;
    const route = compileRoute(layout);
    const mid = characterAt(route, layout, 0.5);
    expect(mid.puffEntry).toBe(0);
    expect(mid.puffExit).toBe(0);
    const peaks = Array.from({ length: 200 }, (_, i) => characterAt(route, layout, i / 200));
    expect(Math.max(...peaks.map((s) => s.puffExit))).toBeGreaterThan(0.5);
    expect(Math.max(...peaks.map((s) => s.puffEntry))).toBeGreaterThan(0.5);
  });

  it("fast scrolls that skip the whole route resolve to a stable hidden state", () => {
    const layout = WORLD_BANDS[2].wide;
    const route = compileRoute(layout);
    expect(characterAt(route, layout, 3)).toEqual(characterAt(route, layout, 1));
    expect(characterAt(route, layout, -3)).toEqual(characterAt(route, layout, 0));
  });
});
