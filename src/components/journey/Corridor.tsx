"use client";

import { battlementGaps, buildCorridor, corridorHeight, type CorridorStop } from "@/lib/tracks";
import type { TrackLayout } from "@/data/worlds";
import { BlockToasts, TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import styles from "./Journey.module.css";

export type CorridorTheme = "map" | "island" | "select" | "dungeon" | "castle" | "trophy";

interface BlockMeta {
  id: string;
  unlock?: string;
  label?: string;
  say?: string;
  power?: "coffee" | "jetpack" | "star";
}

/** Extra items at a fraction of the corridor width (enemies, power-ups). */
export interface CorridorExtra {
  at: number;
  kind: "bug" | "power" | "boss";
  block?: BlockMeta;
}

const GROUND: Record<CorridorTheme, "ground" | "wood" | "block" | "island" | "metal"> = {
  map: "wood",
  island: "island",
  select: "block",
  dungeon: "metal",
  castle: "block",
  trophy: "wood",
};

/** Spread stops evenly if the measured ones collapse (e.g. a 1-column grid). */
function spread(xs: number[], width: number): number[] {
  const distinct = new Set(xs.map((x) => Math.round(x / 20)));
  if (distinct.size === xs.length) return xs;
  const n = xs.length;
  return xs.map((_, i) => 40 + ((width - 86) * (i + 0.5)) / n);
}

/**
 * A horizontal strip of the world placed in empty layout space (above a card
 * grid, a list, a heading). Stops are measured from real content elements so
 * "?" blocks sit above the cards they unlock.
 */
export function Corridor({
  id,
  world,
  label,
  theme,
  stopSelector,
  stopKind = "block",
  blocks = [],
  extras = [],
  dots = false,
  pedestal = false,
  sign,
  banner,
}: {
  id: string;
  world: number;
  label: string;
  theme: CorridorTheme;
  /** CSS selector (within the corridor's parent) for elements to stop above. */
  stopSelector?: string;
  stopKind?: "block" | "node" | "pellet" | "npc";
  extras?: CorridorExtra[];
  /** Pac-Man dots along the path. */
  dots?: boolean;
  /** One per stop, in order. */
  blocks?: BlockMeta[];
  /** End with a pedestal where the character waves. */
  pedestal?: boolean;
  sign?: string;
  banner?: string;
}) {
  const withBlocks = (stopKind === "block" && blocks.length > 0) || extras.some((e) => e.kind === "power");
  const height = corridorHeight(withBlocks);

  const { ref, layout, scale } = useTrack({
    id,
    world,
    label,
    mode: "span",
    observe: () => [ref.current?.parentElement ?? null],
    build: ({ width, scale: s }, stage) => {
      const left = stage.getBoundingClientRect().left;
      const els = stopSelector ? Array.from(stage.parentElement?.querySelectorAll<HTMLElement>(stopSelector) ?? []) : [];
      const xs = spread(
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return (r.left + r.width / 2 - left) / s;
        }),
        width,
      );
      const stops: CorridorStop[] = xs.map((x, i) =>
        (stopKind === "block" || stopKind === "pellet" || stopKind === "npc") && blocks[i]
          ? { x, kind: stopKind, block: blocks[i] }
          : { x, kind: "node" },
      );
      extras.forEach((e) => stops.push({ x: e.at * width, kind: e.kind, block: e.block }));
      if (pedestal) stops.push({ x: width - 64, kind: "pedestal" });
      return buildCorridor({
        id,
        dots,
        width,
        stops,
        gaps: theme === "castle" ? battlementGaps(width) : undefined,
        ground: GROUND[theme],
      });
    },
  });

  return (
    <div
      ref={ref}
      className={`${styles.corridor} ${styles[`theme_${theme}`]}`}
      style={{ "--h": height } as React.CSSProperties}
      data-track-stage={id}
      aria-hidden="true"
    >
      {layout && (
        <>
          <TrackScene
            id={id}
            layout={layout}
            scale={scale}
            back={<Decor theme={theme} layout={layout} sign={sign} banner={banner} />}
          />
          <BlockToasts layout={layout} scale={scale} />
        </>
      )}
    </div>
  );
}

