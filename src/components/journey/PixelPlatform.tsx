import type { PlatformSpec } from "@/data/worlds";

/** Surface/body colors per platform kind. Bodies use shared SVG patterns. */
const KIND = {
  ground: { top: "#5c6f88", lip: "#3a4250", body: "brick", base: "#1d232c" },
  wood: { top: "#a0623f", lip: "#8c5439", body: "plank", base: "#75442f" },
  block: { top: "#849bb8", lip: "#3a4454", body: "bolt", base: "#2c3542" },
  island: { top: "#a7adb8", lip: "#4a5260", body: "brick", base: "#262d38" },
  branch: { top: "#4f9a5a", lip: "#3a7343", body: "plank", base: "#5a3322" },
  metal: { top: "#a7adb8", lip: "#5c6f88", body: "rivet", base: "#2a303a" },
} as const;

/** Per-SVG texture patterns (ids are namespaced by `ns`). */
export function PlatformPatterns({ ns }: { ns: string }) {
  return (
    <defs>
      <pattern id={`${ns}-brick`} width="12" height="6" patternUnits="userSpaceOnUse">
        <rect width="12" height="6" fill="transparent" />
        <rect y="5" width="12" height="1" fill="#000" opacity="0.28" />
        <rect x="5" y="0" width="1" height="2.5" fill="#000" opacity="0.28" />
        <rect x="11" y="2.5" width="1" height="2.5" fill="#000" opacity="0.28" />
        <rect x="1" y="1" width="2" height="1" fill="#fff" opacity="0.04" />
      </pattern>
      <pattern id={`${ns}-plank`} width="16" height="4" patternUnits="userSpaceOnUse">
        <rect y="3" width="16" height="1" fill="#000" opacity="0.25" />
        <rect x="9" width="1" height="3" fill="#000" opacity="0.2" />
      </pattern>
      <pattern id={`${ns}-bolt`} width="10" height="8" patternUnits="userSpaceOnUse">
        <rect x="1" y="1" width="1" height="1" fill="#a7adb8" opacity="0.35" />
        <rect y="7" width="10" height="1" fill="#000" opacity="0.25" />
      </pattern>
      <pattern id={`${ns}-rivet`} width="8" height="6" patternUnits="userSpaceOnUse">
        <rect x="3" y="2" width="1" height="1" fill="#849bb8" opacity="0.45" />
        <rect y="5" width="8" height="1" fill="#000" opacity="0.2" />
      </pattern>
    </defs>
  );
}

/** Chunky pixel platform with a lit top edge, textured body and stepped ends. */
export function PixelPlatform({ p, floor, ns }: { p: PlatformSpec; floor: number; ns: string }) {
  const k = KIND[p.kind];
  const h = p.h ?? floor - p.y;
  const floating = p.h !== undefined;
  return (
    <g>
      <rect x={p.x} y={p.y} width={p.w} height={h} fill={k.base} />
      <rect x={p.x} y={p.y + 2} width={p.w} height={h - 2} fill={`url(#${ns}-${k.body})`} />
      <rect x={p.x} y={p.y} width={p.w} height={1} fill={k.top} />
      <rect x={p.x} y={p.y + 1} width={p.w} height={1} fill={k.lip} />
      {/* Left highlight / right shade */}
      <rect x={p.x} y={p.y + 1} width={1} height={h - 1} fill="#fff" opacity={0.06} />
      <rect x={p.x + p.w - 1} y={p.y + 1} width={1} height={h - 1} fill="#000" opacity={0.3} />
      {floating && (
        <>
          {/* Stepped underside */}
          <rect x={p.x + 2} y={p.y + h} width={p.w - 4} height={1} fill={k.base} />
          <rect x={p.x + 5} y={p.y + h + 1} width={p.w - 10} height={1} fill={k.base} opacity={0.7} />
          <rect x={p.x} y={p.y + h - 1} width={p.w} height={1} fill="#000" opacity={0.3} />
        </>
      )}
      {p.kind === "branch" && (
        // Leaf tufts on the branch
        <>
          <rect x={p.x + 3} y={p.y - 2} width={4} height={2} fill="#4f9a5a" />
          <rect x={p.x + 4} y={p.y - 3} width={2} height={1} fill="#6cbf6a" />
          <rect x={p.x + p.w - 9} y={p.y - 2} width={5} height={2} fill="#3f8a4b" />
        </>
      )}
    </g>
  );
}
