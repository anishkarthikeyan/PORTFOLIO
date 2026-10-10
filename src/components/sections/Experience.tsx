import { experience } from "@/data/portfolio";
import { configuredLinks, visible } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReplaceMe, SampleNotice, StatusBadge } from "@/components/ui/Status";
import styles from "./sections.module.css";

export function Experience() {
  const entries = visible(experience);

  return (
    <section id="experience" className="section" aria-labelledby="experience-title">
      <div className="container">
        <SectionHeader
          id="experience-title"
          index="06"
          eyebrow="Experience log"
          title="Experience"
          lede="Internships, roles, and activities — with responsibilities, contributions, and measured outcomes."
        >
          {entries.some((e) => e.status === "sample") && (
            <SampleNotice>
              Entries below are templates. Organizations, roles, and dates are placeholders, not real positions.
            </SampleNotice>
          )}
        </SectionHeader>

        {entries.length === 0 ? (
          <p className="muted">No entries yet.</p>
        ) : (
          <ol className={styles.timeline}>
            {entries.map((e) => (
              <li key={`${e.organization}-${e.role}`} className={styles.timelineItem} data-anchor>
                <span className={styles.timelineDot} aria-hidden="true" />
                <article className={`panel ${e.status === "sample" ? "panel-sample" : ""} ${styles.cardPad}`}>
                  <header className={styles.expHead}>
                    <div>
                      <h3 className={styles.h3}>{e.role}</h3>
                      <p className={styles.org}>{e.organization}</p>
                    </div>
                    <div className={styles.badges}>
                      <span className="chip">{e.type}</span>
                      <StatusBadge status={e.status} />
                    </div>
                  </header>
                  <p className={styles.dates}>
                    <time>{e.start}</time> – <time>{e.end}</time>
                  </p>
                  <div className={styles.expBody}>
                    <div>
                      <h4 className={styles.h4}>Responsibilities</h4>
                      <ul className="list-dash">
                        {e.responsibilities.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className={styles.h4}>Technical contributions</h4>
                      <ul className="list-dash">
                        {e.contributions.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    {e.outcomes.length > 0 && (
                      <div>
                        <h4 className={styles.h4}>Outcomes</h4>
                        <ul className="list-dash">
                          {e.outcomes.map((o) => (
                            <li key={o.label}>
                              {o.label}: {o.value ?? <ReplaceMe>REPLACE ME — verified outcome</ReplaceMe>}
                              {o.conditions && <span className={styles.conditions}> ({o.conditions})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {configuredLinks(e.links).length > 0 && (
                    <ul className={styles.linkRow}>
                      {configuredLinks(e.links).map((l) => (
                        <li key={l.href}>
                          <a href={l.href} className="text-link" target="_blank" rel="noopener noreferrer">
                            {l.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
