import type { BlockSpec, PipeSpec, TrackLayout } from "@/data/worlds";
import { PixelPlatform, PlatformPatterns } from "./PixelPlatform";
import { WarpPipe } from "./WarpPipe";
import styles from "./Journey.module.css";

/** Pipe stands on the platform beneath its center (or the stage floor). */
export function pipeBase(layout: TrackLayout, pipe: PipeSpec): number {
  const cx = pipe.x + pipe.w / 2;
  const under = layout.platforms
    .filter((p) => p.y > pipe.y && cx >= p.x && cx <= p.x + p.w)
    .sort((a, b) => a.y - b.y)[0];
  return under ? under.y : layout.height;
}

/** 8 × 8 pixel blocks. Hit state is toggled by the controller via data-hit. */
export function BlockSprite({ b }: { b: BlockSpec }) {
  const { x, y } = b;
  // Actors drawn by their game's own component.
  if (b.kind === "ghost" || b.kind === "gate") return null;
  if (b.kind === "boss") {
    if (!b.id.endsWith("-1")) return null;
    const base = b.id.slice(0, -2);
    // Nested hit markers: each stomp flags one level; the last defeats it.
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="boss">
        <g data-block-id={`${base}-2`}>
          <g data-block-id={`${base}-3`} className={styles.bossWrap}>
            <g className={styles.boss}>
              <rect x={x - 5} y={y + 2} width={18} height={8} fill="#8c5439" />
              <rect x={x - 4} y={y} width={16} height={2} fill="#c27a4f" />
              <rect x={x - 2} y={y + 3} width={4} height={2} fill="#e0a070" />
              <rect x={x + 3} y={y + 1} width={1} height={9} fill="#5a3322" />
              <rect x={x + 9} y={y + 2} width={5} height={6} fill="#2b1a12" />
              <rect x={x + 10} y={y + 3} width={2} height={2} fill="#eef1f5" />
              <rect x={x + 11} y={y + 4} width={1} height={1} fill="#c86b5e" />
              <rect x={x - 5} y={y - 2} width={3} height={2} fill="#f2d27a" />
              <rect x={x + 6} y={y - 2} width={3} height={2} fill="#f2d27a" />
              {[x - 4, x, x + 4, x + 8].map((lx) => (
                <rect key={lx} x={lx} y={y + 10} width={1} height={2} fill="#1d232c" />
              ))}
            </g>
            <g className={styles.coin}>
              <text x={x + 4} y={y - 5} textAnchor="middle">
                +1000
              </text>
            </g>
          </g>
        </g>
      </g>
    );
  }
  if (b.kind === "npc") {
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="npc">
        <g className={styles.npc}>
          <rect x={x + 1} y={y} width={6} height={2} fill="#3a8346" />
          <rect x={x} y={y + 2} width={8} height={1} fill="#24552d" />
          <rect x={x + 2} y={y + 3} width={4} height={3} fill="#c27a4f" />
          <rect x={x + 3} y={y + 4} width={1} height={1} fill="#101419" />
          <rect x={x + 1} y={y + 6} width={6} height={4} fill="#5c6f88" />
          <rect x={x + 2} y={y + 10} width={1} height={2} fill="#1d232c" />
          <rect x={x + 5} y={y + 10} width={1} height={2} fill="#1d232c" />
        </g>
        <g className={styles.talk}>
          <rect x={x + 7} y={y - 6} width={6} height={5} fill="#eef1f5" />
          <rect x={x + 9} y={y - 5} width={2} height={2} fill="#101419" />
        </g>
      </g>
    );
  }
  if (b.kind === "key") {
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="key">
        <g className={styles.keyItem}>
          <rect x={x + 1} y={y} width={4} height={4} fill="#f2d27a" />
          <rect x={x + 2} y={y + 1} width={2} height={2} fill="#101419" />
          <rect x={x + 2} y={y + 4} width={2} height={7} fill="#f2d27a" />
          <rect x={x + 4} y={y + 8} width={2} height={1} fill="#f2d27a" />
          <rect x={x + 4} y={y + 10} width={2} height={1} fill="#f2d27a" />
        </g>
        <g className={styles.coin}>
          <text x={x + 4} y={y - 3} textAnchor="middle">
            +{b.points}
          </text>
        </g>
      </g>
    );
  }
  if (b.kind === "door") {
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="door">
        <rect x={x - 6} y={y - 6} width={20} height={30} fill="#3a4250" />
        <rect x={x - 4} y={y - 4} width={16} height={28} fill="#0b0e12" />
        <g className={styles.gate}>
          {[0, 4, 8, 12].map((dx) => (
            <rect key={dx} x={x - 3 + dx} y={y - 4} width={2} height={28} fill="#75442f" />
          ))}
          <rect x={x - 4} y={y + 8} width={16} height={2} fill="#5a3322" />
          <rect x={x + 2} y={y + 10} width={4} height={4} fill="#f2d27a" />
        </g>
      </g>
    );
  }
  if (b.kind === "chest") {
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="chest">
        <rect x={x - 3} y={y + 4} width={14} height={6} fill="#75442f" />
        <rect x={x - 3} y={y + 4} width={14} height={1} fill="#a0623f" />
        <rect x={x + 3} y={y + 5} width={2} height={3} fill="#f2d27a" />
        <g className={styles.lid}>
          <rect x={x - 3} y={y} width={14} height={4} fill="#8c5439" />
          <rect x={x - 3} y={y} width={14} height={1} fill="#c27a4f" />
        </g>
        <g className={styles.glint}>
          <rect x={x + 2} y={y - 6} width={4} height={4} fill="#f2d27a" />
          <rect x={x + 3} y={y - 8} width={2} height={1} fill="#fff4d6" />
        </g>
      </g>
    );
  }
  if (b.kind === "invader") {
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="invader">
        <g className={styles.invader}>
          <rect x={x - 2} y={y + 2} width={12} height={4} fill="#a9bdd6" />
          <rect x={x} y={y} width={2} height={2} fill="#a9bdd6" />
          <rect x={x + 6} y={y} width={2} height={2} fill="#a9bdd6" />
          <rect x={x + 1} y={y + 3} width={2} height={1} fill="#101419" />
          <rect x={x + 5} y={y + 3} width={2} height={1} fill="#101419" />
          <rect x={x - 2} y={y + 6} width={2} height={2} fill="#a9bdd6" className={styles.legs} />
          <rect x={x + 8} y={y + 6} width={2} height={2} fill="#a9bdd6" className={styles.legs} />
        </g>
        <g className={styles.boom}>
          <rect x={x - 3} y={y + 3} width={2} height={2} fill="#f2d27a" />
          <rect x={x + 9} y={y + 3} width={2} height={2} fill="#f2d27a" />
          <rect x={x + 3} y={y - 2} width={2} height={2} fill="#e8b84f" />
          <rect x={x + 3} y={y + 8} width={2} height={2} fill="#e8b84f" />
          <rect x={x + 2} y={y + 3} width={4} height={2} fill="#fff4d6" />
        </g>
      </g>
    );
  }
  if (b.kind === "barrel") {
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="barrel">
        <g className={styles.coin}>
          <text x={x + 4} y={y - 14} textAnchor="middle">
            +{b.points}
          </text>
        </g>
      </g>
    );
  }
  if (b.kind === "coin") {
    // Pac-Man dots are tiny; other coins spin.
    const dot = b.id.includes("-dot-");
    if (b.id.startsWith("leaf-")) {
      return (
        <g className={styles.block} data-block-id={b.id} data-kind="coin">
          <g className={styles.spin}>
            <rect x={x + 2} y={y + 2} width={4} height={4} fill="#62b06a" />
            <rect x={x + 3} y={y + 1} width={2} height={1} fill="#8fcf86" />
            <rect x={x + 3} y={y + 3} width={1} height={2} fill="#2f6b3a" />
          </g>
        </g>
      );
    }
    return (
      <g className={styles.block} data-block-id={b.id} data-kind={dot ? "dot" : "coin"}>
        {dot ? (
          <rect x={x + 3} y={y + 3} width={2} height={2} fill="#f2d27a" className={styles.dot} />
        ) : (
          <g className={styles.spin}>
            <rect x={x + 2} y={y + 1} width={4} height={6} fill="#f2d27a" />
            <rect x={x + 3} y={y + 2} width={1} height={4} fill="#c99a3a" />
          </g>
        )}
      </g>
    );
  }
  if (b.kind === "pellet") {
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="pellet">
        <g className={styles.pellet}>
          <rect x={x + 2} y={y + 1} width={4} height={6} fill="#f2d27a" />
          <rect x={x + 1} y={y + 2} width={6} height={4} fill="#f2d27a" />
          <rect x={x + 2} y={y + 2} width={1} height={1} fill="#fff4d6" />
        </g>
        <g className={styles.coin}>
          <text x={x + 4} y={y - 3} textAnchor="middle">
            +{b.points}
          </text>
        </g>
      </g>
    );
  }
  if (b.kind === "bug") {
    // An original "software bug" beetle that patrols and gets stomped.
    return (
      <g className={styles.block} data-block-id={b.id} data-kind="bug">
        <g className={styles.bug}>
          <rect x={x - 1} y={y + 1} width={10} height={4} fill="#8c5439" />
          <rect x={x} y={y} width={8} height={1} fill="#c27a4f" />
          <rect x={x + 1} y={y + 1} width={2} height={1} fill="#e0a070" />
          <rect x={x + 3} y={y + 1} width={1} height={4} fill="#5a3322" />
          <rect x={x + 7} y={y + 2} width={3} height={3} fill="#2b1a12" />
          <rect x={x + 8} y={y + 2} width={1} height={1} fill="#eef1f5" />
          <g className={styles.legs}>
            <rect x={x} y={y + 5} width={1} height={2} fill="#1d232c" />
            <rect x={x + 4} y={y + 5} width={1} height={2} fill="#1d232c" />
            <rect x={x + 7} y={y + 5} width={1} height={2} fill="#1d232c" />
          </g>
        </g>
        <g className={styles.coin}>
          <text x={x + 4} y={y - 4} textAnchor="middle">
            +{b.points}
          </text>
        </g>
      </g>
    );
  }
  return (
    <g className={styles.block} data-block-id={b.id} data-kind={b.kind}>
      {b.kind === "star" ? (
        <g className={styles.star}>
          <rect x={x + 3} y={y} width={2} height={2} fill="#f2d27a" />
          <rect x={x} y={y + 2} width={8} height={2} fill="#f2d27a" />
          <rect x={x + 1} y={y + 4} width={6} height={2} fill="#e8b84f" />
          <rect x={x + 1} y={y + 6} width={2} height={2} fill="#e8b84f" />
          <rect x={x + 5} y={y + 6} width={2} height={2} fill="#e8b84f" />
          <rect x={x + 3} y={y + 3} width={1} height={1} fill="#101419" />
          <rect x={x + 4} y={y + 3} width={1} height={1} fill="#101419" />
        </g>
      ) : b.kind === "acorn" ? (
        <g className={styles.bump}>
          <rect x={x + 1} y={y} width={6} height={3} fill="#5a3322" />
          <rect x={x + 3} y={y - 1} width={2} height={1} fill="#4a2a1c" />
          <rect x={x + 2} y={y + 3} width={4} height={4} fill="#a0623f" />
          <rect x={x + 3} y={y + 3} width={1} height={2} fill="#d08a5a" />
          <rect x={x + 3} y={y + 7} width={2} height={1} fill="#8c5439" />
        </g>
      ) : (
        <g className={styles.bump}>
          <rect x={x} y={y} width={8} height={8} className={styles.blockFace} />
          <rect x={x} y={y} width={8} height={1} className={styles.blockHi} />
          <rect x={x} y={y + 7} width={8} height={1} className={styles.blockLo} />
          <rect x={x + 7} y={y} width={1} height={8} className={styles.blockLo} />
          {b.kind === "power" ? (
            <g className={styles.powerMark}>
              <rect x={x + 2} y={y + 2} width={4} height={4} />
              <rect x={x + 3} y={y + 1} width={2} height={1} />
            </g>
          ) : b.kind === "question" ? (
            <g className={styles.qmark}>
              <rect x={x + 3} y={y + 2} width={2} height={1} />
              <rect x={x + 5} y={y + 3} width={1} height={1} />
              <rect x={x + 4} y={y + 4} width={1} height={1} />
              <rect x={x + 3} y={y + 6} width={2} height={1} />
            </g>
          ) : (
            <>
              <rect x={x} y={y + 3} width={8} height={1} className={styles.blockLo} />
              <rect x={x + 3} y={y} width={1} height={3} className={styles.blockLo} />
            </>
          )}
        </g>
      )}
      {b.kind === "power" && (
        <g className={styles.powerItem}>
          {b.power === "coffee" && (
            <>
              <rect x={x + 1} y={y - 7} width={5} height={6} fill="#eef1f5" />
              <rect x={x + 6} y={y - 6} width={2} height={3} fill="#eef1f5" />
              <rect x={x + 2} y={y - 6} width={3} height={2} fill="#75442f" />
              <rect x={x + 2} y={y - 10} width={1} height={2} fill="#a7adb8" />
            </>
          )}
          {b.power === "jetpack" && (
            <>
              <rect x={x + 1} y={y - 9} width={6} height={7} fill="#5c6f88" />
              <rect x={x + 2} y={y - 8} width={1} height={5} fill="#a9bdd6" />
              <rect x={x + 2} y={y - 2} width={4} height={2} fill="#e8b84f" />
            </>
          )}
          {b.power === "star" && (
            <>
              <rect x={x + 3} y={y - 9} width={2} height={2} fill="#f2d27a" />
              <rect x={x} y={y - 7} width={8} height={2} fill="#f2d27a" />
              <rect x={x + 1} y={y - 5} width={6} height={3} fill="#e8b84f" />
            </>
          )}
        </g>
      )}
      {/* Coin + score pop (animates once when hit) */}
      <g className={styles.coin}>
        <rect x={x + 2} y={y - 6} width={4} height={5} fill="#f2d27a" />
        <rect x={x + 3} y={y - 5} width={1} height={3} fill="#c99a3a" />
        <text x={x + 4} y={y - 8} textAnchor="middle">
          +{b.points}
        </text>
      </g>
    </g>
  );
}

