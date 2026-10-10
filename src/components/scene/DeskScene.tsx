import { PixelGroup } from "@/components/pixel/PixelSprite";
import {
  CHARACTER,
  CHARACTER_EYES,
  CHARACTER_PALETTE,
  DESK_PLANT,
  PLANT_PALETTE,
  TRAILING_PLANT,
} from "@/components/pixel/sprites";
import styles from "./DeskScene.module.css";

/**
 * The developer room. All coordinates are in art pixels (viewBox 200 × 120);
 * the SVG scales with crisp edges. Desk objects are real links with visible
 * labels on hover/focus, plus a text legend rendered by the hero.
 */

export const DESK_HOTSPOTS = [
  { id: "laptop", object: "Laptop", target: "Projects", href: "/#projects" },
  { id: "poster", object: "Poster", target: "Skills", href: "/#skills" },
  { id: "books", object: "Bookshelf", target: "Education", href: "/#education" },
  { id: "mug", object: "Mug", target: "Profile", href: "/#about" },
  { id: "plant", object: "Plant", target: "Experience", href: "/#experience" },
  { id: "phone", object: "Phone", target: "Contact", href: "/#contact" },
] as const;

type HotspotId = (typeof DESK_HOTSPOTS)[number]["id"];

function Hotspot({
  id,
  box,
  tip,
  children,
}: {
  id: HotspotId;
  box: [number, number, number, number];
  /** Tooltip anchor (x, y) — tooltip is centered above this point. */
  tip: [number, number];
  children: React.ReactNode;
}) {
  const spot = DESK_HOTSPOTS.find((h) => h.id === id)!;
  const label = `${spot.object.toUpperCase()} → ${spot.target.toUpperCase()}`;
  const tw = label.length * 2.5 + 6;
  const [x, y, w, h] = box;
  return (
    <a href={spot.href} className={styles.hot} aria-label={`${spot.object}: go to ${spot.target}`}>
      <rect className={styles.hit} x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} />
      {children}
      <g className={styles.tip} aria-hidden="true">
        <rect x={tip[0] - tw / 2} y={tip[1] - 8} width={tw} height={6.5} />
        <text x={tip[0]} y={tip[1] - 3.4} textAnchor="middle">
          {label}
        </text>
      </g>
    </a>
  );
}

