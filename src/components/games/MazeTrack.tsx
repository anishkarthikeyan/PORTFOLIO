"use client";

import { useRef, useState } from "react";
import { buildMaze, MAZE, type MazeMeta } from "@/lib/games";
import { stateAtBeat } from "@/lib/journey";
import { TrackScene } from "@/components/journey/TrackScene";
import { useTrack } from "@/components/journey/useTrack";
import { place, useRouteRef } from "./useRoute";
import styles from "./Games.module.css";

const H = MAZE.top + MAZE.rows * MAZE.tile + 4;

/**
 * Pac-Man style maze (DSA world). The character (mini size) turns corners
 * eating dots; one ghost chases until the power pellet, then turns blue and
 * gets caught; two more patrol. "Show ghost BFS" overlays the breadth-first
 * search distances the chasing ghost would use.
 */
export function MazeTrack({ id }: { id: string }) {
  const [bfsOn, setBfsOn] = useState(false);
  const chaser = useRef<SVGGElement>(null);
  const patrols = useRef<(SVGGElement | null)[]>([]);

  const { ref, layout, scale } = useTrack({
    id,
    world: 4,
    label: "Pac maze",
    mode: "span",
    build: ({ width }) => buildMaze({ width, id }),
    onBeat: (beat) => {
      const d = routeRef.current;
      if (!d) return;
      const m = d.layout.meta!.maze as MazeMeta;
      const center = ([r, c]: [number, number]) => [m.ox + c * m.tile + m.tile / 2, m.oy + r * m.tile + m.tile / 2] as const;
      const pelletBeat = d.route.events.find((e) => e.id === `${id}-pellet`)?.beat ?? Infinity;
      // Chaser: follows the player's trail until the pellet, then waits (scared) where it gets caught.
      if (beat < pelletBeat) {
        const s = stateAtBeat(d.route, Math.max(0, beat - 2.4));
        const inMaze = s.visible && s.x > m.ox && s.x < m.ox + m.cols * m.tile;
        const [gx, gy] = inMaze ? [s.x, s.y - 6] : center(m.ghostStart);
        place(chaser.current, gx, gy);
      } else {
        const [mx, my] = center(m.meet);
        place(chaser.current, mx + Math.sin(beat * 6) * 1.5, my);
      }
      // Patrollers ping-pong along their corridors.
      m.patrols.forEach((run, i) => {
        const n = run.length;
        const t = Math.floor(beat * 3 + i * 5) % (2 * n - 2 || 1);
        const idx = t < n ? t : 2 * n - 2 - t;
        const [px, py] = center(run[Math.max(0, Math.min(n - 1, idx))]);
        place(patrols.current[i], px, py);
      });
    },
  });
  const routeRef = useRouteRef(layout);

  const m = layout?.meta?.maze as MazeMeta | undefined;

  return (
    <div className={styles.mazeWrap}>
      <div className={styles.mazeBar}>
        <p className={styles.mazeTag}>Pac maze · the ghosts hunt with BFS</p>
        <button type="button" className={`btn btn-sm ${styles.bfsBtn}`} aria-pressed={bfsOn} onClick={() => setBfsOn((v) => !v)}>
          {bfsOn ? "Hide" : "Show"} ghost BFS
        </button>
      </div>
      {bfsOn && (
        <p className={styles.bfsNote}>
          Breadth-first search from the red ghost&apos;s start: each number is how many steps it needs to reach that
          tile. The ghost follows decreasing numbers — the shortest path — to reach you.
        </p>
      )}
      <div
        ref={ref}
        className={styles.stage}
        style={{ "--h": H } as React.CSSProperties}
        data-track-stage={id}
        aria-hidden="true"
      >
        {layout && m && (
          <TrackScene
            id={id}
            layout={layout}
            scale={scale}
            back={
              <g>
                {/* Maze walls (merged runs) */}
                {m.walls.flatMap((row, r) => {
                  const out: React.ReactNode[] = [];
                  let c = 0;
                  while (c < m.cols) {
                    if (!row[c]) {
                      c++;
                      continue;
                    }
                    let e = c;
                    while (e < m.cols && row[e]) e++;
                    out.push(
                      <g key={`${r}-${c}`}>
                        <rect x={m.ox + c * m.tile} y={m.oy + r * m.tile} width={(e - c) * m.tile} height={m.tile} className={styles.wall} />
                        <rect x={m.ox + c * m.tile + 1} y={m.oy + r * m.tile + 1} width={(e - c) * m.tile - 2} height={1} className={styles.wallHi} />
                      </g>,
                    );
                    c = e;
                  }
                  return out;
                })}
                {/* BFS overlay */}
                {bfsOn &&
                  m.bfs.flatMap((row, r) =>
                    row.map((d, c) =>
                      d < 0 ? null : (
                        <g key={`b${r}-${c}`}>
                          <rect
                            x={m.ox + c * m.tile + 1}
                            y={m.oy + r * m.tile + 1}
                            width={m.tile - 2}
                            height={m.tile - 2}
                            fill="#849bb8"
                            opacity={Math.max(0.06, 0.45 - d * 0.018)}
                          />
                          <text x={m.ox + c * m.tile + m.tile / 2} y={m.oy + r * m.tile + m.tile / 2 + 1.5} className={styles.bfsNum}>
                            {d}
                          </text>
                        </g>
                      ),
                    ),
                  )}
              </g>
            }
            front={
              <g>
                <g ref={chaser} data-block-id={`${id}-ghost`} className={styles.ghostChaser}>
                  <Ghost color="#e07a5f" />
                </g>
                {m.patrols.map((_, i) => (
                  <g
                    key={i}
                    ref={(el) => {
                      patrols.current[i] = el;
                    }}
                    className={styles.ghostPatrol}
                  >
                    <Ghost color={i ? "#5aa9b8" : "#e09ac0"} />
                  </g>
                ))}
              </g>
            }
          />
        )}
      </div>
    </div>
  );
}

function Ghost({ color }: { color: string }) {
  return (
    <g className={styles.ghost} style={{ "--ghost": color } as React.CSSProperties}>
      <rect x={-3} y={-4} width={6} height={1} />
      <rect x={-4} y={-3} width={8} height={6} />
      <rect x={-4} y={3} width={2} height={1} />
      <rect x={-1} y={3} width={2} height={1} />
      <rect x={2} y={3} width={2} height={1} />
      <rect x={-3} y={-2} width={2} height={2} className={styles.eye} />
      <rect x={1} y={-2} width={2} height={2} className={styles.eye} />
    </g>
  );
}
