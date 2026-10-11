/**
 * Journey route engine. Pure functions only — no DOM, no timers.
 *
 * A track (band, corridor, tree, elevator, finale…) has a layout with a route
 * of steps. `compileRoute` turns the route into timed segments measured in
 * **beats** (one beat ≈ one short move at game speed). `stateAtBeat` returns
 * the character's pose for any beat, so the same beat always gives the same
 * state — reverse scrolling and fast skips are exact.
 */
import type { BandLayout, PipeSpec, Point, RouteStep, TrackLayout } from "@/data/worlds";
import { HERO_H, type HeroFrame } from "@/components/journey/heroSprite";

/** Fraction of band progress before/after the route plays (character in pipe or idle). */
export const ROUTE_START = 0.1;
export const ROUTE_END = 0.9;

/** Band progress window (small screens): starts when the band top is at 85% of the viewport… */
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
  /** Feet position (bottom-center) in track art pixels. */
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
  /** Feet stand on a moving platform (elevator / conveyor) at this point. */
  riding?: boolean;
  /** Sprite scale (0.5 = "mini" top-down size in maze worlds). */
  scale?: number;
}

export interface Segment {
  step: RouteStep;
  from: Point;
  to: Point;
  /** Normalized position within the route (0..1). */
  start: number;
  end: number;
  /** Absolute beats from the start of the route. */
  b0: number;
  b1: number;
  facing: 1 | -1;
  /** Opening used by emerge/enter (pipe or hole). */
  pipe?: PipeSpec;
}

export interface RouteEvent {
  beat: number;
  kind: "block" | "item" | "stomp" | "coin";
  id: string;
}

export interface CompiledRoute {
  segments: Segment[];
  /** Total beats. */
  total: number;
  /** Route progress (q) at which the section heading is revealed. */
  revealAt: number;
  startsInPipe: boolean;
  endsInPipe: boolean;
  /** Block bumps and item grabs, in beat order. */
  events: RouteEvent[];
  /** Character drawn at half size on this track. */
  mini: boolean;
}

const pipeCenter = (p: PipeSpec): number => p.x + p.w / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Feet depth at which the sprite is fully inside a pipe. */
const SUNK = HERO_H + 1;

/** Game-speed durations, in beats. */
function defaultWeight(step: RouteStep, from: Point, to: Point): number {
  if (step.weight !== undefined) return step.weight;
  const dx = Math.abs(to[0] - from[0]);
  const dy = Math.abs(to[1] - from[1]);
  switch (step.kind) {
    case "emerge":
    case "enter":
      return 1.1;
    case "jump":
      return 1;
    case "fly":
      return Math.max(1.5, dx / 40);
    case "move":
      return Math.max(0.25, (dx + dy) / 30);
    case "walk":
      return Math.max(0.35, dx / 36);
    case "run":
      return Math.max(0.35, dx / 54);
    case "climb":
      return Math.max(0.5, dy / 24);
    case "slide":
      return Math.max(0.5, dy / 48);
    case "ride":
      return Math.max(0.6, Math.hypot(dx, dy) / 30);
    case "hide":
      return 0.6;
    case "grab":
      return 1.2;
    default:
      return 1;
  }
}

function opening(layout: TrackLayout, name: string | undefined, fallback: PipeSpec | undefined, what: string): PipeSpec {
  const p = name ? layout.holes?.[name] : fallback;
  if (!p) throw new Error(`Route ${what} but the opening is missing`);
  return p;
}

