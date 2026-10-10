/**
 * Scroll-journey math. Pure functions only — no DOM, no timers.
 *
 * The character's state is a deterministic function of scroll position:
 *   scrollY → band progress p (0..1) → route progress q (0..1) → state.
 * Because nothing is triggered or accumulated, scrolling back up replays the
 * same states in reverse, and fast scrolls jump straight to the right state.
 */
import type { BandLayout, PipeSpec, Point, RouteStep } from "@/data/worlds";
import { HERO_H, type HeroFrame } from "@/components/journey/heroSprite";

/** Fraction of band progress before/after the route plays (character in pipe or idle). */
export const ROUTE_START = 0.1;
export const ROUTE_END = 0.9;

/** Band progress window: starts when the band top is at 85% of the viewport… */
const ENTER_AT = 0.85;
/** …and ends when the band bottom reaches 15% of the viewport. */
const LEAVE_AT = 0.15;

/**
 * Normalized progress of a band through the viewport.
 * < 0: band still below the window. > 1: band scrolled past.
 */
export function bandProgress(scrollY: number, viewportH: number, bandTop: number, bandHeight: number): number {
  const span = (ENTER_AT - LEAVE_AT) * viewportH + bandHeight;
  return (scrollY + ENTER_AT * viewportH - bandTop) / span;
}

