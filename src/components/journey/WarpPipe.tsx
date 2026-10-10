import type { PipeSpec } from "@/data/worlds";
import styles from "./Journey.module.css";

/** Restrained classic pipe greens: outline → shadow → base → light → highlight. */
export const PIPE = {
  outline: "#12301a",
  mouth: "#08130b",
  shadow: "#24552d",
  base: "#3a8346",
  light: "#58a85c",
  highlight: "#8fcf86",
} as const;

const RIM_H = 6;

/**
 * Pixel-art warp pipe. The rim top sits at (x, y); the body runs to `floor`.
 * Built from vertical shading stripes with notched (stepped) rim corners,
 * a dark mouth the character drops into, and a puff effect for travel.
 */
export function WarpPipe({
  pipe,
  floor,
  role,
  label,
}: {
  pipe: PipeSpec;
  floor: number;
  role: "exit" | "entry";
  label?: string;
}) {
  const { x, y, w } = pipe;
  const bx = x + 1; // body is 1px narrower than the rim on each side
  const bw = w - 2;
  const by = y + RIM_H;
  const bh = floor - by;
  const cx = x + w / 2;

  // Vertical shading stripes (offset from left edge, width, color)
  const bodyStripes: [number, number, string][] = [
    [0, 1, PIPE.outline],
    [1, 2, PIPE.light],
    [3, 1, PIPE.highlight],
    [4, bw - 9, PIPE.base],
    [bw - 5, 3, PIPE.shadow],
    [bw - 2, 1, PIPE.shadow],
    [bw - 1, 1, PIPE.outline],
  ];
  const rimW = w + 2;
  const rimStripes: [number, number, string][] = [
    [0, 1, PIPE.outline],
    [1, 2, PIPE.light],
    [3, 2, PIPE.highlight],
    [5, rimW - 11, PIPE.base],
    [rimW - 6, 4, PIPE.shadow],
    [rimW - 2, 1, PIPE.shadow],
    [rimW - 1, 1, PIPE.outline],
  ];

  return (
    <g className={styles.pipe} data-pipe={role}>
      {/* Body */}
      {bodyStripes.map(([ox, sw, c]) => (
        <rect key={`b${ox}`} x={bx + ox} y={by} width={sw} height={bh} fill={c} />
      ))}
      {/* Rim shadow cast on body */}
      <rect x={bx} y={by} width={bw} height={1} fill={PIPE.outline} />
      <rect x={bx + 1} y={by + 1} width={bw - 2} height={1} fill={PIPE.shadow} opacity={0.6} />
      {/* Rim */}
      {rimStripes.map(([ox, sw, c]) => (
        <rect key={`r${ox}`} x={x - 1 + ox} y={y} width={sw} height={RIM_H} fill={c} />
      ))}
      <rect x={x} y={y} width={w} height={1} fill={PIPE.outline} />
      <rect x={x - 1} y={y + RIM_H - 1} width={rimW} height={1} fill={PIPE.outline} />
      {/* Stepped corners: knock out the four rim corner pixels */}
      <rect x={x - 1} y={y} width={1} height={1} className={styles.knock} />
      <rect x={x + w} y={y} width={1} height={1} className={styles.knock} />
      {/* Mouth (opening) */}
      <rect x={x + 1} y={y + 1} width={w - 2} height={1} fill={PIPE.mouth} />
      <rect x={x + 3} y={y + 2} width={w - 6} height={1} fill={PIPE.mouth} opacity={0.7} />

      {/* Travel puff */}
      <g className={role === "exit" ? styles.puffExit : styles.puffEntry}>
        <rect x={cx - 7} y={y - 3} width={2} height={2} />
        <rect x={cx + 5} y={y - 3} width={2} height={2} />
        <rect x={cx - 3} y={y - 6} width={2} height={2} />
        <rect x={cx + 2} y={y - 7} width={1} height={1} />
        <rect x={cx - 1} y={y - 9} width={2} height={2} />
      </g>

      {label && (
        <g className={styles.pipeSign}>
          <rect x={cx - label.length * 1.35 - 3} y={y - 33} width={label.length * 2.7 + 6} height={6} />
          <text x={cx} y={y - 28.6} textAnchor="middle">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
