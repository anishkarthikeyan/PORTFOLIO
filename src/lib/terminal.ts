/**
 * Terminal command engine. Pure functions only — no shell, no network.
 * Every command reads from the same content source as the rest of the site.
 */
import { codingProfiles, dsaTopics, education, experience, links, profile, skillCategories } from "@/data/portfolio";
import type { Track } from "@/data/types";
import { configuredLinks, getProjects, isConfigured, PHASE_LABEL, TRACK_SHORT, visible } from "./content";
import { WORLD_NAV } from "@/data/worldNav";

export type TerminalLine =
  | { kind: "text"; text: string; tone?: "muted" | "accent" | "error" | "sample" }
  | { kind: "link"; text: string; href: string; external?: boolean };

export interface CommandResult {
  lines: TerminalLine[];
  /** Clear the scrollback before printing. */
  clear?: boolean;
  /** Navigate to this href after printing (dialog closes). */
  navigate?: string;
  /** Secret game cheat to apply (decorative). */
  cheat?: "star";
}

export const COMMANDS: { name: string; description: string }[] = [
  { name: "help", description: "List available commands" },
  { name: "about", description: "Who Anish is" },
  { name: "projects", description: "All projects (SDE + AI/ML)" },
  { name: "sde", description: "Software engineering projects" },
  { name: "aiml", description: "AI / ML projects" },
  { name: "skills", description: "Technical skill tree" },
  { name: "dsa", description: "Problem-solving profile" },
  { name: "experience", description: "Experience log" },
  { name: "contact", description: "Contact and profile links" },
  { name: "open <slug>", description: "Open a project case study" },
  { name: "goto <section>", description: "Jump to a section of the page" },
  { name: "clear", description: "Clear the terminal" },
];

export const BOOT_SEQUENCE = [
  "INITIALIZING ANISH.EXE",
  "LOADING ENGINEERING PROFILE",
  "INDEXING PROJECT ARCHIVE",
  "SYSTEM READY — type 'help'",
];

const SECTIONS = [
  "home",
  "world",
  "projects",
  "about",
  "skills",
  "dsa",
  "system-design",
  "experience",
  "education",
  "achievements",
  "contact",
];

const text = (t: string, tone?: "muted" | "accent" | "error" | "sample"): TerminalLine => ({
  kind: "text",
  text: t,
  tone,
});
const link = (t: string, href: string): TerminalLine => ({
  kind: "link",
  text: t,
  href,
  external: /^https?:\/\//.test(href),
});

const SAMPLE_NOTE = text("[SAMPLE] Entries marked sample are demonstration content.", "sample");

function projectLines(track?: Track): TerminalLine[] {
  const list = getProjects(track);
  if (list.length === 0) return [text("No projects published yet.", "muted")];
  const out: TerminalLine[] = [];
  for (const p of list) {
    out.push(link(`${p.status === "sample" ? "[SAMPLE] " : ""}${p.title}`, `/projects/${p.slug}`));
    out.push(text(`  ${TRACK_SHORT[p.track]} · ${PHASE_LABEL[p.phase]} · ${p.tags.join(", ")}`, "muted"));
  }
  if (list.some((p) => p.status === "sample")) out.push(SAMPLE_NOTE);
  out.push(text("Tip: open <slug>  e.g. 'open " + list[0].slug + "'", "muted"));
  return out;
}

