"use client";

import { useEffect, useRef } from "react";
import type { TrackLayout } from "@/data/worlds";
import { compileRoute, restState, standingBeat, stateAtBeat, type CharacterState, type CompiledRoute } from "@/lib/journey";
import { buildJourneyMap, CHASE, chaseStep, crossedEvents, locate, targetBeat, type JourneyMap, type TrackWindow } from "@/lib/chase";
import { buildHeroSheet, HERO_FRAME_INDEX, HERO_FRAME_ORDER, HERO_H, HERO_W } from "./heroSprite";
import { getTracks, onTracksChange, type TrackHandle } from "./registry";
import { play } from "@/lib/sfx";
import { PIPE } from "./WarpPipe";
import styles from "./Journey.module.css";

const SHEET = buildHeroSheet();
/** The character follows a target line this far down the viewport. */
const TARGET = 0.55;
/**
 * Span windows set each world's pace: its route plays over the whole time the
 * track is on screen. It starts when the track top is this far (× viewport
 * height) below the target line, i.e. just entering at the bottom (0.55 + 0.45 = 1)…
 */
const PRE = 0.45;
/** …and ends when the track bottom is this far above it, i.e. still at 20% from the top. */
const POST = 0.35;
/** Warp animation timings (ms). */
const SINK_MS = 260;
const RISE_MS = 320;
/** Art px per metre of distance. */
const PX_PER_M = 16;

interface MeasuredTrack {
  handle: TrackHandle;
  route: CompiledRoute;
  /** Stage position relative to the journey root. */
  left: number;
  top: number;
  scale: number;
  window: TrackWindow;
}

interface GlobalEvent {
  beat: number;
  kind: "block" | "item" | "stomp" | "coin";
  id: string;
  track: number;
}

const routeCache = new WeakMap<TrackLayout, CompiledRoute>();
function routeFor(layout: TrackLayout) {
  let r = routeCache.get(layout);
  if (!r) routeCache.set(layout, (r = compileRoute(layout)));
  return r;
}

/**
 * The single owner of the journey character.
 *
 * Scroll sets a *target* beat on the global journey timeline; the displayed
 * character *chases* it at game speed (≤ ~1s behind) and warps through a
 * pipe for big jumps. Blocks crossed while moving forward award points,
 * pop coins and unlock items. A rAF loop runs only while the character is
 * catching up or warping — never while idle.
 */
