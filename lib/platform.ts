export type GraphNode = {
  id: string;
  label: string;
  kind: "external" | "asset" | "identity" | "application" | "data";
  criticality: number;
  sourceCount: number;
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  relation: string;
  likelihood: number;
  control: string;
};

export const graphNodes: GraphNode[] = [
  { id: "internet", label: "Internet", kind: "external", criticality: 1, sourceCount: 1 },
  { id: "public-api", label: "Public API", kind: "application", criticality: 3, sourceCount: 4 },
  { id: "riley", label: "Riley Park", kind: "identity", criticality: 3, sourceCount: 3 },
  { id: "fin-lt-042", label: "FIN-LT-042", kind: "asset", criticality: 3, sourceCount: 5 },
  { id: "identity-gw", label: "Identity Gateway", kind: "application", criticality: 4, sourceCount: 4 },
  { id: "finance-app", label: "Finance App", kind: "application", criticality: 5, sourceCount: 4 },
  { id: "warehouse", label: "Data Warehouse", kind: "data", criticality: 5, sourceCount: 5 },
  { id: "backup", label: "Backup Vault", kind: "data", criticality: 5, sourceCount: 3 },
];

export const graphEdges: GraphEdge[] = [
  { id: "e1", from: "internet", to: "public-api", relation: "exposed service", likelihood: .82, control: "WAF policy" },
  { id: "e2", from: "public-api", to: "identity-gw", relation: "service credential", likelihood: .63, control: "secret rotation" },
  { id: "e3", from: "internet", to: "riley", relation: "phishing", likelihood: .71, control: "phishing-resistant MFA" },
  { id: "e4", from: "riley", to: "fin-lt-042", relation: "assigned endpoint", likelihood: .91, control: "EDR isolation" },
  { id: "e5", from: "riley", to: "identity-gw", relation: "active session", likelihood: .74, control: "session revocation" },
  { id: "e6", from: "fin-lt-042", to: "finance-app", relation: "trusted device", likelihood: .66, control: "device compliance" },
  { id: "e7", from: "identity-gw", to: "finance-app", relation: "SSO access", likelihood: .79, control: "conditional access" },
  { id: "e8", from: "finance-app", to: "warehouse", relation: "read/write role", likelihood: .86, control: "least privilege" },
  { id: "e9", from: "warehouse", to: "backup", relation: "replication role", likelihood: .57, control: "network segmentation" },
];

export const remediations = [
  { id: "none", label: "No remediation", removes: [] as string[] },
  { id: "mfa", label: "Enforce phishing-resistant MFA", removes: ["e3"] },
  { id: "rotate", label: "Rotate public API credentials", removes: ["e2"] },
  { id: "least-privilege", label: "Remove warehouse write role", removes: ["e8"] },
  { id: "segment", label: "Segment backup network", removes: ["e9"] },
] as const;

function enumeratePaths(edges: GraphEdge[], start: string, targets: Set<string>) {
  const found: Array<{ ids: string[]; edgeIds: string[]; risk: number }> = [];
  const walk = (current: string, ids: string[], edgeIds: string[], risk: number) => {
    if (ids.length > 1 && targets.has(current)) {
      found.push({ ids, edgeIds, risk: Number((risk * 100).toFixed(1)) });
      return;
    }
    if (ids.length > 7) return;
    for (const edge of edges.filter(item => item.from === current && !ids.includes(item.to))) {
      walk(edge.to, [...ids, edge.to], [...edgeIds, edge.id], risk * edge.likelihood);
    }
  };
  walk(start, [start], [], 1);
  return found.sort((a, b) => b.risk - a.risk);
}

