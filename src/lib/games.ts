/**
 * Game-specific track builders (watch layer). Each is a pure function that
 * returns a TrackLayout whose `meta` carries the geometry its renderer needs
 * (maze walls, zapper beams, girders, invaders…). Inspired by classic games;
 * all layouts and art are original.
 *
 *   maze      — Pac-Man style maze (DSA): dots, power pellet, ghosts, BFS
 *   lab       — Jetpack lab (System design): thrust/gravity dodging zappers
 *   girders   — Donkey Kong style girders + ladders (Experience): barrels
 *   dungeon   — Zelda style key → door → chest (Education)
 *   invaders  — Space Invaders style (Achievements): ship shoots each card
 */
import type { BlockSpec, PlatformSpec, Point, RouteStep, TrackLayout } from "@/data/worlds";
import { flyPoint } from "./journey";

const snap = (v: number) => Math.floor(v + 0.01);
const PIPE_W = 18;
const PIPE_H = 8;

/** Small deterministic PRNG (mulberry32) so layouts never change between renders. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ========================================================================= */
/*  Maze (Pac-Man)                                                           */
/* ========================================================================= */

export type Cell = [row: number, col: number];

export interface MazeMeta {
  rows: number;
  cols: number;
  tile: number;
  ox: number;
  oy: number;
  /** true = wall */
  walls: boolean[][];
  entry: Cell;
  exit: Cell;
  pellet: Cell;
  path: Cell[];
  /** Where the chasing ghost is caught after the power pellet. */
  meet: Cell;
  ghostStart: Cell;
  /** Ping-pong patrol runs for the other ghosts. */
  patrols: Cell[][];
  /** BFS distance from the chasing ghost's start (-1 = wall). */
  bfs: number[][];
}

export const MAZE = { tile: 12, rows: 9, margin: 18, top: 4 } as const;

/** Breadth-first search on open cells: distances + parent links. */
export function bfs(walls: boolean[][], start: Cell): { dist: number[][]; prev: (Cell | null)[][] } {
  const R = walls.length;
  const C = walls[0].length;
  const dist = walls.map((row) => row.map(() => -1));
  const prev: (Cell | null)[][] = walls.map((row) => row.map(() => null));
  const q: Cell[] = [start];
  dist[start[0]][start[1]] = 0;
  while (q.length) {
    const [r, c] = q.shift()!;
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C || walls[nr][nc] || dist[nr][nc] >= 0) continue;
      dist[nr][nc] = dist[r][c] + 1;
      prev[nr][nc] = [r, c];
      q.push([nr, nc]);
    }
  }
  return { dist, prev };
}

function shortest(walls: boolean[][], from: Cell, to: Cell): Cell[] {
  const { prev, dist } = bfs(walls, from);
  if (dist[to[0]][to[1]] < 0) return [];
  const out: Cell[] = [];
  let cur: Cell | null = to;
  while (cur) {
    out.push(cur);
    cur = prev[cur[0]][cur[1]];
  }
  return out.reverse();
}

