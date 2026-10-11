import { achievements } from "@/data/portfolio";
import type { AchievementKind } from "@/data/types";
import { visible } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReplaceMe, SampleNotice, StatusBadge } from "@/components/ui/Status";
import { Corridor } from "@/components/journey/Corridor";
import styles from "./sections.module.css";

const ORDER: AchievementKind[] = ["Hackathon", "Competition", "Award", "Certification", "Publication", "Open Source", "Talk"];

export function Achievements() {
  const items = visible(achievements);
  // Empty categories are hidden automatically.
  const groups = ORDER.map((kind) => ({ kind, items: items.filter((a) => a.kind === kind) })).filter((g) => g.items.length);

  return (
    <section id="achievements" className="section" aria-labelledby="achievements-title">
      <div className="container">
        <SectionHeader
          id="achievements-title"
          index="08"
          eyebrow="Achievements"
          title="Achievements & Certifications"
          lede="Hackathons, competitions, certifications, open source, and talks — with the exact outcome stated."
        >
          {items.some((a) => a.status === "sample") && (
            <SampleNotice>Cards below are layout samples. No award, ranking, or certificate is being claimed.</SampleNotice>
          )}
        </SectionHeader>

        <Corridor
          id="trophy-room"
          world={5}
          label="Trophy room"
          theme="trophy"
          extras={[{ at: 0.06, kind: "power", block: { id: "starpower", power: "star", label: "STAR POWER" } }]}
          stopSelector="[data-unlock-id^='tr-']"
          blocks={groups
            .flatMap((g) => g.items)
            .map((a, k) => ({ id: `tr-${k}`, unlock: `tr-${k}`, label: a.title }))}
        />
        <ul className={styles.cards3}>
          {groups.flatMap((g) => g.items).map((a, k) => (
              <li key={a.title} data-anchor data-unlock-id={`tr-${k}`} className={`${styles.pedestal} panel ${a.status === "sample" ? "panel-sample" : ""} ${styles.cardPad}`}>
                <p className={styles.cardTop}>
                  <span className="chip">{a.kind}</span>
                  <StatusBadge status={a.status} />
                </p>
                <h3 className={styles.cardTitle}>{a.title}</h3>
                <p className={styles.smallRow}>
                  {a.issuer} · {a.date}
                </p>
                <p className={styles.smallRow}>
                  <span className={styles.smallLabel}>Outcome</span>{" "}
                  {a.outcome ?? <ReplaceMe>REPLACE ME — exact outcome</ReplaceMe>}
                </p>
                <p className="muted">{a.description}</p>
                {a.link && (
                  <a href={a.link} className="text-link" target="_blank" rel="noopener noreferrer">
                    Verify ↗<span className="sr-only"> {a.title}</span>
                  </a>
                )}
              </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