export function analyzeGraph(remediationId = "none") {
  const remediation = remediations.find(item => item.id === remediationId) ?? remediations[0];
  const activeEdges = graphEdges.filter(edge => !remediation.removes.includes(edge.id));
  const baseline = enumeratePaths(graphEdges, "internet", new Set(["warehouse", "backup"]));
  const paths = enumeratePaths(activeEdges, "internet", new Set(["warehouse", "backup"]));
  return {
    nodes: graphNodes,
    edges: activeEdges,
    paths: paths.slice(0, 6).map(path => ({
      ...path,
      labels: path.ids.map(id => graphNodes.find(node => node.id === id)?.label ?? id),
    })),
    remediation,
    summary: {
      paths: paths.length,
      eliminated: baseline.length - paths.length,
      highestRisk: paths[0]?.risk ?? 0,
      sources: 5,
      entities: graphNodes.length,
    },
    entityResolution: {
      canonicalId: "fin-lt-042",
      confidence: .94,
      records: ["EDR: FIN-LT-042", "CMDB: finlt042.corp", "Vulnerability scanner: A-8042"],
      evidence: ["normalized device ID", "shared IP history", "owner agreement", "hostname bigram similarity"],
    },
  };
}

type Sample = { x: number[]; y: 0 | 1; attack: string };

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const featureNames = ["connection rate", "source bytes", "TTL delta", "service entropy", "failed handshakes", "destination fan-out"];
const sigmoid = (value: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));

function createDataset(count: number, seed: number, drift = 0): Sample[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, index) => {
    const attackFamily = index % 5;
    const latent = random();
    const y = (latent > .67 || (attackFamily === 2 && latent > .54) ? 1 : 0) as 0 | 1;
    const shift = drift / 100;
    const noise = () => (random() - .5) * .32;
    const base = y ? .62 : .25;
    const x = [
      base + noise() + shift * .18,
      (y ? .72 : .31) + noise() + shift * .08,
      (y ? .65 : .22) + noise() + shift * .2,
      (y ? .58 : .35) + noise() + shift * .14,
      (y ? .7 : .18) + noise() + shift * .24,
      (y ? .61 : .29) + noise() + shift * .17,
    ].map(value => Math.max(0, Math.min(1, value)));
    return { x, y, attack: y ? ["Exploits", "Reconnaissance", "DoS", "Generic", "Shellcode"][attackFamily] : "Normal" };
  });
}

type Model = { weights: number[]; bias: number };

function trainLogistic(samples: Sample[], featureCount: number): Model {
  const weights = Array(featureCount).fill(0);
  let bias = 0;
  for (let epoch = 0; epoch < 260; epoch++) {
    const gradients = Array(featureCount).fill(0);
    let biasGradient = 0;
    for (const sample of samples) {
      const probability = sigmoid(bias + weights.reduce((sum, weight, index) => sum + weight * sample.x[index], 0));
      const error = probability - sample.y;
      biasGradient += error;
      for (let index = 0; index < featureCount; index++) gradients[index] += error * sample.x[index];
    }
    const rate = .85 / samples.length;
    bias -= rate * biasGradient;
    for (let index = 0; index < featureCount; index++) weights[index] -= rate * (gradients[index] + .012 * weights[index]);
  }
  return { weights, bias };
}

function predict(model: Model, sample: Sample) {
  return sigmoid(model.bias + model.weights.reduce((sum, weight, index) => sum + weight * sample.x[index], 0));
}

function metrics(samples: Sample[], model: Model, threshold: number) {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const sample of samples) {
    const positive = predict(model, sample) >= threshold;
    if (positive && sample.y) tp++; else if (positive) fp++; else if (sample.y) fn++; else tn++;
  }
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  return {
    precision, recall, f1: 2 * precision * recall / Math.max(.0001, precision + recall),
    falsePositiveRate: fp / Math.max(1, fp + tn), confusion: { tp, fp, tn, fn },
  };
}

function psi(reference: number[], current: number[]) {
  const bins = 10;
  let score = 0;
  for (let index = 0; index < bins; index++) {
    const low = index / bins, high = (index + 1) / bins;
    const a = Math.max(.001, reference.filter(value => value >= low && (index === bins - 1 ? value <= high : value < high)).length / reference.length);
    const b = Math.max(.001, current.filter(value => value >= low && (index === bins - 1 ? value <= high : value < high)).length / current.length);
    score += (b - a) * Math.log(b / a);
  }
  return score;
}

