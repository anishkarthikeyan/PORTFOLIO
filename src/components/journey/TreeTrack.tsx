"use client";

import { buildTree } from "@/lib/tracks";
import type { TrackLayout } from "@/data/worlds";
import { BlockToasts, TrackScene } from "./TrackScene";
import { useTrack } from "./useTrack";
import styles from "./Journey.module.css";

/**
 * The skill tree trunk. Sits in the trunk column of the Skills section;
 * branches line up with the category panels ([data-limb]) beside it.
 */
export function TreeTrack({ acorns }: { acorns: { id: string; unlock: string; label: string }[] }) {
  const { ref, layout, scale } = useTrack({
    id: "skill-tree",
    world: 4,
    label: "Skill tree",
    mode: "follow",
    // The limb panels are siblings of the trunk column inside the tree body.
    observe: () => [ref.current?.parentElement?.parentElement ?? null],
    build: ({ width, height, scale: s }, stage) => {
      const top = stage.getBoundingClientRect().top;
      const limbs = Array.from(stage.parentElement?.parentElement?.querySelectorAll<HTMLElement>("[data-limb]") ?? []);
      const knots = limbs.map((l) => (l.getBoundingClientRect().top - top) / s + 10);
      // Side from the actual layout (panels move to one side on narrow screens).
      const mid = stage.getBoundingClientRect().left + stage.getBoundingClientRect().width / 2;
      const sides = limbs.map((l) => {
        const r = l.getBoundingClientRect();
        return (r.left + r.width / 2 < mid ? -1 : 1) as 1 | -1;
      });
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
          <TrackScene id="skill-tree" layout={layout} scale={scale} back={<Trunk layout={layout} />} />
          <BlockToasts layout={layout} scale={scale} />
        </>
      )}
    </div>
  );
}

/** Bark, vines and leaf tufts drawn behind the track geometry. */
function Trunk({ layout }: { layout: TrackLayout }) {
  const both = layout.platforms.some((p) => p.x < layout.width / 2 - 8);
  const cx = both ? layout.width / 2 : 12;
  const H = layout.height;
  const vines = layout.route
    .map((step, i) => (step.kind === "climb" ? i : -1))
    .filter((i) => i >= 0)
    .map((i) => {
      const jump = layout.route[i - 1];
      const from = jump?.kind === "jump" ? jump.to : ([cx, 0] as [number, number]);
      const climb = layout.route[i];
      return { x: from[0], y0: from[1] - 2, y1: climb.kind === "climb" ? climb.toY + 6 : from[1] };
    });
  return (
    <g>
      {/* Trunk with bark texture */}
      <rect x={cx - 6} y={0} width={12} height={H} fill="#4a2a1c" />
      <rect x={cx - 5} y={0} width={3} height={H} fill="#5a3322" />
      <rect x={cx + 4} y={0} width={2} height={H} fill="#2b1a12" />
      {Array.from({ length: Math.floor(H / 9) }, (_, i) => (
        <rect key={i} x={cx - 3 + (i % 3) * 2} y={i * 9 + 3} width={2} height={3} fill="#2b1a12" opacity={0.7} />
      ))}
      {/* Roots */}
      <rect x={cx - 12} y={H - 4} width={24} height={4} fill="#4a2a1c" />
      <rect x={cx - 18} y={H - 2} width={8} height={2} fill="#3a2015" />
      <rect x={cx + 10} y={H - 2} width={8} height={2} fill="#3a2015" />
      {/* Hanging vines the character climbs */}
      {vines.map((v, i) => (
        <g key={i}>
          <rect x={v.x - 0.5} y={v.y0} width={1} height={v.y1 - v.y0} fill="#3f8a4b" />
          {Array.from({ length: Math.floor((v.y1 - v.y0) / 7) }, (_, k) => (
            <rect key={k} x={v.x + (k % 2 ? 0.5 : -2.5)} y={v.y0 + 4 + k * 7} width={2} height={2} fill="#62b06a" />
          ))}
        </g>
      ))}
      {/* Leaf tufts on each branch stub */}
      {layout.platforms.map((p, i) => (
        <g key={`l${i}`}>
          <rect x={p.x + 2} y={p.y - 3} width={5} height={3} fill="#3f8a4b" />
          <rect x={p.x + p.w - 7} y={p.y - 2} width={5} height={2} fill="#62b06a" />
        </g>
      ))}
    </g>
  );
}
