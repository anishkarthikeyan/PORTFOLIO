/**
 * Track builders: pure functions that generate a TrackLayout (platforms,
 * pipes, blocks, holes and route) from measured sizes. Each world uses one:
 *
 *   corridor  – horizontal strip: islands, character select, dungeon,
 *               castle battlements, trophy room, overworld map
 *   tree      – climbs down the skill tree trunk, in and out of knot holes
 *   gate      – a request waits at token-bucket gates (rate limiter)
 *   (game worlds — maze, lab, girders, dungeon, invaders — live in games.ts)
 *   finale    – stair bricks → star → flagpole slide → portal
 *
 * All coordinates are art pixels; the character is 16 × 24, blocks 8 × 8.
 * Geometry is validated in tracks.test.ts.
 */
import type { BlockSpec, PipeSpec, PlatformSpec, RouteStep, TrackLayout } from "@/data/worlds";
import { compileRoute, type CompiledRoute } from "./journey";

export const BLOCK = 8;

/** Measured sizes carry sub-pixel error (47.998…); snap before comparing. */
const snap = (v: number) => Math.floor(v + 0.01);
const PIPE_W = 18;
/** Height of corridor pipes above the ground. */
const PIPE_H = 8;

type BlockInput = Omit<BlockSpec, "x" | "y" | "kind" | "points"> & Partial<Pick<BlockSpec, "kind" | "points">>;

export interface CorridorStop {
  x: number;
  /**
   * block: "?" bumped from below · power: "?" that releases a power-up ·
   * bug: enemy to stomp · pellet: Pac-Man power pellet walked through ·
   * node: map stop · pedestal: raised spot where the character waves.
   */
  kind: "block" | "node" | "pedestal" | "bug" | "power" | "pellet" | "boss" | "npc";
  block?: BlockInput;
}

export interface CorridorOptions {
  /** Prefix for generated ids (bugs, dots). */
  id?: string;
  width: number;
  /** Pac-Man style dots along the walking path. */
  dots?: boolean;
  stops: CorridorStop[];
  exit?: boolean;
  entry?: boolean;
  /** Gaps in the ground the character jumps over: [x0, x1]. */
  gaps?: [number, number][];
  ground?: PlatformSpec["kind"];
}

/** Corridor height: taller when it carries blocks to bump. */
export function corridorHeight(withBlocks: boolean): number {
  return withBlocks ? 48 : 40;
}

