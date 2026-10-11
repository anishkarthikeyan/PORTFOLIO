/**
 * Navigation as a world map: the six worlds and the sections inside each.
 * Single source for the world-tile header, the world-map overlay and the
 * in-page map. Every entry is a normal link to a real section.
 */
export interface WorldNavItem {
  world: number;
  /** Section name shown on the tile (recruiter-facing). */
  title: string;
  /** In-game world name. */
  name: string;
  href: string;
  /** Other sections that live in this world. */
  sub: { label: string; href: string }[];
  accent: string;
}

export const WORLD_NAV: WorldNavItem[] = [
  { world: 1, title: "Home", name: "Spawn point", href: "/#home", sub: [{ label: "World map", href: "/#world" }], accent: "#75442f" },
  { world: 2, title: "Projects", name: "Project islands", href: "/#projects", sub: [], accent: "#849bb8" },
  { world: 3, title: "About", name: "Player select", href: "/#about", sub: [], accent: "#a7adb8" },
  {
    world: 4,
    title: "Skills",
    name: "Skill tree",
    href: "/#skills",
    sub: [
      { label: "DSA", href: "/#dsa" },
      { label: "System design", href: "/#system-design" },
    ],
    accent: "#4f9a5a",
  },
  {
    world: 5,
    title: "Experience",
    name: "Archive",
    href: "/#experience",
    sub: [
      { label: "Education", href: "/#education" },
      { label: "Achievements", href: "/#achievements" },
    ],
    accent: "#8c5439",
  },
  { world: 6, title: "Contact", name: "Finale", href: "/#contact", sub: [], accent: "#a9bdd6" },
];
