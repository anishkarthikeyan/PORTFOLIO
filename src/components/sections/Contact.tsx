import { PixelSprite } from "@/components/pixel/PixelSprite";
import { ICON_PORTAL, ICON_PORTAL_PALETTE } from "@/components/pixel/sprites";
import { links } from "@/data/portfolio";
import { allLinks, configuredLinks, isConfigured, isExternal } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DevPlaceholder } from "@/components/ui/Status";
import { TerminalButton } from "@/components/terminal/TerminalButton";
import styles from "./sections.module.css";

export function Contact() {
  const live = configuredLinks();
  const missing = allLinks.filter((l) => !isConfigured(l));

  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="container">
        <div className={`panel ${styles.portal}`}>
          <div className={styles.portalArt} aria-hidden="true">
            <PixelSprite rows={ICON_PORTAL} palette={ICON_PORTAL_PALETTE} scale={6} />
          </div>
          <div className={styles.portalBody}>
            <SectionHeader
              id="contact-title"
              index="09"
              eyebrow="Exit portal"
              title="Contact"
              lede="Open to conversations about software engineering, backend, and AI/ML roles."
            />

            <div className={styles.contactActions}>
              {isConfigured(links.resume) && (
                <a href={links.resume.href} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  Download resume
                </a>
              )}
              {live.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="btn"
                  {...(isExternal(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {l.label} {isExternal(l.href) && <span aria-hidden="true">↗</span>}
                </a>
              ))}
              <TerminalButton className="btn btn-ghost" command="contact">
                <span aria-hidden="true">&gt;_</span> contact
              </TerminalButton>
            </div>

            {live.length === 0 && !isConfigured(links.resume) && (
              <p className="muted">Contact links are being set up and will appear here shortly.</p>
            )}

            {process.env.NODE_ENV !== "production" && (missing.length > 0 || !isConfigured(links.resume)) && (
              <div className={styles.devList}>
                {!isConfigured(links.resume) && <DevPlaceholder hint={links.resume.placeholder ?? "Resume"} />}
                {missing.map((l) => (
                  <DevPlaceholder key={l.label} hint={l.placeholder ?? l.label} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
