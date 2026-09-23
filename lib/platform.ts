import { matchDecision, scoreRecordPair, type AssetRecord } from "./entity-resolution";
import { mulberry32 } from "./random";

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

export const sourceSystems = ["EDR", "CMDB", "Vulnerability scanner", "Identity provider", "Cloud audit logs"] as const;

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

export const remediations: ReadonlyArray<{ id: string; label: string; removes: readonly string[] }> = [
  { id: "none", label: "No remediation", removes: [] },
  { id: "mfa", label: "Enforce phishing-resistant MFA", removes: ["e3"] },
  { id: "rotate", label: "Rotate public API credentials", removes: ["e2"] },
  { id: "least-privilege", label: "Remove warehouse write role", removes: ["e8"] },
  { id: "segment", label: "Segment backup network", removes: ["e9"] },
];

const entryPoint = "internet";
const criticalTargets = new Set(["warehouse", "backup"]);

/** Every simple path from the entry point to each critical target. Paths continue through a target to reach the next one. */
function enumeratePaths(edges: GraphEdge[]) {
  const found: Array<{ ids: string[]; edgeIds: string[]; risk: number }> = [];
  const walk = (current: string, ids: string[], edgeIds: string[], risk: number) => {
    if (ids.length > 1 && criticalTargets.has(current)) {
      found.push({ ids, edgeIds, risk: Number((risk * 100).toFixed(1)) });
    }
    if (ids.length > 7) return;
    for (const edge of edges.filter(item => item.from === current && !ids.includes(item.to))) {
      walk(edge.to, [...ids, edge.to], [...edgeIds, edge.id], risk * edge.likelihood);
    }
  };
  walk(entryPoint, [entryPoint], [], 1);
  return found.sort((a, b) => b.risk - a.risk);
}

const baselinePaths = enumeratePaths(graphEdges);

const deviceRecords: Array<{ source: string; record: AssetRecord }> = [
  { source: "EDR", record: { hostname: "FIN-LT-042", deviceId: "D-8042", ip: "10.20.4.42", owner: "Riley Park", os: "Windows 11 Enterprise" } },
  { source: "CMDB", record: { hostname: "finlt042.corp.example", deviceId: "D-8042", ip: "10.20.4.42", owner: "Park, Riley", os: "Windows 11 Enterprise" } },
  { source: "Vulnerability scanner", record: { hostname: "fin-lt-042", ip: "10.20.4.42", owner: "riley.park", os: "Windows 11 Enterprise" } },
];
const matchThreshold = .72;

function resolveCanonicalDevice() {
  const [anchor, ...others] = deviceRecords;
  const candidates = others.map(({ source, record }) => {
    const { score, features } = scoreRecordPair(anchor.record, record);
    return { source, record, score, decision: matchDecision(score, matchThreshold), features };
  });
  return {
    canonicalId: "fin-lt-042",
    label: "FIN-LT-042",
    method: "weighted field comparison (hand-set weights)",
    threshold: matchThreshold,
    reviewFloor: Number((matchThreshold - .12).toFixed(2)),
    anchor,
    candidates,
    linked: 1 + candidates.filter(candidate => candidate.decision === "MATCH").length,
  };
}

export function analyzeGraph(remediationId = "none") {
  const remediation = remediations.find(item => item.id === remediationId) ?? remediations[0];
  const removed = new Set(remediation.removes);
  const activeEdges = graphEdges.filter(edge => !removed.has(edge.id));
  const paths = enumeratePaths(activeEdges);
  return {
    nodes: graphNodes,
    edges: graphEdges.map(edge => ({ ...edge, active: !removed.has(edge.id) })),
    paths: paths.slice(0, 6).map(path => ({
      ...path,
      labels: path.ids.map(id => graphNodes.find(node => node.id === id)?.label ?? id),
    })),
    remediation,
    summary: {
      paths: paths.length,
      baselinePaths: baselinePaths.length,
      eliminated: baselinePaths.length - paths.length,
      highestRisk: paths[0]?.risk ?? 0,
      baselineHighestRisk: baselinePaths[0]?.risk ?? 0,
      sources: sourceSystems.length,
      entities: graphNodes.length,
      activeEdges: activeEdges.length,
    },
    entityResolution: resolveCanonicalDevice(),
  };
}

