import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchitectureFlow } from "@/components/architecture-flow";
import { AegisScorecard } from "@/components/labs/aegis-scorecard";
import { ProjectLab } from "@/components/labs/project-lab";
import { CaseIndex } from "@/components/section-nav";
import { projects } from "@/lib/projects";

const repository = "https://github.com/nikolovaleo/portafolio-web/blob/main";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  if (!project) return { title: "Project not found" };
  const title = `${project.name} | Leonardo Urena`;
  // Nested openGraph/twitter objects replace the layout's, so the share image is repeated here.
  const images = [{ url: "/og-image.png", width: 1200, height: 630, alt: `${project.name}, a live lab by Leonardo Urena` }];
  return {
    title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { type: "article", title, description: project.summary, url: `/projects/${project.slug}`, siteName: "Leonardo Urena", images },
    twitter: { card: "summary_large_image", title, description: project.summary, images },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  if (!project) notFound();
  const notes = [
    ["problem", "The problem", project.problem],
    ["approach", "How it works", project.approach],
    ["baseline", "Baseline", project.baseline],
    ["measurement", "What is measured", project.measurement],
    ["failure", "Failure modes", project.failure],
    ["production", "Production tradeoffs", project.production],
  ] as const;

  return <main id="content" className="project-page">
    <div className="container">
      <nav className="breadcrumbs" aria-label="Project navigation">
        <Link href={`/?lab=${project.slug}#labs`}><span aria-hidden="true">←</span> All labs</Link>
        <div>
          <a href={`${repository}/app/api/${project.endpoint}/route.ts`} target="_blank" rel="noreferrer">Endpoint source <span aria-hidden="true">↗</span></a>
          <a href={`${repository}/${project.logic}`} target="_blank" rel="noreferrer">Core logic <span aria-hidden="true">↗</span></a>
        </div>
      </nav>

      <header className="project-header">
        <p className="eyebrow">{project.category}</p>
        <h1>{project.name}</h1>
        <p className="project-intro">{project.intro}</p>
        <ul className="project-glance" aria-label="At a glance">
          {project.facts.map(fact => <li key={fact}>{fact}</li>)}
          <li><code translate="no">POST /api/{project.endpoint}</code></li>
        </ul>
        <p className="project-context">Personal project on synthetic data · Not an employer system</p>
      </header>

      <section className="project-block" aria-labelledby="architecture-title">
        <div className="project-block-head">
          <h2 id="architecture-title">Architecture</h2>
          <ul className="chip-list" aria-label="Techniques">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        </div>
        <ArchitectureFlow stages={project.architecture} label={`${project.name} architecture`} />
      </section>

      <section className="project-block" aria-labelledby="lab-title">
        <div className="project-block-head">
          <h2 id="lab-title">Run it</h2>
          <ol className="try-this" aria-label="Try this">{project.tryThis.map(step => <li key={step}>{step}</li>)}</ol>
        </div>
        <p className="lab-shows project-shows"><span>What this shows</span>{project.shows.join(" · ")}</p>
        <ProjectLab slug={project.slug} variant="full" />
      </section>

      {project.slug === "aegis" && <AegisScorecard />}

      <section className="case-study" aria-labelledby="case-title">
        <h2 id="case-title">Decisions, evidence, and limits</h2>
        <div className="case-layout">
          <CaseIndex notes={notes.map(([id, title]) => ({ id, title }))} />
          <div className="case-notes">{notes.map(([id, title, copy]) => <article key={id} id={`note-${id}`}>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>)}</div>
        </div>
      </section>

      <nav className="related" aria-label="Other labs">
        <h2>Continue exploring</h2>
        <ul>{projects.filter(p => p.slug !== project.slug).map(p => <li key={p.slug}>
          <Link href={`/projects/${p.slug}`}><span>{p.category}</span><strong>{p.name}</strong><small>{p.tagline}</small><i aria-hidden="true">→</i></Link>
        </li>)}</ul>
      </nav>
    </div>
  </main>;
}
