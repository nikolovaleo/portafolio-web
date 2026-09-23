import HomeLabs from "@/components/home-labs";
import { ProjectLab } from "@/components/labs/project-lab";
import { projects } from "@/lib/projects";

const specialties = ["Machine learning", "Agentic AI", "RAG systems", "Data platforms", "ML evaluation"];

const impact = [
  { value: "25 → 6 min", label: "SOC investigation time", detail: "Agentic investigation workflow with RAG, specialist agents, API orchestration, and evaluation." },
  { value: "55%", label: "less manual review", detail: "Email classifier developed from more than 50,000 historical user reports." },
  { value: "200K+", label: "assets unified", detail: "Fifteen enterprise security sources normalized for correlation and attack-path analysis." },
  { value: "Weeks → minutes", label: "board reporting", detail: "Fine-tuned incident classifier mapping cases to MITRE ATT&CK and Cyber Kill Chain stages." },
];

const practice = [
  { title: "Data foundation", detail: "Ingestion, normalization, entity mapping, validation, and feature preparation across heterogeneous sources.", tools: "Python · SQL · PySpark · Databricks" },
  { title: "Modeling", detail: "Classification, deep learning, embeddings, and threshold design grounded in error analysis.", tools: "scikit-learn · PyTorch · TensorFlow" },
  { title: "Generative AI", detail: "Grounded RAG, tool use, and multi-agent workflows that retrieve trusted procedures and context.", tools: "LLMs · RAG · LangGraph · Azure AI Foundry" },
  { title: "Evaluation", detail: "Ground-truth datasets, baselines, benchmarking, LLM-as-a-Judge, and failure-mode analysis.", tools: "MLflow · Benchmarks · Error analysis" },
  { title: "Production", detail: "Serverless services, API integration, CI/CD, and monitoring for reliable delivery.", tools: "Azure Functions · REST APIs · Git · CI/CD" },
];

const roles = [
  { period: "Oct 2023 — Present", title: "Lead Cybersecurity Data Scientist", org: "Stryker", detail: "Production AI, data engineering, evaluation, and automation for security operations, identity analytics, cyber hygiene, and incident response." },
  { period: "Jun 2022 — Oct 2023", title: "DCS Cybersecurity Engineer", org: "Emerson", detail: "Security hardening for distributed control systems, engineering automation, and production troubleshooting for energy-generation customers." },
  { period: "Jan 2021 — Jan 2022", title: "Computer Researcher", org: "Tecnológico de Costa Rica", detail: "Applied deep learning for lncRNA–miRNA interaction prediction with the University of Costa Rica’s Tumor Chemosensitivity Laboratory." },
];

