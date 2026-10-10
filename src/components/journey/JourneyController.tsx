"use client";

import { useEffect, useRef, useState } from "react";
import { getBand, type BandLayout } from "@/data/worlds";
import {
  bandProgress,
  characterAt,
  compileRoute,
  parallaxOffset,
  pickActiveBand,
  restState,
  type CharacterState,
  type CompiledRoute,
} from "@/lib/journey";
import { buildLane, laneRestAt, laneStateAt, type Lane } from "@/lib/lane";
import { buildHeroSheet, HERO_FRAME_INDEX, HERO_FRAME_ORDER, HERO_H, HERO_W } from "./heroSprite";
import { PixelPlatform, PlatformPatterns } from "./PixelPlatform";
import { WarpPipe } from "./WarpPipe";
import styles from "./Journey.module.css";

const SHEET = buildHeroSheet();
/** Must match the breakpoints in Journey.module.css. */
const COMPACT_QUERY = "(max-width: 639px)";
const LANE_QUERY = "(min-width: 1100px)";
/** Desktop "camera": the character tracks a line halfway down the viewport. */
const TARGET = 0.5;
/** A band's route starts when the target line is this far (×vh) above it. */
const PRE = 0.35;

interface MeasuredBand {
  el: HTMLElement;
  far: HTMLElement | null;
  section: HTMLElement | null;
  layout: BandLayout;
  route: CompiledRoute;
  final: boolean;
  /** Stage position relative to the journey root, and in document coordinates. */
  left: number;
  top: number;
  docTop: number;
  height: number;
  /** CSS px per art px. */
  scale: number;
}

/** Geometry of one lane, in px relative to the journey root (drives rendering). */
interface LaneView {
  id: string;
  left: number;
  top: number;
  scale: number;
  lane: Lane;
  beams: { left: number; top: number; width: number; height: number }[];
}

interface MeasuredZone {
  stars: HTMLElement | null;
  docTop: number;
  height: number;
}

/**
 * Owns the single journey character (one source of truth for its position
 * and frame). Scroll → pure state (lib/journey.ts, lib/lane.ts) → direct
 * style writes. React state changes only when geometry is re-measured (lane
 * layout), never per scroll. Work happens in one rAF per scroll/resize event;
 * nothing runs while idle, and everything is cleaned up on unmount.
 *
 * Modes:
 *  - Desktop (≥ 1100px): one target line sweeps bands *and* lanes, so the
 *    character emerges in a band, descends the lane beside the content,
 *    and pipes into the next world — continuously.
 *  - Smaller screens: band-only journey (pipes between sections).
 */
