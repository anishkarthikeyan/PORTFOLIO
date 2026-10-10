import Link from "next/link";
import type { Project } from "@/data/types";
import { PHASE_LABEL, TRACK_LABEL } from "@/lib/content";
import { ArchitectureDiagram } from "@/components/diagram/ArchitectureDiagram";
import { StatusBadge } from "@/components/ui/Status";
import styles from "./Projects.module.css";

export function ProjectCard({ project }: { project: Project }) {
  const p = project;
  const headingId = `card-${p.slug}`;
  return (
    <article
      className={`${styles.card} ${p.status === "sample" ? styles.cardSample : ""}`}
      data-track={p.track}
      aria-labelledby={headingId}
    >
      <div className={styles.cardMeta}>
        <span className={styles.track}>
          <span className={styles.trackIcon} aria-hidden="true">
            {p.track === "sde" ? "{ }" : "◇"}
          </span>
          {TRACK_LABEL[p.track]}
        </span>
        <StatusBadge status={p.status} />
      </div>

      <h3 id={headingId} className={styles.cardTitle}>
        <Link href={`/projects/${p.slug}`} className={styles.cardLink}>
          {p.title}
        </Link>
      </h3>

      <p className={styles.problem}>{p.problem}</p>

      <div className={styles.cardDiagram}>
        <ArchitectureDiagram diagram={p.diagram} compact />
      </div>

      <p className={styles.highlight}>
        <span className={styles.highlightLabel}>Highlight</span>
        {p.highlight}
      </p>

      <ul className="chip-list" aria-label="Technologies">
        {p.tags.slice(0, 5).map((t) => (
          <li key={t} className="chip">
            {t}
          </li>
        ))}
      </ul>

      <div className={styles.cardFoot}>
        <span className={styles.phase}>
          <span className={styles.phaseDot} data-phase={p.phase} aria-hidden="true" />
          Status: {PHASE_LABEL[p.phase]}
        </span>
        <div className={styles.cardActions}>
          {p.links.repo && (
            <a href={p.links.repo} className="btn btn-sm btn-ghost" target="_blank" rel="noopener noreferrer">
              Repo ↗<span className="sr-only"> for {p.title}</span>
            </a>
          )}
          <Link href={`/projects/${p.slug}`} className="btn btn-sm" aria-describedby={headingId}>
            Case study ▸
          </Link>
        </div>
      </div>
    </article>
  );
}
