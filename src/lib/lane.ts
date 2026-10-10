/**
 * The "lane": a tower of pixel ledges in the right margin of a world zone
 * (desktop only). The character descends it while the visitor reads, so it
 * stays in the game world next to the content instead of only between sections.
 *
 * Everything here is pure and in art pixels relative to the lane's top-left.
 * A horizontal "target line" (a fixed fraction down the viewport) sweeps the
 * lane as the page scrolls; the character's state is a function of where that
 * line is, so reverse scrolling and fast scrolling behave exactly like bands.
 *
 * Shape (A = anchored ledge bolted to the content edge, B = outer ledge):
 *
 *   [pipe]A0 ──▶ edge          drop
 *           B ◀── landing  ◀──┘
 *   A1 ──▶ … (one A per heading / right-column card)
 *   END ════════▶ [pipe]       enter → warp to next world
 */
import type { PipeSpec } from "@/data/worlds";
import { HERO_H, HERO_W, type HeroFrame } from "@/components/journey/heroSprite";
import type { CharacterState } from "./journey";

export const LANE = {
  /** Narrowest lane that can host the character (art px). */
  minWidth: 36,
  /** Lanes wider than this keep their ledges near the content. */
  maxWidth: 64,
  /** Minimum vertical distance between consecutive ledges (≈ character height). */
  minGap: 30,
  /** Maximum distance between anchored ledges before filler ledges are added. */
  maxGap: 90,
  /** Ledge thickness. */
  ledgeH: 4,
  pipeW: 18,
  pipeH: 12,
  /** Room needed above the first ledge for the pipe + emerging sprite. */
  firstLedgeMin: 40,
  /** Target-line travel used by the emerge and final enter sequences. */
  emergeSpan: 34,
  exitSpan: 44,
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
}

