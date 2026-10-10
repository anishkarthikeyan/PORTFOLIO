import { codingProfiles, dsaTopics, problemExamples } from "@/data/portfolio";
import { visible } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReplaceMe, SampleNotice, StatusBadge, ValueOr } from "@/components/ui/Status";
import { Corridor } from "@/components/journey/Corridor";
import styles from "./sections.module.css";

export function Dsa() {
  const profiles = visible(codingProfiles);
  const topics = visible(dsaTopics);
  const problems = visible(problemExamples);
  const anySample = [...profiles, ...topics, ...problems].some((x) => x.status === "sample");

  return (
    <section id="dsa" className="section" aria-labelledby="dsa-title">
      <div className="container">
        <SectionHeader
          id="dsa-title"
          index="04"
          eyebrow="Problem solving"
          title="DSA & Competitive Programming"
          lede="Practice profiles, topic coverage, and representative problems with the reasoning behind them."
        >
          {anySample && (
            <SampleNotice>
              All counts and ratings are placeholders (REPLACE ME) until linked to real coding profiles. Topic coverage
              is not a claim of mastery.
            </SampleNotice>
          )}
        </SectionHeader>

        {profiles.length > 0 && (
          <ul className={styles.cards2}>
            {profiles.map((p) => (
              <li key={p.platform} data-anchor className={`panel ${p.status === "sample" ? "panel-sample" : ""} ${styles.cardPad}`}>
                <p className={styles.cardTop}>
                  <span className={styles.cardTitle}>{p.platform}</span>
                  <StatusBadge status={p.status} />
                </p>
                <dl className={styles.metrics}>
                  <div>
                    <dt>Problems solved</dt>
                    <dd>
                      <ValueOr value={p.problemsSolved} />
                    </dd>
                  </div>
                  <div>
                    <dt>Contests</dt>
                    <dd>
                      <ValueOr value={p.contestsParticipated} />
                    </dd>
                  </div>
                  <div>
                    <dt>Contest rating</dt>
                    <dd>
                      <ValueOr value={p.contestRating} />
                    </dd>
                  </div>
                </dl>
                <p className={styles.smallRow}>
                  <span className={styles.smallLabel}>Strong topics</span>{" "}
                  {p.strongTopics.length ? p.strongTopics.join(", ") : <ReplaceMe />}
                </p>
                {p.url && (
                  <a href={p.url} className="text-link" target="_blank" rel="noopener noreferrer">
                    View {p.platform} profile ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {topics.length > 0 && (
          <div className={styles.subBlock}>
            <h3 className={styles.h3}>Topic map</h3>
            <p className="muted" style={{ marginBottom: "var(--s-4)" }}>
              Each topic links to evidence once added — practiced problems, write-ups, or contest submissions.
            </p>
            <ul className={styles.topicGrid} data-anchor>
              {topics.map((t) => (
                <li key={t.topic} className={styles.topic} data-has-evidence={Boolean(t.evidence)} data-visit>
                  <span className={styles.roomLabel} aria-hidden="true">
                    Room
                  </span>
                  <span className={styles.topicName}>{t.topic}</span>
                  <span className={styles.topicEvidence}>{t.evidence ?? <ReplaceMe>REPLACE ME — evidence</ReplaceMe>}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {problems.length > 0 && (
          <div className={styles.subBlock}>
            <h3 className={styles.h3}>Representative problems</h3>
            <Corridor
              id="dungeon"
              world={4}
              label="Dungeon"
              theme="dungeon"
              stopSelector="[data-unlock-id^='pz-']"
              blocks={problems.map((p, k) => ({ id: `pz-${k}`, unlock: `pz-${k}`, label: `Puzzle: ${p.pattern}` }))}
            />
            <ul className={styles.cards3}>
              {problems.map((p, k) => (
                <li key={p.title} data-anchor data-unlock-id={`pz-${k}`} className={`${styles.puzzle} panel ${p.status === "sample" ? "panel-sample" : ""} ${styles.cardPad}`}>
                  <p className={styles.puzzleTag} aria-hidden="true">
                    Puzzle room
                  </p>
                  <p className={styles.cardTop}>
                    <span className="chip">{p.pattern}</span>
                    <StatusBadge status={p.status} />
                  </p>
                  <h4 className={styles.cardTitle}>
                    {p.url ? (
                      <a href={p.url} className="text-link" target="_blank" rel="noopener noreferrer">
                        {p.title} ↗
                      </a>
                    ) : (
                      p.title
                    )}
                  </h4>
                  <p className="muted">{p.approach}</p>
                  <p className={styles.smallRow}>
                    <span className={styles.smallLabel}>Complexity</span> <code>{p.complexity}</code>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