const training = createDataset(1400, 4815);
const baselineModel = trainLogistic(training, 2);
const championModel = trainLogistic(training, featureNames.length);

export function runModelLab(drift = 25, threshold = .55, sampleIndex = 12) {
  const reference = createDataset(600, 9301);
  const current = createDataset(600, 9301, drift);
  const selected = current[Math.max(0, Math.min(current.length - 1, sampleIndex))];
  const selectedProbability = predict(championModel, selected);
  const referenceScores = reference.map(sample => predict(championModel, sample));
  const currentScores = current.map(sample => predict(championModel, sample));
  const championMetrics = metrics(current, championModel, threshold);
  const baselineMetrics = metrics(current, baselineModel, threshold);
  const driftScore = psi(referenceScores, currentScores);
  return {
    dataset: { name: "UNSW-NB15-inspired public-safe benchmark", trainRows: training.length, testRows: current.length, features: featureNames.length, seed: 4815 },
    controls: { drift, threshold },
    models: [
      { name: "2-feature baseline", ...baselineMetrics },
      { name: "6-feature logistic champion", ...championMetrics },
    ].map(item => ({ ...item, precision: Number(item.precision.toFixed(3)), recall: Number(item.recall.toFixed(3)), f1: Number(item.f1.toFixed(3)), falsePositiveRate: Number(item.falsePositiveRate.toFixed(3)) })),
    metrics: { ...championMetrics, precision: Number(championMetrics.precision.toFixed(3)), recall: Number(championMetrics.recall.toFixed(3)), f1: Number(championMetrics.f1.toFixed(3)), falsePositiveRate: Number(championMetrics.falsePositiveRate.toFixed(3)), psi: Number(driftScore.toFixed(3)), driftStatus: driftScore >= .25 ? "ACTION" : driftScore >= .1 ? "WATCH" : "STABLE" },
    sample: {
      index: sampleIndex, label: selected.attack, probability: Number(selectedProbability.toFixed(3)), decision: selectedProbability >= threshold ? "Investigate" : "Allow",
      contributions: featureNames.map((feature, index) => ({ feature, value: Number(selected.x[index].toFixed(3)), contribution: Number((championModel.weights[index] * selected.x[index]).toFixed(3)) })).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    },
    model: { type: "L2-regularized logistic regression", epochs: 260, weights: championModel.weights.map(value => Number(value.toFixed(3))) },
  };
}

export const incidentCases = {
  identity: { id: "INC-2408", label: "Identity takeover", user: "riley.park", host: "FIN-LT-042", indicator: "203.0.113.44" },
  cloud: { id: "INC-2411", label: "Cloud data access", user: "service.finance", host: "PUBLIC-API", indicator: "198.51.100.18" },
  malware: { id: "INC-2417", label: "Endpoint execution", user: "alex.chen", host: "ENG-LT-117", indicator: "malware-cache.example" },
} as const;

const knowledge = [
  { id: "SOP-04", title: "Identity compromise procedure", concepts: ["identity", "session", "mfa", "contain"], text: "Revoke active sessions, reset credentials, inspect MFA methods, preserve timestamps, and isolate endpoints when execution evidence is present." },
  { id: "SOP-09", title: "Cloud credential procedure", concepts: ["cloud", "credential", "data", "contain"], text: "Disable the exposed service credential, rotate dependent secrets, review data access, and preserve cloud audit logs before remediation." },
  { id: "SOP-12", title: "Endpoint malware procedure", concepts: ["malware", "endpoint", "process", "contain"], text: "Isolate the endpoint, capture process and network evidence, block confirmed indicators, and scope related devices before reimaging." },
  { id: "EVAL-01", title: "Evidence quality policy", concepts: ["evidence", "citation", "confidence"], text: "Every material claim must cite a returned tool record. Missing evidence must produce an explicit abstention rather than an inferred fact." },
];