/** Resolves a route into timed segments with explicit start/end points. */
export function compileRoute(layout: TrackLayout): CompiledRoute {
  const { route } = layout;
  const first = route[0];
  let pos: Point;
  if (first?.kind === "emerge") {
    const p = opening(layout, first.from, layout.exitPipe, "emerges");
    pos = [pipeCenter(p), p.y];
  } else {
    if (!layout.spawn) throw new Error("Route without emerge needs a spawn point");
    pos = layout.spawn;
  }

  const raw: Omit<Segment, "start" | "end" | "b0" | "b1">[] = [];
  const weights: number[] = [];
  let facing: 1 | -1 = 1;
  for (const step of route) {
    let from: Point = pos;
    let to: Point = pos;
    let pipe: PipeSpec | undefined;
    switch (step.kind) {
      case "emerge":
        pipe = opening(layout, step.from, layout.exitPipe, "emerges");
        from = [pipeCenter(pipe), pipe.y + SUNK];
        to = [pipeCenter(pipe), pipe.y];
        break;
      case "walk":
      case "run":
        to = [step.to, pos[1]];
        break;
      case "jump":
      case "ride":
      case "hide":
      case "fly":
      case "move":
        to = step.to;
        break;
      case "climb":
      case "slide":
        to = [pos[0], step.toY];
        break;
      case "enter":
        pipe = opening(layout, step.into, layout.entryPipe, "enters");
        from = [pipeCenter(pipe), pipe.y];
        to = [pipeCenter(pipe), pipe.y + SUNK];
        break;
    }
    if (to[0] !== from[0] && step.kind !== "hide") facing = to[0] > from[0] ? 1 : -1;
    raw.push({ step, from, to, facing, pipe });
    weights.push(defaultWeight(step, from, to));
    pos = to;
  }

  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const events: RouteEvent[] = [];
  const segments: Segment[] = raw.map((s, i) => {
    const b0 = acc;
    acc += weights[i];
    const seg = { ...s, b0, b1: acc, start: b0 / total, end: acc / total };
    if (s.step.kind === "jump" && s.step.bump) events.push({ beat: b0 + weights[i] * 0.5, kind: "block", id: s.step.bump });
    if (s.step.kind === "jump" && s.step.stomp) events.push({ beat: b0 + weights[i] * 0.97, kind: "stomp", id: s.step.stomp });
    if (s.step.kind === "idle" && s.step.event) events.push({ beat: b0 + weights[i] * 0.4, kind: "block", id: s.step.event });
    if (s.step.kind === "jump" && s.step.over) events.push({ beat: b0 + weights[i] * 0.5, kind: "block", id: s.step.over });
    if (s.step.kind === "grab") events.push({ beat: b0 + weights[i] * 0.4, kind: "item", id: s.step.item });
    return seg;
  });
  // Pass-through collectibles (coins, pellets): the beat where the body crosses them.
  for (const b of layout.blocks ?? []) {
    if (b.kind !== "coin" && b.kind !== "pellet") continue;
    const beat = passBeat(segments, b.x + 4, b.y + 4);
    if (beat !== null) events.push({ beat, kind: b.kind === "coin" ? "coin" : "block", id: b.id });
  }
  events.sort((a, b) => a.beat - b.beat);

  const revealIdx = Math.min(layout.revealAfter, segments.length) - 1;
  const last = route[route.length - 1];
  return {
    segments,
    total,
    revealAt: revealIdx >= 0 ? segments[revealIdx].end : 0,
    startsInPipe: first?.kind === "emerge",
    endsInPipe: last?.kind === "enter",
    events,
    mini: Boolean(layout.mini),
  };
}

/** Feet position during a jetpack flight (shared by state + coin placement). */
export function flyPoint(from: Point, to: Point, step: { lift: number; wave?: number; waves?: number; ease?: boolean }, t: number): Point {
  const x = lerp(from[0], to[0], t);
  if (step.ease) {
    // Thrust then glide: smoothstep between the two heights.
    const e = t * t * (3 - 2 * t);
    return [x, lerp(from[1], to[1], e)];
  }
  const y =
    lerp(from[1], to[1], t) -
    step.lift * Math.sin(Math.PI * t) -
    (step.wave ?? 0) * Math.sin(2 * Math.PI * (step.waves ?? 2) * t) * Math.sin(Math.PI * t);
  return [x, y];
}