export function JourneyController() {
  const charRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const [lanes, setLanes] = useState<LaneView[]>([]);
  const lanesRef = useRef<LaneView[]>([]);
  const laneElsRef = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    const char = charRef.current;
    const sprite = spriteRef.current;
    const root = char?.parentElement;
    if (!char || !sprite || !root) return;

    const html = document.documentElement;
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactMq = window.matchMedia(COMPACT_QUERY);
    const laneMq = window.matchMedia(LANE_QUERY);
    const routeCache = new Map<string, CompiledRoute>();

    let bands: MeasuredBand[] = [];
    let zones: MeasuredZone[] = [];
    let frameId = 0;
    let lastScrollY = window.scrollY;
    let direction: 1 | -1 = 1;
    let lastTrack = "";
    let lastScale = 0;
    let rootDocTop = 0;

    const measure = () => {
      const compact = compactMq.matches;
      const rootRect = root.getBoundingClientRect();
      const sy = window.scrollY;
      rootDocTop = rootRect.top + sy;
      // Hidden route (Next keeps visited pages mounted but display:none) or not
      // laid out yet: nothing to measure — keep everything inert.
      if (rootRect.width === 0 || rootRect.height === 0) {
        bands = [];
        zones = [];
        lanesRef.current = [];
        setLanes((prev) => (prev.length ? [] : prev));
        return;
      }

      bands = Array.from(root.querySelectorAll<HTMLElement>("[data-band]")).flatMap((el) => {
        const cfg = getBand(el.dataset.band ?? "");
        if (!cfg) return [];
        const variant = compact ? "compact" : "wide";
        const layout = cfg[variant];
        const key = `${cfg.id}/${variant}`;
        if (!routeCache.has(key)) routeCache.set(key, compileRoute(layout));
        const route = routeCache.get(key)!;
        const stage = el.querySelector<HTMLElement>(`[data-layout="${variant}"]`);
        const r = (stage ?? el).getBoundingClientRect();
        const next = el.nextElementSibling;
        return [
          {
            el,
            far: el.querySelector<HTMLElement>("[data-far]"),
            section: next instanceof HTMLElement && next.tagName === "SECTION" ? next : null,
            layout,
            route,
            final: !route.endsInPipe,
            left: r.left - rootRect.left,
            top: r.top - rootRect.top,
            docTop: r.top + sy,
            height: r.height,
            scale: r.width / layout.width,
          },
        ];
      });

      zones = Array.from(root.querySelectorAll<HTMLElement>("[data-zone]")).map((z) => {
        const r = z.getBoundingClientRect();
        return { stars: z.querySelector<HTMLElement>("[data-depth]"), docTop: r.top + sy, height: r.height };
      });

      // Lanes: one per zone whose band warps onward (not the final world).
      const nextLanes: LaneView[] = [];
      if (laneMq.matches) {
        const pre = PRE * window.innerHeight;
        root.querySelectorAll<HTMLElement>("[data-zone]").forEach((zone) => {
          const bandEl = zone.querySelector<HTMLElement>("[data-band]");
          const band = bands.find((b) => b.el === bandEl);
          const container = zone.querySelector<HTMLElement>("section .container");
          if (!band || band.final || !container) return;
          const zr = zone.getBoundingClientRect();
          const cr = container.getBoundingClientRect();
          const contentRight = cr.right - parseFloat(getComputedStyle(container).paddingRight);
          const s = band.scale;
          if (!(s > 0)) return;
          const top = band.top + band.height; // root-relative
          const topDoc = band.docTop + band.height;
          const left = contentRight - rootRect.left + 6;
          const widthPx = rootRect.right - rootRect.left - left - 6;
          const endDoc = zr.bottom + sy - pre;

          const anchorEls = Array.from(zone.querySelectorAll<HTMLElement>("[data-reveal], [data-anchor]")).filter(
            (el) => !el.closest("[data-band]"),
          );
          const anchors: { y: number; el: HTMLElement; right: number }[] = anchorEls
            .map((el) => {
              const r = el.getBoundingClientRect();
              return { el, y: (r.top + sy - topDoc) / s, right: r.right };
            })
            // Only headings and panels that reach the lane edge get ledges.
            .filter((a) => a.el.hasAttribute("data-reveal") || a.right >= contentRight - 6);
          const lane = buildLane({
            width: widthPx / s,
            height: (endDoc - topDoc) / s,
            anchors: anchors.map((a) => a.y),
          });
          if (!lane) return;

          // Girders from section headings (empty space to their right) to their ledge.
          const beams = anchors
            .filter(
              (a) =>
                a.el.hasAttribute("data-reveal") &&
                a.el.parentElement?.classList.contains("container") &&
                a.right < contentRight - 24,
            )
            .flatMap((a) => {
              // Attach to the nearest anchored ledge just below the heading top.
              const ledge = lane.ledges.find((l) => l.anchored && l.y >= a.y && l.y - a.y < 30);
              if (!ledge) return [];
              const from = a.right - rootRect.left + 16;
              return [{ left: from, top: top + ledge.y * s, width: Math.max(0, left - from), height: 3 * s }];
            });

          nextLanes.push({ id: zone.dataset.zone ?? "", left, top, scale: s, lane, beams });
        });
      }
      lanesRef.current = nextLanes;
      setLanes((prev) => (JSON.stringify(prev) === JSON.stringify(nextLanes) ? prev : nextLanes));
    };

    const place = (st: CharacterState, left0: number, top0: number, s: number, track: string, reduce: boolean) => {
      if (!st.visible) {
        char.dataset.visible = "false";
        lastTrack = track;
        return;
      }
      if (s !== lastScale) {
        lastScale = s;
        char.style.width = `${HERO_W * s}px`;
        char.style.height = `${HERO_H * s}px`;
        sprite.style.backgroundSize = `${HERO_W * HERO_FRAME_ORDER.length * s}px ${HERO_H * s}px`;
        sprite.style.setProperty("--fx-blink", `${-HERO_FRAME_INDEX.blink * HERO_W * s}px`);
      }
      // Face the direction of travel: reversing the scroll turns the character around.
      const facing = st.moving && direction < 0 ? -st.facing : st.facing;
      const left = left0 + (st.x - HERO_W / 2) * s;
      const top = top0 + (st.y - HERO_H) * s;
      char.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      sprite.style.setProperty("--fx", `${-HERO_FRAME_INDEX[st.frame] * HERO_W * s}px`);
      sprite.style.transform = facing < 0 ? "scaleX(-1)" : "";
      sprite.style.clipPath = st.clip > 0 ? `inset(0 0 ${(st.clip * s).toFixed(1)}px 0)` : "";
      char.dataset.frame = st.frame;
      // In reduced motion, fade between places instead of travelling.
      if (reduce && track !== lastTrack) {
        char.dataset.visible = "false";
        requestAnimationFrame(() => (char.dataset.visible = "true"));
      } else {
        char.dataset.visible = "true";
      }
      lastTrack = track;
    };

    const update = () => {
      frameId = 0;
      const reduce = reduceMq.matches;
      const y = window.scrollY;
      if (y !== lastScrollY) direction = y > lastScrollY ? 1 : -1;
      lastScrollY = y;
      const vh = window.innerHeight;
      const laneMode = lanesRef.current.length > 0;
      const t = y + TARGET * vh;

      // Starfield parallax (zones near the viewport only).
      zones.forEach((z) => {
        if (!z.stars) return;
        const inView = z.docTop < y + vh && z.docTop + z.height > y;
        z.stars.style.transform =
          !reduce && inView ? `translate3d(0, ${((y + vh / 2 - (z.docTop + z.height / 2)) * 0.12).toFixed(1)}px, 0)` : "";
      });

      // Band progress: unified target line on desktop, viewport window otherwise.
      const progress = bands.map((b) =>
        laneMode ? (t - (b.docTop - PRE * vh)) / (b.height + PRE * vh) : bandProgress(y, vh, b.docTop, b.height),
      );

      bands.forEach((b, i) => {
        const p = progress[i];
        const inView = b.docTop < y + vh && b.docTop + b.height > y;
        const st = characterAt(b.route, b.layout, p);
        b.el.dataset.active = inView ? "true" : "false";
        if (b.far) b.far.style.transform = !reduce && inView ? `translate3d(${parallaxOffset(p) * b.scale}px,0,0)` : "";
        b.el.style.setProperty("--puff-exit", reduce ? "0" : st.puffExit.toFixed(3));
        b.el.style.setProperty("--puff-entry", reduce ? "0" : st.puffEntry.toFixed(3));
        if (b.section) b.section.dataset.arrived = reduce || st.arrived ? "true" : "false";
      });

      // 1) A band whose route is playing.
      const active = laneMode
        ? progress.findIndex((p, i) => p >= 0 && (p <= 1 || (bands[i].final && bands[i].docTop + bands[i].height > y)))
        : pickActiveBand(progress);
      if (active >= 0) {
        const b = bands[active];
        const st = reduce ? restState(b.route, b.layout) : characterAt(b.route, b.layout, Math.min(progress[active], 1));
        lanesRef.current.forEach((l) => laneElsRef.current.get(l.id)?.style.setProperty("--puff-exit", "0"));
        return place(st, b.left, b.top, b.scale, `band:${active}`, reduce);
      }

      // 2) A lane beside the content (desktop).
      for (const l of lanesRef.current) {
        const ta = (t - (rootDocTop + l.top)) / l.scale;
        const el = laneElsRef.current.get(l.id);
        if (ta < l.lane.startAt || ta >= l.lane.endAt) {
          el?.style.setProperty("--puff-exit", "0");
          el?.style.setProperty("--puff-entry", "0");
          continue;
        }
        const st = reduce ? laneRestAt(l.lane, ta) : laneStateAt(l.lane, ta);
        el?.style.setProperty("--puff-exit", reduce ? "0" : st.puffExit.toFixed(3));
        el?.style.setProperty("--puff-entry", reduce ? "0" : st.puffEntry.toFixed(3));
        return place(st, l.left, l.top, l.scale, `lane:${l.id}:${reduce ? Math.round(st.y) : ""}`, reduce);
      }

      // 3) Between worlds: inside a pipe.
      char.dataset.visible = "false";
      lastTrack = "";
    };

    const schedule = () => {
      if (!frameId) frameId = requestAnimationFrame(update);
    };
    const remeasure = () => {
      measure();
      schedule();
    };

    // Panels "power on" as they enter the viewport; reset when they drop below it.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) el.dataset.shown = "true";
          else if (e.boundingClientRect.top > 0) el.dataset.shown = "false";
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    const anchorEls = Array.from(root.querySelectorAll<HTMLElement>("[data-anchor]"));

    const applyMotionMode = () => {
      const reduce = reduceMq.matches;
      html.dataset.journey = reduce ? "still" : "motion";
      if (reduce) {
        io.disconnect();
        anchorEls.forEach((el) => delete el.dataset.shown);
      } else {
        anchorEls.forEach((el) => io.observe(el));
      }
    };

    measure();
    applyMotionMode();
    update();

    const onMotionChange = () => {
      applyMotionMode();
      remeasure();
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    window.addEventListener("pageshow", remeasure); // back/forward cache restores
    reduceMq.addEventListener("change", onMotionChange);
    compactMq.addEventListener("change", remeasure);
    laneMq.addEventListener("change", remeasure);
    // Content height changes (filters, fonts, <details>) move bands and ledges.
    const ro = new ResizeObserver(remeasure);
    ro.observe(root);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("pageshow", remeasure);
      reduceMq.removeEventListener("change", onMotionChange);
      compactMq.removeEventListener("change", remeasure);
      laneMq.removeEventListener("change", remeasure);
      ro.disconnect();
      io.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      delete html.dataset.journey;
      anchorEls.forEach((el) => delete el.dataset.shown);
      bands.forEach((b) => b.section && delete b.section.dataset.arrived);
    };
  }, []);

  return (
    <>
      {lanes.map((l) => (
        <LaneScenery
          key={l.id}
          view={l}
          register={(el) => {
            if (el) laneElsRef.current.set(l.id, el);
            else laneElsRef.current.delete(l.id);
          }}
        />
      ))}
      <div ref={charRef} className={styles.character} data-visible="false" aria-hidden="true">
        <div ref={spriteRef} className={styles.sprite} style={{ backgroundImage: SHEET }} />
      </div>
    </>
  );
}