/** Horizontal strip in an empty band of the layout (never over content). */
export function buildCorridor(opts: CorridorOptions): TrackLayout | null {
  const W = snap(opts.width);
  if (W < 100) return null;
  const hasBlocks = opts.stops.some((s) => s.kind === "block" || s.kind === "power" || s.kind === "boss");
  const H = corridorHeight(hasBlocks);
  const g = H - 4;
  const gaps = (opts.gaps ?? []).filter(([a, b]) => a > 30 && b < W - 30).sort((a, b) => a[0] - b[0]);

  // Ground, split around gaps.
  const platforms: PlatformSpec[] = [];
  let gx = 0;
  for (const [a, b] of gaps) {
    platforms.push({ x: gx, y: g, w: a - gx, kind: opts.ground ?? "ground" });
    gx = b;
  }
  platforms.push({ x: gx, y: g, w: W - gx, kind: opts.ground ?? "ground" });

  // Pipes hug the first/last stop so the character doesn't cross the whole
  // page width every time (keeps the pace calm at normal scroll speeds).
  const stopXs = opts.stops.map((s) => Math.min(W - 46, Math.max(40, s.x))).sort((a, b) => a - b);
  const exitX = stopXs.length && !gaps.length ? Math.max(2, Math.min(W - 120, stopXs[0] - 58)) : 2;
  const entryX = stopXs.length && !gaps.length ? Math.min(W - PIPE_W - 2, Math.max(exitX + 90, stopXs[stopXs.length - 1] + 36)) : W - PIPE_W - 2;
  const exitPipe: PipeSpec | undefined = opts.exit !== false ? { x: exitX, y: g - PIPE_H, w: PIPE_W } : undefined;
  const entryPipe: PipeSpec | undefined = opts.entry !== false ? { x: entryX, y: g - PIPE_H, w: PIPE_W } : undefined;

  const route: RouteStep[] = [];
  const blocks: BlockSpec[] = [];
  let x: number;
  if (exitPipe) {
    x = exitPipe.x + PIPE_W + 10;
    route.push({ kind: "emerge" }, { kind: "jump", to: [x, g], apex: 4 });
  } else {
    x = 12;
  }

  /** Walk to `to`, hopping over any gaps on the way. */
  const travel = (to: number) => {
    for (const [a, b] of gaps) {
      if (a > x && b < to) {
        if (a - 5 > x) route.push({ kind: "walk", to: a - 5 });
        route.push({ kind: "jump", to: [b + 5, g], apex: 6 });
        x = b + 5;
      }
    }
    if (to > x) route.push({ kind: "walk", to });
    x = Math.max(x, to);
  };

  const minX = 40;
  const maxX = W - 46;
  let last = -Infinity;
  // Enemies stand on solid ground: nudge them to the middle of a merlon.
  const nudge = (st: CorridorStop) => {
    if (st.kind !== "bug" || !gaps.length) return st;
    let best = st.x;
    let bestD = Infinity;
    for (let k = 0; k <= gaps.length; k++) {
      const a = k === 0 ? 0 : gaps[k - 1][1];
      const b = k === gaps.length ? W : gaps[k][0];
      const c = (a + b) / 2;
      if (b - a >= 18 && Math.abs(c - st.x) < bestD) {
        best = c;
        bestD = Math.abs(c - st.x);
      }
    }
    return { ...st, x: best };
  };
  const stops = [...opts.stops]
    .map((s) => nudge({ ...s, x: Math.min(maxX, Math.max(minX, s.x)) }))
    .sort((a, b) => a.x - b.x)
    .filter((s) => {
      // Stops must not sit in a gap and need room between them.
      if (s.kind !== "bug" && gaps.some(([a, b]) => s.x > a - 14 && s.x < b + 14)) return false;
      if (s.x - last < 28) return false;
      last = s.x;
      return true;
    });

  const pedestals: PlatformSpec[] = [];
  const pid = opts.id ?? "c";
  for (const [i, s] of stops.entries()) {
    if ((s.kind === "block" || s.kind === "power") && s.block) {
      travel(s.x - 10);
      blocks.push({
        kind: s.kind === "power" ? "power" : "question",
        points: s.kind === "power" ? 500 : 100,
        ...s.block,
        x: s.x - BLOCK / 2,
        y: g - 24 - 9 - BLOCK,
      });
      route.push({ kind: "jump", to: [s.x + 10, g], apex: 9, bump: s.block.id });
      x = s.x + 10;
    } else if (s.kind === "bug") {
      // Land on the bug (stomp), then bounce off it — never from/into a gap.
      const inGap = (v: number) => gaps.find(([a, b]) => v > a - 2 && v < b + 2);
      let from = s.x - 16;
      const g1 = inGap(from);
      if (g1) from = g1[1] + 3;
      let to = s.x + 18;
      const g2 = inGap(to);
      if (g2) to = g2[1] + 4;
      travel(from);
      const id = s.block?.id ?? `${pid}-bug-${i}`;
      blocks.push({ kind: "bug", points: 200, ...s.block, id, x: s.x - BLOCK / 2, y: g - 7 });
      route.push({ kind: "jump", to: [s.x, g - 7], apex: 8, stomp: id }, { kind: "jump", to: [to, g], apex: 7 });
      x = to;
    } else if (s.kind === "boss") {
      // Mini-boss: three stomps, bouncing back between them.
      const id = s.block?.id ?? `${pid}-boss`;
      travel(s.x - 26);
      for (let hit = 1; hit <= 3; hit++) {
        blocks.push({ kind: "boss", points: hit === 3 ? 1000 : 100, id: `${id}-${hit}`, x: s.x - BLOCK / 2, y: g - 12 });
        route.push({ kind: "jump", to: [s.x, g - 12], apex: 8, stomp: `${id}-${hit}` });
        route.push({ kind: "jump", to: [hit === 3 ? s.x + 26 : s.x - 22, g], apex: 8 });
      }
      x = s.x + 26;
    } else if (s.kind === "npc" && s.block) {
      // Walk up to the villager and talk (RPG text box).
      travel(s.x - 16);
      blocks.push({ kind: "npc", points: 50, ...s.block, x: s.x - BLOCK / 2, y: g - 12 });
      route.push({ kind: "idle", weight: 1.3, event: s.block.id });
    } else if (s.kind === "pellet" && s.block) {
      // Power pellet at body height: collected by walking through it.
      travel(s.x - 10);
      blocks.push({ kind: "pellet", points: 50, ...s.block, x: s.x - BLOCK / 2, y: g - 16 });
    } else if (s.kind === "node") {
      travel(s.x);
      route.push({ kind: "jump", to: [s.x, g], apex: 4, weight: 0.7 }, { kind: "idle", weight: 0.5 });
    } else if (s.kind === "pedestal") {
      travel(s.x - 18);
      pedestals.push({ x: s.x - 11, y: g - 6, w: 22, kind: "block" });
      route.push(
        { kind: "jump", to: [s.x, g - 6], apex: 6 },
        { kind: "idle", pose: "wave", weight: 1.6 },
        { kind: "jump", to: [s.x + 18, g], apex: 4 },
      );
      x = s.x + 18;
    }
  }

  if (entryPipe) {
    travel(entryPipe.x - 12);
    route.push({ kind: "jump", to: [entryPipe.x + PIPE_W / 2, entryPipe.y], apex: 6 }, { kind: "enter" });
  } else {
    route.push({ kind: "idle" });
  }

  const layout: TrackLayout = {
    width: W,
    height: H,
    platforms: [...platforms, ...pedestals],
    exitPipe,
    entryPipe,
    spawn: exitPipe ? undefined : [12, g],
    route,
    revealAfter: 1,
    props: [],
    blocks,
  };
  if (opts.dots) layout.blocks = [...blocks, ...dotsAlongWalks(layout, pid, g, blocks)];
  return layout;
}

