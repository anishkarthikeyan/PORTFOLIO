import { PixelGroup } from "@/components/pixel/PixelSprite";
import { DESK_PLANT, ICON_PALETTE, ICON_PORTAL, PLANT_PALETTE } from "@/components/pixel/sprites";
import type { PropSpec } from "@/data/worlds";
import styles from "./Journey.module.css";

/** Small text label in world space (decorative; bands are aria-hidden). */
function Tag({ x, y, text }: { x: number; y: number; text: string }) {
  const w = text.length * 2.7 + 5;
  return (
    <g className={styles.tag}>
      <rect x={x - w / 2} y={y - 5} width={w} height={6} />
      <text x={x} y={y - 0.7} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

/**
 * Scenery for each world. Props stand on (x, y) = bottom-left and are drawn
 * behind the character. Everything is plain rects for crisp pixels.
 */
export function WorldProp({ prop }: { prop: PropSpec }) {
  const { x, y, label } = prop;
  switch (prop.kind) {
    case "flag":
      return (
        <g>
          <rect x={x} y={y - 22} width={1} height={22} fill="#a7adb8" />
          <rect x={x - 1} y={y - 23} width={3} height={1} fill="#eef1f5" />
          <rect x={x + 1} y={y - 21} width={12} height={7} fill="#849bb8" className={styles.flag} />
          <rect x={x + 1} y={y - 15} width={12} height={1} fill="#5c6f88" />
          {label && (
            <text x={x + 7} y={y - 16.2} textAnchor="middle" className={styles.flagText}>
              {label}
            </text>
          )}
        </g>
      );
    case "desk":
      // The workspace from the hero, at platform scale.
      return (
        <g>
          <rect x={x} y={y - 12} width={34} height={2} fill="#8c5439" />
          <rect x={x} y={y - 10} width={34} height={1} fill="#5a3322" />
          <rect x={x + 2} y={y - 10} width={2} height={10} fill="#4a2a1c" />
          <rect x={x + 30} y={y - 10} width={2} height={10} fill="#4a2a1c" />
          <rect x={x + 9} y={y - 24} width={16} height={11} fill="#7d838f" />
          <rect x={x + 10} y={y - 23} width={14} height={9} fill="#1c2836" />
          <rect x={x + 11} y={y - 22} width={7} height={1} fill="#849bb8" className={styles.screenLine} />
          <rect x={x + 11} y={y - 20} width={10} height={1} fill="#5c6f88" />
          <rect x={x + 11} y={y - 18} width={5} height={1} fill="#849bb8" />
          <rect x={x + 16} y={y - 13} width={2} height={1} fill="#a7adb8" />
          <rect x={x + 26} y={y - 16} width={4} height={4} fill="#23272e" />
          <rect x={x + 26} y={y - 16} width={4} height={1} fill="#4a515d" />
        </g>
      );
    case "lamp":
      return (
        <g>
          <polygon points={`${x + 2},${y - 26} ${x - 8},${y} ${x + 14},${y}`} fill="#a9bdd6" opacity={0.05} />
          <rect x={x + 1} y={y - 26} width={1} height={26} fill="#3a414d" />
          <rect x={x - 2} y={y - 28} width={8} height={3} fill="#5c6f88" />
          <rect x={x - 1} y={y - 25} width={6} height={1} fill="#eef1f5" opacity={0.8} />
          <rect x={x - 2} y={y - 1} width={7} height={1} fill="#3a414d" />
        </g>
      );
    case "server":
      return (
        <g>
          <rect x={x} y={y - 20} width={14} height={20} fill="#262d38" />
          <rect x={x} y={y - 20} width={14} height={1} fill="#5c6f88" />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={x + 2} y={y - 17 + i * 4} width={10} height={3} fill="#1a1f27" />
              <rect x={x + 3} y={y - 16 + i * 4} width={1} height={1} fill="#849bb8" className={styles.led} style={{ animationDelay: `${i * 0.4}s` }} />
              <rect x={x + 5} y={y - 16 + i * 4} width={5} height={1} fill="#3a4454" />
            </g>
          ))}
          {label && <Tag x={x + 7} y={y - 23} text={label} />}
        </g>
      );
    case "nodes": {
      const pts: [number, number][] = [
        [x, y - 8],
        [x, y - 16],
        [x + 10, y - 4],
        [x + 10, y - 12],
        [x + 10, y - 20],
        [x + 20, y - 12],
      ];
      const links: [number, number][] = [
        [0, 2], [0, 3], [1, 3], [1, 4], [2, 5], [3, 5], [4, 5],
      ];
      return (
        <g>
          {links.map(([a, b]) => (
            <line key={`${a}${b}`} x1={pts[a][0] + 1} y1={pts[a][1] + 1} x2={pts[b][0] + 1} y2={pts[b][1] + 1} stroke="#3a4454" strokeWidth={0.6} />
          ))}
          {pts.map(([px, py], i) => (
            <rect key={i} x={px} y={py} width={3} height={3} fill={i === 5 ? "#a9bdd6" : "#849bb8"} className={i === 5 ? styles.led : undefined} />
          ))}
          {label && <Tag x={x + 11} y={y - 23} text={label} />}
        </g>
      );
    }
    case "card":
      return (
        <g>
          <rect x={x + 9} y={y - 6} width={1} height={6} fill="#5c6f88" />
          <rect x={x} y={y - 20} width={20} height={14} fill="#232a35" />
          <rect x={x} y={y - 20} width={20} height={1} fill="#a7adb8" />
          <rect x={x + 2} y={y - 17} width={6} height={7} fill="#8d5b3b" />
          <rect x={x + 2} y={y - 17} width={6} height={2} fill="#0d0e11" />
          <rect x={x + 3} y={y - 14} width={1} height={1} fill="#eef1f5" />
          <rect x={x + 6} y={y - 14} width={1} height={1} fill="#eef1f5" />
          <rect x={x + 10} y={y - 16} width={8} height={1} fill="#849bb8" />
          <rect x={x + 10} y={y - 14} width={6} height={1} fill="#5c6f88" />
          <rect x={x + 10} y={y - 12} width={7} height={1} fill="#5c6f88" />
          {label && <Tag x={x + 10} y={y - 22} text={label} />}
        </g>
      );
    case "plant":
      return <PixelGroup rows={DESK_PLANT} palette={PLANT_PALETTE} x={x} y={y - DESK_PLANT.length} />;
    case "trunk":
      return (
        <g>
          <rect x={x} y={y - 46} width={8} height={46} fill="#4a2a1c" />
          <rect x={x + 1} y={y - 46} width={2} height={46} fill="#5a3322" />
          <rect x={x + 6} y={y - 46} width={1} height={46} fill="#2b1a12" />
          <rect x={x - 6} y={y - 38} width={6} height={2} fill="#4a2a1c" />
          <rect x={x + 8} y={y - 30} width={8} height={2} fill="#4a2a1c" />
        </g>
      );
    case "leaves":
      return (
        <g opacity={0.9}>
          {[
            [0, 4, 14, 6], [10, 0, 18, 8], [24, 3, 16, 7], [6, 8, 30, 5],
          ].map(([dx, dy, w, h], i) => (
            <rect key={i} x={x + dx} y={y + dy} width={w} height={h} fill={i % 2 ? "#2f6b3a" : "#3f8a4b"} />
          ))}
          {[[4, 6], [14, 2], [28, 5], [20, 9], [34, 9]].map(([dx, dy], i) => (
            <rect key={`n${i}`} x={x + dx} y={y + dy} width={2} height={2} fill="#a9bdd6" className={styles.led} style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
        </g>
      );
    case "books":
      return (
        <g>
          <rect x={x} y={y - 3} width={18} height={3} fill="#3a414d" />
          <rect x={x + 1} y={y - 6} width={16} height={3} fill="#75442f" />
          <rect x={x + 2} y={y - 9} width={14} height={3} fill="#5c6f88" />
          <rect x={x + 3} y={y - 8} width={6} height={1} fill="#a7adb8" />
        </g>
      );
    case "cabinet":
      return (
        <g>
          <rect x={x} y={y - 22} width={16} height={22} fill="#2c3542" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={x + 1} y={y - 21 + i * 7} width={14} height={6} fill="#232a35" />
              <rect x={x + 6} y={y - 18 + i * 7} width={4} height={1} fill="#a7adb8" />
            </g>
          ))}
        </g>
      );
    case "cap":
      return (
        <g>
          <rect x={x + 3} y={y - 8} width={8} height={8} fill="#2c3542" />
          <rect x={x} y={y - 12} width={14} height={2} fill="#0d0e11" />
          <rect x={x + 4} y={y - 10} width={6} height={2} fill="#17191e" />
          <rect x={x + 12} y={y - 11} width={1} height={5} fill="#d9b26f" />
        </g>
      );
    case "portal":
      return (
        <g>
          <ellipse cx={x + 16} cy={y - 16} rx={22} ry={20} fill="#a9bdd6" opacity={0.07} className={styles.portalGlow} />
          <g transform={`translate(${x} ${y - 26}) scale(2)`}>
            <PixelGroup rows={ICON_PORTAL.slice(1, 14)} palette={{ ...ICON_PALETTE, S: "#3a4250" }} />
          </g>
        </g>
      );
    case "signpost":
      return (
        <g>
          <rect x={x + 5} y={y - 10} width={1} height={10} fill="#5c6f88" />
          {label && <Tag x={x + 6} y={y - 10} text={label} />}
        </g>
      );
    default:
      return null;
  }
}