export function buildMaze(opts: { width: number; seed?: number; id?: string }): TrackLayout | null {
  const W = snap(opts.width);
  const { tile: T, rows: R, margin: M, top } = MAZE;
  let C = Math.floor((W - 2 * M) / T);
  if (C % 2 === 0) C -= 1;
  if (C < 9) return null;
  const pid = opts.id ?? "maze";
  const rand = rng(opts.seed ?? 7);

  // Perfect maze by randomized DFS over odd cells, then knock out extra walls for loops.
  const walls: boolean[][] = Array.from({ length: R }, () => Array.from({ length: C }, () => true));
  const stack: Cell[] = [[1, 1]];
  walls[1][1] = false;
  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const nbrs = (
      [
        [r - 2, c],
        [r + 2, c],
        [r, c - 2],
        [r, c + 2],
      ] as Cell[]
    ).filter(([nr, nc]) => nr > 0 && nc > 0 && nr < R - 1 && nc < C - 1 && walls[nr][nc]);
    if (!nbrs.length) {
      stack.pop();
      continue;
    }
    const [nr, nc] = nbrs[Math.floor(rand() * nbrs.length)];
    walls[(r + nr) / 2][(c + nc) / 2] = false;
    walls[nr][nc] = false;
    stack.push([nr, nc]);
  }
  for (let r = 1; r < R - 1; r++) {
    for (let c = 1; c < C - 1; c++) {
      const between = (r % 2 === 1) !== (c % 2 === 1);
      if (walls[r][c] && between && rand() < 0.28) walls[r][c] = false;
    }
  }
  const midRow = (R - 1) / 2 % 2 === 1 ? (R - 1) / 2 : (R - 1) / 2 + 1;
  const entry: Cell = [midRow, 0];
  const exit: Cell = [midRow, C - 1];
  walls[entry[0]][entry[1]] = false;
  walls[exit[0]][exit[1]] = false;
  const pellet: Cell = [1, C - 2 - ((C - 3) % 2)];

  const toPellet = shortest(walls, entry, pellet);
  const toExit = shortest(walls, pellet, exit);
  const path = [...toPellet, ...toExit.slice(1)];
  if (path.length < 4) return null;
  const meet = toExit[Math.max(1, Math.floor(toExit.length * 0.55))];
  const ghostStart: Cell = [R - 2, 1];

  // Patrol runs: longest open horizontal stretch in the top and bottom rows not on the path.
  const onPath = new Set(path.map(([r, c]) => `${r},${c}`));
  const patrols: Cell[][] = [];
  for (const r of [R - 2, 1]) {
    let best: Cell[] = [];
    let run: Cell[] = [];
    for (let c = 1; c < C - 1; c++) {
      if (!walls[r][c] && !onPath.has(`${r},${c}`)) run.push([r, c]);
      else run = [];
      if (run.length > best.length) best = [...run];
    }
    if (best.length >= 2) patrols.push(best);
  }

  const center = ([r, c]: Cell): Point => [M + c * T + T / 2, top + r * T + T / 2 + 6];
  const route: RouteStep[] = [{ kind: "emerge" }];
  const first = center(entry);
  route.push({ kind: "move", to: first });
  // Merge consecutive cells moving in the same direction into single moves
  // (a reversal — e.g. backing out of the pellet's dead end — is a new move).
  let dir = "";
  let pending: Point | null = null;
  let caught = false;
  for (let i = 1; i < path.length; i++) {
    const d = `${path[i][0] - path[i - 1][0]},${path[i][1] - path[i - 1][1]}`;
    if (d !== dir && pending) {
      route.push({ kind: "move", to: pending });
    }
    dir = d;
    pending = center(path[i]);
    if (!caught && path[i][0] === meet[0] && path[i][1] === meet[1]) {
      caught = true;
      route.push({ kind: "move", to: pending }, { kind: "idle", weight: 0.4, event: `${pid}-ghost` });
      pending = null;
      dir = "";
    }
  }
  if (pending) route.push({ kind: "move", to: pending });
  const exitPipe = { x: M - PIPE_W + 2, y: first[1], w: PIPE_W - 4 };
  const last = center(exit);
  const entryPipe = { x: M + C * T - 2, y: last[1], w: PIPE_W - 4 };
  route.push({ kind: "move", to: [entryPipe.x + entryPipe.w / 2, last[1]] }, { kind: "enter" });
  // Emerge must come from the left pipe.
  route[1] = { kind: "move", to: first };

  const blocks: BlockSpec[] = [];
  path.forEach(([r, c], i) => {
    const [x, feet] = center([r, c]);
    if (r === pellet[0] && c === pellet[1]) {
      blocks.push({ id: `${pid}-pellet`, kind: "pellet", points: 50, x: x - 4, y: feet - 6 - 4, label: "POWER PELLET" });
    } else if (!(r === meet[0] && c === meet[1])) {
      blocks.push({ id: `${pid}-dot-${i}`, kind: "coin", points: 10, x: x - 4, y: feet - 6 - 4 });
    }
  });
  const [mx, mfeet] = center(meet);
  blocks.push({ id: `${pid}-ghost`, kind: "ghost", points: 200, x: mx - 4, y: mfeet - 12 });

  const leftPipe = { ...exitPipe, x: exitPipe.x - 2 };
  // Small ledges so the warp pipes are short stubs beside the maze.
  const ledge = (p: { x: number; y: number; w: number }): PlatformSpec => ({ x: p.x - 2, y: p.y + 8, w: p.w + 4, h: 2, kind: "metal" });
  return {
    width: W,
    height: top + R * T + 4,
    platforms: [ledge(leftPipe), ledge(entryPipe)],
    exitPipe: leftPipe,
    entryPipe,
    route,
    revealAfter: 1,
    props: [],
    blocks,
    mini: true,
    meta: {
      maze: { rows: R, cols: C, tile: T, ox: M, oy: top, walls, entry, exit, pellet, path, meet, ghostStart, patrols, bfs: bfs(walls, ghostStart).dist } satisfies MazeMeta,
    },
  };
}