export default function Home() {
  return <main id="content">
    <header className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">Leonardo Ureña Nikolova · AI &amp; Data Science</p>
          <h1>Intelligent systems.<br /><em>Built end to end.</em></h1>
          <p className="hero-role">Lead Cybersecurity Data Scientist · AI/ML Engineer</p>
          <p className="hero-intro">I turn complex data into production AI systems, from pipelines and models to RAG, agents, evaluation, APIs, and monitoring.</p>
          <div className="hero-actions">
            <a className="button" href="#labs">Try the live labs <span aria-hidden="true">→</span></a>
            <a className="button button-outline" href="/Leonardo-Urena-CV.pdf" download>Download résumé <span aria-hidden="true">↓</span></a>
            <a className="text-link" href="https://github.com/nikolovaleo" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
            <a className="text-link" href="https://www.linkedin.com/in/nikolovaleo/" target="_blank" rel="noreferrer">LinkedIn <span aria-hidden="true">↗</span></a>
          </div>
          <ul className="hero-specialties" aria-label="Core specialties">{specialties.map(item => <li key={item}>{item}</li>)}</ul>
        </div>
        <figure className="hero-portrait">
          <img src="/leonardo-urena-portrait.jpg" width="640" height="1147" alt="Portrait of Leonardo Ureña Nikolova" fetchPriority="high" />
          <figcaption><strong>5+ years</strong> across AI, machine learning, data engineering, and research<span>Escazú, Costa Rica</span></figcaption>
        </figure>
      </div>
    </header>

    <section className="section impact" aria-labelledby="impact-title">
      <div className="container">
        <div className="section-head">
          <div><p className="eyebrow">Selected professional impact</p><h2 id="impact-title">Work measured by outcomes,<br />not model names.</h2></div>
          <p className="section-lede">Professional outcomes are summarized at a non-confidential level. The interactive labs below are separate personal builds on synthetic data.</p>
        </div>
        <ul className="impact-grid">{impact.map(item => <li key={item.value}><strong>{item.value}</strong><span>{item.label}</span><p>{item.detail}</p></li>)}</ul>
      </div>
    </section>

    <section className="section labs" id="labs" aria-labelledby="labs-title">
      <div className="container">
        <div className="section-head">
          <div><p className="eyebrow">Interactive labs · security intelligence and applied ML</p><h2 id="labs-title">Working systems, not screenshots.</h2></div>
          <div>
            <p className="section-lede">Each card is the situation behind the lab. The first three are one security platform: trusted records, a monitored model, and an investigation that waits for approval. Hermes and Prism apply that same bar to email triage and search changes. Every control calls a live API.</p>
            <p className="disclosure"><span>Personal projects</span><span>Synthetic, public-safe data</span><span>Not employer systems</span></p>
          </div>
        </div>
        <HomeLabs
          labs={projects.map(({ slug, name, context, accent, summary, group }) => ({ slug, name, tagline: context, accent, summary, group }))}
          panels={projects.map(project => <ProjectLab key={project.slug} slug={project.slug} variant="compact" />)}
        />
      </div>
    </section>

    <section className="section practice" id="expertise" aria-labelledby="expertise-title">
      <div className="container">
        <div className="section-head">
          <div><p className="eyebrow">AI / Data Science practice</p><h2 id="expertise-title">The complete system,<br />not just the model.</h2></div>
          <p className="section-lede">Production quality depends as much on data, evaluation, and delivery as on model choice, so I work across the whole lifecycle.</p>
        </div>
        <ol className="practice-grid">{practice.map((stage, index) => <li key={stage.title}>
          <span>0{index + 1}</span><h3>{stage.title}</h3><p>{stage.detail}</p><small>{stage.tools}</small>
        </li>)}</ol>
      </div>
    </section>

    <section className="section experience" id="experience" aria-labelledby="experience-title">
      <div className="container experience-grid">
        <div className="experience-intro">
          <p className="eyebrow">Experience</p>
          <h2 id="experience-title">An engineering foundation.<br />An applied AI focus.</h2>
          <p>I’m a robotics and mechatronics engineer with an emphasis in artificial intelligence and computer vision. My work connects cybersecurity, data engineering, and machine learning, from research and experimentation to deployment and monitoring.</p>
          <a className="text-link" href="/Leonardo-Urena-CV.pdf" download>Full résumé (PDF) <span aria-hidden="true">↓</span></a>
        </div>
        <ol className="timeline">{roles.map(role => <li key={role.title}>
          <p className="timeline-period">{role.period}</p>
          <h3>{role.title}</h3>
          <p className="timeline-org">{role.org}</p>
          <p>{role.detail}</p>
        </li>)}</ol>
      </div>
      <div className="container credentials">
        <article className="research-card">
          <p className="eyebrow">Deep learning research</p>
          <p className="research-figure"><strong>89.93%</strong> accuracy on lncRNA–miRNA interaction prediction</p>
          <p>Sequence embeddings and a deep CNN improved accuracy and AUC by 23.5% over the prior result.</p>
        </article>
        <dl className="credential-list">
          <div className="credential-education"><dt>Education</dt><dd>Licentiate in Robotics and Mechatronics Engineering, emphasis in AI &amp; computer vision<span>Tecnológico de Costa Rica</span></dd></div>
          <div><dt>Certifications</dt><dd>Deep Learning Specialization<span>DeepLearning.AI</span></dd><dd>CompTIA Security+<span>CompTIA</span></dd></div>
          <div><dt>Languages</dt><dd>English (C1) · Spanish · Russian</dd></div>
        </dl>
      </div>
    </section>
  </main>;
}