/** World-specific background details. */
function Decor({ theme, layout, sign, banner }: { theme: CorridorTheme; layout: TrackLayout; sign?: string; banner?: string }) {
  const W = layout.width;
  const g = layout.height - 4;
  const nodes = layout.route.filter((s) => s.kind === "jump" && s.apex === 4 && s.weight === 0.7).map((s) => (s.kind === "jump" ? s.to[0] : 0));
  switch (theme) {
    case "map":
      return (
        <g>
          {/* Dotted overworld path */}
          {Array.from({ length: Math.floor((W - 40) / 6) }, (_, i) => (
            <rect key={i} x={24 + i * 6} y={g - 2} width={2} height={1} fill="#a7adb8" opacity={0.35} />
          ))}
          {nodes.map((x, i) => (
            <g key={i}>
              <rect x={x - 4} y={g - 3} width={8} height={3} fill="#2c3542" />
              <rect x={x - 3} y={g - 3} width={6} height={1} fill="#849bb8" />
              <text x={x} y={g - 26} textAnchor="middle" className={styles.mapLabel}>
                {`${i + 1}`}
              </text>
            </g>
          ))}
        </g>
      );
    case "island":
      return (
        <g>
          {Array.from({ length: Math.floor(W / 14) }, (_, i) => (
            <rect key={i} x={i * 14 + (i % 2) * 5} y={6 + (i % 3) * 4} width={4} height={1} fill="#a7adb8" opacity={0.18} />
          ))}
          {sign && (
            <g className={styles.tag}>
              <rect x={24} y={g - 22} width={sign.length * 2.7 + 6} height={6} />
              <text x={27} y={g - 17.7}>
                {sign}
              </text>
              <rect x={30} y={g - 16} width={1} height={16} fill="#5c6f88" />
            </g>
          )}
        </g>
      );
    case "select":
      return (
        <g>
          {Array.from({ length: Math.floor(W / 8) }, (_, i) => (
            <rect key={i} x={i * 8 + 2} y={2} width={2} height={2} className={i % 2 ? styles.bulbA : styles.bulbB} />
          ))}
          <text x={W / 2} y={11} textAnchor="middle" className={styles.marquee}>
            PLAYER SELECT · TALK TO THE VILLAGERS
          </text>
        </g>
      );
    case "dungeon":
      return (
        <g>
          {Array.from({ length: Math.floor(W / 12) }, (_, i) => (
            <rect key={i} x={i * 12} y={(i % 2) * 5 + 14} width={11} height={4} fill="#161b22" />
          ))}
          {Array.from({ length: Math.max(2, Math.floor(W / 70)) }, (_, i) => {
            const x = 50 + i * 70;
            return x < W - 30 ? (
              <g key={`t${i}`}>
                <rect x={x} y={g - 20} width={2} height={6} fill="#5a3322" />
                <rect x={x - 1} y={g - 24} width={4} height={4} fill="#e8b84f" className={styles.flame} />
                <rect x={x} y={g - 26} width={2} height={2} fill="#f2d27a" className={styles.flame} />
              </g>
            ) : null;
          })}
        </g>
      );
    case "castle":
      return (
        <g>
          {banner && (
            <g>
              <rect x={W - 70} y={4} width={1} height={g - 4} fill="#a7adb8" />
              <rect x={W - 69} y={5} width={40} height={9} fill="#5c6f88" className={styles.flag} />
              <text x={W - 49} y={11.4} textAnchor="middle" className={styles.flagText}>
                {banner}
              </text>
            </g>
          )}
        </g>
      );
    case "trophy":
      return (
        <g>
          {Array.from({ length: Math.max(1, Math.floor(W / 90)) }, (_, i) => {
            const x = 60 + i * 90;
            return x < W - 40 ? (
              <g key={i} opacity={0.5}>
                <rect x={x} y={14} width={8} height={5} fill="#d9b26f" />
                <rect x={x + 3} y={19} width={2} height={3} fill="#d9b26f" />
                <rect x={x + 1} y={22} width={6} height={1} fill="#a7adb8" />
              </g>
            ) : null;
          })}
        </g>
      );
    default:
      return null;
  }
}