export interface Lane {
  width: number;
  height: number;
  ledges: LaneLedge[];
  exitPipe: PipeSpec;
  entryPipe: PipeSpec;
  /** Target-line positions (art px) where the sequence starts / finishes. */
  startAt: number;
  endAt: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const HALF = HERO_W / 2;

/**
 * Builds a lane for a zone. `anchors` are art-px y positions (relative to
 * the lane top) of headings/cards the ledges should line up with.
 * Returns null when the zone is too narrow or too short for a lane.
 */
export function buildLane(input: { width: number; height: number; anchors: number[] }): Lane | null {
  const W = Math.min(input.width, LANE.maxWidth);
  const H = input.height;
  if (W < LANE.minWidth) return null;

  const endMax = H - LANE.exitSpan;
  const first = Math.max(LANE.firstLedgeMin, (input.anchors[0] ?? 0) + 6);
  if (endMax - first < 2 * LANE.minGap) return null;

  // Anchored ledge positions: one per anchor, spaced to fit B ledges between.
  const ys: number[] = [first];
  for (const a of input.anchors.slice(1).map((v) => v + 6).sort((x, y) => x - y)) {
    const prev = ys[ys.length - 1];
    if (a - prev < 2 * LANE.minGap || a > endMax - 2 * LANE.minGap) continue;
    // Fill big gaps so the character never free-falls a whole screen.
    const fillers = Math.floor((a - prev) / LANE.maxGap);
    for (let k = 1; k < fillers; k++) ys.push(prev + ((a - prev) * k) / fillers);
    ys.push(a);
  }
  // Fill between the last anchor and the end ledge too.
  const endY = endMax;
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
  const ledges: LaneLedge[] = [];
  const anchorSet = new Set([first, ...input.anchors.map((v) => v + 6)]);

  ys.forEach((y, i) => {
    ledges.push({
      y,
      x0: aSpan[0],
      x1: aSpan[1],
      dir: 1,
      anchored: anchorSet.has(y),
      landX: i === 0 ? LANE.pipeW + 6 : bSpan[0] - 2,
      edgeX: aSpan[1] - 2,
    });
    const nextY = i + 1 < ys.length ? ys[i + 1] : endY;
    ledges.push({
      y: (y + nextY) / 2,
      x0: bSpan[0],
      x1: bSpan[1],
      dir: -1,
      anchored: false,
      landX: aSpan[1] + 2,
      edgeX: bSpan[0] + 2,
    });
  });
  const pipeX = W - LANE.pipeW;
  ledges.push({ y: endY, x0: 0, x1: W, dir: 1, anchored: false, landX: bSpan[0] - 2, edgeX: pipeX - 4 });

  return {
    width: W,
    height: H,
    ledges,
    exitPipe: { x: 0, y: first - LANE.pipeH, w: LANE.pipeW },
    entryPipe: { x: pipeX, y: endY - LANE.pipeH, w: LANE.pipeW },
    startAt: first - LANE.emergeSpan,
    endAt: endY + LANE.exitSpan,
  };
}

const WALK: HeroFrame[] = ["walk1", "walk2", "walk3", "walk4"];
const SUNK = HERO_H + 1;

function base(x: number, y: number, frame: HeroFrame, facing: 1 | -1): CharacterState {
  return { visible: true, x, y, frame, facing, clip: 0, puffExit: 0, puffEntry: 0, arrived: true, moving: false };
}

const HIDDEN: CharacterState = { ...base(0, 0, "pipe", 1), visible: false };

/** Character state for a target-line position `t` (art px from lane top). */
export function laneStateAt(lane: Lane, t: number): CharacterState {
  const { ledges, exitPipe, entryPipe } = lane;
  if (t < lane.startAt || t >= lane.endAt) return HIDDEN;

  const first = ledges[0];
  // Emerge from the exit pipe and hop onto the first ledge.
  if (t < first.y) {
    const u = (t - lane.startAt) / (first.y - lane.startAt);
    const rim = exitPipe.y;
    const cx = exitPipe.x + exitPipe.w / 2;
    if (u < 0.65) {
      const y = lerp(rim + SUNK, rim - 3, u / 0.65);
      return { ...base(cx, y, "pipe", 1), clip: Math.max(0, y - rim), puffExit: u < 0.35 ? Math.sin((Math.PI * u) / 0.35) : 0 };
    }
    if (u < 0.8) return base(cx, lerp(rim - 3, rim, (u - 0.65) / 0.15), "fall", 1);
    const v = (u - 0.8) / 0.2;
    const y = lerp(rim, first.y, v) - 6 * 4 * v * (1 - v);
    return { ...base(lerp(cx, first.landX, v), y, v > 0.92 ? "land" : v < 0.5 ? "jump" : "fall", 1), moving: true };
  }

  const last = ledges[ledges.length - 1];
  // Final ledge: walk to the pipe, hop onto it, sink in.
  if (t >= last.y) {
    const u = clamp01((t - last.y) / (lane.endAt - last.y));
    const rim = entryPipe.y;
    const cx = entryPipe.x + entryPipe.w / 2;
    if (u < 0.45) {
      const x = lerp(last.landX, last.edgeX, u / 0.45);
      return { ...base(x, last.y, WALK[Math.floor(Math.abs(x - last.landX) / 3) % 4], 1), moving: true };
    }
    if (u < 0.65) {
      const v = (u - 0.45) / 0.2;
      const y = lerp(last.y, rim, v) - 6 * 4 * v * (1 - v);
      return { ...base(lerp(last.edgeX, cx, v), y, v > 0.92 ? "land" : v < 0.5 ? "jump" : "fall", 1), moving: true };
    }
    const v = (u - 0.65) / 0.35;
    const y = v < 0.2 ? rim : lerp(rim, rim + SUNK, (v - 0.2) / 0.8);
    const clip = Math.max(0, y - rim);
    return {
      ...base(cx, y, v < 0.1 ? "land" : "pipe", 1),
      visible: clip < HERO_H,
      clip,
      puffEntry: v > 0.65 ? Math.sin((Math.PI * (v - 0.65)) / 0.35) : 0,
    };
  }

  // Between ledge i and i+1: walk across, then drop to the next ledge.
  let i = 0;
  while (i < ledges.length - 2 && t >= ledges[i + 1].y) i++;
  const a = ledges[i];
  const b = ledges[i + 1];
  const u = (t - a.y) / (b.y - a.y);
  if (u < 0.55) {
    const x = lerp(a.landX, a.edgeX, u / 0.55);
    return { ...base(x, a.y, WALK[Math.floor(Math.abs(x - a.landX) / 3) % 4], a.dir), moving: true };
  }
  const v = (u - 0.55) / 0.45;
  const x = lerp(a.edgeX, b.landX, v);
  const y = lerp(a.y, b.y, v * v) - 4 * 4 * v * (1 - v);
  const frame: HeroFrame = v > 0.94 ? "land" : v < 0.25 ? "jump" : "fall";
  return { ...base(x, y, frame, a.dir), moving: true };
}

/** Reduced-motion pose: standing on the ledge nearest the target line. */
export function laneRestAt(lane: Lane, t: number): CharacterState {
  if (t < lane.startAt || t >= lane.endAt) return HIDDEN;
  const ledge = lane.ledges.reduce((best, l) => (Math.abs(l.y - t) < Math.abs(best.y - t) ? l : best));
  return base(ledge.landX, ledge.y, "idle", ledge.dir);
}

/** Horizontal sprite bounds used by tests and the controller. */
export function spriteBounds(state: CharacterState) {
  return { left: state.x - HALF, right: state.x + HALF, top: state.y - HERO_H };
}
