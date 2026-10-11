import { describe, expect, it } from "vitest";
import type { TrackLayout } from "@/data/worlds";
import { HERO_H, HERO_W } from "@/components/journey/heroSprite";
import { compileRoute, stateAtBeat } from "./journey";
import { bfs, buildDungeon, buildGirders, buildInvaders, buildLab, buildMaze, type GirderMeta, type LabMeta, type MazeMeta } from "./games";
import { buildCorridor } from "./tracks";

const sample = (layout: TrackLayout, n = 3000) => {
  const route = compileRoute(layout);
  return Array.from({ length: n + 1 }, (_, i) => {
    const beat = (route.total * i) / n;
    return { beat, s: stateAtBeat(route, beat) };
  });
};

const cases: [string, TrackLayout | null][] = [
  ["maze wide", buildMaze({ width: 300 })],
  ["maze narrow", buildMaze({ width: 150 })],
  ["lab", buildLab({ width: 300 })],
  ["lab narrow", buildLab({ width: 210 })],
  ["lab phone", buildLab({ width: 146 })],
  ["lab inside a phone card", buildLab({ width: 126 })],
  ["girders phone", buildGirders({ width: 146, floors: 3 })],
  ["dungeon phone", buildDungeon({ width: 146, prize: "YOU GOT IT" })],
  ["invaders phone", buildInvaders({ width: 146, targets: [{ x: 51, id: "a" }, { x: 73, id: "b" }, { x: 95, id: "c" }] })],
  ["maze phone", buildMaze({ width: 146 })],
  ["girders 3", buildGirders({ width: 280, floors: 3 })],
  ["girders 5", buildGirders({ width: 200, floors: 5 })],
  ["dungeon", buildDungeon({ width: 260, prize: "YOU GOT IT" })],
  ["invaders", buildInvaders({ width: 300, targets: [{ x: 60, id: "a" }, { x: 150, id: "b" }, { x: 240, id: "c" }] })],
  ["corridor with boss", buildCorridor({ width: 320, stops: [{ x: 120, kind: "bug" }, { x: 240, kind: "boss" }] })],
  ["corridor with npcs", buildCorridor({ width: 320, stops: [{ x: 90, kind: "npc", block: { id: "n1", label: "hi" } }, { x: 180, kind: "npc", block: { id: "n2", label: "yo" } }, { x: 260, kind: "pedestal" }] })],
];

describe.each(cases)("%s", (_name, layout) => {
  it("builds", () => expect(layout).not.toBeNull());
  if (!layout) return;
  const route = compileRoute(layout);

  it("keeps the (possibly mini) sprite inside the track", () => {
    for (const { beat, s } of sample(layout)) {
      if (!s.visible) continue;
      const k = s.scale ?? 1;
      expect(s.x - (HERO_W * k) / 2, `left @${beat}`).toBeGreaterThanOrEqual(-0.01);
      expect(s.x + (HERO_W * k) / 2, `right @${beat}`).toBeLessThanOrEqual(layout.width + 0.01);
      if (s.clip === 0) expect(s.y - HERO_H * k, `head @${beat}`).toBeGreaterThanOrEqual(-0.5);
    }
  });

  it("fires exactly one event per interactive block", () => {
    const ids = (layout.blocks ?? []).filter((b) => b.kind !== "star").map((b) => b.id).sort();
    expect(route.events.filter((e) => e.kind !== "item").map((e) => e.id).sort()).toEqual(ids);
  });

  it("ends inside its exit pipe", () => {
    expect(route.endsInPipe).toBe(true);
    expect(stateAtBeat(route, route.total).visible).toBe(false);
  });
});