/* ========================================================================= */
/*  Jetpack lab                                                              */
/* ========================================================================= */

export interface Zapper {
  x: number;
  y0: number;
  y1: number;
}
export interface LabMeta {
  zappers: Zapper[];
  ceiling: number;
  floor: number;
}

export const LAB_H = 80;

export function buildLab(opts: { width: number; id?: string }): TrackLayout | null {
  const W = snap(opts.width);
  // Very narrow labs (phones, inside a card) skip zappers but keep the flight + coins.
  if (W < 116) return null;
  const pid = opts.id ?? "lab";
  const g = LAB_H - 4;
  const ceiling = 4;
  const HIGH = 30; // feet height when flying high (head at 6)
  const LOW = g - 6; // feet height when flying low (head at g - 30)
  const exitPipe = { x: 2, y: g - PIPE_H, w: PIPE_W };
  const entryPipe = { x: W - PIPE_W - 2, y: g - PIPE_H, w: PIPE_W };

  // Obstacles alternate: top beam (fly low), bottom beam (fly high), middle bar (fly high).
  const zappers: Zapper[] = [];
  const waypoints: Point[] = [[50, g]];
  const kinds = ["top", "bottom", "mid", "top", "bottom", "mid"];
  let k = 0;
  for (let x = 78; x <= W - 68; x += 40, k++) {
    const kind = kinds[k % kinds.length];
    // Hold a level cruise height across each beam (±10), easing between beams.
    let h: number;
    if (kind === "top") {
      zappers.push({ x, y0: ceiling + 2, y1: LOW - 24 - 7 });
      h = LOW;
    } else if (kind === "bottom") {
      zappers.push({ x, y0: HIGH + 7, y1: g - 2 });
      h = HIGH;
    } else {
      zappers.push({ x, y0: HIGH + 4, y1: LOW - 24 - 7 + 3 });
      h = k % 4 === 2 ? HIGH : LOW;
    }
    waypoints.push([x - 10, h], [x + 10, h]);
  }
  const landX = W - 48;
  waypoints.push([landX, g]);

  const route: RouteStep[] = [
    { kind: "emerge" },
    { kind: "jump", to: [26, g], apex: 4 },
    { kind: "jump", to: [44, g], apex: 9, bump: `${pid}-power` },
    { kind: "walk", to: 50 },
  ];
  const coins: BlockSpec[] = [];
  let n = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const from = waypoints[i - 1];
    const to = waypoints[i];
    const step = { kind: "fly" as const, to, lift: 0, ease: true };
    route.push(step);
    // Coin trail between obstacles.
    for (let x = from[0] + 12; x < to[0] - 8; x += 11) {
      if (zappers.some((z) => Math.abs(z.x - x) < 8)) continue;
      const [, feet] = flyPoint(from, to, step, (x - from[0]) / (to[0] - from[0]));
      coins.push({ id: `${pid}-coin-${n++}`, kind: "coin", points: 10, x: x - 4, y: feet - 16 });
    }
  }
  route.push(
    { kind: "walk", to: entryPipe.x - 12 },
    { kind: "jump", to: [entryPipe.x + PIPE_W / 2, entryPipe.y], apex: 6 },
    { kind: "enter" },
  );

  return {
    width: W,
    height: LAB_H,
    platforms: [{ x: 0, y: g, w: W, kind: "metal" }],
    exitPipe,
    entryPipe,
    route,
    revealAfter: 1,
    props: [],
    blocks: [
      { id: `${pid}-power`, kind: "power", power: "jetpack", points: 500, x: 31, y: g - 24 - 9 - 8, label: "JETPACK" },
      ...coins,
    ],
    meta: { lab: { zappers, ceiling, floor: g } satisfies LabMeta },
  };
}

