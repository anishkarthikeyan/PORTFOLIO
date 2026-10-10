import { skillCategories } from "@/data/portfolio";
import type { SkillCategory } from "@/data/types";
import { visible } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SampleNotice } from "@/components/ui/Status";
import { TreeTrack } from "@/components/journey/TreeTrack";
import styles from "./sections.module.css";

/**
 * Where each category grows on the tree. Fundamentals are the roots; the rest
 * are branches from the canopy down. Unknown categories become branches.
 * (Presentation only — the data order in portfolio.ts is unchanged.)
 */
const TREE_ORDER: Record<string, { part: "canopy" | "branch" | "root"; order: number }> = {
  frontend: { part: "canopy", order: 0 },
  infra: { part: "canopy", order: 1 },
  backend: { part: "branch", order: 2 },
  aiml: { part: "branch", order: 3 },
  programming: { part: "root", order: 9 },
};

function Category({ c }: { c: SkillCategory }) {
  return (
    <>
      <div className={styles.branchHead}>
        <div>
          <h3 className={styles.h3}>{c.title}</h3>
          <p className="muted">{c.description}</p>
        </div>
      </div>
      <div className={styles.branchBody}>
        {c.groups.map((g) => (
          <div key={g.title} className={styles.leafGroup}>
            <h4 className={styles.h4}>{g.title}</h4>
            <ul className={`chip-list ${styles.leaves}`}>
              {g.items.map((s) => (
                <li key={s.name} className={`chip ${s.status === "sample" ? styles.chipSample : ""}`} title={s.note}>
                  {s.name}
                  {s.status === "sample" && <span className="sr-only"> (sample)</span>}
                  {s.note && <span className={styles.chipNote}> — {s.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

export function Skills() {
  const categories = skillCategories
    .map((c) => ({ ...c, groups: c.groups.map((g) => ({ ...g, items: visible(g.items) })).filter((g) => g.items.length) }))
    .filter((c) => c.groups.length);
  const anySample = categories.some((c) => c.groups.some((g) => g.items.some((i) => i.status === "sample")));

  const placed = categories
    .map((c, i) => ({ c, ...(TREE_ORDER[c.id] ?? { part: "branch" as const, order: 5 + i }) }))
    .sort((a, b) => a.order - b.order);
  const limbs = placed.filter((p) => p.part !== "root");
  const roots = placed.filter((p) => p.part === "root");

  return (
    <section id="skills" className="section" aria-labelledby="skills-title">
      <div className="container">
        <SectionHeader
          id="skills-title"
          index="03"
          eyebrow="Skill tree"
          title="Technical Skills"
          lede="A real tree: specialisations branch out at the top, fundamentals form the roots. No self-rated percentages — evidence lives in the projects."
        >
          {anySample && (
            <SampleNotice>
              Skill list is sample content showing the structure. Items marked with a dashed outline are placeholders,
              not confirmed skills.
            </SampleNotice>
          )}
        </SectionHeader>

        <div className={styles.skillTree}>
          {/* Canopy */}
          <div className={styles.canopy} aria-hidden="true" />

          <div className={styles.treeBody}>
            <div className={styles.trunkCol}>
              <TreeTrack
                acorns={placed.map((p) => ({ id: p.c.id, unlock: `sk-${p.c.id}`, label: p.c.title }))}
              />
            </div>
            <ol className={styles.limbs}>
              {limbs.map((p, i) => (
                <li
                  key={p.c.id}
                  className={`${styles.limb} ${p.part === "canopy" ? styles.limbCanopy : ""}`}
                  data-limb={p.c.id}
                  data-side={i % 2 ? "left" : "right"}
                  data-unlock-id={`sk-${p.c.id}`}
                  data-anchor
                >
                  <Category c={p.c} />
                </li>
              ))}
              {roots.map((p) => (
                <li
                  key={p.c.id}
                  className={`${styles.limb} ${styles.limbRoot}`}
                  data-limb={p.c.id}
                  data-side="right"
                  data-unlock-id={`sk-${p.c.id}`}
                  data-anchor
                >
                  <p className={styles.rootTag} aria-hidden="true">
                    Roots · fundamentals
                  </p>
                  <Category c={p.c} />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