/** Pac-Man dots every 10 art px along ground-level walks, clear of other items. */
function dotsAlongWalks(layout: TrackLayout, pid: string, g: number, avoid: BlockSpec[]): BlockSpec[] {
  const dots: BlockSpec[] = [];
  const route = compileRoute(layout);
  let n = 0;
  for (const seg of route.segments) {
    if ((seg.step.kind !== "walk" && seg.step.kind !== "run") || seg.from[1] !== g) continue;
    const [a, b] = [Math.min(seg.from[0], seg.to[0]), Math.max(seg.from[0], seg.to[0])];
    for (let x = Math.ceil((a + 4) / 10) * 10; x <= b - 4; x += 10) {
      if (avoid.some((o) => Math.abs(o.x + 4 - x) < 12)) continue;
      dots.push({ id: `${pid}-dot-${n++}`, kind: "coin", points: 10, x: x - 4, y: g - 16 });
    }
  }
  return dots;
}

/** Castle battlements: merlons with crenel gaps to hop across. */
export function battlementGaps(width: number): [number, number][] {
  const gaps: [number, number][] = [];
  for (let x = 52; x + 8 < width - 52; x += 30) gaps.push([x, x + 8]);
  return gaps;
}

/* ------------------------------------------------------------------------- */
/*  Skill tree                                                               */
/* ------------------------------------------------------------------------- */

export interface TreeOptions {
  width: number;
  height: number;
  /** Branch positions (art px from the top of the trunk), one per category. */
  knots: number[];
  /** Side each branch grows to (1 = right, -1 = left). Compact trees use one side. */
  sides: (1 | -1)[];
  /** Ids of the acorn blocks (one per branch) and what they unlock. */
  acorns: BlockInput[];
}

export const TREE = { trunkHalf: 9, stub: 12, minGap: 56, top: 42 } as const;

/**
 * Character climbs down the trunk: pops out of a knot hole at each branch,
 * hops onto the branch stub (bumping its acorn), climbs down the hanging
 * vine, dives into the next hollow, and finally exits through the roots.
 */