export function runCommand(raw: string): CommandResult {
  const input = raw.trim();
  if (!input) return { lines: [] };
  const [cmd, ...args] = input.split(/\s+/);
  const name = cmd.toLowerCase();
  const arg = args.join(" ").toLowerCase();

  switch (name) {
    case "help":
      return {
        lines: [
          text("Available commands:", "accent"),
          ...COMMANDS.map((c) => text(`  ${c.name.padEnd(16)} ${c.description}`)),
          text("Keys: ↑/↓ history · Tab complete · Esc close", "muted"),
        ],
      };

    case "about": {
      const edu = education[0];
      return {
        lines: [
          text(profile.name.toUpperCase(), "accent"),
          text(profile.positioning.join(" | ")),
          text(`${edu.degree} ${edu.field} — ${edu.institution} (expected ${edu.expectedGraduation})`),
          text(profile.summaries.sde.text, "muted"),
          ...(profile.summaries.sde.status === "sample" ? [text("[SAMPLE] Summary is template text.", "sample")] : []),
          link("→ view profile", "/#about"),
        ],
      };
    }

    case "projects":
      return { lines: [text("PROJECT ARCHIVE", "accent"), ...projectLines()] };
    case "sde":
      return { lines: [text("SOFTWARE ENGINEERING", "accent"), ...projectLines("sde")] };
    case "aiml":
    case "ai":
    case "ml":
      return { lines: [text("AI / MACHINE LEARNING", "accent"), ...projectLines("aiml")] };

    case "skills": {
      const lines: TerminalLine[] = [text("SKILL TREE", "accent")];
      for (const c of skillCategories) {
        const items = c.groups.flatMap((g) => visible(g.items)).map((i) => i.name);
        if (items.length) lines.push(text(`${c.title}: `), text(`  ${items.join(" · ")}`, "muted"));
      }
      lines.push(SAMPLE_NOTE, link("→ view skill tree", "/#skills"));
      return { lines };
    }

    case "dsa": {
      const lines: TerminalLine[] = [text("PROBLEM SOLVING", "accent")];
      for (const p of visible(codingProfiles)) {
        const solved = p.problemsSolved ?? "REPLACE ME";
        const rating = p.contestRating ?? "REPLACE ME";
        lines.push(text(`${p.platform}: solved ${solved} · rating ${rating}${p.status === "sample" ? "  [SAMPLE]" : ""}`));
        if (p.url) lines.push(link(`  ${p.url}`, p.url));
      }
      lines.push(text(`Topics: ${dsaTopics.map((t) => t.topic).join(", ")}`, "muted"));
      lines.push(link("→ view DSA section", "/#dsa"));
      return { lines };
    }

    case "experience": {
      const list = visible(experience);
      const lines: TerminalLine[] = [text("EXPERIENCE LOG", "accent")];
      if (!list.length) lines.push(text("No entries yet.", "muted"));
      for (const e of list) {
        lines.push(text(`${e.status === "sample" ? "[SAMPLE] " : ""}${e.role} @ ${e.organization}`));
        lines.push(text(`  ${e.start} – ${e.end} · ${e.type}`, "muted"));
      }
      lines.push(link("→ view experience", "/#experience"));
      return { lines };
    }

    case "contact": {
      const lines: TerminalLine[] = [text("CONTACT", "accent")];
      const configured = configuredLinks();
      if (isConfigured(links.resume)) lines.push(link(`Resume: ${links.resume.href}`, links.resume.href));
      for (const l of configured) lines.push(link(`${l.label}: ${l.href.replace(/^mailto:/, "")}`, l.href));
      if (!configured.length) lines.push(text("Contact links are not published yet.", "muted"));
      lines.push(link("→ view contact section", "/#contact"));
      return { lines };
    }

    case "open": {
      const target = getProjects().find((p) => p.slug === arg || p.slug === `project-${arg}`);
      if (!target) return { lines: [text(`No project '${arg}'. Try 'projects'.`, "error")] };
      return { lines: [text(`Opening ${target.title}…`, "accent")], navigate: `/projects/${target.slug}` };
    }

    case "goto":
    case "cd": {
      const target = SECTIONS.find((sct) => sct === arg);
      if (!target) return { lines: [text(`Unknown section. Options: ${SECTIONS.join(", ")}`, "error")] };
      return { lines: [text(`Navigating to #${target}…`, "accent")], navigate: `/#${target}` };
    }

    case "clear":
    case "cls":
      return { lines: [], clear: true };

    // --- Secret cheats (not listed in help) ---
    case "iddqd":
      return { lines: [text("★ Cheat activated: star power for 20 seconds.", "accent")], cheat: "star" };
    case "warp": {
      const n = Number(arg);
      const w = WORLD_NAV.find((x) => x.world === n);
      if (!w) return { lines: [text(`Warp zone: choose a world 1–${WORLD_NAV.length}.`, "error")] };
      return { lines: [text(`Warping to World ${w.world} · ${w.title}…`, "accent")], navigate: w.href };
    }

    case "sudo":
      return { lines: [text("Nice try. This is a portfolio, not a shell.", "muted")] };

    default:
      return { lines: [text(`command not found: ${name} — type 'help'`, "error")] };
  }
}

/** Tab completion over command names, sections, and project slugs. */
export function complete(partial: string): string | null {
  const parts = partial.trimStart().split(/\s+/);
  if (parts.length <= 1) {
    const names = COMMANDS.map((c) => c.name.split(" ")[0]);
    const hit = names.filter((n) => n.startsWith(parts[0].toLowerCase()));
    return hit.length === 1 ? hit[0] + (["open", "goto"].includes(hit[0]) ? " " : "") : null;
  }
  const [cmd, rest] = [parts[0].toLowerCase(), parts.slice(1).join(" ").toLowerCase()];
  const pool = cmd === "open" ? getProjects().map((p) => p.slug) : cmd === "goto" ? SECTIONS : [];
  const hit = pool.filter((p) => p.startsWith(rest));
  return hit.length === 1 ? `${cmd} ${hit[0]}` : null;
}
