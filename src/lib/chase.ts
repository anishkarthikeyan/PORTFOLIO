/**
 * Global journey map + chase. Pure functions only.
 *
 * Every track on the page owns a slice of one global "beat" timeline, in
 * document order. Scrolling moves a *target* beat; the displayed character
 * *chases* it at game speed:
 *
 *   - slow scrolling → the character keeps up exactly;
 *   - normal scrolling → it trails by at most ~1 second, sprinting to catch up;
 *   - big jumps (flick, nav click, several worlds) → it warps through a pipe.
 *
 * Nothing here touches the DOM or time sources, so it is fully testable.
 */

export const CHASE = {
  /** Natural game speed (beats per second). */
  baseSpeed: 2.4,
  /** Fastest catch-up (a visible sprint) before warping instead. */
  maxSpeed: 12,
  /** Catch-up time constant (s): together with baseSpeed, any gap < warpGap closes in ≈1–1.4s. */
  maxLag: 0.7,
  /** Above this speed the character visibly sprints (run frames). */
  sprintAt: 4,
  /** Gaps larger than this (beats) warp through a pipe… */
  warpGap: 18,
  /** …as does skipping this many tracks at once (nav clicks, flicks). */
  warpTracks: 4,
} as const;

export interface TrackWindow {
  id: string;
  /** Target-line range (document px) over which this track plays. */
  start: number;
  end: number;
  /** Total beats of the track's route. */
  total: number;
  /** Optional [targetLine, beat] knots (e.g. vertical tracks aligned to ledges). */
  knots?: [number, number][];
}

export interface MappedTrack extends TrackWindow {
  /** Global beat at which this track starts. */
  offset: number;
}

export interface JourneyMap {
  tracks: MappedTrack[];
  total: number;
}

/** Orders tracks, removes window overlaps, and assigns global beat offsets. */
export function buildJourneyMap(windows: TrackWindow[]): JourneyMap {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  let prevEnd = -Infinity;
  let offset = 0;
  const tracks: MappedTrack[] = sorted.map((w) => {
    const start = Math.max(w.start, prevEnd);
    const end = Math.max(start + 1, w.end);
    prevEnd = end;
    const t = { ...w, start, end, offset };
    offset += w.total;
    return t;
  });
  return { tracks, total: offset };
}

function interpolate(knots: [number, number][], x: number): number {
  if (x <= knots[0][0]) return knots[0][1];
  for (let i = 1; i < knots.length; i++) {
    const [x1, y1] = knots[i];
    if (x <= x1) {
      const [x0, y0] = knots[i - 1];
      return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return knots[knots.length - 1][1];
}

/** Local beat of a track for a target line position. */
export function localBeat(track: TrackWindow, t: number): number {
  if (t <= track.start) return 0;
  if (t >= track.end) return track.total;
  if (track.knots && track.knots.length > 1) {
    return Math.min(track.total, Math.max(0, interpolate(track.knots, t)));
  }
  return ((t - track.start) / (track.end - track.start)) * track.total;
}

/** Global target beat for a target line position (document px). */
export function targetBeat(map: JourneyMap, t: number): number {
  let beat = 0;
  for (const tr of map.tracks) {
    if (t < tr.start) break;
    beat = tr.offset + localBeat(tr, t);
  }
  return beat;
}

/** Which track a global beat falls in, and the local beat within it. */
export function locate(map: JourneyMap, beat: number): { index: number; local: number } {
  const { tracks } = map;
  if (!tracks.length) return { index: -1, local: 0 };
  for (let i = 0; i < tracks.length; i++) {
    const tr = tracks[i];
    if (beat < tr.offset + tr.total || i === tracks.length - 1) {
      return { index: i, local: Math.min(tr.total, Math.max(0, beat - tr.offset)) };
    }
  }
  return { index: tracks.length - 1, local: tracks[tracks.length - 1].total };
}

export type ChaseResult = { beat: number; settled: boolean; speed: number } | { warp: true; settled: false };

/**
 * One animation step of the chase. `dt` in seconds.
 * Returns the new displayed beat, or a warp request for large gaps.
 */
export function chaseStep(map: JourneyMap, displayed: number, target: number, dt: number): ChaseResult {
  const gap = target - displayed;
  if (Math.abs(gap) < 1e-3) return { beat: target, settled: true, speed: 0 };
  const a = locate(map, displayed).index;
  const b = locate(map, target).index;
  if (Math.abs(gap) > CHASE.warpGap || Math.abs(b - a) >= CHASE.warpTracks) return { warp: true, settled: false };
  // Natural speed plus a catch-up term, so the character stays within ~1s.
  const speed = Math.min(CHASE.maxSpeed, CHASE.baseSpeed + Math.abs(gap) / CHASE.maxLag);
  const step = Math.min(Math.abs(gap), speed * dt);
  const beat = displayed + Math.sign(gap) * step;
  return { beat, settled: Math.abs(target - beat) < 1e-3, speed };
}

/** Events crossed while moving forward from `from` to `to` (exclusive/inclusive). */
export function crossedEvents<T extends { beat: number }>(events: T[], from: number, to: number): T[] {
  if (to <= from) return [];
  return events.filter((e) => e.beat > from && e.beat <= to);
}