export function buildTree(opts: TreeOptions): TrackLayout | null {
  const W = snap(opts.width);
  const H = snap(opts.height);
  const both = opts.sides.some((s) => s < 0);
  if (W < (both ? 48 : 36)) return null;
  const cx = both ? W / 2 : 12;

  // Keep knots that leave room to climb between them.
  const knots: { y: number; side: 1 | -1; acorn?: BlockInput }[] = [];
  opts.knots.forEach((k, i) => {
    const y = Math.max(TREE.top, k);
    const prev = knots[knots.length - 1];
    if (prev && y - prev.y < TREE.minGap) return;
    if (y > H - 40) return;
    knots.push({ y, side: opts.sides[i] ?? 1, acorn: opts.acorns[i] });
  });
  if (!knots.length) return null;

  const holes: Record<string, PipeSpec> = {};
  const platforms: PlatformSpec[] = [];
  const blocks: BlockSpec[] = [];
  const route: RouteStep[] = [];
  const rootY = H - 6;

  knots.forEach((k, i) => {
    const d = k.side;
    const stubX = d > 0 ? cx + TREE.trunkHalf : cx - TREE.trunkHalf - TREE.stub;
    const vineX = cx + d * 16;
    const nextY = knots[i + 1]?.y ?? rootY;
    const vineEnd = k.y + Math.max(24, (nextY - k.y) * 0.5);
    const dropY = Math.min(nextY - 12, vineEnd + 10);

    holes[`k${i}`] = { x: cx - 7, y: k.y, w: 14 };
    holes[`d${i}`] = { x: cx - 7, y: dropY, w: 14 };
    platforms.push({ x: stubX, y: k.y, w: TREE.stub, h: 3, kind: "branch" });

    route.push({ kind: "emerge", from: `k${i}` });
    if (k.acorn) {
      blocks.push({
        kind: "acorn",
        points: 100,
        ...k.acorn,
        x: cx + d * 8 - BLOCK / 2,
        y: k.y - 24 - 6 - BLOCK,
      });
      route.push({ kind: "jump", to: [vineX, k.y], apex: 6, bump: k.acorn.id });
    } else {
      route.push({ kind: "jump", to: [vineX, k.y], apex: 6 });
    }
    route.push({ kind: "climb", toY: vineEnd }, { kind: "jump", to: [cx, dropY], apex: 4 }, { kind: "enter", into: `d${i}` });
    // Leaf coins hanging on the vine, collected while climbing down.
    for (let f = k.y + 14, j = 0; f + 2 <= vineEnd; f += 14, j++) {
      blocks.push({ id: `leaf-${i}-${j}`, kind: "coin", points: 10, x: vineX - 4, y: f - 16 });
    }
  });

  return {
    width: W,
    height: H,
    platforms,
    holes,
    route,
    revealAfter: 2,
    props: [],
    blocks,
  };
}

/* ------------------------------------------------------------------------- */
/*  Token-bucket gates (rate limiter)                                        */
/* ------------------------------------------------------------------------- */

export const GATE_H = 52;

export interface GateMeta {
  /** Floor (feet) height. */
  ground: number;
  /** Gate centers; `throttled` gates make the request wait for a token. */
  gates: { x: number; id: string; throttled: boolean }[];
}

/**
 * Token-bucket rate limiter (System design): the character is a request
 * walking through API gates. A gate with a token in its bucket lets it
 * straight through; an empty bucket answers 429 and the request waits until
 * a token refills, then the barrier lifts.
 */
export function buildTokenGate(opts: { width: number; id?: string }): TrackLayout | null {
  const W = snap(opts.width);
  if (W < 150) return null;
  const id = opts.id ?? "gate";
  const g = GATE_H - 4;
  const exitPipe = { x: 2, y: g - PIPE_H, w: PIPE_W };
  const entryPipe = { x: W - PIPE_W - 2, y: g - PIPE_H, w: PIPE_W };
  const n = W >= 260 ? 3 : 2;
  const span = W - 2 * 48;
  // The middle (or second) gate is the one that throttles.
  const gates = Array.from({ length: n }, (_, i) => ({
    x: Math.round(48 + (span * (i + 0.5)) / n),
    id: `${id}-gate-${i}`,
    throttled: i === 1,
  }));
  const route: RouteStep[] = [{ kind: "emerge" }, { kind: "jump", to: [30, g], apex: 5 }];
  for (const gt of gates) {
    route.push({ kind: "walk", to: gt.x - 14 });
    if (gt.throttled) route.push({ kind: "idle", weight: 1.4 });
    route.push({ kind: "idle", weight: gt.throttled ? 0.6 : 0.35, event: gt.id });
  }
  route.push(
    { kind: "run", to: entryPipe.x - 12 },
    { kind: "jump", to: [entryPipe.x + PIPE_W / 2, entryPipe.y], apex: 6 },
    { kind: "enter" },
  );
  return {
    width: W,
    height: GATE_H,
    platforms: [{ x: 0, y: g, w: W, kind: "metal" }],
    exitPipe,
    entryPipe,
    route,
    revealAfter: 1,
    props: [],
    blocks: gates.map((gt) => ({
      id: gt.id,
      kind: "gate" as const,
      x: gt.x - 4,
      y: g - 30,
      points: gt.throttled ? 300 : 100,
      label: gt.throttled ? "429 → token refilled → 200 OK" : "Token spent → 200 OK",
      say: gt.throttled ? "429… waiting for a token. OK, through!" : undefined,
    })),
    meta: { gate: { ground: g, gates } satisfies GateMeta },
  };
}

