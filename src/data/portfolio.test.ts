/**
 * Content-integrity tests. These guard the "no fabricated claims" rule:
 * sample content must stay labelled, and sample metrics must stay empty.
 */
import { describe, expect, it } from "vitest";
import * as data from "./portfolio";
import { CHARACTER, CHARACTER_EYES, DESK_PLANT, ICON_ARCHIVE, ICON_LOG, ICON_PORTAL, ICON_TREE, TRAILING_PLANT } from "@/components/pixel/sprites";

const { projects, education, experience, achievements, codingProfiles, systemDesigns, links, extraLinks } = data;

describe("confirmed profile", () => {
  it("uses only the confirmed name and education", () => {
    expect(data.profile.name).toBe("Anish Karthikeyan");
    expect(education[0]).toMatchObject({
      institution: "Chennai Institute of Technology",
      degree: "B.E.",
      field: "Computer Science and Engineering",
      expectedGraduation: "2028",
    });
  });

  it("does not invent optional education details", () => {
    // Optional fields must be filled by the owner, not generated.
    expect(education[0].coursework).toEqual([]);
    expect(education[0].academicProjects).toEqual([]);
  });
});

describe("projects", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9-]+$/));
  });

  it("has at least two projects per career track", () => {
    expect(projects.filter((p) => p.track === "sde").length).toBeGreaterThanOrEqual(2);
    expect(projects.filter((p) => p.track === "aiml").length).toBeGreaterThanOrEqual(2);
  });

  it("shows 3–5 card tags and a non-empty diagram", () => {
    for (const p of projects) {
      expect(p.tags.length).toBeGreaterThanOrEqual(3);
      expect(p.tags.length).toBeLessThanOrEqual(5);
      expect(p.diagram.stages.length).toBeGreaterThan(1);
      expect(p.diagram.flows.length).toBeGreaterThan(0);
    }
  });

  it("never marks illustrative diagrams of sample projects as implemented", () => {
    for (const p of projects.filter((x) => x.status === "sample")) {
      expect(p.diagram.basis).not.toBe("implemented");
    }
  });
});

describe("no fabricated claims in sample content", () => {
  const samples = projects.filter((p) => p.status === "sample");

  it("keeps every sample result and metric value empty", () => {
    for (const p of samples) {
      p.results.forEach((r) => expect(r.value, `${p.slug}: ${r.label}`).toBeNull());
      if (p.track === "aiml") {
        p.metrics.forEach((m) => expect(m.value, `${p.slug}: ${m.name}`).toBeNull());
        expect(p.data.size).toBeNull();
      }
    }
  });

  it("keeps sample coding-profile numbers empty", () => {
    for (const c of codingProfiles.filter((x) => x.status === "sample")) {
      expect(c.problemsSolved).toBeNull();
      expect(c.contestRating).toBeNull();
      expect(c.contestsParticipated).toBeNull();
      expect(c.url).toBeNull();
    }
  });

  it("never states an outcome for sample achievements", () => {
    achievements.filter((a) => a.status === "sample").forEach((a) => expect(a.outcome).toBeNull());
  });

  it("labels template experience as sample", () => {
    experience
      .filter((e) => /SAMPLE|REPLACE ME/.test(`${e.organization} ${e.role}`))
      .forEach((e) => expect(e.status).toBe("sample"));
  });

  it("does not mark any project, experience, or achievement as verified yet", () => {
    [...projects, ...experience, ...achievements, ...systemDesigns].forEach((x) => expect(x.status).not.toBe("verified"));
  });

  it("contains no fabricated percentage claims in sample project prose", () => {
    for (const p of samples) {
      const text = JSON.stringify(p);
      expect(text, p.slug).not.toMatch(/\b\d{1,3}(\.\d+)?\s?%/);
    }
  });
});

describe("links", () => {
  it("are either unset (null) or well-formed", () => {
    for (const l of [...Object.values(links), ...extraLinks]) {
      if (l.href !== null) expect(l.href).toMatch(/^(https:\/\/|mailto:|\/)/);
    }
  });
});

describe("sprites", () => {
  it("have rectangular rows", () => {
    for (const rows of [CHARACTER, CHARACTER_EYES, DESK_PLANT, TRAILING_PLANT, ICON_ARCHIVE, ICON_TREE, ICON_LOG, ICON_PORTAL]) {
      const w = rows[0].length;
      rows.forEach((r) => expect(r.length).toBe(w));
    }
    expect(CHARACTER_EYES.length).toBe(CHARACTER.length);
  });
});
