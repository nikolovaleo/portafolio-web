import HomeLabs from "@/components/home-labs";
import { ProjectLab } from "@/components/labs/project-lab";
import { ProductionWork } from "@/components/production-work";
import { availability, capabilities, proof, resumePath, roles, siteUrl } from "@/lib/profile";
import { projects } from "@/lib/projects";

/** schema.org profile so search engines can show name, title, employer, and links. */
const profileJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Leonardo Urena Nikolova",
      alternateName: "Leonardo Urena",
      jobTitle: "Lead Cybersecurity Data Scientist",
      description: "AI/ML engineer and data scientist building production machine learning, LLM agents, RAG, and evaluation systems.",
      url: siteUrl,
      image: `${siteUrl}/leonardo-urena-portrait.jpg`,
      email: "mailto:nikolovaleo@gmail.com",
      worksFor: { "@type": "Organization", name: "Stryker", url: "https://www.stryker.com" },
      address: { "@type": "PostalAddress", addressLocality: "Escazú", addressCountry: "CR" },
      alumniOf: { "@type": "CollegeOrUniversity", name: "Tecnológico de Costa Rica" },
      hasCredential: [
        { "@type": "EducationalOccupationalCredential", name: "Deep Learning Specialization", recognizedBy: { "@type": "Organization", name: "DeepLearning.AI" } },
        { "@type": "EducationalOccupationalCredential", name: "CompTIA Security+", recognizedBy: { "@type": "Organization", name: "CompTIA" } },
      ],
      knowsAbout: ["Machine learning", "Data science", "Large language models", "Agentic AI", "Retrieval-augmented generation", "LLM evaluation", "Entity resolution", "MLOps", "Data engineering", "Cybersecurity"],
      knowsLanguage: ["en", "es", "ru"],
      sameAs: ["https://www.linkedin.com/in/nikolovaleo/", "https://github.com/nikolovaleo"],
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Leonardo Urena · AI/ML Engineering",
      author: { "@id": `${siteUrl}/#person` },
    },
  ],
};

export default function Home() {
  return <main id="content">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd).replace(/</g, "\\u003c") }} />

    <header className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="hero-kicker">Leonardo Urena <span>·</span> Lead Data Scientist &amp; AI/ML Engineer</p>
          <h1>I build AI systems that run in production.</h1>
          <p className="hero-intro">Agentic AI, RAG, LLM evaluation, and ML pipelines on Azure and Databricks. In production for security operations at Stryker since 2023.</p>
          <div className="hero-actions">
            <a className="button" href="#work">Explore the work <span aria-hidden="true">↓</span></a>
            <a className="button button-secondary" href={resumePath} download>Download résumé</a>
          </div>
        </div>
        <figure className="hero-portrait">
          <picture>
            <source media="(max-width: 720px)" srcSet="/leonardo-urena-portrait-mobile.png" width="1024" height="1024" />
            <img src="/leonardo-urena-portrait.jpg" width="640" height="1147" alt="Portrait of Leonardo Urena Nikolova" fetchPriority="high" decoding="async" />
          </picture>
          <figcaption>
            <span><strong>5+ years</strong> across production ML, AI research, and data engineering</span>
            <span className="hero-availability">{availability}</span>
          </figcaption>
        </figure>
      </div>
      <div className="container">
        <dl className="proof" aria-label="Selected results at Stryker">
          {proof.map(item => <div key={item.value} className="proof-item">
            <dt>{item.label}</dt>
            <dd><strong>{item.value}</strong><span>{item.detail}</span></dd>
          </div>)}
        </dl>
      </div>
    </header>

    <ProductionWork />

    <section className="section labs" id="labs" aria-labelledby="labs-title">
      <div className="container">
        <header className="section-intro">
          <p className="eyebrow">Interactive labs</p>
          <h2 id="labs-title">Working systems, not screenshots.</h2>
          <p>Five personal projects, each with a live API. Atlas, Sentinel, and Aegis form one security platform: trusted records, a monitored model, and an investigation that waits for approval. Hermes and Prism hold email triage and search changes to the same bar.</p>
          <ul className="disclosure" aria-label="About these labs"><li>Personal projects</li><li>Synthetic, public-safe data</li><li>Not employer systems</li></ul>
        </header>
        <HomeLabs
          labs={projects.map(({ slug, name, tagline, summary, group, shows, tryThis }) => ({ slug, name, tagline, summary, group, shows, tryThis }))}
          panels={projects.map(project => <ProjectLab key={project.slug} slug={project.slug} variant="compact" />)}
        />
      </div>
    </section>

    <section className="section practice" id="expertise" aria-labelledby="expertise-title">
      <div className="container">
        <header className="section-intro">
          <p className="eyebrow">How I work</p>
          <h2 id="expertise-title">The complete system, not just the model.</h2>
          <p>Production quality depends as much on data, evaluation, and delivery as on model choice, so I work across the whole lifecycle.</p>
        </header>
        <ol className="lifecycle">{capabilities.map(stage => <li key={stage.title}>
          <h3>{stage.title}</h3>
          <p>{stage.detail}</p>
          <ul aria-label={`${stage.title} tools`}>{stage.tools.map(tool => <li key={tool} translate="no">{tool}</li>)}</ul>
        </li>)}</ol>
      </div>
    </section>

    <section className="section experience" id="experience" aria-labelledby="experience-title">
      <div className="container">
        <header className="section-intro">
          <p className="eyebrow">Experience</p>
          <h2 id="experience-title">Research, industrial cybersecurity, then production AI.</h2>
          <p>A robotics and mechatronics engineer with an emphasis in AI and computer vision. My work connects cybersecurity, data engineering, and machine learning, from research to deployment and monitoring.</p>
        </header>
        <ol className="timeline">{roles.map(role => <li key={role.title}>
          <p className="timeline-period">{role.period}</p>
          <div className="timeline-body">
            <h3>{role.title}</h3>
            <p className="timeline-org">{role.org} <span>· {role.place}</span></p>
            <p className="timeline-scope">{role.scope}</p>
            <ul className="timeline-points">{role.points.map(point => <li key={point}>{point}</li>)}</ul>
          </div>
        </li>)}</ol>
        <div className="credentials">
          <article className="research-card">
            <p className="credential-label">Deep learning research</p>
            <p className="research-figure"><strong>89.93%</strong> accuracy on lncRNA-miRNA interaction prediction</p>
            <p>Sequence embeddings and a deep CNN improved accuracy and AUC by 23.5% over the prior result.</p>
          </article>
          <dl className="credential-list">
            <div className="credential-education"><dt>Education</dt><dd>Licentiate in Robotics and Mechatronics Engineering, emphasis in AI &amp; computer vision<span>Tecnológico de Costa Rica</span></dd></div>
            <div><dt>Certifications</dt><dd>Deep Learning Specialization<span>DeepLearning.AI</span></dd><dd>CompTIA Security+<span>CompTIA</span></dd></div>
            <div><dt>Languages</dt><dd>English (C1)<span>Spanish and Russian, native</span></dd></div>
          </dl>
        </div>
        <a className="text-link" href={resumePath} download>Full résumé (PDF) <span aria-hidden="true">↓</span></a>
      </div>
    </section>
  </main>;
}
