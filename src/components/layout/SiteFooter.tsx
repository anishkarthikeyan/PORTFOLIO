import { education, links, profile } from "@/data/portfolio";
import { configuredLinks, isConfigured, isExternal, NAV_ITEMS } from "@/lib/content";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  const edu = education[0];
  const external = configuredLinks();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.id}>
          <p className="pixel">ANISH.EXE</p>
          <p className="muted">
            {profile.name} · {edu.degree} {edu.field}, {edu.institution} · Expected {edu.expectedGraduation}
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className={styles.links}>
            {NAV_ITEMS.slice(1).map((n) => (
              <li key={n.id}>
                <a href={n.href}>{n.label}</a>
              </li>
            ))}
            {isConfigured(links.resume) && (
              <li>
                <a href={links.resume.href} target="_blank" rel="noopener noreferrer">
                  Resume
                </a>
              </li>
            )}
            {external.map((l) => (
              <li key={l.label}>
                <a href={l.href} {...(isExternal(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className={styles.fine}>
          Pixel art and code are original. Content marked SAMPLE is demonstration material, not verified information.
          Press <kbd>`</kbd> for the terminal.
        </p>
      </div>
    </footer>
  );
}
