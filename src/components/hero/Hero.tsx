import { DeskScene, DESK_HOTSPOTS } from "@/components/scene/DeskScene";
import { TerminalButton } from "@/components/terminal/TerminalButton";
import { DevPlaceholder } from "@/components/ui/Status";
import { education, links, profile } from "@/data/portfolio";
import { isConfigured } from "@/lib/content";
import styles from "./Hero.module.css";

const COMPACT_OBJECTS = new Set(["laptop", "mug", "plant", "phone"]);

export function Hero() {
  const edu = education[0];
  const [first, ...rest] = profile.name.toUpperCase().split(" ");

  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <div className={`container ${styles.grid}`}>
        <div className={styles.intro}>
          <p className={`eyebrow ${styles.tagline}`}>
            {profile.taglineWords.map((w, i) => (
              <span key={w}>
                {i > 0 && <span className={styles.slash} aria-hidden="true">/</span>}
                {w}
              </span>
            ))}
          </p>
          <h1 id="hero-title" className={styles.name}>
            {first} <span className={styles.accent}>{rest.join(" ")}</span>
          </h1>
          <p className={styles.positioning}>
            {profile.positioning.map((p, i) => (
              <span key={p}>
                {i > 0 && <span className={styles.pipe} aria-hidden="true">|</span>}
                {p}
              </span>
            ))}
          </p>
        </div>

        <div className={styles.details}>
          <span className={styles.rule} aria-hidden="true" />
          <p className={styles.headline}>{profile.headline}</p>
          <p className={styles.edu}>
            <span className={styles.eduLabel}>Studying</span>
            {edu.degree} {edu.field} · {edu.institution} · Expected {edu.expectedGraduation}
          </p>

          <div className={styles.ctas}>
            <a href="#world" className="btn btn-primary">
              Enter World <span aria-hidden="true">▸</span>
            </a>
            <a href="#projects" className="btn">
              View Projects
            </a>
          </div>
          <div className={styles.secondary}>
            {isConfigured(links.resume) ? (
              <a href={links.resume.href} className="btn btn-ghost btn-sm" target="_blank" rel="noopener noreferrer">
                Resume ↗
              </a>
            ) : (
              <DevPlaceholder hint={links.resume.placeholder ?? "Resume link"} />
            )}
            <a href="#contact" className="btn btn-ghost btn-sm">
              Contact
            </a>
            <TerminalButton className="btn btn-ghost btn-sm">
              <span aria-hidden="true">&gt;_</span> Terminal
            </TerminalButton>
          </div>
        </div>
        <div className={styles.sceneWrap}>
          <div className={styles.sceneWide}>
            <DeskScene variant="wide" />
          </div>
          <div className={styles.sceneCompact}>
            <DeskScene variant="compact" />
          </div>
          <div className={styles.legend}>
            <p className={styles.legendTitle}>Interactive desk</p>
            <ul>
              {DESK_HOTSPOTS.map((h) => (
                <li key={h.id} data-compact={COMPACT_OBJECTS.has(h.id)}>
                  <a href={h.href}>
                    {h.object} <span aria-hidden="true">→</span>
                    <span className="sr-only">goes to</span> {h.target}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