describe("pac-man maze", () => {
  const layout = buildMaze({ width: 300 })!;
  const m = layout.meta!.maze as MazeMeta;
  const route = compileRoute(layout);

  it("is deterministic (same seed, same maze)", () => {
    expect((buildMaze({ width: 300 })!.meta!.maze as MazeMeta).walls).toEqual(m.walls);
  });

  it("only walks through open cells, cornering on the grid", () => {
    for (const { s } of sample(layout, 2000)) {
      if (!s.visible || s.clip > 0) continue;
      const c = Math.floor((s.x - m.ox) / m.tile);
      const r = Math.floor((s.y - 6 - m.oy) / m.tile);
      if (c < 0 || c >= m.cols) continue; // outside the maze, at the pipes
      expect(m.walls[r][c], `wall at ${r},${c}`).toBe(false);
    }
  });

  it("eats a dot on every path cell and the power pellet before catching the ghost", () => {
    const pellet = route.events.find((e) => e.id.endsWith("-pellet"))!;
    const ghost = route.events.find((e) => e.id.endsWith("-ghost"))!;
    expect(pellet.beat).toBeLessThan(ghost.beat);
    expect(route.events.filter((e) => e.kind === "coin").length).toBeGreaterThan(10);
  });

  it("BFS distances grow by one per step from the ghost", () => {
    const { dist } = bfs(m.walls, m.ghostStart);
    expect(dist[m.ghostStart[0]][m.ghostStart[1]]).toBe(0);
    for (let r = 0; r < m.rows; r++)
      for (let c = 0; c < m.cols; c++) {
        if (dist[r][c] <= 0) continue;
        const nb = [
          [r - 1, c],
          [r + 1, c],
          [r, c - 1],
          [r, c + 1],
        ].filter(([a, b]) => dist[a]?.[b] >= 0);
        expect(Math.min(...nb.map(([a, b]) => dist[a][b]))).toBe(dist[r][c] - 1);
      }
  });
});

describe.each([300, 210, 146, 126])("jetpack lab %i", (w) => {
  const layout = buildLab({ width: w })!;
  const lab = layout.meta!.lab as LabMeta;
  it("never touches a zapper beam while flying", () => {
    for (const { s } of sample(layout, 4000)) {
      if (!s.visible) continue;
      for (const z of lab.zappers) {
        if (Math.abs(s.x - z.x) > HERO_W / 2 + 1) continue;
        const overlap = s.y > z.y0 && s.y - HERO_H < z.y1;
        expect(overlap, `zapper at ${z.x}: body ${s.y - HERO_H}..${s.y} vs ${z.y0}..${z.y1}`).toBe(false);
      }
    }
  });
  it("has zappers to dodge (alternating high and low on wide labs)", () => {
    if (w >= 146) expect(lab.zappers.length).toBeGreaterThanOrEqual(1);
    if (w >= 210) expect(new Set(lab.zappers.map((z) => z.y0 < 10)).size).toBe(2);
  });
});

describe("girders", () => {
  const layout = buildGirders({ width: 280, floors: 3 })!;
  const meta = layout.meta!.girders as GirderMeta;
  it("climbs a ladder between every pair of girders and jumps a barrel on each lower girder", () => {
    const route = compileRoute(layout);
    expect(route.segments.filter((s) => s.step.kind === "climb").length).toBe(2);
    expect(meta.barrels.length).toBe(2);
  });
  it("never pokes its head through the girder above while jumping", () => {
    for (const { s } of sample(layout)) {
      if (!s.visible || s.frame.startsWith("climb")) continue;
      for (const g of meta.girders) {
        if (g.y >= s.y) continue;
        const headInGirder = s.y - HERO_H < g.y + 4 && s.y - HERO_H > g.y - 1;
        expect(headInGirder, `head ${s.y - HERO_H} vs girder ${g.y}`).toBe(false);
      }
    }
  });
});

describe("boss", () => {
  it("takes three stomps", () => {
    const layout = buildCorridor({ width: 320, stops: [{ x: 240, kind: "boss" }] })!;
    expect(compileRoute(layout).events.filter((e) => e.kind === "stomp").length).toBe(3);
  });
});
