/**
 * The "lane": a zig-zag tower of pixel ledges in the right margin (desktop).
 * Used in the Player Profile world so the character descends beside the
 * philosophy cards. Pure; produces a standard TrackLayout + its ledges.
 *
 *   [pipe]A0 ──▶ edge          drop
 *           B ◀── landing  ◀──┘
 *   A1 ──▶ … (one A per heading / right-column card)
 *   END ════════▶ [pipe]       enter → warp onward
 *
 * The way down rotates (pole slide → ladder → hop) so the descent never
 * repeats the same move twice in a row. Poles and ladders hang from a ledge's
 * edge, which lies inside the next ledge's span.
 */
import type { PipeSpec, RouteStep, TrackLayout } from "@/data/worlds";

export const LANE = {
  /** Narrowest lane that can host the character (art px). */
  minWidth: 36,
  /** Lanes wider than this keep their ledges near the content. */
  maxWidth: 64,
  /** Minimum vertical distance between consecutive ledges (≈ character height). */
  minGap: 30,
  /** Maximum distance between anchored ledges before filler ledges are added. */
  maxGap: 90,
  pipeW: 18,
  pipeH: 12,
  /** Room needed above the first ledge for the pipe + emerging sprite. */
  firstLedgeMin: 42,
  /** Room needed below the final ledge. */
  exitSpan: 20,
} as const;

export interface LaneLedge {
  y: number;
  x0: number;
  x1: number;
  /** Walking direction on this ledge. */
  dir: 1 | -1;
  /** True when bolted to a heading or card (draws a bracket/girder). */
  anchored: boolean;
  /** Where the character lands on this ledge, and where it leaves it. */
  landX: number;
  edgeX: number;
  /** How the character gets down to the next ledge (drawn as a pole/ladder). */
  down?: "hop" | "pole" | "ladder";
}

export interface Lane {
  width: number;
  height: number;
  ledges: LaneLedge[];
  exitPipe: PipeSpec;
  entryPipe: PipeSpec;
  layout: TrackLayout;
}

/**
 * Builds a lane. `anchors` are art-px y positions (relative to the lane top)
 * of headings/cards the ledges should line up with. Returns null when the
 * space is too narrow or too short.
 */
export function buildLane(input: { width: number; height: number; anchors: number[] }): Lane | null {
  // Snap sub-pixel measurement error (35.99… → 36) before comparing.
  const W = Math.min(Math.floor(input.width + 0.01), LANE.maxWidth);
  const H = input.height;
  if (W < LANE.minWidth) return null;

  const endY = H - LANE.exitSpan;
  const first = Math.max(LANE.firstLedgeMin, (input.anchors[0] ?? 0) + 6);
  if (endY - first < 2 * LANE.minGap) return null;

  const ys: number[] = [first];
  for (const a of input.anchors.slice(1).map((v) => v + 6).sort((x, y) => x - y)) {
    const prev = ys[ys.length - 1];
    if (a - prev < 2 * LANE.minGap || a > endY - 2 * LANE.minGap) continue;
    const fillers = Math.floor((a - prev) / LANE.maxGap);
    for (let k = 1; k < fillers; k++) ys.push(prev + ((a - prev) * k) / fillers);
    ys.push(a);
  }
  {
    const prev = ys[ys.length - 1];
    const fillers = Math.floor((endY - prev) / LANE.maxGap);
    for (let k = 1; k < fillers; k++) {
      const y = prev + ((endY - prev) * k) / fillers;
      if (endY - y >= 2 * LANE.minGap) ys.push(y);
    }
  }

  const aSpan: [number, number] = [0, W - 12];
  const bSpan: [number, number] = [12, W];
  const anchorSet = new Set([first, ...input.anchors.map((v) => v + 6)]);
  const ledges: LaneLedge[] = [];
  ys.forEach((y, i) => {
    ledges.push({
      y,
      x0: aSpan[0],
      x1: aSpan[1],
      dir: 1,
      anchored: anchorSet.has(y),
      landX: i === 0 ? LANE.pipeW + 6 : bSpan[0] - 4,
      edgeX: aSpan[1],
    });
    const nextY = i + 1 < ys.length ? ys[i + 1] : endY;
    ledges.push({ y: (y + nextY) / 2, x0: bSpan[0], x1: bSpan[1], dir: -1, anchored: false, landX: aSpan[1] + 4, edgeX: bSpan[0] });
  });
  const pipeX = W - LANE.pipeW;
  ledges.push({ y: endY, x0: 0, x1: W, dir: 1, anchored: false, landX: bSpan[0] - 4, edgeX: pipeX - 8 });

  const exitPipe = { x: 0, y: first - LANE.pipeH, w: LANE.pipeW };
  const entryPipe = { x: pipeX, y: endY - LANE.pipeH, w: LANE.pipeW };

  const DOWN = ["pole", "ladder", "hop"] as const;
  ledges.forEach((l, i) => {
    const next = ledges[i + 1];
    if (!next) return;
    l.down = DOWN[i % DOWN.length];
    // Poles/ladders drop straight down from the edge, so the next ledge is landed on there.
    if (l.down !== "hop") next.landX = l.edgeX;
  });

  const route: RouteStep[] = [{ kind: "emerge" }, { kind: "jump", to: [ledges[0].landX, ledges[0].y], apex: 10 }];
  ledges.forEach((l, i) => {
    if (l.edgeX !== l.landX) route.push({ kind: "walk", to: l.edgeX });
    const next = ledges[i + 1];
    if (!next) return;
    if (l.down === "pole") route.push({ kind: "slide", toY: next.y });
    else if (l.down === "ladder") route.push({ kind: "climb", toY: next.y });
    else route.push({ kind: "jump", to: [next.landX, next.y], apex: 4 });
  });
  route.push({ kind: "jump", to: [entryPipe.x + LANE.pipeW / 2, entryPipe.y], apex: 10 }, { kind: "enter" });

  return {
    width: W,
    height: H,
    ledges,
    exitPipe,
    entryPipe,
    layout: {
      width: W,
      height: H,
      platforms: ledges.map((l) => ({ x: l.x0, y: l.y, w: l.x1 - l.x0, h: 4, kind: l.anchored ? ("metal" as const) : ("block" as const) })),
      exitPipe,
      entryPipe,
      route,
      revealAfter: 2,
      props: [],
    },
  };
}
