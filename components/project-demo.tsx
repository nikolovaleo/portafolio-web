"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

type GraphResult = {
  nodes: Array<{ id: string; label: string; kind: string; criticality: number; sourceCount: number }>;
  edges: Array<{ id: string; from: string; to: string; relation: string; likelihood: number; control: string }>;
  paths: Array<{ ids: string[]; labels: string[]; edgeIds: string[]; risk: number }>;
  remediation: { id: string; label: string; removes: readonly string[] };
  summary: { paths: number; eliminated: number; highestRisk: number; sources: number; entities: number };
  entityResolution: { canonicalId: string; confidence: number; records: string[]; evidence: string[] };
};

type ModelResult = {
  dataset: { name: string; trainRows: number; testRows: number; features: number; seed: number };
  models: Array<{ name: string; precision: number; recall: number; f1: number; falsePositiveRate: number }>;
  metrics: { precision: number; recall: number; f1: number; falsePositiveRate: number; psi: number; driftStatus: string; confusion: { tp: number; fp: number; tn: number; fn: number } };
  sample: { index: number; label: string; probability: number; decision: string; contributions: Array<{ feature: string; value: number; contribution: number }> };
  model: { type: string; epochs: number; weights: number[] };
  meta: { latencyMs: number };
};

type AgentResult = {
  incident: { id: string; label: string; user: string; host: string; indicator: string };
  answer: string;
  toolCalls: Array<{ tool: string; status: string; output: { source: string; record: string } }>;
  citations: Array<{ id: string; title: string; excerpt: string; score: number }>;
  proposal: string;
  action: { status: string; detail: string };
  trace: Array<{ agent: string; status: string; detail: string }>;
  evaluation: { score: number; total: number; checks: Array<{ name: string; passed: boolean }> };
  meta: { latencyMs: number; orchestration: string; retrieval: string; model: string };
};

const remediationOptions = [
  ["none", "No remediation"], ["mfa", "Enforce phishing-resistant MFA"], ["rotate", "Rotate public API credentials"],
  ["least-privilege", "Remove warehouse write role"], ["segment", "Segment backup network"],
];

const incidentOptions = [
  ["identity", "Identity takeover"], ["cloud", "Cloud data access"], ["malware", "Endpoint execution"],
];

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

function EndpointBadge({ path, latency }: { path: string; latency?: number }) {
  return <div className="endpoint-badge"><span>POST</span><code>{path}</code><i>{latency === undefined ? "ready" : `${latency}ms`}</i></div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return <div className="platform-metric"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</div>;
}

