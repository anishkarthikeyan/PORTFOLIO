import { describe, expect, it } from "vitest";
import { complete, COMMANDS, runCommand } from "./terminal";
import { projects } from "@/data/portfolio";

const text = (r: ReturnType<typeof runCommand>) => r.lines.map((l) => l.text).join("\n");

describe("terminal commands", () => {
  it("help lists every required command", () => {
    const out = text(runCommand("help"));
    for (const c of ["help", "about", "projects", "sde", "aiml", "skills", "dsa", "experience", "contact", "clear"]) {
      expect(out).toContain(c);
    }
    expect(COMMANDS.length).toBeGreaterThanOrEqual(10);
  });

  it("projects lists every project with sample labels", () => {
    const out = text(runCommand("projects"));
    projects.forEach((p) => expect(out).toContain(p.title));
    expect(out).toContain("[SAMPLE]");
  });

  it("sde and aiml filter by track", () => {
    const sde = text(runCommand("sde"));
    const aiml = text(runCommand("aiml"));
    projects.forEach((p) => {
      expect(p.track === "sde" ? sde : aiml).toContain(p.title);
      expect(p.track === "sde" ? aiml : sde).not.toContain(p.title);
    });
  });

  it("about uses confirmed education details", () => {
    expect(text(runCommand("about"))).toContain("Chennai Institute of Technology");
  });

  it("dsa shows placeholders instead of invented numbers", () => {
    expect(text(runCommand("dsa"))).toContain("REPLACE ME");
  });

  it("open navigates to a case study, with or without the project- prefix", () => {
    expect(runCommand("open project-atlas").navigate).toBe("/projects/project-atlas");
    expect(runCommand("open vector").navigate).toBe("/projects/project-vector");
    expect(runCommand("open nope").navigate).toBeUndefined();
  });

  it("goto navigates to known sections only", () => {
    expect(runCommand("goto skills").navigate).toBe("/#skills");
    expect(runCommand("goto ../etc").navigate).toBeUndefined();
  });

  it("clear clears and unknown commands error safely", () => {
    expect(runCommand("clear").clear).toBe(true);
    const r = runCommand("rm -rf /");
    expect(r.lines[0]).toMatchObject({ tone: "error" });
    expect(r.navigate).toBeUndefined();
  });

  it("is case-insensitive and ignores whitespace", () => {
    expect(text(runCommand("  HELP  "))).toContain("Available commands");
    expect(runCommand("   ").lines).toEqual([]);
  });

  it("has secret cheats that never run anything real", () => {
    expect(runCommand("iddqd").cheat).toBe("star");
    expect(runCommand("warp 4").navigate).toBe("/#skills");
    expect(runCommand("warp 99").navigate).toBeUndefined();
    expect(text(runCommand("help"))).not.toContain("iddqd");
  });

  it("tab-completes commands and slugs", () => {
    expect(complete("pro")).toBe("projects");
    expect(complete("open project-a")).toBe("open project-atlas");
    expect(complete("s")).toBeNull(); // ambiguous: sde, skills
  });
});