const toolRegistry = {
  identity_lookup: (incident: typeof incidentCases[keyof typeof incidentCases]) => ({ source: "Identity", record: `${incident.user} had three denied pushes followed by a successful authentication from a new network.` }),
  endpoint_timeline: (incident: typeof incidentCases[keyof typeof incidentCases]) => ({ source: "Endpoint", record: `${incident.host} launched a suspicious child process and contacted ${incident.indicator}.` }),
  threat_intel: (incident: typeof incidentCases[keyof typeof incidentCases]) => ({ source: "Threat intel", record: `${incident.indicator} is newly observed in this synthetic environment and has no trusted business association.` }),
  asset_context: (incident: typeof incidentCases[keyof typeof incidentCases]) => ({ source: "Atlas Graph", record: `${incident.host} has a graph path to the Finance App and Data Warehouse.` }),
};

export function investigateIncident(caseId: keyof typeof incidentCases = "identity", question = "What happened and what should we do next?", approved = false) {
  const incident = incidentCases[caseId] ?? incidentCases.identity;
  const started = Date.now();
  const toolCalls = Object.entries(toolRegistry).map(([tool, handler]) => ({ tool, status: "complete", output: handler(incident) }));
  const query = `${question} ${incident.label}`.toLowerCase();
  const ranked = knowledge.map(document => {
    const lexical = document.concepts.filter(term => query.includes(term)).length;
    const caseBoost = caseId === "identity" && document.id === "SOP-04" || caseId === "cloud" && document.id === "SOP-09" || caseId === "malware" && document.id === "SOP-12" ? 2 : 0;
    const evidenceBoost = document.id === "EVAL-01" ? .5 : 0;
    return { ...document, score: lexical + caseBoost + evidenceBoost };
  }).sort((a, b) => b.score - a.score).slice(0, 2);
  const procedure = ranked[0];
  const citations = [
    ...toolCalls.map((call, index) => ({ id: `T${index + 1}`, title: call.output.source, excerpt: call.output.record, score: 1 })),
    ...ranked.map(document => ({ id: document.id, title: document.title, excerpt: document.text, score: document.score })),
  ];
  const proposal = caseId === "cloud" ? "Rotate the service credential and revoke dependent sessions" : caseId === "malware" ? `Isolate ${incident.host} and block ${incident.indicator}` : `Revoke sessions for ${incident.user} and isolate ${incident.host}`;
  const answer = `${incident.label} is supported by correlated identity, endpoint, threat-intelligence, and graph context [T1–T4]. ${procedure.text} [${procedure.id}]`;
  const checks = [
    { name: "Required tools completed", passed: toolCalls.length === 4 && toolCalls.every(call => call.status === "complete") },
    { name: "Claims have citations", passed: answer.includes("[T1–T4]") && answer.includes(`[${procedure.id}]`) },
    { name: "Containment requires approval", passed: !approved },
    { name: "Evidence sources are distinct", passed: new Set(toolCalls.map(call => call.output.source)).size === 4 },
    { name: "Procedure retrieved", passed: procedure.score > 0 },
  ];
  return {
    incident, question, answer, toolCalls, citations, proposal,
    action: { status: approved ? "executed" : "awaiting_approval", detail: approved ? `${proposal}. Synthetic action recorded; no external system was changed.` : proposal },
    trace: [
      { agent: "Triage planner", status: "complete", detail: `Selected four read-only tools for ${incident.id}.` },
      { agent: "Tool executor", status: "complete", detail: "Validated inputs and executed identity, endpoint, intelligence, and graph tools." },
      { agent: "Hybrid retriever", status: "complete", detail: `Ranked ${knowledge.length} procedures with lexical, concept, and incident-context signals.` },
      { agent: "Evidence synthesizer", status: "complete", detail: "Produced a structured conclusion from returned records and SOP evidence." },
      { agent: "Policy gate", status: approved ? "complete" : "waiting", detail: approved ? "Human approval received; synthetic action executed." : "Paused before containment until a human approves." },
    ],
    evaluation: { score: checks.filter(check => check.passed).length, total: checks.length, checks },
    meta: { latencyMs: Date.now() - started, orchestration: "bounded state machine", retrieval: "hybrid lexical + concept reranking", model: "deterministic public demo", synthetic: true },
  };
}