export default function ProjectDemo({ project }: { project: "atlas" | "sentinel" | "aegis" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remediation, setRemediation] = useState("none");
  const [graph, setGraph] = useState<GraphResult | null>(null);
  const [drift, setDrift] = useState(25);
  const [threshold, setThreshold] = useState(55);
  const [sampleIndex, setSampleIndex] = useState(12);
  const [model, setModel] = useState<ModelResult | null>(null);
  const [caseId, setCaseId] = useState("identity");
  const [question, setQuestion] = useState("What happened, what evidence supports it, and what action should we take?");
  const [agent, setAgent] = useState<AgentResult | null>(null);

  async function post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error("The live endpoint could not complete this run.");
    return response.json();
  }

  async function runGraph(next = remediation) {
    setError(""); setLoading(true);
    try { setGraph(await post("/api/graph", { remediation: next })); } catch (caught) { setError(caught instanceof Error ? caught.message : "Request failed."); } finally { setLoading(false); }
  }

  async function runModel() {
    setError(""); setLoading(true);
    try { setModel(await post("/api/monitor", { drift, threshold: threshold / 100, sampleIndex })); } catch (caught) { setError(caught instanceof Error ? caught.message : "Request failed."); } finally { setLoading(false); }
  }

  async function runAgent(approved = false) {
    setError(""); setLoading(true);
    try { setAgent(await post("/api/agent", { caseId, question, approved })); } catch (caught) { setError(caught instanceof Error ? caught.message : "Request failed."); } finally { setLoading(false); }
  }

  useEffect(() => {
    if (project === "atlas") void runGraph("none");
    if (project === "sentinel") void runModel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project]);

  if (project === "atlas") return <div className="project-demo">{error && <p role="alert" className="demo-error">{error}</p>}
    <article className="lab-project accent-cyan">
      <div className="project-intro"><div><p className="project-overline">Knowledge graph · Entity resolution · Attack paths</p><h1>Atlas Graph</h1><p>Five fragmented security sources become one traceable graph. Explore the paths from an external entry point to critical data, then test which control removes the most risk.</p><div className="tech-tags"><span>Graph traversal</span><span>Entity resolution</span><span>Lineage</span><span>What-if analysis</span></div></div><EndpointBadge path="/api/graph" /></div>
      <div className="demo-shell platform-shell">
        <div className="platform-controls"><label><span>Remediation scenario</span><select value={remediation} onChange={event => setRemediation(event.target.value)}>{remediationOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><Button className="run-button" onClick={() => runGraph()} disabled={loading}>{loading ? "Recalculating…" : "Recalculate attack paths"}<ArrowIcon /></Button></div>
        <div className="platform-metrics" aria-live="polite"><Metric label="Reachable paths" value={String(graph?.summary.paths ?? "—")} /><Metric label="Paths eliminated" value={String(graph?.summary.eliminated ?? "—")} /><Metric label="Highest path risk" value={graph ? `${graph.summary.highestRisk}%` : "—"} /><Metric label="Source coverage" value={graph ? `${graph.summary.sources} systems` : "—"} /></div>
        <div className="graph-workspace">
          <section className="graph-map"><div className="panel-heading"><span>Security knowledge graph</span><small>{graph?.summary.entities ?? 0} canonical entities · {graph?.edges.length ?? 0} active relationships</small></div><div className="node-grid">{graph?.nodes.map(node => <div className={`graph-node kind-${node.kind}`} key={node.id}><i>{node.kind}</i><strong>{node.label}</strong><small>{node.sourceCount} source{node.sourceCount === 1 ? "" : "s"} · C{node.criticality}</small></div>)}</div></section>
          <section className="path-panel"><div className="panel-heading"><span>Ranked critical paths</span><small>edge likelihood product</small></div>{graph?.paths.length ? graph.paths.map((path, index) => <div className="attack-path" key={path.ids.join("-")}><div><b>0{index + 1}</b><strong>{path.risk}%</strong></div><p>{path.labels.map((label, item) => <span key={label}>{label}{item < path.labels.length - 1 && <i>→</i>}</span>)}</p></div>) : <div className="empty-result">No critical data path remains under this scenario.</div>}</section>
        </div>
        <section className="resolution-proof"><div><span className="eyebrow-small">Entity resolution proof</span><h3>{graph?.entityResolution.canonicalId}</h3><strong>{graph ? Math.round(graph.entityResolution.confidence * 100) : 0}% match confidence</strong></div><div>{graph?.entityResolution.records.map(record => <code key={record}>{record}</code>)}</div><ul>{graph?.entityResolution.evidence.map(item => <li key={item}>{item}</li>)}</ul></section>
      </div>
    </article></div>;

  if (project === "sentinel") return <div className="project-demo">{error && <p role="alert" className="demo-error">{error}</p>}
    <article className="lab-project accent-lime">
      <div className="project-intro"><div><p className="project-overline">Machine learning · Evaluation · Monitoring</p><h1>Sentinel ModelOps</h1><p>A fitted intrusion classifier—not a hand-written score. Compare the champion against its baseline, tune the operating threshold, introduce drift, and explain an individual prediction.</p><div className="tech-tags"><span>Logistic regression</span><span>Champion / challenger</span><span>PSI</span><span>Local explanations</span></div></div><EndpointBadge path="/api/monitor" latency={model?.meta.latencyMs} /></div>
      <div className="demo-shell platform-shell">
        <div className="model-disclosure"><strong>{model?.dataset.name ?? "Reproducible benchmark"}</strong><span>{model ? `${model.dataset.trainRows.toLocaleString()} train · ${model.dataset.testRows} test · ${model.dataset.features} features · seed ${model.dataset.seed}` : "Fitting model…"}</span><small>Generated public-safe rows inspired by the UNSW-NB15 feature domain; not official benchmark results.</small></div>
        <div className="model-controls"><div><label>Population drift <strong>{drift}%</strong></label><Slider value={[drift]} min={0} max={100} step={1} onValueChange={value => setDrift(value[0])} /></div><div><label>Decision threshold <strong>{threshold}%</strong></label><Slider value={[threshold]} min={20} max={85} step={1} onValueChange={value => setThreshold(value[0])} /></div><div><label>Explain test sample <strong>#{sampleIndex}</strong></label><Slider value={[sampleIndex]} min={0} max={99} step={1} onValueChange={value => setSampleIndex(value[0])} /></div><Button className="run-button" onClick={runModel} disabled={loading}>{loading ? "Fitting & scoring…" : "Run model evaluation"}<ArrowIcon /></Button></div>
        <div className="platform-metrics"><Metric label="Precision" value={model ? `${(model.metrics.precision * 100).toFixed(1)}%` : "—"} /><Metric label="Recall" value={model ? `${(model.metrics.recall * 100).toFixed(1)}%` : "—"} /><Metric label="F1" value={model ? model.metrics.f1.toFixed(3) : "—"} /><Metric label="PSI" value={model ? model.metrics.psi.toFixed(3) : "—"} detail={model?.metrics.driftStatus} /></div>
        <div className="model-grid">
          <section><div className="panel-heading"><span>Model comparison</span><small>same test population</small></div><div className="model-table"><div className="table-row table-head"><span>Model</span><span>Precision</span><span>Recall</span><span>F1</span></div>{model?.models.map(item => <div className="table-row" key={item.name}><strong>{item.name}</strong><span>{(item.precision * 100).toFixed(1)}%</span><span>{(item.recall * 100).toFixed(1)}%</span><span>{item.f1.toFixed(3)}</span></div>)}</div><div className="confusion-mini"><span>TP <b>{model?.metrics.confusion.tp ?? "—"}</b></span><span>FP <b>{model?.metrics.confusion.fp ?? "—"}</b></span><span>FN <b>{model?.metrics.confusion.fn ?? "—"}</b></span><span>TN <b>{model?.metrics.confusion.tn ?? "—"}</b></span></div></section>
          <section className="sample-explanation"><div className="panel-heading"><span>Prediction explanation</span><small>sample #{model?.sample.index ?? sampleIndex}</small></div><div className="prediction-head"><div><strong>{model ? `${(model.sample.probability * 100).toFixed(1)}%` : "—"}</strong><span>attack score</span></div><div><b>{model?.sample.decision ?? "Waiting"}</b><span>label: {model?.sample.label ?? "—"}</span></div></div>{model?.sample.contributions.map(item => <div className="contribution-row" key={item.feature}><span>{item.feature}</span><i><b style={{ width: `${Math.min(100, Math.abs(item.contribution) * 45)}%` }} /></i><strong>{item.contribution > 0 ? "+" : ""}{item.contribution}</strong></div>)}</section>
        </div>
      </div>
    </article></div>;

  return <div className="project-demo">{error && <p role="alert" className="demo-error">{error}</p>}
    <article className="lab-project accent-violet">
      <div className="project-intro"><div><p className="project-overline">Agentic AI · Tools · Retrieval · Evaluation</p><h1>Aegis Investigator</h1><p>A bounded investigation agent calls four security tools, retrieves the relevant procedure, cites every material conclusion, evaluates its own run, and stops before containment until a human approves.</p><div className="tech-tags"><span>Typed tool calls</span><span>Hybrid retrieval</span><span>Structured state</span><span>Approval policy</span></div></div><EndpointBadge path="/api/agent" latency={agent?.meta.latencyMs} /></div>
      <div className="demo-shell platform-shell">
        <div className="agent-command"><label><span>Incident case</span><select value={caseId} onChange={event => { setCaseId(event.target.value); setAgent(null); }}>{incidentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>Investigation objective</span><Textarea value={question} onChange={event => setQuestion(event.target.value)} rows={3} /></label><Button className="run-button" onClick={() => runAgent(false)} disabled={loading}>{loading ? "Running agent…" : "Run investigation"}<ArrowIcon /></Button><p>Deterministic public runtime for reproducibility. The architecture exposes the same planning, tool, retrieval, evaluation, and approval boundaries required by a model-driven agent.</p></div>
        <div className="agent-layout">
          <section className="trace-panel"><div className="panel-heading"><span>Execution trace</span><small>{agent?.incident.id ?? "select a case"}</small></div>{(agent?.trace ?? [{agent:"Triage planner",status:"waiting",detail:"Waiting for an investigation."},{agent:"Tool executor",status:"waiting",detail:"Four read-only tools available."},{agent:"Hybrid retriever",status:"waiting",detail:"Procedures indexed."},{agent:"Evidence synthesizer",status:"waiting",detail:"Citation policy active."},{agent:"Policy gate",status:"waiting",detail:"Containment requires approval."}]).map((step, index) => <div className="trace-step" key={step.agent}><i>{String(index + 1).padStart(2, "0")}</i><div><strong>{step.agent}</strong><span>{step.detail}</span></div><b className={step.status}>{step.status.replace("_", " ")}</b></div>)}</section>
          <section className="tool-panel"><div className="panel-heading"><span>Typed tool calls</span><small>read-only</small></div>{agent?.toolCalls.map(call => <details key={call.tool}><summary><code>{call.tool}</code><span>{call.status}</span></summary><p><strong>{call.output.source}</strong>{call.output.record}</p></details>) ?? <div className="empty-result">Run the agent to inspect every tool result.</div>}</section>
        </div>
        <section className="agent-conclusion"><div><span className="eyebrow-small">Grounded conclusion</span><p>{agent?.answer ?? "No conclusion has been generated."}</p></div><div className="eval-score"><strong>{agent ? `${agent.evaluation.score}/${agent.evaluation.total}` : "—"}</strong><span>run checks passed</span>{agent?.evaluation.checks.map(check => <small key={check.name}>{check.passed ? "✓" : "×"} {check.name}</small>)}</div></section>
        {agent && <section className={`approval-gate ${agent.action.status}`}><div><span>Human approval gate</span><strong>{agent.proposal}</strong><p>{agent.action.detail}</p></div>{agent.action.status === "awaiting_approval" ? <Button onClick={() => runAgent(true)} disabled={loading}>Approve synthetic action</Button> : <b>Action recorded ✓</b>}</section>}
        <section className="evidence-strip">{agent?.citations.slice(0, 6).map(citation => <article key={citation.id}><span>{citation.id} · score {citation.score}</span><strong>{citation.title}</strong><p>{citation.excerpt}</p></article>)}</section>
      </div>
    </article></div>;
}