/* ========================================================================= */
/*  Girders + ladders (Donkey Kong)                                          */
/* ========================================================================= */

export interface GirderMeta {
  girders: { y: number; x0: number; x1: number }[];
  ladders: { x: number; y0: number; y1: number }[];
  /** Barrel jump points: the barrel meets the character here. */
  barrels: { id: string; x: number; y: number; dir: 1 | -1 }[];
}

export const GIRDER = { gap: 40, top: 38 } as const;

export function buildGirders(opts: { width: number; floors: number; id?: string }): TrackLayout | null {
  const W = snap(opts.width);
  const n = Math.max(2, Math.min(5, opts.floors));
  if (W < 110) return null;
  const pid = opts.id ?? "dk";
  const H = GIRDER.top + (n - 1) * GIRDER.gap + 8;
  const girders = Array.from({ length: n }, (_, i) => ({ y: GIRDER.top + i * GIRDER.gap, x0: 6, x1: W - 6 }));
  const platforms: PlatformSpec[] = girders.map((g) => ({ x: g.x0, y: g.y, w: g.x1 - g.x0, h: 4, kind: "block" }));
  const exitPipe = { x: 10, y: girders[0].y - PIPE_H, w: PIPE_W };
  const lastG = girders[n - 1];
  const lastDir = (n - 1) % 2 === 0 ? 1 : -1;
  const entryPipe = { x: lastDir > 0 ? W - PIPE_W - 10 : 10, y: lastG.y - PIPE_H, w: PIPE_W };

  const ladders: GirderMeta["ladders"] = [];
  const barrels: GirderMeta["barrels"] = [];
  const blocks: BlockSpec[] = [];
  const route: RouteStep[] = [{ kind: "emerge" }, { kind: "jump", to: [40, girders[0].y], apex: 4 }];
  let x = 40;
  for (let i = 0; i < n; i++) {
    const g = girders[i];
    const dir: 1 | -1 = i % 2 === 0 ? 1 : -1;
    const end = i === n - 1 ? (dir > 0 ? entryPipe.x - 12 : entryPipe.x + PIPE_W + 12) : dir > 0 ? W - 30 : 30;
    if (i > 0) {
      // A barrel rolls toward the character mid-girder: jump it.
      const jx = Math.round((x + end) / 2);
      const id = `${pid}-barrel-${i}`;
      route.push({ kind: "walk", to: jx - dir * 12 });
      route.push({ kind: "jump", to: [jx + dir * 12, g.y], apex: 8, over: id });
      barrels.push({ id, x: jx, y: g.y, dir: (-dir) as 1 | -1 });
      blocks.push({ id, kind: "barrel", points: 100, x: jx - 4, y: g.y - 7 });
    }
    route.push({ kind: "walk", to: end });
    x = end;
    if (i < n - 1) {
      const next = girders[i + 1];
      ladders.push({ x: end, y0: g.y, y1: next.y });
      route.push({ kind: "climb", toY: next.y });
    }
  }
  route.push({ kind: "jump", to: [entryPipe.x + PIPE_W / 2, entryPipe.y], apex: 6 }, { kind: "enter" });

  return {
    width: W,
    height: H,
    platforms,
    exitPipe,
    entryPipe,
    route,
    revealAfter: 1,
    props: [],
    blocks,
    meta: { girders: { girders, ladders, barrels } satisfies GirderMeta },
  };
}

/* ========================================================================= */
/*  Dungeon: key → door → chest (Zelda)                                      */
/* ========================================================================= */

export interface DungeonMeta {
  key: number;
  door: number;
  chest: number;
  floor: number;
}

export const DUNGEON_H = 48;