export function JourneyController() {
  const charRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const warpRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const char = charRef.current;
    const sprite = spriteRef.current;
    const warpPipe = warpRef.current;
    const bubble = bubbleRef.current;
    const bubbleText = bubble?.querySelector("span");
    const nearMark = nearRef.current;
    const root = char?.parentElement;
    if (!char || !sprite || !warpPipe || !root || !bubble || !bubbleText || !nearMark) return;

    const html = document.documentElement;
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hud = document.querySelector<HTMLElement>("[data-hud]");
    const hudScore = hud?.querySelector<HTMLElement>("[data-hud-score]");
    const hudBlocks = hud?.querySelector<HTMLElement>("[data-hud-blocks]");
    const hudDistance = hud?.querySelector<HTMLElement>("[data-hud-distance]");
    const hudWorld = hud?.querySelector<HTMLElement>("[data-hud-world]");

    let tracks: MeasuredTrack[] = [];
    let scenery: { stars: { el: HTMLElement; top: number; h: number }[]; far: { el: HTMLElement; top: number; h: number }[] } = {
      stars: [],
      far: [],
    };
    let map: JourneyMap = { tracks: [], total: 0 };
    let events: GlobalEvent[] = [];
    let totalBlocks = 0;
    let rootTop = 0;

    // Journey state (session only).
    let displayed = 0;
    let target = 0;
    let started = false;
    let frameId = 0;
    let lastTime = 0;
    let lastActive = -1;
    let lastScale = 0;
    let lastPos: { x: number; y: number; track: number } | null = null;
    let direction: 1 | -1 = 1;
    let lastT = 0;
    let score = 0;
    let distance = 0;
    const collected = new Set<string>();
    const visited = new Set<number>();
    let warp: { phase: "sink" | "rise"; t0: number; to: number } | null = null;
    /** Active power-up (lasts for the rest of the world it was found in). */
    /** world -1 = cheat power-up, active until `cheatUntil`. */
    let power: { kind: "coffee" | "jetpack" | "star"; world: number } | null = null;
    let hits = 0;
    let coins = 0;
    let totalCoins = 0;
    let bossDown = false;
    let tStart = 0;
    let tEnd = 0;
    let maxSavedWorld = 0;
    let cheatUntil = 0;
    let lastSeg = "";
    const timers: ReturnType<typeof setTimeout>[] = [];
    let lastWorldKey = "";
    let anchors: { el: HTMLElement; x: number; y: number; top: number; right: number }[] = [];
    let near: HTMLElement | null = null;
    let bubbleUntil = 0;
    let lastWorldSaid = 0;
    let speed = 0;

    /* ------------------------------ measure ------------------------------ */

    const measure = () => {
      const rr = root.getBoundingClientRect();
      if (!rr.width || !rr.height) {
        tracks = [];
        map = buildJourneyMap([]);
        return;
      }
      const sy = window.scrollY;
      const vh = window.innerHeight;
      rootTop = rr.top + sy;
      // The last reachable target line (page bottom).
      const maxT = document.documentElement.scrollHeight - vh + TARGET * vh - 2;

      tracks = getTracks().flatMap((handle) => {
        const r = handle.el.getBoundingClientRect();
        if (!r.width || !r.height || !handle.layout) return [];
        const route = routeFor(handle.layout);
        const s = handle.scale;
        const docTop = r.top + sy;
        let window: TrackWindow;
        if (handle.mode === "follow") {
          // Beats follow the character's feet: it reaches each ledge/branch/floor
          // as that point crosses the target line.
          const knots: [number, number][] = [[docTop + route.segments[0].to[1] * s - 0.25 * vh, 0]];
          for (const seg of route.segments) {
            const t = Math.max(knots[knots.length - 1][0] + 0.5, docTop + seg.to[1] * s);
            knots.push([t, seg.b1]);
          }
          window = { id: handle.id, start: knots[0][0], end: knots[knots.length - 1][0], total: route.total, knots };
        } else {
          const start = docTop - (handle.pre ?? PRE) * vh;
          let end = docTop + r.height + POST * vh;
          if (end > maxT) end = Math.max(start + 0.25 * vh, maxT);
          window = { id: handle.id, start, end, total: route.total };
        }
        return [{ handle, route, left: r.left - rr.left, top: docTop - rootTop, scale: s, window }];
      });

      // Parallax layers (starfields behind worlds, far silhouettes in bands).
      const box = (el: HTMLElement) => {
        const b = el.getBoundingClientRect();
        return { el, top: b.top + sy, h: b.height };
      };
      scenery = {
        // Measure the zone backdrop (the starfield itself is taller and moves).
        stars: Array.from(root.querySelectorAll<HTMLElement>("[data-depth]")).map((el) => ({ ...box(el.parentElement ?? el), el })),
        far: Array.from(root.querySelectorAll<HTMLElement>("[data-far]")).map(box),
      };

      // Panels that can react when the character is near.
      anchors = Array.from(root.querySelectorAll<HTMLElement>("[data-anchor]"))
        .filter((el) => !el.closest("[data-world-node]"))
        .map((el) => {
          const b = el.getBoundingClientRect();
          return {
            el,
            x: b.left + b.width / 2 - rr.left,
            y: b.top + sy - rootTop + b.height / 2,
            top: b.top + sy - rootTop,
            right: b.right - rr.left,
          };
        });

      map = buildJourneyMap(tracks.map((t) => t.window));
      // Keep `tracks` in map order.
      tracks = map.tracks.map((mt) => tracks.find((t) => t.window.id === mt.id)!);
      events = tracks.flatMap((t, i) =>
        t.route.events.map((e) => ({ beat: map.tracks[i].offset + e.beat, kind: e.kind, id: e.id, track: i })),
      );
      totalBlocks = events.filter((e) => e.kind === "block" || e.kind === "stomp").length;
      totalCoins = events.filter((e) => e.kind === "coin").length;
      // Re-apply collected blocks to freshly rendered scenery (no animation).
      collected.forEach((id) => {
        document.querySelectorAll<HTMLElement>(`[data-block-id="${id}"]`).forEach((b) => (b.dataset.hit = "done"));
      });
    };

    /* ------------------------------- render ------------------------------ */

    const place = (state: CharacterState, tr: MeasuredTrack, index: number, warpClip = 0) => {
      const reduce = reduceMq.matches;
      if (!state.visible) {
        char.dataset.visible = "false";
        lastPos = null;
        return;
      }
      const s = tr.scale;
      if (s !== lastScale) {
        lastScale = s;
        char.style.width = `${HERO_W * s}px`;
        char.style.height = `${HERO_H * s}px`;
        sprite.style.backgroundSize = `${HERO_W * HERO_FRAME_ORDER.length * s}px ${HERO_H * s}px`;
        sprite.style.setProperty("--fx-blink", `${-HERO_FRAME_INDEX.blink * HERO_W * s}px`);
      }
      const facing = state.moving && direction < 0 ? -state.facing : state.facing;
      const left = tr.left + (state.x - HERO_W / 2) * s;
      const top = tr.top + (state.y - HERO_H) * s;
      char.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
      sprite.style.setProperty("--fx", `${-HERO_FRAME_INDEX[state.frame] * HERO_W * s}px`);
      // Mini (maze) size scales around the feet; clip is measured on the scaled body.
      const k = state.scale ?? 1;
      sprite.style.transform = k !== 1 || facing < 0 ? `scale(${facing < 0 ? -k : k}, ${k})` : "";
      const clip = Math.max(state.clip, warpClip);
      sprite.style.clipPath = clip > 0 ? `inset(0 0 ${((clip / k) * s).toFixed(1)}px 0)` : "";
      char.dataset.frame = state.frame;
      if (reduce && index !== lastActive) {
        char.dataset.visible = "false";
        requestAnimationFrame(() => (char.dataset.visible = "true"));
      } else {
        char.dataset.visible = "true";
      }
      // Distance travelled (art px → metres), not counting warps.
      if (lastPos && lastPos.track === index && !warp) {
        distance += Math.abs(state.x - lastPos.x) + Math.abs(state.y - lastPos.y);
      }
      lastPos = { x: state.x, y: state.y, track: index };
    };

    const setPuffs = (active: number, state: CharacterState | null) => {
      tracks.forEach((t, i) => {
        const el = t.handle.el as HTMLElement | SVGElement;
        const on = i === active && state && !reduceMq.matches;
        el.style.setProperty("--puff-exit", on ? state.puffExit.toFixed(3) : "0");
        el.style.setProperty("--puff-entry", on ? state.puffEntry.toFixed(3) : "0");
      });
    };

    const pad = (n: number, len: number) => String(Math.floor(n)).padStart(len, "0");

    const updateHud = (active: number) => {
      if (!hud) return;
      hud.dataset.show = started && !reduceMq.matches ? "true" : "false";
      if (hudScore) hudScore.textContent = pad(score, 6);
      if (hudBlocks) hudBlocks.textContent = `×${pad(coins, 2)}`;
      if (hudDistance) hudDistance.textContent = `${pad(distance / PX_PER_M, 4)}m`;
      if (hudWorld && active >= 0) {
        const h = tracks[active].handle;
        hudWorld.textContent = `${h.world} · ${h.label.toUpperCase()}`;
      }
    };

    const summary = () => document.querySelector<HTMLElement>("[data-journey-summary]");
    const fillSummary = () => {
      const el = summary();
      if (!el) return;
      const set = (k: string, v: string) => {
        const d = el.querySelector(`[data-sum="${k}"]`);
        if (d) d.textContent = v;
      };
      set("score", pad(score, 6));
      set("distance", `${pad(distance / PX_PER_M, 4)}m`);
      set("worlds", `${visited.size}/${new Set(tracks.map((t) => t.handle.world)).size}`);
      set("blocks", `${hits}/${totalBlocks}`);
      set("coins", `${coins}`);
      const secs = Math.round(((tEnd || performance.now()) - (tStart || performance.now())) / 1000);
      set("time", `${pad(secs / 60, 2)}:${pad(secs % 60, 2)}`);
      const worldsTotal = new Set(tracks.map((t) => t.handle.world)).size;
      const badges = [
        visited.size >= worldsTotal && "Explorer",
        hits >= totalBlocks && "Completionist",
        totalCoins > 0 && coins >= totalCoins * 0.8 && "Coin hoarder",
        bossDown && "Bug slayer",
        secs > 0 && secs < 90 && "Speedrunner",
      ].filter(Boolean) as string[];
      const list = el.querySelector("[data-sum-badges]");
      if (list) list.textContent = badges.length ? badges.join(" · ") : "Keep exploring!";
    };

    /** Show a speech bubble above the character for a moment. */
    const say = (text: string, now = performance.now()) => {
      if (reduceMq.matches) return;
      bubbleText.textContent = text;
      bubbleUntil = now + 2600;
      start();
    };

    /** Award points, pop the coin, show the unlock pop-up, sparkle the item. */
    const collect = (e: GlobalEvent) => {
      if (collected.has(e.id)) return;
      collected.add(e.id);
      const tr = tracks[e.track];
      const spec = tr?.handle.layout.blocks?.find((b) => b.id === e.id);
      score += spec?.points ?? (e.kind === "coin" ? 10 : 100);
      document.querySelectorAll<HTMLElement>(`[data-block-id="${e.id}"]`).forEach((b) => (b.dataset.hit = "true"));
      // Sound + bookkeeping per kind.
      if (e.kind === "coin") {
        coins++;
        play(e.id.includes("-dot-") ? "waka" : "coin");
      } else if (e.kind === "stomp") {
        hits++;
        if (spec?.kind === "boss" && e.id.endsWith("-3")) {
          bossDown = true;
          play("boss");
        } else play("stomp");
      } else if (spec?.kind === "npc") {
        hits++;
        play("talk");
      } else if (spec?.kind === "key") {
        hits++;
        play("key");
      } else if (spec?.kind === "gate") {
        hits++;
        play("key");
      } else if (spec?.kind === "door") {
        hits++;
        play("pipe");
      } else if (spec?.kind === "chest") {
        hits++;
        play("chest");
      } else if (spec?.kind === "invader") {
        hits++;
        play("shoot");
      } else if (spec?.kind === "barrel") {
        hits++;
        play("coin");
      } else if (spec?.kind === "ghost") {
        hits++;
        play("powerup");
        say("Gotcha, ghost!");
      } else if (spec?.kind === "pellet") {
        hits++;
        coins++;
        play("waka");
        // Pac-Man: the ghost in this corridor gets scared.
        document.querySelector(`[data-block-id="${e.id}"]`)?.closest("[data-track-stage]")?.setAttribute("data-scared", "true");
      } else if (spec?.kind === "power" && spec.power) {
        hits++;
        power = { kind: spec.power, world: tr.handle.world };
        play("bump");
        play("powerup");
      } else if (e.id === "star") {
        play("powerup");
        tEnd = tEnd || performance.now();
      } else {
        hits++;
        play("bump");
        play("coin");
      }
      document.querySelectorAll<HTMLElement>(`[data-toast-for="${e.id}"]`).forEach((t) => (t.dataset.show = "true"));
      if (spec?.say) say(spec.say);
      if (spec?.unlock) {
        document.querySelectorAll<HTMLElement>(`[data-unlock-id="${spec.unlock}"]`).forEach((u) => (u.dataset.unlocked = "true"));
      }
      if (e.kind !== "coin") hud?.setAttribute("data-bump", String(Date.now() % 2));
      if (e.id === "star") fillSummary();
    };

    /** Draws the character for the current displayed beat. */
    const render = (now: number) => {
      const reduce = reduceMq.matches;
      if (!tracks.length) {
        char.dataset.visible = "false";
        return;
      }
      const { index, local } = locate(map, displayed);
      const tr = tracks[index];
      if (!tr) return;
      // Worlds reached so far (including ones passed through by pipe).
      map.tracks.forEach((mt, i) => {
        if (displayed > mt.offset) visited.add(tracks[i].handle.world);
      });
      if (displayed > 0.01 && !started) {
        started = true;
        tStart = performance.now();
      }

      let state = reduce ? restState(tr.route, tr.handle.layout) : stateAtBeat(tr.route, local);
      // Catching up: walks become a visible sprint.
      if (!reduce && speed > CHASE.sprintAt && state.frame.startsWith("walk")) {
        state = { ...state, frame: state.frame.replace("walk", "run") as CharacterState["frame"] };
      }
      if (reduce) {
        // Reduced motion: stand still at the track's rest pose while it is on screen.
        const mt = map.tracks[index];
        if (lastT < mt.start || lastT > mt.end) state = { ...state, visible: false };
      }

      // Warp: a small pipe pops up under the feet; the character sinks / rises.
      let warpClip = 0;
      if (warp && !reduce) {
        const t = now - warp.t0;
        const dur = warp.phase === "sink" ? SINK_MS : RISE_MS;
        const k = Math.min(1, t / dur);
        const pipeUp = warp.phase === "sink" ? Math.min(1, k / 0.4) : k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
        warpClip = warp.phase === "sink" ? Math.max(0, (k - 0.3) / 0.7) * (HERO_H + 1) : (1 - Math.min(1, k / 0.6)) * (HERO_H + 1);
        if (state.visible) {
          const s = tr.scale;
          warpPipe.style.width = `${18 * s}px`;
          warpPipe.style.height = `${10 * s}px`;
          warpPipe.style.transform = `translate3d(${(tr.left + (state.x - 9) * s).toFixed(1)}px, ${(tr.top + state.y * s - 10 * s * pipeUp).toFixed(1)}px, 0)`;
          warpPipe.style.clipPath = `inset(0 0 ${(10 * s * (1 - pipeUp)).toFixed(1)}px 0)`;
          warpPipe.dataset.show = "true";
          // Feet stand on the warp pipe rim while it is up.
          state = { ...state, y: state.y - 10 * pipeUp, frame: "pipe" };
        }
      } else {
        warpPipe.dataset.show = "false";
      }

      // Movement sounds when a new move starts; power-up looks.
      const segIdx = tr.route.segments.findIndex((sg) => local >= sg.b0 && local < sg.b1);
      const seg = tr.route.segments[segIdx];
      const segKey = `${index}:${segIdx}`;
      if (seg && segKey !== lastSeg && !warp && !reduce) {
        const k = seg.step.kind;
        if (k === "jump" && !("stomp" in seg.step && seg.step.stomp)) play("jump");
        else if (k === "emerge" || k === "enter") play("pipe");
        else if (k === "fly") play("jetpack");
        else if (k === "slide") play("flag");
      }
      lastSeg = segKey;
      if (power && power.world !== tr.handle.world && power.world !== -1) power = null;
      if (power && power.world === -1 && now > cheatUntil) power = null;
      char.dataset.power = power && !reduce ? power.kind : "";
      char.dataset.flying = seg?.step.kind === "fly" ? "true" : "false";

      place(state, tr, index, warpClip);
      setPuffs(index, state);

      // World selector: current + visited worlds on header tiles and map nodes.
      const worldKey = `${tr.handle.world}|${[...visited].sort().join(",")}`;
      if (worldKey !== lastWorldKey) {
        lastWorldKey = worldKey;
        html.dataset.world = String(tr.handle.world);
        document.querySelectorAll<HTMLElement>("[data-world-tile], [data-world-node]").forEach((el) => {
          const w = Number(el.dataset.worldTile ?? el.dataset.worldNode);
          el.dataset.current = w === tr.handle.world ? "true" : "false";
          el.dataset.visited = visited.has(w) ? "true" : "false";
        });
        // Save point: reaching a new world saves progress (this browser only).
        if (tr.handle.world > maxSavedWorld && started && !reduce) {
          const prevSaved = maxSavedWorld;
          maxSavedWorld = tr.handle.world;
          try {
            localStorage.setItem("anish.save", JSON.stringify({ world: tr.handle.world }));
          } catch {
            /* storage unavailable */
          }
          if (prevSaved > 0) {
            play("save");
            hud?.setAttribute("data-saved", String(now));
            const savedEl = hud?.querySelector<HTMLElement>("[data-hud-saved]");
            if (savedEl) {
              savedEl.dataset.show = "false";
              requestAnimationFrame(() => (savedEl.dataset.show = "true"));
            }
          }
        }
        // The character announces each new world once.
        if (tr.handle.world !== lastWorldSaid && started && !reduce) {
          lastWorldSaid = tr.handle.world;
          say(`World ${tr.handle.world}: ${tr.handle.label}!`, now);
        }
      }

      // Panels near the character glow ("!"), so content reacts to the player.
      const cx = tr.left + state.x * tr.scale;
      const cy = tr.top + (state.y - 12) * tr.scale;
      let best: (typeof anchors)[number] | null = null;
      let bestD = 380;
      if (state.visible && !reduce) {
        for (const a of anchors) {
          const d = Math.hypot((a.x - cx) * 0.5, a.y - cy);
          if (d < bestD) {
            bestD = d;
            best = a;
          }
        }
      }
      if ((best?.el ?? null) !== near) {
        if (near) delete near.dataset.near;
        if (best) {
          best.el.dataset.near = "true";
          nearMark.style.transform = `translate3d(${(best.right - 30).toFixed(0)}px, ${(best.top - 14).toFixed(0)}px, 0)`;
        }
        nearMark.dataset.show = best ? "true" : "false";
        near = best?.el ?? null;
      }

      // Speech bubble beside the character (head height, inside its track),
      // only on wide horizontal tracks so it never covers content.
      const roomy = tr.handle.mode === "span" && tr.handle.layout.width * tr.scale > 420;
      if (now < bubbleUntil && state.visible && roomy) {
        const w = root.clientWidth;
        const charL = tr.left + (state.x - HERO_W / 2) * tr.scale;
        const charR = charL + HERO_W * tr.scale;
        const side = charR + 300 < w ? "right" : "left";
        const left = side === "right" ? charR + 6 : charL - 6;
        const top = tr.top + (state.y - HERO_H) * tr.scale + 4;
        bubble.dataset.side = side;
        bubble.style.transform = `translate3d(${left.toFixed(0)}px, ${top.toFixed(0)}px, 0)`;
        bubble.dataset.show = "true";
      } else {
        bubble.dataset.show = "false";
      }
      tr.handle.onBeat?.(local);
      // Coordinated heading reveal for the section a band introduces.
      tracks.forEach((t, i) => {
        if (!t.handle.section) return;
        const arrivedAt = map.tracks[i].offset + t.route.revealAt * t.route.total;
        t.handle.section.dataset.arrived = reduce || displayed >= arrivedAt - 1e-6 ? "true" : "false";
      });
      // Summary drop-down is open while the character is past the star.
      const star = events.find((e) => e.id === "star");
      const sum = summary();
      const open = Boolean(star && displayed >= star.beat && !reduce);
      if (sum) sum.dataset.open = open ? "true" : "false";
      if (open) fillSummary();
      updateHud(index);
      lastActive = index;
    };

    /* -------------------------------- loop ------------------------------- */

    const tick = (now: number) => {
      frameId = 0;
      const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 1 / 60);
      lastTime = now;
      const reduce = reduceMq.matches;

      if (reduce) {
        displayed = target;
        render(now);
        return;
      }

      if (warp) {
        const dur = warp.phase === "sink" ? SINK_MS : RISE_MS;
        if (now - warp.t0 >= dur) {
          if (warp.phase === "sink") {
            // Travel through the pipe: collect anything skipped on the way.
            crossedEvents(events, displayed, warp.to).forEach(collect);
            displayed = warp.to;
            warp = { phase: "rise", t0: now, to: warp.to };
          } else {
            warp = null;
          }
        }
      } else {
        const r = chaseStep(map, displayed, target, dt);
        if ("warp" in r) {
          const { index, local } = locate(map, target);
          const tr = tracks[index];
          const landing = tr ? map.tracks[index].offset + standingBeat(tr.route, local) : target;
          const visibleNow = (() => {
            const cur = locate(map, displayed);
            return tracks[cur.index] ? stateAtBeat(tracks[cur.index].route, cur.local).visible : false;
          })();
          warp = { phase: visibleNow ? "sink" : "rise", t0: now, to: landing };
          play("warp");
          if (!visibleNow) {
            crossedEvents(events, displayed, landing).forEach(collect);
            displayed = landing;
          }
        } else {
          crossedEvents(events, displayed, r.beat).forEach(collect);
          displayed = r.beat;
          speed = r.speed;
        }
      }

      render(now);
      const settled = !warp && Math.abs(target - displayed) < 1e-3 && now >= bubbleUntil;
      if (!settled) frameId = requestAnimationFrame(tick);
      else {
        lastTime = 0;
        speed = 0;
        render(now);
      }
    };

    const start = () => {
      if (!frameId) frameId = requestAnimationFrame(tick);
    };

    /** Scroll-linked parallax (cheap transforms on layers near the viewport). */
    const parallax = (y: number, vh: number) => {
      const reduce = reduceMq.matches;
      for (const z of scenery.stars) {
        const near = z.top < y + vh && z.top + z.h > y;
        const zone = z.el.closest<HTMLElement>("[data-zone]");
        if (zone) zone.dataset.inview = near ? "true" : "false";
        z.el.style.transform = !reduce && near ? `translate3d(0, ${((y + vh / 2 - (z.top + z.h / 2)) * 0.12).toFixed(1)}px, 0)` : "";
      }
      for (const f of scenery.far) {
        const near = f.top < y + vh && f.top + f.h > y;
        const p = (y + vh - f.top) / (vh + f.h);
        f.el.style.transform = !reduce && near ? `translate3d(${((0.5 - p) * 40).toFixed(1)}px, 0, 0)` : "";
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      parallax(y, window.innerHeight);
      const t = y + TARGET * window.innerHeight;
      lastT = t;
      const next = targetBeat(map, t);
      if (next !== target) direction = next > target ? 1 : -1;
      target = next;
      start();
    };

    const remeasure = () => {
      measure();
      onScroll();
    };

    // Panels "power on" as they enter the viewport; reset when they drop below it.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting && el.dataset.shown !== "true" && el.hasAttribute("data-tetris")) {
            // Tetris: a lock click as each tile lands.
            el.querySelectorAll("li").forEach((_, i) => timers.push(setTimeout(() => play("lock"), 420 + i * 90)));
          }
          if (e.isIntersecting) el.dataset.shown = "true";
          else if (e.boundingClientRect.top > 0) el.dataset.shown = "false";
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    const anchorEls = () => Array.from(root.querySelectorAll<HTMLElement>("[data-anchor]"));
    // Dungeon rooms are marked visited once seen (stays lit).
    const visitIo = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && ((e.target as HTMLElement).dataset.visited = "true")),
      { rootMargin: "0px 0px -20% 0px" },
    );
    root.querySelectorAll("[data-visit]").forEach((el) => visitIo.observe(el));

    const applyMotionMode = () => {
      const reduce = reduceMq.matches;
      html.dataset.journey = reduce ? "still" : "motion";
      io.disconnect();
      if (reduce) anchorEls().forEach((el) => delete el.dataset.shown);
      else anchorEls().forEach((el) => io.observe(el));
    };

    measure();
    applyMotionMode();
    // Start where the visitor already is (deep link / restored scroll): no replay.
    lastT = window.scrollY + TARGET * window.innerHeight;
    target = targetBeat(map, lastT);
    displayed = target;
    render(performance.now());

    const onMotionChange = () => {
      applyMotionMode();
      remeasure();
    };
    let measureFrame = 0;
    const scheduleMeasure = () => {
      if (!measureFrame)
        measureFrame = requestAnimationFrame(() => {
          measureFrame = 0;
          remeasure();
        });
    };

    // Terminal cheats (e.g. iddqd → star power for 20s).
    const onCheat = (e: Event) => {
      const d = (e as CustomEvent<{ power?: "star" }>).detail;
      if (d?.power) {
        power = { kind: d.power, world: -1 };
        cheatUntil = performance.now() + 20000;
        play("powerup");
        say("Star power!");
        start();
      }
    };
    // Click a "?" block to bump it yourself; click the character to make it jump.
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const block = t?.closest?.("[data-block-id]") as HTMLElement | null;
      if (block && ["question", "power", "acorn"].includes(block.dataset.kind ?? "")) {
        const ev = events.find((x) => x.id === block.dataset.blockId);
        if (ev) collect(ev);
        return;
      }
      if (t && char.contains(t)) {
        char.dataset.hop = "false";
        requestAnimationFrame(() => (char.dataset.hop = "true"));
        play("jump");
      }
    };
    window.addEventListener("anish:cheat", onCheat);
    document.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("pageshow", scheduleMeasure);
    reduceMq.addEventListener("change", onMotionChange);
    const offTracks = onTracksChange(scheduleMeasure);
    const ro = new ResizeObserver(scheduleMeasure);
    ro.observe(root);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("anish:cheat", onCheat);
      document.removeEventListener("click", onClick);
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("pageshow", scheduleMeasure);
      reduceMq.removeEventListener("change", onMotionChange);
      offTracks();
      ro.disconnect();
      io.disconnect();
      visitIo.disconnect();
      timers.forEach(clearTimeout);
      if (frameId) cancelAnimationFrame(frameId);
      if (measureFrame) cancelAnimationFrame(measureFrame);
      delete html.dataset.journey;
      anchorEls().forEach((el) => delete el.dataset.shown);
      if (near) delete near.dataset.near;
      delete html.dataset.world;
      tracks.forEach((t) => t.handle.section && delete t.handle.section.dataset.arrived);
    };
  }, []);

  return (
    <>
      <div ref={warpRef} className={styles.warpMini} data-show="false" aria-hidden="true">
        <svg viewBox="0 0 18 10" width="100%" height="100%" shapeRendering="crispEdges" preserveAspectRatio="none">
          <rect x={0} y={0} width={18} height={4} fill={PIPE.base} />
          <rect x={0} y={0} width={18} height={1} fill={PIPE.outline} />
          <rect x={1} y={1} width={16} height={1} fill={PIPE.mouth} />
          <rect x={2} y={2} width={2} height={2} fill={PIPE.highlight} />
          <rect x={1} y={4} width={16} height={6} fill={PIPE.base} />
          <rect x={2} y={4} width={2} height={6} fill={PIPE.light} />
          <rect x={13} y={4} width={3} height={6} fill={PIPE.shadow} />
        </svg>
      </div>
      <div ref={nearRef} className={styles.nearMark} data-show="false" aria-hidden="true">
        <span>!</span>
      </div>
      <div ref={bubbleRef} className={styles.bubble} data-show="false" aria-hidden="true">
        <span />
      </div>
      <div ref={charRef} className={styles.character} data-visible="false" aria-hidden="true">
        <div ref={spriteRef} className={styles.sprite} style={{ backgroundImage: SHEET }} />
      </div>
    </>
  );
}
