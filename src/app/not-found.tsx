import Link from "next/link";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { ICON_PORTAL, ICON_PORTAL_PALETTE } from "@/components/pixel/sprites";

export default function NotFound() {
  return (
    <section className="section" aria-labelledby="nf-title" style={{ borderTop: 0 }}>
      <div className="container" style={{ display: "grid", gap: "var(--s-4)", justifyItems: "start", minHeight: "60svh", alignContent: "center" }}>
        <PixelSprite rows={ICON_PORTAL} palette={ICON_PORTAL_PALETTE} scale={5} />
        <p className="eyebrow">Error 404</p>
        <h1 id="nf-title" className="section-title">
          Room not found
        </h1>
        <p className="muted">This path doesn&apos;t lead anywhere. Head back to the main world.</p>
        <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-primary">
            Return home
          </Link>
          <Link href="/#projects" className="btn">
            View projects
          </Link>
        </div>
      </div>
    </section>
  );
}
