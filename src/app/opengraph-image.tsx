import { ImageResponse } from "next/og";
import { toRuns } from "@/components/pixel/PixelSprite";
import { CHARACTER, CHARACTER_EYES, CHARACTER_PALETTE } from "@/components/pixel/sprites";
import { education, profile } from "@/data/portfolio";

export const alt = "Anish Karthikeyan — software engineering and applied AI portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function characterSvg() {
  const rects = [...toRuns(CHARACTER, CHARACTER_PALETTE), ...toRuns(CHARACTER_EYES, CHARACTER_PALETTE)]
    .map((r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="1" fill="${r.fill}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 46" shape-rendering="crispEdges">${rects}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export default function Image() {
  const edu = education[0];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
          background: "#101419",
          color: "#eef1f5",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 700 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, color: "#849bb8" }}>{profile.taglineWords.join(" / ")}</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700 }}>
            <span>ANISH&nbsp;</span>
            <span style={{ color: "#849bb8" }}>KARTHIKEYAN</span>
          </div>
          <div style={{ fontSize: 24, letterSpacing: 3 }}>{profile.positioning.join("  |  ")}</div>
          <div style={{ width: 48, height: 4, background: "#849bb8" }} />
          <div style={{ fontSize: 20, color: "#b4bdca" }}>
            {`${edu.degree} ${edu.field} · ${edu.institution} · Expected ${edu.expectedGraduation}`}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={characterSvg()} width={308} height={322} alt="" />
          <div style={{ width: 360, height: 14, background: "#75442f" }} />
        </div>
      </div>
    ),
    size,
  );
}
