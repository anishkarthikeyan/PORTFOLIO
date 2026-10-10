import { education } from "@/data/portfolio";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DevPlaceholder, StatusBadge } from "@/components/ui/Status";
import styles from "./sections.module.css";

function OptionalList({ title, items, hint }: { title: string; items: string[]; hint: string }) {
  // Empty optional fields are hidden publicly and flagged only in development.
  if (!items.length) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div>
        <h4 className={styles.h4}>{title}</h4>
        <DevPlaceholder hint={hint} />
      </div>
    );
  }
  return (
    <div>
      <h4 className={styles.h4}>{title}</h4>
      <ul className="chip-list">
        {items.map((i) => (
          <li key={i} className="chip">
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Education() {
  return (
    <section id="education" className="section" aria-labelledby="education-title">
      <div className="container">
        <SectionHeader id="education-title" index="07" eyebrow="Education" title="Education" />
        <ul className={styles.eduList}>
          {education.map((e) => (
            <li key={e.institution} className={`panel notched ${styles.eduCard}`}>
              <div className={styles.eduIcon} aria-hidden="true">
                <span className="pixel">B.E</span>
              </div>
              <div className={styles.eduMain}>
                <p className={styles.cardTop}>
                  <span className="eyebrow">Expected graduation {e.expectedGraduation}</span>
                  <StatusBadge status={e.status} />
                </p>
                <h3 className={styles.eduDegree}>
                  {e.degree} {e.field}
                </h3>
                <p className={styles.eduSchool}>
                  {e.institution}
                  {e.location && <span className="muted"> · {e.location}</span>}
                </p>
                <div className={styles.eduExtras}>
                  <OptionalList title="Relevant coursework" items={e.coursework} hint="Add coursework in portfolio.ts" />
                  <OptionalList title="Relevant subjects" items={e.relevantSubjects} hint="Add subjects in portfolio.ts" />
                  <OptionalList title="Academic projects" items={e.academicProjects} hint="Add academic projects in portfolio.ts" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
