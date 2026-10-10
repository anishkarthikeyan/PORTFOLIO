/**
 * Tiny registry connecting self-measuring track components to the single
 * JourneyController. Tracks register their stage element and layout; the
 * controller re-measures whenever the set changes.
 */
import type { TrackLayout } from "@/data/worlds";

export interface TrackHandle {
  id: string;
  /** World number + label shown in the HUD. */
  world: number;
  label: string;
  /**
   * "span": the route plays while the track passes the target line.
   * "follow": the route follows the character's y (vertical tracks), so it
   * reaches each ledge/branch/floor as that point crosses the target line.
   */
  mode: "span" | "follow";
  /** Element whose top-left is art (0, 0). */
  el: Element;
  layout: TrackLayout;
  /** CSS px per art px. */
  scale: number;
  /** Section whose heading is revealed when the character arrives. */
  section?: HTMLElement | null;
  /** Called with the local beat while this track is active (moving platforms). */
  onBeat?: (beat: number) => void;
  /** Span window: start when the track top is this many viewport-heights below the target line. */
  pre?: number;
}

const handles = new Map<string, TrackHandle>();
const listeners = new Set<() => void>();

export function registerTrack(handle: TrackHandle): () => void {
  handles.set(handle.id, handle);
  listeners.forEach((l) => l());
  return () => {
    if (handles.get(handle.id) === handle) handles.delete(handle.id);
    listeners.forEach((l) => l());
  };
}

export function getTracks(): TrackHandle[] {
  return [...handles.values()];
}

export function onTracksChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Below this width the compact (phone) layouts are used. */
export const COMPACT_MAX = 639;

/** Shared pixel scale (CSS px per art px), consistent with the world bands. */
export function journeyScale(): number {
  const w = document.documentElement.clientWidth;
  return w <= COMPACT_MAX ? w / 160 : Math.min(w, 1600) / 360;
}
