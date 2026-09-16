import { notFound } from "next/navigation";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import ProjectDemo from "@/components/project-demo";
import { projects } from "@/lib/projects";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  return { title: project ? project.name + " | Leonardo Ureña" : "Project not found", description: project?.summary };
}
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  if (!project) notFound();
  return <main><SiteNav /><div className="project-route" id="content"><div className="project-route-nav"><a href="/#labs">← All projects</a><div><a href={"https://github.com/nikolovaleo/portafolio-web/blob/main/app/api/"+project.endpoint+"/route.ts"} target="_blank" rel="noreferrer">Endpoint source ↗</a><a href="https://github.com/nikolovaleo/portafolio-web/blob/main/lib/platform.ts" target="_blank" rel="noreferrer">Core logic ↗</a></div></div><p className="project-disclosure">Personal project · Synthetic/public-safe data · No employer systems</p><ProjectDemo project={project.slug} />
    <section className="case-study" aria-labelledby="case-title"><p className="kicker">Engineering notes</p><h2 id="case-title">Decisions, evidence, and limits.</h2><div className="case-grid">{[["The problem", project.problem],["How it works",project.approach],["Baseline",project.baseline],["What is measured",project.measurement],["Failure modes",project.failure],["Production tradeoffs",project.production]].map(([title,copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <nav className="related-projects" aria-label="Other projects">{projects.filter(p => p.slug !== slug).map(p => <a key={p.slug} href={"/projects/"+p.slug}>{p.name} ↗</a>)}</nav></div><SiteFooter /></main>;
}
