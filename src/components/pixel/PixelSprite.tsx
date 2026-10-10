import type { Palette } from "./sprites";

interface Run {
  x: number;
  y: number;
  w: number;
  fill: string;
}

/** Collapses each row into horizontal runs of the same color to keep the DOM small. */
export function toRuns(rows: string[], palette: Palette): Run[] {
  const runs: Run[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      const fill = palette[ch];
      if (ch !== "." && fill) runs.push({ x, y, w: end - x, fill });
      x = end;
    }
  });
  return runs;
}

interface PixelGroupProps {
  rows: string[];
  palette: Palette;
  x?: number;
  y?: number;
  className?: string;
}

/** Renders a sprite as a <g> inside a parent SVG (coordinates in art pixels). */
export function PixelGroup({ rows, palette, x = 0, y = 0, className }: PixelGroupProps) {
  return (
    <g transform={x || y ? `translate(${x} ${y})` : undefined} className={className}>
      {toRuns(rows, palette).map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </g>
  );
}

interface PixelSpriteProps {
  rows: string[];
  palette: Palette;
  /** Rendered pixel size in CSS px. */
  scale?: number;
  title?: string;
  className?: string;
}

/** Standalone sprite. Decorative unless a `title` is provided. */
export function PixelSprite({ rows, palette, scale = 4, title, className }: PixelSpriteProps) {
  const w = Math.max(...rows.map((r) => r.length));
  const h = rows.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w * scale}
      height={h * scale}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <PixelGroup rows={rows} palette={palette} />
    </svg>
  );
}
