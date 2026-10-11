"use client";

import { useState } from "react";
import { buildTree, TREE } from "@/lib/tracks";
import type { TrackLayout } from "@/data/worlds";
import { BlockToasts, TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import styles from "./Journey.module.css";

/**
 * The skill tree trunk. Sits in the trunk column of the Skills section;
 * branches line up with the category panels ([data-limb]) beside it.
 */
export function TreeTrack({ acorns }: { acorns: { id: string; unlock: string; label: string }[] }) {
  // Every panel gets a limb (decorative), even ones the route doesn't stop at.
  const [limbs, setLimbs] = useState<{ y: number; d: 1 | -1 }[]>([]);
  const { ref, layout, scale } = useTrack({
    id: "skill-tree",
    world: 4,
    label: "Skill tree",
    mode: "follow",
    // The limb panels are siblings of the trunk column inside the tree body.
    observe: () => [ref.current?.parentElement?.parentElement ?? null],
    build: ({ width, height, scale: s }, stage) => {
      const box = stage.getBoundingClientRect();
      const limbs = Array.from(stage.parentElement?.parentElement?.querySelectorAll<HTMLElement>("[data-limb]") ?? []);
      const knots = limbs.map((l) => (l.getBoundingClientRect().top - box.top) / s + 10);
      // Side from the actual layout (panels move to one side on narrow screens).
      const mid = box.left + box.width / 2;
      const sides = limbs.map((l) => {
        const r = l.getBoundingClientRect();
        return (r.left + r.width / 2 < mid ? -1 : 1) as 1 | -1;
      });
      setLimbs(knots.map((y, i) => ({ y, d: sides[i] })));
      const ordered = limbs.map((l) => acorns.find((a) => a.id === l.dataset.limb));
      return buildTree({
        width,
        height,
        knots,
        sides,
        acorns: ordered.map((a, i) => a ?? { id: `acorn-${i}` }),
      });
    },
  });

  return (
    <div ref={ref} className={styles.trunkStage} aria-hidden="true">
      {layout && (
        <>
          <TrackScene
            id="skill-tree"
            layout={layout}
            scale={scale}
            showPlatforms={false}
            showHoles={false}
            back={<Tree layout={layout} limbs={limbs} />}
          />
          <BlockToasts layout={layout} scale={scale} />
        </>
      )}
    </div>
  );
}

/* Bark palette */
const BARK = {
  outline: "#2b1a12",
  shadow: "#3a2015",
  base: "#5a3322",
  mid: "#75442f",
  light: "#8c5439",
  highlight: "#a0623f",
  hollow: "#0f0805",
};
const LEAF = { dark: "#2f6b3a", base: "#3f8a4b", light: "#62b06a", bright: "#8fcf86" };

/** Small deterministic hash for stable bark details (no randomness at render). */
const h = (n: number) => ((n * 2654435761) >>> 0) % 997;

/** A leaf cluster: a stepped blob of greens, ~10 × 6 art px. */
function Leaves({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const f = (dx: number) => (flip ? x - dx : x + dx);
  return (
    <g>
      <rect x={f(flip ? 8 : 0)} y={y + 2} width={8} height={3} fill={LEAF.dark} />
      <rect x={f(flip ? 9 : 1)} y={y} width={7} height={3} fill={LEAF.base} />
      <rect x={f(flip ? 7 : 3)} y={y - 2} width={4} height={2} fill={LEAF.base} />
      <rect x={f(flip ? 7 : 2)} y={y} width={2} height={1} fill={LEAF.light} />
      <rect x={f(flip ? 4 : 5)} y={y - 1} width={1} height={1} fill={LEAF.bright} />
    </g>
  );
}

/**
 * Hand-built pixel tree: tapered trunk with bark grain, knots and moss,
 * real limbs reaching each category panel (with a stepped brace and
 * leaves), rounded hollows the character uses, hanging vines, and a root
 * flare spreading into the ground.
 */
function Tree({ layout, limbs: limbSpecs }: { layout: TrackLayout; limbs: { y: number; d: 1 | -1 }[] }) {
  const W = layout.width;
  const H = layout.height;
  const both = limbSpecs.some((l) => l.d < 0);
  const cx = both ? W / 2 : 12;
  const half = TREE.trunkHalf;
  const flareTop = H - 18;

  // Trunk rows: full width at the top (meets the canopy fork), flaring at the base.
  const rows: { y: number; x0: number; x1: number }[] = [];
  for (let y = 0; y < H; y += 2) {
    let hw = half;
    if (y >= flareTop) hw = half + Math.floor((y - flareTop) / 3) + 1;
    rows.push({ y, x0: cx - hw, x1: cx + hw });
  }

  // Bark grain dashes and knots at stable pseudo-random spots.
  const grain = Array.from({ length: Math.floor(H / 5) }, (_, i) => ({
    x: cx - half + 3 + (h(i) % (half * 2 - 6)),
    y: i * 5 + (h(i + 31) % 3),
    len: 2 + (h(i + 7) % 3),
  }));
  const knots = Array.from({ length: Math.max(1, Math.floor(H / 140)) }, (_, i) => ({
    x: cx - half + 4 + (h(i + 100) % (half * 2 - 10)),
    y: 40 + i * 140 + (h(i + 50) % 40),
  })).filter((k) => k.y < H - 30);

  const limbs = limbSpecs
    .filter((l) => l.y > 6 && l.y < H - 24)
    .map(({ d, y }) => {
      // From the trunk edge out past the column edge (the panel covers the tip).
      const start = d > 0 ? cx + half - 1 : cx - half + 1;
      const end = d > 0 ? W + 6 : -6;
      return { d, y, x0: Math.min(start, end), x1: Math.max(start, end), start };
    });

  const vines = layout.route
    .map((step, i) => (step.kind === "climb" ? i : -1))
    .filter((i) => i >= 0)
    .map((i) => {
      const jump = layout.route[i - 1];
      const from = jump?.kind === "jump" ? jump.to : ([cx, 0] as [number, number]);
      const climb = layout.route[i];
      return { x: from[0], y0: from[1] + 3, y1: climb.kind === "climb" ? climb.toY + 4 : from[1] };
    });

  return (
    <g>
      {/* Roots spreading into the ground (drawn first, behind the trunk) */}
      <g>
        <rect x={cx - half - 22} y={H - 3} width={(half + 22) * 2} height={3} fill={BARK.shadow} />
        {[-1, 1].map((d) => (
          <g key={d}>
            <rect x={d > 0 ? cx + half : cx - half - 14} y={H - 6} width={14} height={3} fill={BARK.base} />
            <rect x={d > 0 ? cx + half + 10 : cx - half - 22} y={H - 4} width={12} height={2} fill={BARK.mid} />
            <rect x={d > 0 ? cx + half + 20 : cx - half - 26} y={H - 2} width={6} height={2} fill={BARK.base} />
          </g>
        ))}
      </g>

      {/* Trunk body */}
      {rows.map((r) => (
        <g key={r.y}>
          <rect x={r.x0} y={r.y} width={r.x1 - r.x0} height={2} fill={BARK.base} />
          <rect x={r.x0} y={r.y} width={1} height={2} fill={BARK.outline} />
          <rect x={r.x1 - 1} y={r.y} width={1} height={2} fill={BARK.outline} />
          <rect x={r.x0 + 1} y={r.y} width={3} height={2} fill={BARK.light} />
          <rect x={r.x0 + 4} y={r.y} width={2} height={2} fill={BARK.mid} />
          <rect x={r.x1 - 5} y={r.y} width={4} height={2} fill={BARK.shadow} />
        </g>
      ))}
      <rect x={cx - half + 1} y={0} width={1} height={H - 18} fill={BARK.highlight} opacity={0.5} />
      {grain.map((g, i) => (
        <rect key={i} x={g.x} y={g.y} width={1} height={g.len} fill={BARK.shadow} />
      ))}
      {knots.map((k, i) => (
        <g key={`k${i}`}>
          <rect x={k.x} y={k.y} width={4} height={3} fill={BARK.shadow} />
          <rect x={k.x + 1} y={k.y + 1} width={2} height={1} fill={BARK.outline} />
          <rect x={k.x} y={k.y - 1} width={4} height={1} fill={BARK.light} />
        </g>
      ))}
      {/* Moss patches */}
      {[0.22, 0.58].map((f, i) => (
        <g key={`m${i}`}>
          <rect x={cx - half + 1} y={Math.floor(H * f)} width={3} height={6} fill={LEAF.dark} />
          <rect x={cx - half + 1} y={Math.floor(H * f) + 1} width={2} height={3} fill={LEAF.base} />
        </g>
      ))}

      {/* Limbs reaching each panel */}
      {limbs.map((l, i) => (
        <g key={`l${i}`}>
          {/* stepped brace under the limb near the trunk */}
          {[0, 1, 2, 3].map((k) => (
            <rect
              key={k}
              x={l.d > 0 ? l.start + k * 2 : l.start - (k + 1) * 2}
              y={l.y + 4}
              width={2}
              height={Math.max(1, 6 - k * 2)}
              fill={BARK.base}
            />
          ))}
          <rect x={l.x0} y={l.y} width={l.x1 - l.x0} height={4} fill={BARK.base} />
          <rect x={l.x0} y={l.y} width={l.x1 - l.x0} height={1} fill={BARK.light} />
          <rect x={l.x0} y={l.y + 3} width={l.x1 - l.x0} height={1} fill={BARK.shadow} />
          <rect x={l.d > 0 ? l.x0 + 5 : l.x1 - 7} y={l.y + 1} width={2} height={1} fill={BARK.shadow} />
          {/* twig + leaves near the tip and at the trunk joint */}
          <rect x={l.d > 0 ? l.x1 - 12 : l.x0 + 10} y={l.y - 4} width={2} height={4} fill={BARK.mid} />
          <Leaves x={l.d > 0 ? l.x1 - 16 : l.x0 + 16} y={l.y - 7} flip={l.d < 0} />
          <Leaves x={l.d > 0 ? l.start - 3 : l.start + 3} y={l.y - 4} flip={l.d < 0} />
        </g>
      ))}

      {/* Hollows (knot holes) the character pops in and out of */}
      {Object.values(layout.holes ?? {}).map((o, i) => {
        const x = o.x + 1;
        const w = o.w - 2;
        return (
          <g key={`h${i}`}>
            <rect x={x + 2} y={o.y - 3} width={w - 4} height={1} fill={BARK.light} />
            <rect x={x + 1} y={o.y - 2} width={w - 2} height={1} fill={BARK.outline} />
            <rect x={x} y={o.y - 1} width={w} height={3} fill={BARK.hollow} />
            <rect x={x + 1} y={o.y + 2} width={w - 2} height={1} fill={BARK.hollow} />
            <rect x={x + 2} y={o.y + 3} width={w - 4} height={1} fill={BARK.shadow} />
            <rect x={x + 1} y={o.y - 1} width={1} height={3} fill={BARK.shadow} />
          </g>
        );
      })}

      {/* Hanging vines the character climbs */}
      {vines.map((v, i) => (
        <g key={`v${i}`}>
          <rect x={v.x - 0.5} y={v.y0} width={1} height={Math.max(0, v.y1 - v.y0)} fill={LEAF.dark} />
          {Array.from({ length: Math.floor((v.y1 - v.y0) / 6) }, (_, k) => (
            <rect key={k} x={v.x + (k % 2 ? 0.5 : -2.5)} y={v.y0 + 3 + k * 6} width={2} height={2} fill={k % 3 ? LEAF.base : LEAF.light} />
          ))}
        </g>
      ))}
    </g>
  );
}
