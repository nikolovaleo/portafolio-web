/**
 * Homepage content. Every figure here comes from public/Leonardo-Urena-CV.pdf; keep the two in sync.
 */

export const siteUrl = "https://www.leonardo-urena.com";
export const resumePath = "/Leonardo-Urena-CV.pdf";
export const email = "nikolovaleo@gmail.com";
export const links = {
  linkedin: "https://www.linkedin.com/in/nikolovaleo/",
  github: "https://github.com/nikolovaleo",
};

export const availability = "Open to Senior AI/ML Engineer and Lead Data Scientist roles, remote or with relocation.";

/** The four outcomes a reader should see before scrolling. */
export const proof = [
  { value: "25 → 6 min", label: "Average SOC investigation time", detail: "Agentic workflow with RAG and an LLM-as-a-Judge stage" },
  { value: "55%", label: "Less manual review", detail: "Classifier trained on 50,000+ labeled reports, at a 96% true-negative rate" },
  { value: "200K+", label: "Records from 15 sources", detail: "Resolved and linked with PySpark entity-resolution pipelines" },
  { value: "110K+", label: "Identities in 61 countries", detail: "Correlated to cut identity review effort by 70%" },
];

export type FlowStage = { title: string; detail: string; group?: ReadonlyArray<{ title: string; detail: string }> };

export type ProductionSystem = {
  id: string;
  title: string;
  outcome: string;
  body: string;
  evaluation: string;
  /** Label for `evaluation`; defaults to "How it is evaluated". */
  evaluationLabel?: string;
  stack: string[];
  flow?: FlowStage[];
};

export const productionWork: ProductionSystem[] = [
  {
    id: "soc-agent",
    title: "Agentic SOC investigation",
    outcome: "Average investigation time down 75%, from about 25 minutes to 6.",
    body: "A production agentic workflow in which LLM expert agents gather evidence through enterprise APIs and ground their analysis in retrieved procedures and knowledge.",
    evaluation: "A dedicated judge model scores each multi-agent analysis against defined quality criteria before anything is released.",
    stack: ["Python", "Foundry SDK", "Azure Functions", "RAG", "Embeddings", "LLM-as-a-Judge"],
    flow: [
      { title: "Alert", detail: "Investigation starts" },
      { title: "LLM expert agents", detail: "Python on Azure Functions, Foundry SDK" },
      {
        title: "Evidence and context",
        detail: "Called by the agents",
        group: [
          { title: "Enterprise APIs", detail: "Security and IT systems" },
          { title: "Retrieval (RAG)", detail: "Embeddings over procedures" },
        ],
      },
      { title: "LLM-as-a-Judge", detail: "Checks quality before release" },
      { title: "Analyst", detail: "Receives the reviewed analysis" },
    ],
  },
  {
    id: "phishing",
    title: "Phishing report classification",
    outcome: "55% less manual review at a 96% true-negative rate.",
    body: "Classification models trained on 50,000+ labeled historical reports, built through feature engineering, model comparison, and systematic error analysis.",
    evaluation: "False positives, false negatives, and edge cases reviewed; versions compared in MLflow and validated on benchmark datasets before adoption.",
    stack: ["Classification", "Feature engineering", "MLflow", "Error analysis"],
  },
  {
    id: "attack-mapping",
    title: "Fine-tuned incident classifier",
    outcome: "Quarterly Board-level security reporting from weeks of analyst effort to minutes.",
    body: "An LLM fine-tuned on 2,000 to 3,000 analyst-reviewed ServiceNow security incident records maps noisy investigation narratives to MITRE ATT&CK tactics and Cyber Kill Chain stages.",
    evaluation: "Validated on held-out closed incidents, with confusion analyzed across adjacent taxonomy classes before operational use.",
    stack: ["LLM fine-tuning", "MITRE ATT&CK", "Held-out evaluation"],
  },
  {
    id: "entity-resolution",
    title: "Entity resolution and identity analytics",
    outcome: "200,000+ records linked across 15 sources. Identity review effort down 70% across 110,000+ identities in 61 countries.",
    body: "Python, SQL, PySpark, and Databricks pipelines for normalization, entity mapping, deduplication, and reconciliation across heterogeneous enterprise sources.",
    evaluationLabel: "What it found",
    evaluation: "Correlating Active Directory, Workday, ServiceNow, endpoint, and policy data surfaced 1,200+ inconsistencies and exceptions.",
    stack: ["PySpark", "Databricks", "SQL", "Record linkage", "Data quality"],
  },
];