export function buildDungeon(opts: { width: number; id?: string; prize: string }): TrackLayout | null {
  const W = snap(opts.width);
  if (W < 130) return null;
  const pid = opts.id ?? "zelda";
  const g = DUNGEON_H - 4;
  const key = Math.round(W * 0.28);
  const door = Math.round(W * 0.52);
  const chest = Math.round(W * 0.74);
  const exitPipe = { x: 2, y: g - PIPE_H, w: PIPE_W };
  const entryPipe = { x: W - PIPE_W - 2, y: g - PIPE_H, w: PIPE_W };
  return {
    width: W,
    height: DUNGEON_H,
    platforms: [{ x: 0, y: g, w: W, kind: "block" }],
    exitPipe,
    entryPipe,
    route: [
      { kind: "emerge" },
      { kind: "jump", to: [30, g], apex: 4 },
      { kind: "walk", to: key },
      { kind: "idle", weight: 0.9, event: `${pid}-key` },
      { kind: "walk", to: door - 12 },
      { kind: "idle", weight: 1, event: `${pid}-door` },
      { kind: "walk", to: chest - 12 },
      { kind: "idle", weight: 1.8, event: `${pid}-chest` },
      { kind: "walk", to: entryPipe.x - 12 },
      { kind: "jump", to: [entryPipe.x + PIPE_W / 2, entryPipe.y], apex: 6 },
      { kind: "enter" },
    ],
    revealAfter: 1,
    props: [],
    blocks: [
      { id: `${pid}-key`, kind: "key", points: 100, x: key - 4, y: g - 12, label: "SMALL KEY" },
      { id: `${pid}-door`, kind: "door", points: 100, x: door - 4, y: g - 24 },
      { id: `${pid}-chest`, kind: "chest", points: 500, x: chest - 4, y: g - 10, label: opts.prize },
    ],
    meta: { dungeon: { key, door, chest, floor: g } satisfies DungeonMeta },
  };
}

/* ========================================================================= */
/*  Space invaders                                                           */
/* ========================================================================= */

export interface InvaderMeta {
  invaders: { id: string; x: number; y: number }[];
  shipY: number;
}

export const INVADERS_H = 64;

export function buildInvaders(opts: {
  width: number;
  targets: { x: number; id: string; unlock?: string; label?: string }[];
  id?: string;
}): TrackLayout | null {
  const W = snap(opts.width);
  if (W < 120 || !opts.targets.length) return null;
  const g = INVADERS_H - 4;
  const shipY = g - 6; // feet on the ship deck
  const exitPipe = { x: 2, y: g - PIPE_H, w: PIPE_W };
  const entryPipe = { x: W - PIPE_W - 2, y: g - PIPE_H, w: PIPE_W };
  // Targets sorted left → right, kept clear of the pipes.
  let last = -Infinity;
  const targets = [...opts.targets]
    .map((t) => ({ ...t, x: Math.min(W - 44, Math.max(44, t.x)) }))
    .sort((a, b) => a.x - b.x)
    .filter((t) => {
      if (t.x - last < 18) return false;
      last = t.x;
      return true;
    });
  const route: RouteStep[] = [
    { kind: "emerge" },
    { kind: "jump", to: [40, shipY], apex: 8 },
  ];
  const invaders: InvaderMeta["invaders"] = [];
  const blocks: BlockSpec[] = [];
  for (const t of targets) {
    route.push({ kind: "ride", to: [t.x, shipY] }, { kind: "idle", weight: 0.7, event: t.id });
    invaders.push({ id: t.id, x: t.x, y: 8 });
    blocks.push({ id: t.id, kind: "invader", points: 150, x: t.x - 4, y: 8, unlock: t.unlock, label: t.label });
  }
  route.push(
    { kind: "ride", to: [W - 44, shipY] },
    { kind: "jump", to: [W - 32, g], apex: 6 },
    { kind: "jump", to: [entryPipe.x + PIPE_W / 2, entryPipe.y], apex: 6 },
    { kind: "enter" },
  );
  return {
    width: W,
    height: INVADERS_H,
    platforms: [{ x: 0, y: g, w: W, kind: "metal" }],
    exitPipe,
    entryPipe,
    route,
    revealAfter: 1,
    props: [],
    blocks,
    meta: { invaders: { invaders, shipY } satisfies InvaderMeta },
  };
}