/** The band to animate: the one inside its window closest to its midpoint. */
export function pickActiveBand(progresses: number[]): number {
  let best = -1;
  let bestDist = Infinity;
  progresses.forEach((p, i) => {
    if (p < 0 || p > 1) return;
    const d = Math.abs(p - 0.5);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

export interface CharacterState {
  visible: boolean;
  /** Feet position (bottom-center) in band art pixels. */
  x: number;
  y: number;
  frame: HeroFrame;
  /** 1 = facing right (route direction), -1 = left. */
  facing: 1 | -1;
  /** Art pixels hidden below a pipe rim (0 = none). */
  clip: number;
  /** Pipe puff intensities 0..1. */
  puffExit: number;
  puffEntry: number;
  /** Section heading may be revealed. */
  arrived: boolean;
  /** True while walking, running or jumping (direction-sensitive frames). */
  moving: boolean;
}

interface Segment {
  step: RouteStep;
  from: Point;
  to: Point;
  start: number;
  end: number;
  facing: 1 | -1;
}

export interface CompiledRoute {
  segments: Segment[];
  /** Route progress (q) at which the section heading is revealed. */
  revealAt: number;
  startsInPipe: boolean;
  endsInPipe: boolean;
}

const pipeCenter = (p: PipeSpec): number => p.x + p.w / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Feet depth at which the sprite is fully inside a pipe. */
const SUNK = HERO_H + 1;

function defaultWeight(step: RouteStep, from: Point, to: Point): number {
  if (step.weight !== undefined) return step.weight;
  const dist = Math.abs(to[0] - from[0]);
  switch (step.kind) {
    case "emerge":
    case "enter":
      return 1.2;
    case "jump":
      return 0.8;
    case "walk":
      return Math.max(0.3, dist / 40);
    case "run":
      return Math.max(0.3, dist / 60);
    default:
      return 1;
  }
}

/** Resolves a route into timed segments with explicit start/end points. */
export function compileRoute(layout: BandLayout): CompiledRoute {
  const { route, exitPipe, entryPipe } = layout;
  let pos: Point;
  if (route[0]?.kind === "emerge") {
    if (!exitPipe) throw new Error("Route emerges but layout has no exitPipe");
    pos = [pipeCenter(exitPipe), exitPipe.y];
  } else {
    if (!layout.spawn) throw new Error("Route without emerge needs a spawn point");
    pos = layout.spawn;
  }

  const raw: Omit<Segment, "start" | "end">[] = [];
  const weights: number[] = [];
  let facing: 1 | -1 = 1;
  for (const step of route) {
    let from: Point = pos;
    let to: Point = pos;
    switch (step.kind) {
      case "emerge":
        from = [pipeCenter(exitPipe!), exitPipe!.y + SUNK];
        to = [pipeCenter(exitPipe!), exitPipe!.y];
        break;
      case "walk":
      case "run":
        to = [step.to, pos[1]];
        break;
      case "jump":
        to = step.to;
        break;
      case "enter":
        if (!entryPipe) throw new Error("Route enters but layout has no entryPipe");
        from = [pipeCenter(entryPipe), entryPipe.y];
        to = [pipeCenter(entryPipe), entryPipe.y + SUNK];
        break;
    }
    if (to[0] !== from[0]) facing = to[0] > from[0] ? 1 : -1;
    raw.push({ step, from, to, facing });
    weights.push(defaultWeight(step, from, to));
    pos = to;
  }

  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const segments: Segment[] = raw.map((s, i) => {
    const start = acc / total;
    acc += weights[i];
    return { ...s, start, end: acc / total };
  });
  const revealIdx = Math.min(layout.revealAfter, segments.length) - 1;
  return {
    segments,
    revealAt: revealIdx >= 0 ? segments[revealIdx].end : 0,
    startsInPipe: route[0]?.kind === "emerge",
    endsInPipe: route[route.length - 1]?.kind === "enter",
  };
}

const WALK: HeroFrame[] = ["walk1", "walk2", "walk3", "walk4"];
const RUN: HeroFrame[] = ["run1", "run2", "run3", "run4"];

function hidden(arrived: boolean): CharacterState {
  return { visible: false, x: 0, y: 0, frame: "pipe", facing: 1, clip: 0, puffExit: 0, puffEntry: 0, arrived, moving: false };
}

/** Character state for a segment at local time t (0..1). */
function segmentState(seg: Segment, t: number, layout: BandLayout): Omit<CharacterState, "arrived"> {
  const { step, from, to, facing } = seg;
  const base = { visible: true, facing, clip: 0, puffExit: 0, puffEntry: 0, moving: false };

  switch (step.kind) {
    case "emerge": {
      const rim = layout.exitPipe!.y;
      // Rise with a small overshoot, then settle onto the rim.
      const y = t < 0.75 ? lerp(rim + SUNK, rim - 3, t / 0.75) : lerp(rim - 3, rim, (t - 0.75) / 0.25);
      const frame: HeroFrame = t < 0.75 ? "pipe" : t < 0.95 ? "fall" : "land";
      return {
        ...base,
        x: from[0],
        y,
        frame,
        clip: Math.max(0, y - rim),
        puffExit: t < 0.5 ? Math.sin((Math.PI * t) / 0.5) : 0,
      };
    }
    case "enter": {
      const rim = layout.entryPipe!.y;
      // Crouch on the rim, straighten, then sink into the pipe.
      const y = t < 0.25 ? rim : lerp(rim, rim + SUNK, (t - 0.25) / 0.75);
      const frame: HeroFrame = t < 0.12 ? "land" : "pipe";
      const clip = Math.max(0, y - rim);
      return {
        ...base,
        visible: clip < HERO_H,
        x: from[0],
        y,
        frame,
        clip,
        puffEntry: t > 0.7 ? Math.sin((Math.PI * (t - 0.7)) / 0.3) : 0,
      };
    }
    case "walk":
    case "run": {
      const x = lerp(from[0], to[0], t);
      const dist = Math.abs(x - from[0]);
      const frames = step.kind === "walk" ? WALK : RUN;
      const stride = step.kind === "walk" ? 3 : 4;
      return { ...base, moving: true, x, y: from[1], frame: frames[Math.floor(dist / stride) % 4] };
    }
    case "jump": {
      const apex = step.apex ?? 10;
      const x = lerp(from[0], to[0], t);
      const y = lerp(from[1], to[1], t) - apex * 4 * t * (1 - t);
      const vy = to[1] - from[1] - apex * 4 * (1 - 2 * t); // dy/dt; negative = rising
      const frame: HeroFrame = t > 0.94 ? "land" : vy < 0 ? "jump" : "fall";
      return { ...base, moving: true, x, y, frame };
    }
    case "celebrate": {
      const hop = t < 0.5 ? 6 * Math.sin((Math.PI * t) / 0.5) : 0;
      return { ...base, x: from[0], y: from[1] - hop, frame: "celebrate" };
    }
    case "idle":
    default:
      return { ...base, x: from[0], y: from[1], frame: "idle" };
  }
}

/** Route progress q (0..1) from band progress p. */
export function routeProgress(p: number): number {
  return clamp01((p - ROUTE_START) / (ROUTE_END - ROUTE_START));
}

/** The character's state on a band for band progress p. */
export function characterAt(route: CompiledRoute, layout: BandLayout, p: number): CharacterState {
  const q = routeProgress(p);
  const arrived = p > 1 || q >= route.revealAt;
  const { segments } = route;

  if (q <= 0 && route.startsInPipe) return hidden(arrived);
  if (q >= 1 && route.endsInPipe) return hidden(arrived);

  const idx = q >= 1 ? segments.length - 1 : segments.findIndex((s) => q >= s.start && q < s.end);
  const seg = segments[Math.max(0, idx)];
  const t = q >= 1 ? 1 : clamp01((q - seg.start) / (seg.end - seg.start || 1));
  return { ...segmentState(seg, t, layout), arrived };
}

/**
 * Reduced-motion pose: standing still where the character first lands,
 * so it is present in the scene without any travel animation.
 */
export function restState(route: CompiledRoute, layout: BandLayout): CharacterState {
  // Final worlds (no exit pipe) rest at the goal; others where the character first lands.
  const seg = route.endsInPipe
    ? (route.segments[Math.min(layout.revealAfter, route.segments.length) - 1] ?? route.segments[0])
    : route.segments[route.segments.length - 1];
  return {
    visible: true,
    x: seg.to[0],
    y: seg.to[1],
    frame: route.endsInPipe ? "idle" : "celebrate",
    facing: 1,
    clip: 0,
    puffExit: 0,
    puffEntry: 0,
    arrived: true,
    moving: false,
  };
}

/** Parallax offset (art px) for the far background layer. */
export function parallaxOffset(p: number, depth = 14): number {
  return (0.5 - clamp01(p)) * depth;
}
