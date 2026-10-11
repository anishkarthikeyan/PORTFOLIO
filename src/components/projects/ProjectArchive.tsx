import { getProjects, hasSample } from "@/lib/content";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SampleNotice } from "@/components/ui/Status";
import { ProjectCard } from "./ProjectCard";
import { ProjectFilter } from "./ProjectFilter";

export function ProjectArchive() {
  const projects = getProjects();
  const counts = {
    all: projects.length,
    sde: projects.filter((p) => p.track === "sde").length,
    aiml: projects.filter((p) => p.track === "aiml").length,
  };

  return (
    <section id="projects" className="section" aria-labelledby="projects-title">
      {/* Anchors for deep links that preselect a track */}
      <span id="projects-sde" />
      <span id="projects-aiml" />
      <div className="container">
        <SectionHeader
          id="projects-title"
          index="01"
          eyebrow="Project archive"
          title="Projects"
          lede="Case studies across software engineering and applied AI/ML — each documents the problem, design, trade-offs, testing, and evidence."
        >
          {hasSample(projects) && (
            <SampleNotice>
              The projects below are demonstration templates (Atlas, Orbit, Vector, Signal) showing the case-study
              format. They are not real work, and all results are intentionally left as REPLACE ME.
            </SampleNotice>
          )}
        </SectionHeader>

        {projects.length === 0 ? (
          <p className="muted">Projects are being documented — check back soon.</p>
        ) : (
          <ProjectFilter
            counts={counts}
            items={projects.map((p, i) => ({
              key: p.slug,
              track: p.track,
              highlight: p.highlight,
              problem: p.problem,
              node: <ProjectCard project={p} level={`2-${i + 1}`} />,
            }))}
          />
        )}
      </div>
    </section>
  );
}
