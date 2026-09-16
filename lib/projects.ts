export const projects = [
  {
    slug: "atlas", name: "Atlas Graph", accent: "cyan", category: "Knowledge graph · Data engineering", endpoint: "graph",
    summary: "Resolve fragmented security records, calculate attack paths, and test which remediation removes the most risk.",
    facts: ["5 connected sources", "Attack-path search", "What-if remediation"],
    problem: "Security tools describe the same users, devices, services, and findings with different identifiers. Without trustworthy identity and relationships, downstream analytics produce duplicate alerts and misleading attack paths.",
    approach: "Resolve representative source records into canonical entities with confidence and lineage, construct a directed security graph, and enumerate paths from an exposed entry point to critical data. Every edge carries a relationship, likelihood, and mitigating control.",
    baseline: "The baseline graph uses exact identifiers and all observed edges. The enhanced pipeline links noisy records using multiple matching signals and preserves the evidence behind the canonical entity.",
    measurement: "The live API reports the number of reachable critical paths, maximum path risk, paths removed by each remediation, source coverage, and entity-resolution evidence. Path risk is the product of edge likelihoods, not a probability of compromise.",
    failure: "Missing telemetry can hide edges; stale access data can create paths that no longer exist; and correlated edge assumptions can make multiplicative risk optimistic. Entity confidence is illustrative and must be calibrated on labeled pairs before production use.",
    production: "Process source snapshots with Spark, store the versioned graph in a graph database, learn entity-resolution weights from reviewed pairs, enforce field-level lineage, and validate proposed attack paths with asset owners before driving remediation."
  },
  {
    slug: "sentinel", name: "Sentinel ModelOps", accent: "lime", category: "Machine learning · MLOps", endpoint: "monitor",
    summary: "Train, compare, explain, and stress-test an intrusion classifier under changing data and decision costs.",
    facts: ["2,000 fitted samples", "Champion vs baseline", "Drift & explanations"],
    problem: "A classifier can look strong at a default threshold while producing unacceptable false positives, failing on shifted traffic, or hiding which inputs drive individual decisions.",
    approach: "Fit two L2-regularized logistic models on a reproducible public-safe benchmark inspired by the UNSW-NB15 feature domain. Compare a two-feature baseline with a six-feature champion, then rescore a fixed test population under controlled covariate shift.",
    baseline: "The baseline is trained with two traffic features; the champion uses all six. Both are evaluated on the same 600 labeled samples, with the same threshold and drift controls, so the comparison is reproducible.",
    measurement: "Precision, recall, F1, false-positive rate, confusion counts, PSI, fitted weights, and per-example logit contributions are calculated by the live endpoint. The source rows are generated and synthetic; results are not claims about the official UNSW-NB15 benchmark.",
    failure: "Synthetic features simplify real network behavior, PSI is sensitive to binning, and covariate drift does not necessarily imply quality loss. Linear contributions are explanations of this model—not causal effects.",
    production: "Train on licensed source data with a temporal split, add calibration and attack-family slice metrics, log artifacts and data versions in MLflow, monitor delayed labels, and define champion–challenger rollback criteria."
  },
  {
    slug: "aegis", name: "Aegis Investigator", accent: "violet", category: "Agentic AI · Retrieval · Evaluation", endpoint: "agent",
    summary: "A bounded investigation agent that calls security tools, retrieves procedures, cites evidence, and pauses before containment.",
    facts: ["4 typed tools", "Hybrid retrieval", "Human approval gate"],
    problem: "Incident evidence is spread across identity, endpoint, threat-intelligence, asset, and procedure systems. An assistant must assemble it quickly without inventing facts or executing containment without authorization.",
    approach: "A typed state machine plans four read-only tool calls, validates their outputs, retrieves the most relevant procedure with lexical and concept signals, creates a cited conclusion, evaluates the run, and stops at a human approval gate before any synthetic action.",
    baseline: "The prior portfolio demo used BM25 and extractive answers only. This version adds tool orchestration, graph context, incident-specific reranking, structured state, run-level checks, and an explicit action policy.",
    measurement: "Every run exposes tool inputs and outputs, procedure ranking, citations, latency, five deterministic evaluation checks, and approval state. This public deployment uses a deterministic planner for reproducibility; it does not claim autonomous LLM reasoning.",
    failure: "The tool registry and cases are intentionally bounded. A deterministic planner cannot handle arbitrary incidents, while a model-driven planner would introduce nondeterminism, prompt injection, cost, and new evaluation requirements.",
    production: "Connect an approved model for structured planning and grounded synthesis, expose access-controlled MCP tools, trace model and tool events, add adversarial test cases, enforce per-tool authorization, and compare model quality against this deterministic baseline."
  },
] as const;