/** Ledges, pipes and girders of one lane (decorative, desktop only). */
function LaneScenery({ view, register }: { view: LaneView; register: (el: HTMLDivElement | null) => void }) {
  const { lane, scale: s } = view;
  const ns = `lane-${view.id}`;
  return (
    <>
      {view.beams.map((b, i) => (
        <div key={i} className={styles.beam} style={{ left: b.left, top: b.top, width: b.width, height: b.height }} aria-hidden="true" />
      ))}
      <div ref={register} className={styles.lane} style={{ left: view.left, top: view.top }} aria-hidden="true">
        <svg
          width={lane.width * s}
          height={lane.height * s}
          viewBox={`0 0 ${lane.width} ${lane.height}`}
          shapeRendering="crispEdges"
          focusable="false"
        >
          <PlatformPatterns ns={ns} />
          {lane.ledges.map((l, i) => (
            <g key={i}>
              {l.anchored && (
                // Bracket bolting the ledge to the content edge
                <>
                  <rect x={l.x0} y={l.y + 4} width={2} height={6} fill="#3a4454" />
                  <rect x={l.x0 + 2} y={l.y + 4} width={2} height={3} fill="#3a4454" />
                </>
              )}
              {!l.anchored && i !== lane.ledges.length - 1 && (
                // Chain hanging the outer ledge from above
                <rect x={l.x1 - 4} y={l.y - 14} width={1} height={14} fill="#2c3542" />
              )}
              <PixelPlatform
                p={{ x: l.x0, y: l.y, w: l.x1 - l.x0, h: 4, kind: l.anchored ? "metal" : "block" }}
                floor={lane.height}
                ns={ns}
              />
            </g>
          ))}
          <WarpPipe pipe={lane.exitPipe} floor={lane.ledges[0].y} role="exit" />
          <WarpPipe pipe={lane.entryPipe} floor={lane.ledges[lane.ledges.length - 1].y} role="entry" />
        </svg>
      </div>
    </>
  );
}
