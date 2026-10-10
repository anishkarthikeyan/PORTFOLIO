import { skillCategories } from "@/data/portfolio";
import { visible } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SampleNotice } from "@/components/ui/Status";
import styles from "./sections.module.css";

export function Skills() {
  const categories = skillCategories
    .map((c) => ({ ...c, groups: c.groups.map((g) => ({ ...g, items: visible(g.items) })).filter((g) => g.items.length) }))
    .filter((c) => c.groups.length);
  const anySample = categories.some((c) => c.groups.some((g) => g.items.some((i) => i.status === "sample")));

  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeader
          id="skills-title"
          index="03"
          eyebrow="Skill tree"
          title="Technical Skills"
          lede="Organized by engineering area. No self-rated percentages — evidence lives in the projects."
        >
          {anySample && (
            <SampleNotice>
              Skill list is sample content showing the structure. Items marked with a dashed outline are placeholders,
              not confirmed skills.
            </SampleNotice>
          )}
        </SectionHeader>

        <ol className={styles.tree}>
          {categories.map((c, i) => (
            <li key={c.id} className={styles.branch}>
              <div className={styles.branchHead}>
                <span className={styles.branchNode} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={styles.h3}>{c.title}</h3>
                  <p className="muted">{c.description}</p>
                </div>
              </div>
              <div className={styles.branchBody}>
                {c.groups.map((g) => (
                  <div key={g.title} className={styles.leafGroup}>
                    <h4 className={styles.h4}>{g.title}</h4>
                    <ul className="chip-list">
                      {g.items.map((s) => (
                        <li
                          key={s.name}
                          className={`chip ${s.status === "sample" ? styles.chipSample : ""}`}
                          title={s.note}
                        >
                          {s.name}
                          {s.status === "sample" && <span className="sr-only"> (sample)</span>}
                          {s.note && <span className={styles.chipNote}> — {s.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