/**
 * Beat at which the character's body (16 × 24 above the feet) passes the
 * point (cx, cy), or null if it never does. Used for coins and pellets.
 */
function passBeat(segments: Segment[], cx: number, cy: number): number | null {
  for (const s of segments) {
    const k = s.step.kind;
    if ((k === "climb" || k === "slide") && Math.abs(cx - s.from[0]) <= 6) {
      // Vertical moves: the body passes cy when the feet are 12 px below it.
      const feet = cy + 12;
      const [y0, y1] = [s.from[1], s.to[1]];
      if (y0 !== y1 && feet >= Math.min(y0, y1) && feet <= Math.max(y0, y1)) return s.b0 + ((feet - y0) / (y1 - y0)) * (s.b1 - s.b0);
      continue;
    }
    if (k === "move") {
      // Mini (top-down) body: 8 × 12. Moves are axis-aligned.
      const [x0, y0] = s.from;
      const [x1, y1] = s.to;
      const onX = Math.abs(cx - x0) <= 4 && Math.abs(cx - x1) <= 4;
      const onY = Math.abs(cy + 6 - y0) <= 4 && Math.abs(cy + 6 - y1) <= 4;
      if (onX && y0 !== y1 && cy + 6 >= Math.min(y0, y1) && cy + 6 <= Math.max(y0, y1)) return s.b0 + ((cy + 6 - y0) / (y1 - y0)) * (s.b1 - s.b0);
      if (onY && x0 !== x1 && cx >= Math.min(x0, x1) && cx <= Math.max(x0, x1)) return s.b0 + ((cx - x0) / (x1 - x0)) * (s.b1 - s.b0);
      continue;
    }
    if (k !== "walk" && k !== "run" && k !== "ride" && k !== "fly" && k !== "jump") continue;
    const [x0, x1] = [s.from[0], s.to[0]];
    if (cx < Math.min(x0, x1) || cx > Math.max(x0, x1) || x0 === x1) continue;
    const t = (cx - x0) / (x1 - x0);
    let feet: number;
    if (k === "fly" && s.step.kind === "fly") feet = flyPoint(s.from, s.to, s.step, t)[1];
    else if (k === "jump" && s.step.kind === "jump") feet = lerp(s.from[1], s.to[1], t) - (s.step.apex ?? 10) * 4 * t * (1 - t);
    else feet = lerp(s.from[1], s.to[1], t);
    if (cy <= feet && cy >= feet - HERO_H) return s.b0 + t * (s.b1 - s.b0);
  }
  return null;
}

const WALK: HeroFrame[] = ["walk1", "walk2", "walk3", "walk4"];
const RUN: HeroFrame[] = ["run1", "run2", "run3", "run4"];

function hidden(arrived: boolean): CharacterState {
  return { visible: false, x: 0, y: 0, frame: "pipe", facing: 1, clip: 0, puffExit: 0, puffEntry: 0, arrived, moving: false };
}

