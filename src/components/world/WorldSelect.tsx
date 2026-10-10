import { PixelSprite } from "@/components/pixel/PixelSprite";
import {
  CHARACTER,
  CHARACTER_EYES,
  CHARACTER_PALETTE,
  ICON_ARCHIVE,
  ICON_LOG,
  ICON_LOG_PALETTE,
  ICON_PALETTE,
  ICON_PORTAL,
  ICON_PORTAL_PALETTE,
  ICON_TREE,
} from "@/components/pixel/sprites";
import { RovingGrid } from "./RovingGrid";
import { Corridor } from "@/components/journey/Corridor";
import styles from "./WorldSelect.module.css";

// Head-and-shoulders crop of the canonical character, eyes merged in.
const HEAD = CHARACTER.slice(0, 30).map((row, y) =>
  row
    .split("")
    .map((c, x) => (CHARACTER_EYES[y][x] !== "." ? CHARACTER_EYES[y][x] : c))
    .join(""),
);

const WORLDS = [
  {
    id: "profile",
    room: "01",
    name: "Player Profile",
    blurb: "About, education, interests, and engineering philosophy.",
    href: "#about",
    icon: <PixelSprite rows={HEAD} palette={CHARACTER_PALETTE} scale={2} />,
  },
  {
    id: "archive",
    room: "02",
    name: "Project Archive",
    blurb: "SDE, backend, and AI/ML case studies.",
    href: "#projects",
    icon: <PixelSprite rows={ICON_ARCHIVE} palette={ICON_PALETTE} scale={4} />,
  },
  {
    id: "skills",
    room: "03",
    name: "Skill Tree",
    blurb: "Languages, DSA, backend, AI/ML, infrastructure, tools.",
    href: "#skills",
    icon: <PixelSprite rows={ICON_TREE} palette={ICON_PALETTE} scale={4} />,
  },
  {
    id: "log",
    room: "04",
    name: "Experience Log",
    blurb: "Experience, internships, achievements, and activities.",
    href: "#experience",
    icon: <PixelSprite rows={ICON_LOG} palette={ICON_LOG_PALETTE} scale={4} />,
  },
  {
    id: "portal",
    room: "05",
    name: "Exit Portal",
    blurb: "Resume, GitHub, LinkedIn, email, and other links.",
    href: "#contact",
    icon: <PixelSprite rows={ICON_PORTAL} palette={ICON_PORTAL_PALETTE} scale={4} />,
  },
];

export function WorldSelect() {
  return (
    <section id="world" className={styles.section} aria-labelledby="world-title">
      <div className="container">
        <div className={styles.head} data-reveal>
          <p className="eyebrow">World select</p>
          <h2 id="world-title" className={styles.title}>
            Choose a destination
          </h2>
          <p className={styles.hint}>
            Every room is a shortcut to a regular section — use the navigation bar any time.{" "}
            <span className={styles.keys}>Arrow keys move between rooms.</span>
          </p>
        </div>

        <RovingGrid className={styles.grid} label="World destinations">
          {WORLDS.map((w) => (
            <li key={w.id} data-anchor>
              <a href={w.href} className={styles.room} data-world={w.id}>
                <span className={styles.roomNo}>ROOM {w.room}</span>
                <span className={styles.stage} aria-hidden="true">
                  <span className={styles.icon}>{w.icon}</span>
                  <span className={styles.floor} />
                </span>
                <span className={styles.name}>{w.name}</span>
                <span className={styles.blurb}>{w.blurb}</span>
                <span className={styles.enter} aria-hidden="true">
                  ENTER ▸
                </span>
              </a>
            </li>
          ))}
        </RovingGrid>
        {/* Overworld path: the character walks node to node under the rooms. */}
        <Corridor id="overworld" world={1} label="Overworld" theme="map" stopSelector="[data-anchor]" stopKind="node" />
      </div>
    </section>
  );
}