/**
 * Base SVG for a track: platforms, pipes, holes and blocks, plus a slot for
 * world-specific decoration drawn behind (`back`) or in front (`front`).
 */
export function TrackScene({
  id,
  layout,
  scale,
  back,
  front,
  showPlatforms = true,
  showHoles = true,
}: {
  id: string;
  layout: TrackLayout;
  scale: number;
  back?: React.ReactNode;
  front?: React.ReactNode;
  /** Worlds that draw their own surfaces (the tree) can hide the defaults. */
  showPlatforms?: boolean;
  showHoles?: boolean;
}) {
  const ns = `ts-${id}`;
  return (
    <svg
      className={styles.trackSvg}
      width={layout.width * scale}
      height={layout.height * scale}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <PlatformPatterns ns={ns} />
      {back}
      {showPlatforms &&
        layout.platforms.map((p, i) => <PixelPlatform key={i} p={p} floor={layout.height} ns={ns} />)}
      {Object.entries(showHoles ? (layout.holes ?? {}) : {}).map(([name, h]) => (
        <g key={name}>
          <rect x={h.x} y={h.y - 1} width={h.w} height={1} fill="#2b1a12" />
          <rect x={h.x + 1} y={h.y} width={h.w - 2} height={3} fill="#08090b" />
          <rect x={h.x + 3} y={h.y + 3} width={h.w - 6} height={1} fill="#08090b" opacity={0.6} />
        </g>
      ))}
      {layout.exitPipe && <WarpPipe pipe={layout.exitPipe} floor={pipeBase(layout, layout.exitPipe)} role="exit" />}
      {layout.entryPipe && <WarpPipe pipe={layout.entryPipe} floor={pipeBase(layout, layout.entryPipe)} role="entry" />}
      {(layout.blocks ?? []).map((b) => (
        <BlockSprite key={b.id} b={b} />
      ))}
      {front}
    </svg>
  );
}

