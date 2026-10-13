import { getBand, WORLD_BANDS, type BandLayout, type PipeSpec, type WorldBand as Band } from "@/data/worlds";
import { compileRoute } from "@/lib/journey";
import { PixelPlatform, PlatformPatterns } from "./PixelPlatform";
import { WarpPipe } from "./WarpPipe";
import { WorldProp } from "./WorldProps";
import { BandTrack } from "./BandTrack";
import styles from "./Journey.module.css";

/** Deterministic pseudo-random for stable skylines (no hydration mismatch). */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Far parallax layer: stepped silhouettes + a few accent lights. */
export function FarLayer({ band, layout }: { band: Band; layout: BandLayout }) {
  const r = rand(band.world * 97 + layout.width);
  const blocks: { x: number; w: number; h: number }[] = [];
  for (let x = -20; x < layout.width + 20; ) {
    const w = 10 + Math.floor(r() * 18);
    const h = 8 + Math.floor(r() * (layout.height * 0.45));
    blocks.push({ x, w, h });
    x += w + Math.floor(r() * 4);
  }
  const lights = Array.from({ length: Math.round(layout.width / 18) }, () => ({
    x: Math.floor(r() * layout.width),
    y: Math.floor(r() * layout.height * 0.6),
  }));
  return (
    <svg
      className={styles.far}
      viewBox={`-20 0 ${layout.width + 40} ${layout.height}`}
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {lights.map((l, i) => (
        <rect key={i} x={l.x} y={l.y} width={1} height={1} fill={band.accent} opacity={0.35} />
      ))}
      {blocks.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={layout.height - b.h} width={b.w} height={b.h} fill="#161b22" />
          <rect x={b.x} y={layout.height - b.h} width={b.w} height={1} fill={band.accent} opacity={0.12} />
          {b.h > 14 && <rect x={b.x + 3} y={layout.height - b.h + 4} width={2} height={1} fill={band.accent} opacity={0.3} />}
        </g>
      ))}
    </svg>
  );
}

/** A pipe stands on the platform beneath its center (or the band floor). */
function pipeBase(layout: BandLayout, pipe: PipeSpec): number {
  const cx = pipe.x + pipe.w / 2;
  const under = layout.platforms
    .filter((p) => p.y > pipe.y && cx >= p.x && cx <= p.x + p.w)
    .sort((a, b) => a.y - b.y)[0];
  return under ? under.y : layout.height;
}

/**
 * Something the character rides, drawn around its feet at the origin. The
 * band moves it (data-mover = route step index) in step with the character.
 */
function Vehicle({ kind }: { kind: "cart" | "zip" }) {
  if (kind === "zip") {
    // Trolley on the cable, with a handlebar at hand height.
    return (
      <g>
        <rect x={-3} y={-29} width={6} height={3} fill="#5c6f88" />
        <rect x={-2} y={-30} width={4} height={1} fill="#a7adb8" />
        <rect x={-1} y={-26} width={2} height={12} fill="#3a4454" />
        <rect x={-9} y={-14} width={18} height={2} fill="#e8b84f" />
        <rect x={-9} y={-14} width={2} height={2} fill="#c86b5e" />
        <rect x={7} y={-14} width={2} height={2} fill="#c86b5e" />
      </g>
    );
  }
  // Mine cart: the character's legs are hidden inside it while riding.
  return (
    <g>
      <rect x={-11} y={-9} width={22} height={7} fill="#5c6f88" />
      <rect x={-11} y={-9} width={22} height={1} fill="#a9bdd6" />
      <rect x={-11} y={-6} width={22} height={1} fill="#3a4454" />
      <rect x={-11} y={-9} width={1} height={7} fill="#849bb8" />
      <rect x={10} y={-9} width={1} height={7} fill="#3a4454" />
      {[-7, 4].map((wx) => (
        <g key={wx} className={styles.wheel} style={{ transformOrigin: `${wx + 1.5}px -1.5px` }}>
          <rect x={wx} y={-3} width={3} height={3} fill="#1d232c" />
          <rect x={wx + 1} y={-3} width={1} height={3} fill="#a7adb8" />
        </g>
      ))}
    </g>
  );
}

function Stage({ band, layout, variant }: { band: Band; layout: BandLayout; variant: "wide" | "compact" }) {
  const ns = `wb-${band.id}-${variant}`;
  const floor = layout.height;
  const route = compileRoute(layout);
  return (
    <svg
      className={`${styles.stage} ${variant === "wide" ? styles.stageWide : styles.stageCompact}`}
      data-layout={variant}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      <PlatformPatterns ns={ns} />
      {/* World title, top-left */}
      <text x={layout.exitPipe ? layout.exitPipe.x + layout.exitPipe.w + 6 : 4} y={variant === "wide" ? 9 : 8} className={styles.worldTitle}>
        {`WORLD ${band.world} · ${band.title.toUpperCase()}`}
      </text>
      {layout.props.map((p, i) => (
        <WorldProp key={i} prop={p} />
      ))}
      {layout.platforms.map((p, i) => (
        <PixelPlatform key={i} p={p} floor={floor} ns={ns} />
      ))}
      {Object.entries(layout.holes ?? {}).map(([name, h]) => (
        <g key={name}>
          <rect x={h.x} y={h.y - 1} width={h.w} height={1} fill="#2b1a12" />
          <rect x={h.x + 1} y={h.y} width={h.w - 2} height={3} fill="#08090b" />
        </g>
      ))}
      {route.segments.map((sg, i) =>
        sg.step.kind === "ride" && sg.step.vehicle ? (
          <g key={`v${i}`} data-mover={i} transform={`translate(${sg.from[0]} ${sg.from[1]})`}>
            <Vehicle kind={sg.step.vehicle} />
          </g>
        ) : null,
      )}
      {layout.exitPipe && <WarpPipe pipe={layout.exitPipe} floor={pipeBase(layout, layout.exitPipe)} role="exit" />}
      {layout.entryPipe && (
        <WarpPipe
          pipe={layout.entryPipe}
          floor={pipeBase(layout, layout.entryPipe)}
          role="entry"
          label={variant === "wide" && band.next ? `▸ ${band.next.toUpperCase()}` : undefined}
        />
      )}
    </svg>
  );
}

/**
 * Decorative world strip shown before a section. It is hidden from assistive
 * technology: the real section heading that follows carries the meaning.
 */
export function WorldBand({ id }: { id: string }) {
  const band = getBand(id);
  if (!band) return null;
  return (
    <div
      className={styles.band}
      data-band={band.id}
      style={{ "--world-accent": band.accent } as React.CSSProperties}
      aria-hidden="true"
    >
      <div className={styles.farWrap} data-far>
        <div className={styles.farWide}>
          <FarLayer band={band} layout={band.wide} />
        </div>
        <div className={styles.farCompact}>
          <FarLayer band={band} layout={band.compact} />
        </div>
      </div>
      <Stage band={band} layout={band.wide} variant="wide" />
      <Stage band={band} layout={band.compact} variant="compact" />
      <BandTrack id={band.id} />
    </div>
  );
}

export const BAND_IDS = WORLD_BANDS.map((b) => b.id);