type Sample = { x: number[]; y: 0 | 1; attack: string };

const featureNames = ["connection rate", "source bytes", "TTL delta", "service entropy", "failed handshakes", "destination fan-out"];
const sigmoid = (value: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));

const normalMeans = [.40, .38, .30, .42, .24, .33];
const attackMeans = [.56, .52, .58, .55, .54, .52];
const driftShift = [.18, .08, .2, .14, .24, .17];

// Class distributions overlap and some attacks are low-and-slow, so no model separates them perfectly.
function createDataset(count: number, seed: number, drift = 0): Sample[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, (_, index) => {
    const attackFamily = index % 5;
    const latent = random();
    const y = (latent > .67 || (attackFamily === 2 && latent > .54) ? 1 : 0) as 0 | 1;
    const stealth = y && random() < .2 ? .55 : 0;
    const shift = drift / 100;
    const noise = () => (random() + random() - 1) * .4;
    const x = normalMeans.map((normal, feature) => {
      const mean = y ? attackMeans[feature] - (attackMeans[feature] - normal) * stealth : normal;
      return Math.max(0, Math.min(1, mean + noise() + shift * driftShift[feature]));
    });
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

function histogram(scores: number[], bins = 10) {
  const counts: number[] = Array(bins).fill(0);
  for (const score of scores) counts[Math.min(bins - 1, Math.floor(score * bins))]++;
  return counts;
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
    distribution: { bins: 10, reference: histogram(referenceScores), current: histogram(currentScores) },
    sample: {
      index: sampleIndex, label: selected.attack, probability: Number(selectedProbability.toFixed(3)), decision: selectedProbability >= threshold ? "Investigate" : "Allow",
      contributions: featureNames.map((feature, index) => ({ feature, value: Number(selected.x[index].toFixed(3)), contribution: Number((championModel.weights[index] * selected.x[index]).toFixed(3)) })).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)),
    },
    model: { type: "L2-regularized logistic regression", epochs: 260, features: featureNames, weights: championModel.weights.map(value => Number(value.toFixed(3))), bias: Number(championModel.bias.toFixed(3)) },
  };
}

type ToolName = "identity_lookup" | "endpoint_timeline" | "threat_intel" | "asset_context";

const toolOrder: ToolName[] = ["identity_lookup", "endpoint_timeline", "threat_intel", "asset_context"];
const toolSources: Record<ToolName, string> = {
  identity_lookup: "Identity",
  endpoint_timeline: "Endpoint",
  threat_intel: "Threat intel",
  asset_context: "Atlas Graph",
};