/** HTML pop-ups shown above blocks when hit ("UNLOCKED: …"). */
export function BlockToasts({ layout, scale }: { layout: TrackLayout; scale: number }) {
  // Narrow tracks (e.g. the tree trunk) have no room for pop-ups; the unlocked
  // panel's sparkle carries the feedback instead.
  if (layout.width * scale < 260) return null;
  return (
    <>
      {(layout.blocks ?? [])
        .filter((b) => b.label && b.kind !== "star")
        .map((b) => (
          <div
            key={b.id}
            className={`${styles.toast} ${b.kind === "npc" || b.kind === "chest" ? styles.rpgBox : ""}`}
            data-toast-for={b.id}
            // Inside the track, just below the block; kept within the track width.
            style={{
              left: Math.min(Math.max((b.x + 4) * scale, 130), layout.width * scale - 130),
              // Never below the track (it would cover content): RPG boxes (taller)
              // sit at the top of the track; others just below their block.
              top:
                b.kind === "chest" || b.kind === "npc"
                  ? 2
                  : Math.max(0, Math.min((b.y + 11) * scale, layout.height * scale - 60)),
            }}
            aria-hidden="true"
          >
            <span className={styles.toastTag}>
              {b.kind === "chest" ? "You got" : b.kind === "npc" ? "Villager" : b.kind === "invader" ? "Cleared" : b.kind === "gate" ? "Rate limiter" : "Unlocked"}
            </span>
            {b.label}
          </div>
        ))}
    </>
  );
}