/* ------------------------------------------------------------------------- */
/*  Finale                                                                   */
/* ------------------------------------------------------------------------- */

export const FINALE_H = 72;

export interface FinaleGeometry {
  ground: number;
  bricks: { x: number; y: number; w: number }[];
  star: { x: number; y: number };
  pole: { x: number; top: number };
  portal: { x: number; w: number };
}

/** Geometry shared by the finale builder and its renderer. */
export function finaleGeometry(width: number): FinaleGeometry {
  const g = FINALE_H - 4;
  const bw = 16;
  const bricks = [0, 1, 2].map((i) => ({ x: 24 + i * bw, y: g - 12 * (i + 1), w: bw }));
  const topEnd = bricks[2].x + bw;
  const poleX = Math.max(topEnd + 20, Math.min(width - 30, topEnd + 30));
  const portalX = poleX + 8;
  return {
    ground: g,
    bricks,
    star: { x: topEnd + 2, y: bricks[2].y - 22 },
    pole: { x: poleX, top: g - 56 },
    portal: { x: portalX, w: Math.max(14, Math.min(24, width - portalX - 2)) },
  };
}

/** Climb three stair bricks, touch the star, slide the flagpole, reach the portal. */
export function buildFinale(opts: { width: number }): TrackLayout | null {
  const W = snap(opts.width);
  if (W < 120) return null;
  const f = finaleGeometry(W);
  const g = f.ground;
  const [b1, b2, b3] = f.bricks;
  const mid = (b: { x: number; w: number }) => b.x + b.w / 2;
  return {
    width: W,
    height: FINALE_H,
    platforms: [
      { x: 0, y: g, w: W, kind: "ground" },
      ...f.bricks.map((b) => ({ x: b.x, y: b.y, w: b.w, h: 6, kind: "block" as const })),
    ],
    exitPipe: { x: 2, y: g - PIPE_H, w: PIPE_W },
    route: [
      { kind: "emerge" },
      { kind: "jump", to: [mid(b1), b1.y], apex: 8 },
      { kind: "jump", to: [mid(b2), b2.y], apex: 8 },
      { kind: "jump", to: [mid(b3), b3.y], apex: 8 },
      { kind: "grab", item: "star" },
      { kind: "jump", to: [f.pole.x - 3, b3.y], apex: 6 },
      { kind: "slide", toY: g },
      { kind: "walk", to: f.portal.x + f.portal.w / 2 - 4 },
      { kind: "celebrate", weight: 1.4 },
    ],
    revealAfter: 1,
    props: [],
    blocks: [{ id: "star", kind: "star", x: f.star.x, y: f.star.y, points: 1000, label: "JOURNEY COMPLETE" }],
  };
}

/* ------------------------------------------------------------------------- */
/*  Vehicles                                                                 */
/* ------------------------------------------------------------------------- */

/** Cab/belt position at a beat: follows `ride` segments, parks between them. */
export function vehicleAt(route: CompiledRoute, beat: number): { x: number; y: number } | null {
  const rides = route.segments.filter((s) => s.step.kind === "ride");
  if (!rides.length) return null;
  // Before the first ride, the cab waits where that ride starts.
  if (beat <= rides[0].b0) return { x: rides[0].from[0], y: rides[0].from[1] };
  let pos = { x: rides[0].from[0], y: rides[0].from[1] };
  for (const r of rides) {
    if (beat < r.b0) break;
    const t = Math.min(1, (beat - r.b0) / (r.b1 - r.b0));
    pos = { x: r.from[0] + (r.to[0] - r.from[0]) * t, y: r.from[1] + (r.to[1] - r.from[1]) * t };
  }
  return pos;
}