/** One row per lifecycle stage. Stage titles are asserted by tests/portfolio.test.mjs. */
export const capabilities = [
  { title: "Data foundation", detail: "Ingestion, normalization, entity resolution, validation, and feature preparation across heterogeneous enterprise sources.", tools: ["Python", "SQL", "PySpark", "Databricks"] },
  { title: "Modeling", detail: "Classification, deep learning, embeddings, and fine-tuning, with thresholds chosen from error analysis.", tools: ["scikit-learn", "PyTorch", "TensorFlow", "Fine-tuning"] },
  { title: "Generative AI", detail: "Agentic and multi-agent workflows, tool use, and RAG grounded in trusted procedures.", tools: ["Azure AI Foundry", "RAG", "Embeddings", "LangGraph"] },
  { title: "Evaluation", detail: "Ground-truth datasets, baselines, benchmarks, LLM-as-a-Judge, and failure-mode analysis.", tools: ["DeepEval", "LLM-as-a-Judge", "MLflow", "Benchmarks"] },
  { title: "Production", detail: "Serverless services, API integration, CI/CD, and validation against benchmarks before release.", tools: ["Azure Functions", "REST APIs", "Git", "CI/CD"] },
];

export const roles = [
  {
    period: "Since Oct 2023", title: "Lead Cybersecurity Data Scientist", org: "Stryker", place: "Heredia, Costa Rica",
    scope: "Production AI and data systems for security operations, identity analytics, and incident response, on Azure AI Foundry, Azure Functions, Databricks, and MLflow.",
    points: [
      "Architected a production agentic investigation workflow (RAG, expert agents, enterprise APIs) that cut average SOC investigation time by 75%, from about 25 to 6 minutes, with an LLM-as-a-Judge stage checking outputs before release.",
      "Built and evaluated classifiers on 50,000+ labeled historical reports, reducing manual review by 55% at a 96% true-negative rate.",
      "Fine-tuned an LLM on 2,000 to 3,000 analyst-reviewed incident records to map cases to MITRE ATT&CK and Cyber Kill Chain stages, taking Board-level security reporting from weeks to minutes; validated on held-out closed incidents.",
      "Built entity-resolution pipelines linking 200,000+ records from 15 enterprise sources, and correlated 110,000+ identities across 61 countries, cutting identity-review effort by 70%.",
    ],
  },
  {
    period: "Jun 2022 to Oct 2023", title: "DCS Cybersecurity Engineer", org: "Emerson", place: "Escazú, Costa Rica",
    scope: "Security for distributed control systems at energy-generation customers.",
    points: [
      "Led the design and implementation of a configurable hardening solution spanning operating systems, DCS infrastructure, historians, secure protocols, ACLs, and data-loss prevention.",
      "Built automation tools that turned recurring manual procedures into reusable workflows for global production environments.",
    ],
  },
  {
    period: "Jan 2021 to Jan 2022", title: "Computer Researcher", org: "Tecnológico de Costa Rica", place: "Cartago, Costa Rica",
    scope: "Applied deep learning with the University of Costa Rica’s Tumor Chemosensitivity Laboratory.",
    points: [
      "Designed a deep CNN over embedding-based RNA sequence representations for lncRNA-miRNA interaction prediction.",
      "Built laboratory-validated ground-truth datasets and used error analysis to guide model iterations.",
    ],
  },
];
