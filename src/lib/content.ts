import {
  achievements,
  codingProfiles,
  experience,
  extraLinks,
  links,
  problemExamples,
  projects,
  site,
  skillCategories,
  systemDesigns,
} from "@/data/portfolio";
import type {
  ConfigurableLink,
  ContentStatus,
  MaybeApplicable,
  NotApplicable,
  Project,
  Track,
} from "@/data/types";

/** Filters out sample records when `site.hideSampleContent` is enabled. */
export function visible<T extends { status: ContentStatus }>(items: T[]): T[] {
  return site.hideSampleContent ? items.filter((i) => i.status !== "sample") : items;
}

export function isNotApplicable<T>(value: MaybeApplicable<T>): value is NotApplicable {
  return typeof value === "object" && value !== null && "notApplicable" in value;
}

export function isConfigured(link: ConfigurableLink): link is ConfigurableLink & { href: string } {
  return typeof link.href === "string" && link.href.trim().length > 0;
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

export const TRACK_LABEL: Record<Track, string> = {
  sde: "Software Engineering",
  aiml: "AI / Machine Learning",
};

export const TRACK_SHORT: Record<Track, string> = { sde: "SDE", aiml: "AI/ML" };

export const PHASE_LABEL: Record<Project["phase"], string> = {
  concept: "Concept",
  planned: "Planned",
  "in-progress": "In progress",
  completed: "Completed",
  archived: "Archived",
};

export const MATURITY_LABEL = {
  "implemented-tested": "Implemented & tested",
  "designed-not-implemented": "Designed — not implemented",
  "learning-exercise": "Hypothetical learning exercise",
} as const;

export function getProjects(track?: Track): Project[] {
  const list = visible(projects);
  return track ? list.filter((p) => p.track === track) : list;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

export function getVisibleSections() {
  return {
    dsa: site.sections.dsa && (visible(codingProfiles).length > 0 || visible(problemExamples).length > 0),
    systemDesign: site.sections.systemDesign && visible(systemDesigns).length > 0,
    experience: site.sections.experience && visible(experience).length > 0,
    achievements: site.sections.achievements && visible(achievements).length > 0,
    skills: skillCategories.some((c) => c.groups.some((g) => visible(g.items).length > 0)),
  };
}

export const allLinks: ConfigurableLink[] = [links.github, links.linkedin, links.email, ...extraLinks];

export function configuredLinks(list: ConfigurableLink[] = allLinks) {
  return list.filter(isConfigured);
}

export function hasSample<T extends { status: ContentStatus }>(items: T[]): boolean {
  return items.some((i) => i.status === "sample");
}

/** Primary navigation. The world selector and terminal use the same targets. */
export const NAV_ITEMS = [
  { id: "home", label: "Home", href: "/#home" },
  { id: "projects", label: "Projects", href: "/#projects" },
  { id: "skills", label: "Skills", href: "/#skills" },
  { id: "experience", label: "Experience", href: "/#experience" },
  { id: "education", label: "Education", href: "/#education" },
  { id: "achievements", label: "Achievements", href: "/#achievements" },
  { id: "contact", label: "Contact", href: "/#contact" },
] as const;
