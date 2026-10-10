import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudy } from "@/components/case-study/CaseStudy";
import { getProject, getProjects, TRACK_LABEL } from "@/lib/content";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  const prefix = project.status === "sample" ? "[Sample] " : "";
  return {
    title: `${prefix}${project.title}`,
    description: `${TRACK_LABEL[project.track]} case study: ${project.problem}`,
    openGraph: { title: `${prefix}${project.title}`, description: project.problem },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <CaseStudy project={project} />;
}