export const incidentCases = {
  identity: {
    id: "INC-2408", label: "Identity takeover", user: "riley.park", host: "FIN-LT-042", indicator: "203.0.113.44", procedure: "SOP-04",
    records: {
      identity_lookup: "riley.park denied three MFA push prompts, then signed in from 203.0.113.44, a network not seen for this user in 90 days.",
      endpoint_timeline: "FIN-LT-042 launched an unsigned child process from the browser and contacted 203.0.113.44 four minutes after the sign-in.",
      threat_intel: "203.0.113.44 is newly observed in this synthetic environment and has no trusted business association.",
      asset_context: "FIN-LT-042 reaches the Finance App and Data Warehouse through a trusted-device path.",
    },
    findings: [
      { text: "The account shows MFA fatigue followed by a sign-in from an unfamiliar network", cites: ["T1"] },
      { text: "The user's assigned laptop then ran an unsigned process that contacted the same untrusted address", cites: ["T2", "T3"] },
      { text: "The laptop has a path to finance data, which raises the impact of the compromise", cites: ["T4"] },
    ],
    proposal: "Revoke sessions for riley.park and isolate FIN-LT-042",
  },
  cloud: {
    id: "INC-2411", label: "Cloud data access", user: "service.finance", host: "PUBLIC-API", indicator: "198.51.100.18", procedure: "SOP-09",
    records: {
      identity_lookup: "service.finance issued tokens to 198.51.100.18, outside the service's approved deployment range.",
      endpoint_timeline: "PUBLIC-API made 1,240 Data Warehouse read calls in ten minutes using the service credential.",
      threat_intel: "198.51.100.18 belongs to a hosting range with no approved integration in this synthetic environment.",
      asset_context: "PUBLIC-API reaches the Data Warehouse through the Identity Gateway and Finance App.",
    },
    findings: [
      { text: "The finance service credential was used from an address outside its approved range", cites: ["T1", "T3"] },
      { text: "The same credential drove an unusual burst of warehouse reads", cites: ["T2"] },
      { text: "The public API has a graph path to critical data, so the credential exposes the warehouse", cites: ["T4"] },
    ],
    proposal: "Disable and rotate the service.finance credential and revoke its tokens",
  },
  malware: {
    id: "INC-2417", label: "Endpoint execution", user: "alex.chen", host: "ENG-LT-117", indicator: "malware-cache.example", procedure: "SOP-12",
    records: {
      identity_lookup: "alex.chen has no failed sign-ins, new devices, or unusual locations in the last 24 hours.",
      endpoint_timeline: "ENG-LT-117 ran a script from a downloaded archive and contacted malware-cache.example.",
      threat_intel: "malware-cache.example matches a synthetic indicator list for commodity loaders.",
      asset_context: "ENG-LT-117 has no path to critical data in the current graph; exposure is limited to the engineering segment.",
    },
    findings: [
      { text: "A script from a downloaded archive ran on the endpoint and contacted a known-bad domain", cites: ["T2", "T3"] },
      { text: "Identity signals show no credential misuse, so this looks like endpoint-only execution", cites: ["T1"] },
      { text: "The endpoint has no path to critical data, which limits the blast radius", cites: ["T4"] },
    ],
    proposal: "Isolate ENG-LT-117 and block malware-cache.example",
  },
} as const;

const knowledge = [
  { id: "SOP-04", title: "Identity compromise procedure", concepts: ["identity", "session", "mfa", "contain"], text: "Revoke active sessions, reset credentials, inspect MFA methods, preserve timestamps, and isolate endpoints when execution evidence is present." },
  { id: "SOP-09", title: "Cloud credential procedure", concepts: ["cloud", "credential", "data", "contain"], text: "Disable the exposed service credential, rotate dependent secrets, review data access, and preserve cloud audit logs before remediation." },
  { id: "SOP-12", title: "Endpoint malware procedure", concepts: ["malware", "endpoint", "process", "contain"], text: "Isolate the endpoint, capture process and network evidence, block confirmed indicators, and scope related devices before reimaging." },
  { id: "EVAL-01", title: "Evidence quality policy", concepts: ["evidence", "citation", "confidence"], text: "Every material claim must cite a returned tool record. Missing evidence must produce an explicit abstention rather than an inferred fact." },
];

