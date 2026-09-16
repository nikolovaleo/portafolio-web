import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { projects } from "@/lib/projects";
export default function Home() {
  return <main id="content"><SiteNav />
    <header className="hero personal-hero">
      <div className="hero-copy"><p className="kicker">Leonardo Ureña Nikolova · AI &amp; Data Science</p>
        <h1>Intelligent systems.<br /><em>Built end to end.</em></h1>
        <p className="hero-role">Lead Cybersecurity Data Scientist · AI/ML Engineer</p>
        <p className="hero-intro">I turn complex data into production AI systems—from pipelines and models to RAG, agents, evaluation, APIs, and monitoring.</p>
        <div className="hero-actions"><a className="button-link primary-link" href="#labs">Explore my projects ↗</a><a className="button-link secondary-link" href="/Leonardo-Urena-CV.pdf" download>Download résumé ↓</a><a className="text-link" href="https://github.com/nikolovaleo" target="_blank" rel="noreferrer">GitHub ↗</a></div>
        <div className="hero-specialties" aria-label="Core specialties"><span>Machine learning</span><span>Agentic AI</span><span>RAG systems</span><span>Data platforms</span><span>ML evaluation</span></div>
      </div>
      <figure className="hero-portrait"><img src="/leonardo-urena-portrait.jpg" width="640" height="1147" alt="Leonardo Ureña Nikolova" fetchPriority="high" /><figcaption><strong>Production-minded AI</strong><span>Research depth · Engineering discipline · Measurable outcomes</span></figcaption></figure>
    </header>
    <section className="impact-section" aria-labelledby="impact-title">
      <div className="impact-heading"><p className="kicker">Selected professional impact</p><h2 id="impact-title">Work measured by outcomes,<br />not model names.</h2></div>
      <div className="impact-grid">
        <article><strong>25 → 6 min</strong><span>SOC investigation time</span><p>Agentic investigation workflow with RAG, specialist agents, API orchestration, and evaluation.</p></article>
        <article><strong>55%</strong><span>less manual review</span><p>Email classifier developed from more than 50,000 historical user reports.</p></article>
        <article><strong>200K+</strong><span>assets unified</span><p>Fifteen enterprise security sources normalized for correlation and attack-path analysis.</p></article>
        <article><strong>Weeks → minutes</strong><span>board reporting</span><p>Fine-tuned incident classifier mapping cases to MITRE ATT&amp;CK and Cyber Kill Chain stages.</p></article>
      </div>
      <p className="impact-note">Professional outcomes are summarized at a non-confidential level. The interactive projects below are separate personal builds using synthetic data.</p>
    </section>
    <section className="ai-practice" id="expertise" aria-labelledby="expertise-title">
      <div className="practice-intro"><p className="kicker">AI / Data Science practice</p><h2 id="expertise-title">The complete system,<br />not just the model.</h2><p>I work across the lifecycle because production quality is determined as much by data, evaluation, and delivery as it is by model choice.</p></div>
      <div className="lifecycle" aria-label="End-to-end AI delivery lifecycle">
        <article><span>01</span><div><h3>Data foundation</h3><p>Ingestion, normalization, entity resolution, feature engineering, and scalable processing.</p><strong>Python · SQL · PySpark · Databricks</strong></div></article>
        <article><span>02</span><div><h3>Modeling</h3><p>Classification, anomaly detection, deep learning, embeddings, and threshold design.</p><strong>PyTorch · TensorFlow · scikit-learn</strong></div></article>
        <article><span>03</span><div><h3>Generative AI</h3><p>Grounded RAG, re-ranking, fine-tuning, tool use, and multi-step agent workflows.</p><strong>LLMs · Vector search · LangGraph</strong></div></article>
        <article><span>04</span><div><h3>Evaluation</h3><p>Task-specific metrics, retrieval benchmarks, error analysis, judges, drift, and guardrails.</p><strong>MLflow · Offline evals · Observability</strong></div></article>
        <article><span>05</span><div><h3>Production</h3><p>APIs, event-driven services, CI/CD, scalable inference, and operational monitoring.</p><strong>Azure · Docker · FastAPI · Functions</strong></div></article>
      </div>
    </section>
    <section className="selected-work" id="labs" aria-labelledby="work-title">
      <div className="work-heading"><div><p className="kicker">AI Security Intelligence Platform</p><h2 id="work-title">One system. Three layers of proof.</h2></div><p>Atlas creates trusted context, Sentinel detects risk, and Aegis investigates with tools and evidence. Every result is produced by a live endpoint and exposes its assumptions.</p></div>
      <div className="platform-flow" aria-label="Connected platform architecture"><div><span>01</span><strong>Atlas Graph</strong><small>Trusted entities and paths</small></div><i>→</i><div><span>02</span><strong>Sentinel ModelOps</strong><small>Risk scoring and monitoring</small></div><i>→</i><div><span>03</span><strong>Aegis Investigator</strong><small>Evidence and approved action</small></div></div>
      <div className="project-cards">{projects.map((project, index) => <article className={`project-summary accent-${project.accent}`} key={project.slug}>
        <div className="summary-top"><span>0{index + 1}</span><span>{project.category}</span></div><h3><a href={`/projects/${project.slug}`}>{project.name}</a></h3><p>{project.summary}</p><div className="summary-facts">{project.facts.map(fact => <span key={fact}>{fact}</span>)}</div><a className="project-open" href={`/projects/${project.slug}`}>Try the demo & read the case study <span>↗</span></a>
      </article>)}</div>
    </section>
    <section className="about-section" id="about" aria-labelledby="about-title">
      <div><p className="kicker">About</p><h2 id="about-title">An engineering foundation.<br />An applied AI focus.</h2><p>I’m a mechatronics engineer with an emphasis in artificial intelligence and computer vision. My work connects cybersecurity, data engineering, and machine learning—from research and experimentation to deployment and monitoring.</p><p>These personal projects make my engineering choices visible. Professional experience is summarized below; the demos are original, synthetic examples.</p><a className="text-link" href="/Leonardo-Urena-CV.pdf" download>Full résumé ↓</a></div>
      <div className="experience-list" aria-label="Experience timeline">
        <article><time>Oct 2023 — present</time><h3>Lead Cybersecurity Data Scientist</h3><strong>Stryker</strong><p>Production AI, data engineering, evaluation, and automation supporting cybersecurity operations.</p></article>
        <article><time>Jun 2022 — Oct 2023</time><h3>DCS Cybersecurity Engineer</h3><strong>Emerson</strong><p>Industrial control systems, security hardening, engineering automation, and production troubleshooting.</p></article>
        <article><time>Jan 2021 — Jan 2022</time><h3>Computer Researcher</h3><strong>Tecnológico de Costa Rica</strong><p>Applied deep learning for biological interaction prediction, feature engineering, and model evaluation.</p></article>
      </div>
    </section>
    <section className="research-callout" aria-labelledby="research-title"><div><p className="kicker">Deep learning research</p><h2 id="research-title">89.93% accuracy on biological sequence prediction.</h2></div><p>At Tecnológico de Costa Rica, I developed sequence embeddings and a deep CNN to predict lncRNA–miRNA interactions, improving the prior result by 23.5%. It is the research foundation behind how I approach representation learning, experiments, and model evaluation today.</p></section>
    <SiteFooter />
  </main>;
}
