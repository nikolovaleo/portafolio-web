import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectLab } from "@/components/labs/project-lab";
import { projects } from "@/lib/projects";

const repository = "https://github.com/nikolovaleo/portafolio-web/blob/main";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  if (!project) return { title: "Project not found" };
  const title = `${project.name} | Leonardo Ureña`;
  return { title, description: project.summary, openGraph: { title, description: project.summary, url: `/projects/${project.slug}` } };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projects.find(p => p.slug === slug);
  if (!project) notFound();
  const notes = [
    ["The problem", project.problem],
    ["How it works", project.approach],
    ["Baseline", project.baseline],
    ["What is measured", project.measurement],
    ["Failure modes", project.failure],
    ["Production tradeoffs", project.production],
  ];

  return <main id="content" className={`project-page accent-${project.accent}`}>
    <div className="container">
      <nav className="breadcrumbs" aria-label="Project navigation">
        <Link href="/#labs"><span aria-hidden="true">←</span> All labs</Link>
        <div>
          <a href={`${repository}/app/api/${project.endpoint}/route.ts`} target="_blank" rel="noreferrer">Endpoint source <span aria-hidden="true">↗</span></a>
          <a href={`${repository}/${project.logic}`} target="_blank" rel="noreferrer">Core logic <span aria-hidden="true">↗</span></a>
        </div>
      </nav>

      <header className="project-header">
        <div>
          <p className="eyebrow">{project.category}</p>
          <h1>{project.name}</h1>
          <p className="project-intro">{project.intro}</p>
          <ul className="tag-list" aria-label="Techniques">{project.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        </div>
        <dl className="project-meta">
          <div><dt>Endpoint</dt><dd><code>POST /api/{project.endpoint}</code></dd></div>
          <div><dt>Data</dt><dd>Synthetic, public-safe</dd></div>
          <div><dt>Context</dt><dd>Personal project · Not an employer system</dd></div>
        </dl>
      </header>

      <ProjectLab slug={project.slug} variant="full" />

      <section className="case-study" aria-labelledby="case-title">
        <div className="section-head">
          <div><p className="eyebrow">Engineering notes</p><h2 id="case-title">Decisions, evidence, and limits.</h2></div>
        </div>
        <div className="case-grid">{notes.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div>
      </section>

      <nav className="related" aria-label="Other labs">
        <p className="eyebrow">Continue exploring</p>
        <ul>{projects.filter(p => p.slug !== project.slug).map(p => <li key={p.slug} className={`accent-${p.accent}`}>
          <Link href={`/projects/${p.slug}`}><span>{p.category}</span><strong>{p.name}</strong><small>{p.tagline}</small><i aria-hidden="true">→</i></Link>
        </li>)}</ul>
      </nav>
    </div>
  </main>;
}
