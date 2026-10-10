import { education, profile } from "@/data/portfolio";
import { visible } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/Status";
import { SummarySwitch } from "./SummarySwitch";
import styles from "./sections.module.css";

export function Profile() {
  const edu = education[0];
  const interests = visible(profile.interests.map((i) => ({ ...i })));
  const philosophy = visible(profile.philosophy);

  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container">
        <SectionHeader id="about-title" index="02" eyebrow="Player profile" title="About" />

        <div className={styles.profileGrid}>
          <SummarySwitch sde={profile.summaries.sde} aiml={profile.summaries.aiml} />

          <aside data-anchor className={`panel notched ${styles.statCard}`} aria-label="Profile facts">
            <p className={styles.statHead}>
              <span className="pixel">PLAYER.STATS</span>
            </p>
            <dl className={styles.stats}>
              <div>
                <dt>Name</dt>
                <dd>{profile.name}</dd>
              </div>
              <div>
                <dt>Degree</dt>
                <dd>
                  {edu.degree} {edu.field}
                </dd>
              </div>
              <div>
                <dt>Institution</dt>
                <dd>{edu.institution}</dd>
              </div>
              <div>
                <dt>Graduation</dt>
                <dd>Expected {edu.expectedGraduation}</dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>
                  <ul className="chip-list">
                    {profile.focusAreas.map((f) => (
                      <li key={f} className="chip">
                        {f}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        {interests.length > 0 && (
          <div className={styles.subBlock}>
            <h3 className={styles.h3}>Interests</h3>
            <ul className={styles.interestList}>
              {interests.map((i) => (
                <li key={i.text}>
                  <StatusBadge status={i.status} /> <span>{i.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {philosophy.length > 0 && (
          <div className={styles.subBlock}>
            <h3 className={styles.h3}>Engineering philosophy</h3>
            <ul className={styles.cards3}>
              {philosophy.map((p) => (
                <li key={p.title} data-anchor className={`panel ${p.status === "sample" ? "panel-sample" : ""} ${styles.cardPad}`}>
                  <p className={styles.cardTop}>
                    <span className={styles.cardTitle}>{p.title}</span>
                    <StatusBadge status={p.status} />
                  </p>
                  <p className="muted">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
