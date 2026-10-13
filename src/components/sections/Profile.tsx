import { education, profile } from "@/data/portfolio";
import { visible } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatusBadge } from "@/components/ui/Status";
import { SummarySwitch } from "./SummarySwitch";
import { Corridor } from "@/components/journey/Corridor";
import { LaneTrack } from "@/components/journey/LaneTrack";
import Image from "next/image";
/** Head-and-shoulders crop of the hero desk picture, for the trainer card. */
import face from "../../../public/trainer-face.png";
/** Type-badge colours for focus areas (Pokémon-style "types"). */
const TYPE_COLORS = ["#5aa9b8", "#d9b26f", "#9a7ac0", "#62b06a", "#c86b5e", "#6b86c8"];
import styles from "./sections.module.css";

export function Profile() {
  const edu = education[0];
  const interests = visible(profile.interests.map((i) => ({ ...i })));
  const philosophy = visible(profile.philosophy);

  return (
    <section id="about" className="section" aria-labelledby="about-title">
      <div className="container">
        <div className={styles.laneHost}>
        {/* Zig-zag ledge lane in the right margin beside the profile (wide screens). */}
        <LaneTrack id="profile-lane" world={3} label="Player profile" />
        <SectionHeader id="about-title" index="02" eyebrow="Player profile" title="About" />

        <div className={styles.profileGrid}>
          <SummarySwitch sde={profile.summaries.sde} aiml={profile.summaries.aiml} />

          <aside data-anchor className={`panel ${styles.statCard} ${styles.arcade}`} aria-label="Profile facts">
            <p className={styles.statHead}>
              <span className="pixel">Trainer card</span>
              <span className={styles.ready} aria-hidden="true">
                ▶ Player 1
              </span>
            </p>
            <div className={styles.portrait} aria-hidden="true">
              <Image src={face} alt="" width={140} height={140} />
            </div>
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
                <dt>Types</dt>
                <dd>
                  <ul className="chip-list">
                    {profile.focusAreas.map((f, i) => (
                      <li key={f} className={styles.typeBadge} style={{ "--type": TYPE_COLORS[i % TYPE_COLORS.length] } as React.CSSProperties}>
                        {f}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
        </div>

        {interests.length > 0 && (
          <div className={styles.subBlock}>
            <h3 className={styles.h3}>Interests</h3>
            <Corridor
              id="player-select"
              world={3}
              label="Player select"
              theme="select"
              stopSelector="[data-unlock-id^='int-']"
              stopKind="npc"
              blocks={interests.map((i, k) => ({ id: `int-${k}`, unlock: `int-${k}`, label: i.text }))}
              pedestal
            />
            <ul className={styles.interestList}>
              {interests.map((i, k) => (
                <li key={i.text} data-unlock-id={`int-${k}`}>
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