export function DeskScene({ variant = "wide" }: { variant?: "wide" | "compact" }) {
  const compact = variant === "compact";
  const viewBox = compact ? "62 28 108 68" : "54 2 146 104";
  const gid = `scene-${variant}`;

  return (
    <svg
      className={`${styles.scene} ${compact ? styles.compact : styles.wide}`}
      viewBox={viewBox}
      shapeRendering="crispEdges"
      role="group"
      aria-label="Pixel-art room: Anish at a desk with a laptop, mug, plant, phone and bookshelf. Objects link to portfolio sections."
    >
      <defs>
        <radialGradient id={`${gid}-light`} cx="0.61" cy="0.5" r="0.3">
          <stop offset="0" stopColor="#849bb8" stopOpacity="0.18" />
          <stop offset="0.6" stopColor="#849bb8" stopOpacity="0.04" />
          <stop offset="1" stopColor="#849bb8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient steel-blue light pool */}
      <rect x="0" y="0" width="200" height="120" fill={`url(#${gid}-light)`} shapeRendering="auto" />

      {/* ---------- Wall: shelf, books, trailing plant ---------- */}
      {!compact && (
        <>
          <Hotspot id="books" box={[166, 6, 32, 20]} tip={[168, 36]}>
            <g>
              <rect x="167" y="10" width="4" height="16" fill="#2a303a" />
              <rect x="171" y="7" width="5" height="19" fill="#3a414d" />
              <rect x="176" y="9" width="4" height="17" fill="#1f242c" />
              <rect x="180" y="6" width="5" height="20" fill="#4a5260" />
              <rect x="185" y="11" width="3" height="15" fill="#2d3440" />
              <rect x="189" y="8" width="5" height="18" fill="#394150" transform="rotate(-8 191 26)" />
              <rect x="172" y="12" width="3" height="1" fill="#5c6f88" />
              <rect x="181" y="10" width="3" height="1" fill="#849bb8" />
            </g>
          </Hotspot>
          <rect x="128" y="26" width="72" height="2" fill="#2a303a" />
          <rect x="128" y="28" width="72" height="1" fill="#14181d" />
          <rect x="140" y="29" width="2" height="5" fill="#1c2128" />
          <rect x="190" y="29" width="2" height="5" fill="#1c2128" />
          <PixelGroup rows={TRAILING_PLANT} palette={PLANT_PALETTE} x={136} y={20} />

          {/* Poster */}
          <Hotspot id="poster" box={[62, 18, 30, 34]} tip={[80, 60]}>
            <rect x="62" y="18" width="30" height="34" fill="#151a21" />
            <rect x="62" y="18" width="30" height="34" fill="none" stroke="#2a313c" strokeWidth="1" />
            <g className={styles.posterText}>
              <text x="66" y="26">CODE ·</text>
              <text x="66" y="31">SYSTEMS ·</text>
              <text x="66" y="36">AI ·</text>
              <text x="66" y="41">IMPACT</text>
            </g>
            <rect x="66" y="44" width="4" height="0.6" fill="#5c6f88" />
          </Hotspot>
        </>
      )}

      {/* ---------- Character + chair ---------- */}
      <g className={styles.character}>
        <PixelGroup rows={CHARACTER} palette={CHARACTER_PALETTE} x={100} y={32} />
        {/* Translate on the wrapper: the blink animation's CSS transform would override it otherwise */}
        <g transform="translate(100 32)">
          <PixelGroup rows={CHARACTER_EYES} palette={CHARACTER_PALETTE} className={styles.eyes} />
        </g>
        {/* Screen light on the face */}
        <rect x="111" y="44" width="22" height="13" fill="#a9bdd6" className={styles.screenGlow} />
      </g>

      {/* Sleeves + hands (typing) */}
      <g className={styles.handL}>
        <rect x="97" y="78" width="6" height="5" fill="#17191e" />
        <rect x="100" y="82" width="4" height="3" fill="#8d5b3b" />
        <rect x="100" y="84" width="4" height="1" fill="#704530" />
      </g>
      <g className={styles.handR}>
        <rect x="141" y="78" width="6" height="5" fill="#17191e" />
        <rect x="140" y="82" width="4" height="3" fill="#8d5b3b" />
        <rect x="140" y="84" width="4" height="1" fill="#704530" />
      </g>

      {/* ---------- Desk ---------- */}
      <rect x={compact ? 60 : 30} y="86" width={compact ? 112 : 170} height="1" fill="#8c5439" />
      <rect x={compact ? 60 : 30} y="87" width={compact ? 112 : 170} height="3" fill="#75442f" />
      <rect x={compact ? 60 : 30} y="90" width={compact ? 112 : 170} height="6" fill="#5a3322" />
      <rect x={compact ? 60 : 30} y="96" width={compact ? 112 : 170} height="1" fill="#2a1810" />
      {[44, 58, 82, 118, 150, 176].map((x) => (
        <rect key={x} x={x} y="88" width="6" height="0.6" fill="#653a28" />
      ))}
      {!compact && (
        <>
          <rect x="36" y="97" width="4" height="23" fill="#2b1a12" />
          <rect x="190" y="97" width="4" height="23" fill="#2b1a12" />
        </>
      )}

      {/* ---------- Laptop (back of lid) ---------- */}
      <Hotspot id="laptop" box={[102, 66, 40, 22]} tip={[122, 64]}>
        <rect x="102" y="66" width="40" height="20" fill="#7d838f" />
        <rect x="102" y="66" width="40" height="1" fill="#a7adb8" />
        <rect x="102" y="66" width="1" height="20" fill="#959ba7" />
        <rect x="141" y="66" width="1" height="20" fill="#5f6570" />
        <rect x="100" y="86" width="44" height="1.5" fill="#a7adb8" />
        <rect x="100" y="87.5" width="44" height="0.8" fill="#4d525b" />
        {/* Neutral glowing mark */}
        <g className={styles.mark}>
          <rect x="121" y="74" width="2" height="1" fill="#eef1f5" />
          <rect x="120" y="75" width="4" height="2" fill="#eef1f5" />
          <rect x="121" y="77" width="2" height="1" fill="#eef1f5" />
        </g>
      </Hotspot>

      {/* ---------- Mug ---------- */}
      <Hotspot id="mug" box={[86, 77, 11, 9]} tip={[90, 74]}>
        <g className={styles.steam} aria-hidden="true">
          <rect x="89" y="73" width="1" height="1" fill="#5c6f88" />
          <rect x="91" y="71" width="1" height="1" fill="#5c6f88" />
          <rect x="90" y="69" width="1" height="1" fill="#5c6f88" />
        </g>
        <rect x="86" y="77" width="8" height="9" fill="#23272e" />
        <rect x="86" y="77" width="8" height="1" fill="#4a515d" />
        <rect x="87" y="78" width="1" height="7" fill="#353b45" />
        <rect x="93" y="78" width="1" height="8" fill="#191c21" />
        <rect x="94" y="79" width="2" height="1" fill="#2c3139" />
        <rect x="96" y="80" width="1" height="3" fill="#2c3139" />
        <rect x="94" y="83" width="2" height="1" fill="#2c3139" />
      </Hotspot>

      {/* ---------- Desk plant ---------- */}
      <Hotspot id="plant" box={compact ? [68, 73, 11, 13] : [70, 73, 11, 13]} tip={compact ? [80, 70] : [76, 70]}>
        <PixelGroup rows={DESK_PLANT} palette={PLANT_PALETTE} x={compact ? 68 : 70} y={73} />
      </Hotspot>

      {/* ---------- Phone ---------- */}
      <Hotspot id="phone" box={[150, 83, 14, 3]} tip={compact ? [156, 80] : [157, 80]}>
        <rect x="150" y="84" width="14" height="2" fill="#262b33" />
        <rect x="150" y="84" width="14" height="0.6" fill="#4a515d" />
        <rect x="152" y="84" width="3" height="0.6" fill="#5c6f88" className={styles.notify} />
      </Hotspot>

      {/* ---------- Book stack (decorative) ---------- */}
      {!compact && (
        <g aria-hidden="true">
          <rect x="172" y="81" width="20" height="2" fill="#2a303a" />
          <rect x="173" y="83" width="19" height="1.5" fill="#3a414d" />
          <rect x="171" y="84.5" width="21" height="1.5" fill="#22272f" />
        </g>
      )}
    </svg>
  );
}