/** Character state for a segment at local time t (0..1). */
function segmentState(seg: Segment, t: number): Omit<CharacterState, "arrived"> {
  const { step, from, to, facing } = seg;
  const base = { visible: true, facing, clip: 0, puffExit: 0, puffEntry: 0, moving: false };

  switch (step.kind) {
    case "emerge": {
      const rim = seg.pipe!.y;
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
      const rim = seg.pipe!.y;
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
    case "fly": {
      const [x, y] = flyPoint(from, to, step, t);
      return { ...base, moving: true, x, y, frame: t > 0.94 ? "land" : "jump" };
    }
    case "move": {
      const x = lerp(from[0], to[0], t);
      const y = lerp(from[1], to[1], t);
      const dist = Math.abs(x - from[0]) + Math.abs(y - from[1]);
      return { ...base, moving: to[0] !== from[0], x, y, frame: WALK[Math.floor(dist / 2) % 4], scale: 0.5 };
    }
    case "climb":
    case "slide": {
      const y = lerp(from[1], to[1], t);
      const frame: HeroFrame =
        step.kind === "slide" ? "climb1" : Math.floor(Math.abs(y - from[1]) / 4) % 2 ? "climb2" : "climb1";
      return { ...base, x: from[0], y, frame };
    }
    case "ride":
      return { ...base, x: lerp(from[0], to[0], t), y: lerp(from[1], to[1], t), frame: "idle", riding: true };
    case "hide":
      return { ...base, visible: false, x: lerp(from[0], to[0], t), y: lerp(from[1], to[1], t), frame: "pipe" };
    case "grab": {
      // Small hop to touch the item, then a celebrate pose.
      const hop = t < 0.5 ? 6 * Math.sin((Math.PI * t) / 0.5) : 0;
      return { ...base, x: from[0], y: from[1] - hop, frame: t < 0.5 ? "jump" : "celebrate" };
    }
    case "celebrate": {
      const hop = t < 0.5 ? 6 * Math.sin((Math.PI * t) / 0.5) : 0;
      return { ...base, x: from[0], y: from[1] - hop, frame: "celebrate" };
    }
    case "idle":
    default:
      return { ...base, x: from[0], y: from[1], frame: step.kind === "idle" && step.pose === "wave" ? "wave" : "idle" };
  }
}

/** The character's state at an absolute beat of a route. */
export function stateAtBeat(route: CompiledRoute, beat: number): CharacterState {
  const { segments, total } = route;
  const arrived = beat >= route.revealAt * total;
  if (beat <= 0 && route.startsInPipe) return hidden(arrived);
  if (beat >= total && route.endsInPipe) return hidden(true);
  const b = Math.min(Math.max(beat, 0), total);
  let idx = segments.findIndex((s) => b >= s.b0 && b < s.b1);
  if (idx < 0) idx = segments.length - 1;
  const seg = segments[idx];
  const t = clamp01((b - seg.b0) / (seg.b1 - seg.b0 || 1));
  const st = segmentState(seg, t);
  return { ...st, arrived, ...(route.mini ? { scale: 0.5 } : {}) };
}

/**
 * Nearest beat at or before `beat` where the character stands on something
 * (used as the landing spot of a warp, so it never pops out mid-air).
 */
export function standingBeat(route: CompiledRoute, beat: number): number {
  const b = Math.min(Math.max(beat, 0), route.total);
  const airborne = (k: string) => ["jump", "fly", "climb", "slide", "hide", "grab", "emerge", "enter"].includes(k);
  // Mini (maze) moves are always "standing".
  let idx = route.segments.findIndex((s) => b >= s.b0 && b < s.b1);
  if (idx < 0) idx = route.segments.length - 1;
  if (!airborne(route.segments[idx].step.kind)) return b;
  // Walk back to the last moment the character stood on something.
  while (idx > 0 && airborne(route.segments[idx].step.kind) && route.segments[idx].step.kind !== "emerge") idx--;
  const seg = route.segments[idx];
  return Math.max(0, seg.b1 - 1e-6);
}

/** Route progress q (0..1) from band progress p. */
export function routeProgress(p: number): number {
  return clamp01((p - ROUTE_START) / (ROUTE_END - ROUTE_START));
}

/** The character's state on a band for band progress p (small-screen mapping). */
export function characterAt(route: CompiledRoute, _layout: BandLayout, p: number): CharacterState {
  const q = routeProgress(p);
  const state = stateAtBeat(route, q * route.total);
  return { ...state, arrived: p > 1 || q >= route.revealAt };
}

/**
 * Reduced-motion pose: standing still where the character first lands
 * (or at the goal for routes that don't end in a pipe).
 */
export function restState(route: CompiledRoute, layout: TrackLayout): CharacterState {
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