export function investigateIncident(caseId: keyof typeof incidentCases = "identity", question = "What happened and what should we do next?", approved = false) {
  const incident = incidentCases[caseId] ?? incidentCases.identity;
  const started = Date.now();
  const toolCalls = toolOrder.map((tool, index) => ({
    id: `T${index + 1}`,
    tool,
    status: "complete",
    input: tool === "identity_lookup" ? { user: incident.user } : tool === "threat_intel" ? { indicator: incident.indicator } : { host: incident.host },
    output: { source: toolSources[tool], record: incident.records[tool] },
  }));

  const query = `${question} ${incident.label}`.toLowerCase();
  const ranked = knowledge.map(document => {
    const lexical = document.concepts.filter(term => query.includes(term)).length;
    const caseBoost = document.id === incident.procedure ? 1.5 : 0;
    const evidenceBoost = document.id === "EVAL-01" ? .5 : 0;
    return { id: document.id, title: document.title, text: document.text, score: lexical + caseBoost + evidenceBoost };
  }).sort((a, b) => b.score - a.score);
  const procedure = ranked[0];

  const citations = [
    ...toolCalls.map(call => ({ id: call.id, title: call.output.source, excerpt: call.output.record, score: 1 })),
    ...ranked.slice(0, 2).map(document => ({ id: document.id, title: document.title, excerpt: document.text, score: document.score })),
  ];
  const answer = [
    ...incident.findings.map(finding => `${finding.text} [${finding.cites.join(", ")}].`),
    `Recommended procedure: ${procedure.text.replace(/\.$/, "")} [${procedure.id}].`,
  ].join(" ");

  const knownIds = new Set(citations.map(citation => citation.id));
  const citedIds = [...answer.matchAll(/\[([^\]]+)\]/g)].flatMap(match => match[1].split(/,\s*/));
  const sentences = answer.split(/(?<=\]\.)\s+/);
  const qualityChecks = [
    { name: "All four tools returned a record", passed: toolCalls.length === 4 && toolCalls.every(call => call.status === "complete" && call.output.record.length > 0) },
    { name: "Every statement cites returned evidence", passed: sentences.every(sentence => /\[[^\]]+\]\.$/.test(sentence)) && citedIds.every(id => knownIds.has(id)) },
    { name: "Procedure matches the incident type", passed: procedure.id === incident.procedure },
    { name: "Evidence spans four distinct sources", passed: new Set(toolCalls.map(call => call.output.source)).size === 4 },
  ];
  const blocked = qualityChecks.some(check => !check.passed);

  const action = blocked
    ? { status: "blocked", detail: "Containment is blocked because a run check failed. Review the evidence and procedure, then run again." }
    : approved
      ? { status: "executed", detail: `${incident.proposal}. Synthetic action recorded; no external system was changed.` }
      : { status: "awaiting_approval", detail: "Paused for human approval. Nothing has been executed." };
  const checks = [
    ...qualityChecks,
    { name: "No containment without approval", passed: action.status !== "executed" || approved },
  ];

  return {
    incident: { id: incident.id, label: incident.label, user: incident.user, host: incident.host, indicator: incident.indicator },
    question, answer, toolCalls, citations, proposal: incident.proposal, action,
    retrieval: ranked.map(({ id, title, score }) => ({ id, title, score })),
    trace: [
      { step: "Planner", status: "complete", detail: `Selected four read-only tools for ${incident.id}.` },
      { step: "Tool executor", status: "complete", detail: `Queried identity, endpoint, threat intel, and graph context for ${incident.user} and ${incident.host}.` },
      { step: "Procedure retrieval", status: "complete", detail: `Ranked ${knowledge.length} documents by keyword and incident context; top match ${procedure.id}.` },
      { step: "Evidence synthesis", status: "complete", detail: `Composed ${sentences.length} cited statements from returned records using templates.` },
      action.status === "blocked"
        ? { step: "Approval gate", status: "blocked", detail: "A run check failed, so containment cannot be approved." }
        : { step: "Approval gate", status: approved ? "complete" : "waiting", detail: approved ? "Human approval received; synthetic action recorded." : "Paused before containment until a human approves." },
    ],
    evaluation: { method: "deterministic rule checks", score: checks.filter(check => check.passed).length, total: checks.length, checks },
    meta: { latencyMs: Date.now() - started, orchestration: "bounded state machine", retrieval: "keyword + incident-context scoring", synthesis: "template-based", model: "none — deterministic public demo", synthetic: true },
  };
}
