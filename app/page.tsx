"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

type Asset = {
  hostname: string;
  ip: string;
  owner: string;
  os: string;
  deviceId: string;
};

type ResolveResult = {
  decision: string;
  score: number;
  threshold: number;
  thresholdGap: number;
  features: Array<{ feature: string; weight: number; match: number; contribution: number }>;
  unifiedRecord: null | Record<string, unknown>;
  meta: { latencyMs: number; model: string; synthetic: boolean };
};

type AgentResult = {
  answer: string;
  trace: Array<{ agent: string; status: string; detail: string }>;
  citations: Array<{ id: string; title: string; score: number; excerpt: string }>;
  judge: {
    score: number;
    verdict: string;
    checks: Array<{ name: string; passed: boolean }>;
  };
  meta: { latencyMs: number; retrieval: string; orchestration: string };
};

type MonitorResult = {
  metrics: {
    precision: number;
    recall: number;
    f1: number;
    falsePositiveRate: number;
    psi: number;
    driftStatus: string;
  };
  confusion: { tp: number; fp: number; tn: number; fn: number };
  distribution: Array<{ label: string; baseline: number; current: number }>;
  featureImpact: Array<{ feature: string; impact: number }>;
  meta: { latencyMs: number; model: string };
};

const scenarios: Record<string, { label: string; left: Asset; right: Asset }> = {
  match: {
    label: "Likely match",
    left: { hostname: "FIN-LT-042", ip: "10.42.7.18", owner: "Riley Park", os: "Windows 11", deviceId: "A-8042" },
    right: { hostname: "finlt042.corp", ip: "10.42.7.18", owner: "riley.park", os: "Win 11 Enterprise", deviceId: "A8042" },
  },
  review: {
    label: "Needs review",
    left: { hostname: "MKT-MAC-117", ip: "10.19.4.22", owner: "Jordan Lee", os: "macOS 15", deviceId: "M-117" },
    right: { hostname: "jordans-macbook", ip: "10.19.4.31", owner: "J. Lee", os: "Mac OS", deviceId: "M-171" },
  },
  different: {
    label: "Different assets",
    left: { hostname: "SRV-WEB-008", ip: "10.8.2.14", owner: "Web Platform", os: "Ubuntu 24.04", deviceId: "S-008" },
    right: { hostname: "HR-LT-221", ip: "10.33.9.80", owner: "Casey Morgan", os: "Windows 11", deviceId: "L-221" },
  },
};

const fieldLabels: Array<[keyof Asset, string]> = [
  ["hostname", "Hostname"],
  ["ip", "IP address"],
  ["owner", "Owner"],
  ["os", "Operating system"],
  ["deviceId", "Device ID"],
];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" width="18" height="18">
      <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EndpointBadge({ path, latency }: { path: string; latency?: number }) {
  return (
    <div className="endpoint-badge">
      <span>POST</span>
      <code>{path}</code>
      <i>{latency === undefined ? "ready" : latency + "ms"}</i>
    </div>
  );
}

function VideoSlot({ accent }: { accent: string }) {
  return (
    <div className={"video-slot accent-" + accent} aria-label="Project walkthrough video coming soon">
      <span className="video-play" aria-hidden="true">▶</span>
      <div><small>Project walkthrough</small><strong>Video coming soon</strong></div>

    </div>
  );
}

function AssetCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Asset;
  onChange: (next: Asset) => void;
}) {
  return (
    <div className="asset-card">
      <div className="card-label"><span />{label}</div>
      {fieldLabels.map(([field, fieldLabel]) => (
        <label key={field}>
          <span>{fieldLabel}</span>
          <Input
            value={value[field]}
            onChange={(event) => onChange({ ...value, [field]: event.target.value })}
            aria-label={label + " " + fieldLabel}
          />
        </label>
      ))}
    </div>
  );
}

export default function Home() {
  const [leftAsset, setLeftAsset] = useState<Asset>(scenarios.match.left);
  const [rightAsset, setRightAsset] = useState<Asset>(scenarios.match.right);
  const [matchThreshold, setMatchThreshold] = useState(72);
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);

  const [question, setQuestion] = useState("What happened and what should the analyst do next?");
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);

  const [drift, setDrift] = useState(35);
  const [modelThreshold, setModelThreshold] = useState(58);
  const [monitorResult, setMonitorResult] = useState<MonitorResult | null>(null);
  const [monitorLoading, setMonitorLoading] = useState(false);

  async function runResolution() {
    setResolveLoading(true);
    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ left: leftAsset, right: rightAsset, threshold: matchThreshold / 100 }),
      });
      setResolveResult(await response.json());
    } finally {
      setResolveLoading(false);
    }
  }

  async function runAgent() {
    setAgentLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      setAgentResult(await response.json());
    } finally {
      setAgentLoading(false);
    }
  }

  async function runMonitor(nextDrift = drift, nextThreshold = modelThreshold) {
    setMonitorLoading(true);
    try {
      const response = await fetch("/api/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drift: nextDrift, threshold: nextThreshold / 100 }),
      });
      setMonitorResult(await response.json());
    } finally {
      setMonitorLoading(false);
    }
  }

  useEffect(() => {
    void fetch("/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ left: scenarios.match.left, right: scenarios.match.right, threshold: 0.72 }),
    }).then(async (response) => setResolveResult(await response.json()));
    void fetch("/api/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drift: 35, threshold: 0.58 }),
    }).then(async (response) => setMonitorResult(await response.json()));
  }, []);

  function loadScenario(key: string) {
    const scenario = scenarios[key];
    setLeftAsset(scenario.left);
    setRightAsset(scenario.right);
    setResolveResult(null);
  }

  return (
    <main>
      <nav className="site-nav" aria-label="Primary navigation">
        <div className="nav-inner"><a className="wordmark" href="#top" aria-label="Leonardo Ureña, home">lu<span>.</span></a>
        <div className="nav-links"><a href="#labs">Projects</a><a href="#about">About</a><a href="https://github.com/nikolovaleo/portafolio-web" target="_blank" rel="noreferrer">GitHub</a><a href="mailto:nikolovaleo@gmail.com">Contact</a></div></div>
      </nav>
      <header className="hero" id="top">
        <p className="hero-name">Leonardo Ureña</p>
        <h1>Intelligence.<br /><span>Put to work.</span></h1>
        <p className="hero-intro">AI engineering. Data science. Thoughtful engineering.
              From end to end.<br className="desktop-break" /> Thoughtfully built, from the data to the experience.</p>
        <div className="hero-actions"><a className="primary-link" href="#labs">Explore projects</a><a className="text-link" href="#about">Get to know me <span aria-hidden="true">›</span></a></div>

        <div className="showcase">
          <Tabs defaultValue="atlas" className="showcase-tabs">
            <div className="showcase-header"><span className="showcase-label">A closer look.</span><TabsList aria-label="Preview a project"><TabsTrigger value="atlas">Atlas Resolve</TabsTrigger><TabsTrigger value="aegis">Aegis RAG</TabsTrigger><TabsTrigger value="drift">Drift Lab</TabsTrigger></TabsList><span className="sample-label">Synthetic data</span></div>
            <TabsContent value="atlas" className="showcase-content">
              <div className="showcase-copy"><span className="product-category">Entity resolution</span><h2>A little clarity.<br />Across every record.</h2><p>Two sources. One identity. See exactly what connects them.</p><a className="text-link" href="#project-1">Explore Atlas Resolve <span aria-hidden="true">›</span></a></div>
              <div className="identity-preview" aria-label="Current entity resolution preview">
                <div className="identity-sources"><div><span>Endpoint record</span><strong>{leftAsset.hostname}</strong><small>{leftAsset.ip}</small></div><div><span>Inventory record</span><strong>{rightAsset.hostname}</strong><small>{rightAsset.ip}</small></div></div>
                <div className="identity-connector" aria-hidden="true"><span /><b>↓</b></div>
                <div className="identity-result"><div className="preview-score">{resolveResult ? Math.round(resolveResult.score * 100) : '—'}<small>/100</small></div><div><strong>{resolveResult ? resolveResult.decision.replace('_', ' ').toLowerCase() : 'Ready to compare'}</strong><span>Explainable match score</span></div><span className="result-icon" aria-hidden="true">{resolveResult?.decision === 'MATCH' ? '✓' : '↔'}</span></div>
              </div>
            </TabsContent>
            <TabsContent value="aegis" className="showcase-content">
              <div className="showcase-copy"><span className="product-category">Retrieval & evaluation</span><h2>Every answer.<br />With a trail to follow.</h2><p>A transparent investigation pipeline, from the first question to the final check.</p><a className="text-link" href="#project-2">Explore Aegis RAG <span aria-hidden="true">›</span></a></div>
              <div className="pipeline-preview">{[['01','Plan','Understand the question'],['02','Retrieve','Find relevant evidence'],['03','Analyze','Connect the findings'],['04','Evaluate','Check the answer']].map(([number,title,detail])=><div key={number}><span>{number}</span><section><strong>{title}</strong><p>{detail}</p></section><b aria-hidden="true">{number === '04' ? '✓' : '↓'}</b></div>)}</div>
            </TabsContent>
            <TabsContent value="drift" className="showcase-content">
              <div className="showcase-copy"><span className="product-category">Model monitoring</span><h2>Models change.<br />Stay one step ahead.</h2><p>Explore the relationship between changing data, decision thresholds, and performance.</p><a className="text-link" href="#project-3">Explore Drift Lab <span aria-hidden="true">›</span></a></div>
              <div className="drift-preview"><div className="preview-metrics"><div><span>Precision</span><strong>{monitorResult ? (monitorResult.metrics.precision*100).toFixed(1)+'%' : '—'}</strong></div><div><span>Recall</span><strong>{monitorResult ? (monitorResult.metrics.recall*100).toFixed(1)+'%' : '—'}</strong></div></div><div className="preview-chart" aria-label="Current risk score distribution">{monitorResult?.distribution.map(bin=><div key={bin.label} style={{height:Math.max(2,bin.current/Math.max(...monitorResult.distribution.map(x=>x.current),1)*100)+'%'}} title={bin.label+': '+bin.current}/>)}</div><span className="preview-chart-label">Risk-score distribution</span></div>
            </TabsContent>
          </Tabs>
        </div>
        <p className="hero-footnote">Three personal projects. Real interactions. Original code.</p>
      </header>
      <section className="labs" id="labs" aria-labelledby="labs-title">
        <div className="section-heading"><h2 id="labs-title">Meet the projects.</h2><p>Designed to be explored.<br />Built to show how it works.</p></div>

        <article className="lab-project accent-cyan" id="project-1">
          <div className="project-intro">
            <div className="project-number">01</div>
            <div>
              <p className="project-overline">Data engineering · Knowledge graphs · Entity resolution</p>
              <h3>Atlas Resolve</h3><h4>Different records.<br />One clear picture.</h4>
              <p>Bring fragmented asset records together. Compare the signals, adjust the threshold, and understand every match.</p>
              <div className="tech-tags"><span>TypeScript</span><span>Weighted similarity</span><span>Graph-ready output</span><span>Explainability</span></div>
            </div>
            <EndpointBadge path="/api/resolve" latency={resolveResult?.meta.latencyMs} />
          </div>

          <div className="product-visual atlas-visual" aria-label="Record comparison overview">
            <div className="visual-record"><span>Source A</span><strong>{leftAsset.hostname}</strong><small>{leftAsset.owner}</small><code>{leftAsset.ip}</code></div>
            <div className="visual-match"><span className="visual-match-icon" aria-hidden="true">↔</span><strong>{resolveResult ? Math.round(resolveResult.score*100)+'/100' : '—'}</strong><span>Match score</span></div>
            <div className="visual-record"><span>Source B</span><strong>{rightAsset.hostname}</strong><small>{rightAsset.owner}</small><code>{rightAsset.ip}</code></div>
          </div>
          <Collapsible className="project-explorer">
          <CollapsibleTrigger className="demo-toggle">Try the live demo <span className="toggle-plus" aria-hidden="true">+</span></CollapsibleTrigger>
          <CollapsibleContent>
          <div className="demo-shell">
            <div className="demo-toolbar">
              <div>
                <span className="eyebrow-small">Scenario</span>
                <div className="scenario-buttons">
                  {Object.entries(scenarios).map(([key, scenario]) => (
                    <Button key={key} variant="outline" size="sm" onClick={() => loadScenario(key)}>{scenario.label}</Button>
                  ))}
                </div>
              </div>
              <div className="threshold-control">
                <label>Match threshold <strong>{matchThreshold}%</strong></label>
                <Slider value={[matchThreshold]} min={45} max={95} step={1} onValueChange={(value) => setMatchThreshold(value[0])} aria-label="Entity match threshold" />
              </div>
            </div>

            <div className="asset-grid">
              <AssetCard label="Source A · EDR" value={leftAsset} onChange={setLeftAsset} />
              <div className="versus" aria-hidden="true">↔</div>
              <AssetCard label="Source B · CMDB" value={rightAsset} onChange={setRightAsset} />
            </div>
            <Button className="run-button" onClick={runResolution} disabled={resolveLoading}>{resolveLoading ? "Resolving…" : "Run entity resolution"} <ArrowIcon /></Button>

            <div className="result-grid" aria-live="polite">
              <div className="decision-card">
                <span className="eyebrow-small">Decision</span>
                {resolveResult ? (
                  <>
                    <strong className={"decision " + resolveResult.decision.toLowerCase()}>{resolveResult.decision.replace("_", " ")}</strong>
                    <div
                      className="score-ring"
                      role="img"
                      aria-label={`Match score ${Math.round(resolveResult.score * 100)} out of 100; threshold ${Math.round(resolveResult.threshold * 100)} out of 100`}
                      style={{ "--score": resolveResult.score * 100 } as CSSProperties}
                    >
                      <span className="score-value" aria-hidden="true">
                        <b>{Math.round(resolveResult.score * 100)}</b>
                        <span>/100</span>
                      </span>
                    </div>
                    <p>
                      Match threshold: {Math.round(resolveResult.threshold * 100)}/100<br />
                      <strong>{Math.abs(Math.round(resolveResult.thresholdGap * 100))} points {resolveResult.thresholdGap >= 0 ? "above" : "below"} threshold</strong>
                    </p>
                  </>
                ) : <p>Run the endpoint to score these records.</p>}
              </div>
              <div className="feature-card">
                <span className="eyebrow-small">Feature contribution</span>
                {resolveResult?.features.map((feature) => (
                  <div className="feature-row" key={feature.feature}>
                    <div><span>{feature.feature}</span><b>{Math.round(feature.match * 100)}%</b></div>
                    <i><span style={{ width: Math.round(feature.match * 100) + "%" }} /></i>
                  </div>
                ))}
              </div>
              <div className="json-card">
                <span className="eyebrow-small">Canonical output</span>
                <pre>{resolveResult ? JSON.stringify(resolveResult.unifiedRecord ?? { status: "manual_review" }, null, 2) : "{ waiting: true }"}</pre>
              </div>
            </div>
          </div>

          <div className="build-notes">
            <div><span>Why it matters</span><p>Enterprise analytics fail when identity is unreliable. This demo makes the matching logic observable instead of hiding it behind a black-box join.</p></div>
            <div><span>Production evolution</span><p>Move features to Spark, learn weights from labeled pairs, persist lineage, and emit graph edges for attack-path analytics.</p></div>
            <VideoSlot accent="cyan" />
          </div>
          </CollapsibleContent>
          </Collapsible>
        </article>

        <article className="lab-project accent-violet" id="project-2">
          <div className="project-intro">
            <div className="project-number">02</div>
            <div>
              <p className="project-overline">Agentic AI · RAG · Tool orchestration · LLM evaluation</p>
              <h3>Aegis RAG</h3><h4>Good answers start<br />with good evidence.</h4>
              <p>Follow the evidence from question to conclusion. Explore retrieval, specialist workflows, and evaluation in a deterministic investigation sandbox.</p>
              <div className="tech-tags"><span>RAG</span><span>Multi-agent</span><span>Query expansion</span><span>Evaluation rubric</span></div>
            </div>
            <EndpointBadge path="/api/agent" latency={agentResult?.meta.latencyMs} />
          </div>

          <div className="product-visual aegis-visual" aria-label="Investigation workflow">
            {[['01','Question'],['02','Evidence'],['03','Analysis'],['04','Evaluation']].map(([n,label])=><div key={n}><span>{n}</span><strong>{label}</strong><i aria-hidden="true">{n==='04' ? '✓' : '→'}</i></div>)}
          </div>
          <Collapsible className="project-explorer">
          <CollapsibleTrigger className="demo-toggle">Try the live demo <span className="toggle-plus" aria-hidden="true">+</span></CollapsibleTrigger>
          <CollapsibleContent>
          <div className="demo-shell agent-shell">
            <div className="agent-input">
              <label htmlFor="agent-question">Ask the synthetic investigation</label>
              <Textarea id="agent-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} />
              <div className="quick-prompts">
                {[
                  "What happened and what should the analyst do next?",
                  "What evidence supports the conclusion?",
                  "Summarize the incident for a manager.",
                ].map((prompt) => (
                  <Button key={prompt} variant="outline" size="sm" onClick={() => setQuestion(prompt)}>{prompt}</Button>
                ))}
              </div>
              <Button className="run-button" onClick={runAgent} disabled={agentLoading}>{agentLoading ? "Agents are working…" : "Run investigation"} <ArrowIcon /></Button>
              <p className="safety-note">This public sandbox uses a deterministic reasoning layer over a synthetic corpus—no API keys, customer data, or hidden employer context.</p>
            </div>

            <div className="agent-output" aria-live="polite">
              <div className="trace-panel">
                <span className="eyebrow-small">Agent trace</span>
                {(agentResult?.trace ?? [
                  { agent: "Planner", status: "waiting", detail: "Waiting for a question." },
                  { agent: "Retriever", status: "waiting", detail: "Synthetic corpus ready." },
                  { agent: "Specialists", status: "waiting", detail: "Identity and endpoint tools ready." },
                  { agent: "Judge", status: "waiting", detail: "Evaluation rubric ready." },
                ]).map((step, index) => (
                  <div className="trace-step" key={step.agent}>
                    <i>{String(index + 1).padStart(2, "0")}</i>
                    <div><strong>{step.agent}</strong><span>{step.detail}</span></div>
                    <b className={step.status}>{step.status}</b>
                  </div>
                ))}
              </div>
              <div className="answer-panel">
                <div className="answer-head">
                  <span className="eyebrow-small">Grounded response</span>
                  {agentResult && <b>{agentResult.judge.verdict} · {agentResult.judge.score}/100</b>}
                </div>
                <p>{agentResult?.answer ?? "Run the agent to generate an evidence-backed investigation summary."}</p>
                {agentResult && (
                  <div className="judge-checks">
                    {agentResult.judge.checks.map((check) => <span key={check.name}>{check.passed ? "✓" : "×"} {check.name}</span>)}
                  </div>
                )}
              </div>
              <div className="citation-grid">
                {agentResult?.citations.map((citation) => (
                  <div key={citation.id}>
                    <span>{citation.id} · score {citation.score}</span>
                    <strong>{citation.title}</strong>
                    <p>{citation.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="build-notes">
            <div><span>Why it matters</span><p>A useful agent must expose what it retrieved, which specialist did what, and why the final answer passed evaluation.</p></div>
            <div><span>Production evolution</span><p>Swap in embedding retrieval and tool APIs, isolate permissions per agent, add model-based evals, and log traces for regression testing.</p></div>
            <VideoSlot accent="violet" />
          </div>
          </CollapsibleContent>
          </Collapsible>
        </article>

        <article className="lab-project accent-lime" id="project-3">
          <div className="project-intro">
            <div className="project-number">03</div>
            <div>
              <p className="project-overline">Machine learning · MLOps · Drift detection · Explainability</p>
              <h3>Drift Lab</h3><h4>Know your model.<br />Beyond the accuracy.</h4>
              <p>A live model-observability surface for a synthetic email-risk classifier. Stress the input distribution, tune the decision threshold, and watch model quality change.</p>
              <div className="tech-tags"><span>PSI drift</span><span>Confusion matrix</span><span>Threshold tuning</span><span>Feature impact</span></div>
            </div>
            <EndpointBadge path="/api/monitor" latency={monitorResult?.meta.latencyMs} />
          </div>

          <div className="product-visual monitor-visual" aria-label="Current model performance">
            {[["Precision",monitorResult?.metrics.precision],["Recall",monitorResult?.metrics.recall],["F1 score",monitorResult?.metrics.f1]].map(([label,value])=><div key={String(label)}><strong>{typeof value==='number' ? (value*100).toFixed(1)+'%' : '—'}</strong><span>{label}</span></div>)}
          </div>
          <Collapsible className="project-explorer">
          <CollapsibleTrigger className="demo-toggle">Try the live demo <span className="toggle-plus" aria-hidden="true">+</span></CollapsibleTrigger>
          <CollapsibleContent>
          <div className="demo-shell monitor-shell">
            <div className="monitor-controls">
              <div>
                <label>Population drift <strong>{drift}%</strong></label>
                <Slider value={[drift]} min={0} max={100} step={1} onValueChange={(value) => setDrift(value[0])} aria-label="Population drift percentage" />
                <small>Changes sender, URL, and language feature distributions.</small>
              </div>
              <div>
                <label>Decision threshold <strong>{modelThreshold}%</strong></label>
                <Slider value={[modelThreshold]} min={10} max={90} step={1} onValueChange={(value) => setModelThreshold(value[0])} aria-label="Model decision threshold" />
                <small>Higher values reduce false positives but may miss attacks.</small>
              </div>
              <Button className="run-button" onClick={() => runMonitor()} disabled={monitorLoading}>{monitorLoading ? "Scoring 600 events…" : "Recompute metrics"} <ArrowIcon /></Button>
            </div>

            <div className="metric-cards" aria-live="polite">
              {[
                ["Precision", monitorResult?.metrics.precision],
                ["Recall", monitorResult?.metrics.recall],
                ["F1 score", monitorResult?.metrics.f1],
                ["False-positive rate", monitorResult?.metrics.falsePositiveRate],
              ].map(([label, value]) => (
                <div key={String(label)}><span>{label}</span><strong>{typeof value === "number" ? (value * 100).toFixed(1) + "%" : "—"}</strong></div>
              ))}
              <div className="drift-metric"><span>PSI drift</span><strong>{monitorResult?.metrics.psi ?? "—"}</strong><b>{monitorResult?.metrics.driftStatus ?? "WAITING"}</b></div>
            </div>

            <div className="monitor-grid">
              <div className="distribution-chart">
                <div className="chart-head"><span className="eyebrow-small">Risk-score distribution</span><div><i /> baseline <i /> current</div></div>
                <div className="bars">
                  {monitorResult?.distribution.map((bin) => {
                    const max = Math.max(...monitorResult.distribution.flatMap((item) => [item.baseline, item.current]), 1);
                    return (
                      <div className="bar-group" key={bin.label}>
                        <div><i style={{ height: (bin.baseline / max) * 100 + "%" }} /><i style={{ height: (bin.current / max) * 100 + "%" }} /></div>
                        <span>{bin.label.split("–")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="confusion-panel">
                <span className="eyebrow-small">Confusion matrix</span>
                <div className="matrix">
                  <div className="matrix-label" />
                  <div className="matrix-label">Pred +</div>
                  <div className="matrix-label">Pred −</div>
                  <div className="matrix-label">Actual +</div>
                  <div className="matrix-cell good"><strong>{monitorResult?.confusion.tp ?? "—"}</strong><span>True positive</span></div>
                  <div className="matrix-cell warn"><strong>{monitorResult?.confusion.fn ?? "—"}</strong><span>False negative</span></div>
                  <div className="matrix-label">Actual −</div>
                  <div className="matrix-cell warn"><strong>{monitorResult?.confusion.fp ?? "—"}</strong><span>False positive</span></div>
                  <div className="matrix-cell good"><strong>{monitorResult?.confusion.tn ?? "—"}</strong><span>True negative</span></div>
                </div>
              </div>

              <div className="impact-panel">
                <span className="eyebrow-small">Global feature impact</span>
                {monitorResult?.featureImpact.map((feature) => (
                  <div className="impact-row" key={feature.feature}>
                    <span>{feature.feature.replace(/([A-Z])/g, " $1")}</span>
                    <i><b style={{ width: feature.impact + "%" }} /></i>
                    <strong>{feature.impact}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="build-notes">
            <div><span>Why it matters</span><p>A model is not done at deployment. Thresholds, drift, class imbalance, and false-positive cost decide whether it remains useful.</p></div>
            <div><span>Production evolution</span><p>Stream prediction logs, add delayed labels, monitor slices, alert on PSI and performance, and automate champion–challenger evaluation.</p></div>
            <VideoSlot accent="lime" />
          </div>
          </CollapsibleContent>
          </Collapsible>
        </article>
      </section>

      <section className="profile" id="about" aria-labelledby="profile-title">
        <div>
          <p className="kicker"><span /> The person behind the projects</p>
          <h2 id="profile-title">Thoughtful engineering.
              From end to end.</h2>
        </div>
        <div className="profile-copy">
          <p>I’m a mechatronics engineer with an emphasis in artificial intelligence and computer vision, currently working as a Lead Cybersecurity Data Scientist.</p>
          <p>I build across the whole path: data contracts, features, models, APIs, agent orchestration, evaluation, monitoring, and the interface where a person decides whether to trust the result.</p>
          <div className="profile-meta">
            <div><span>Core</span><strong>Python · SQL · ML · Data engineering</strong></div>
            <div><span>Applied AI</span><strong>RAG · Agents · Embeddings · Evals</strong></div>
            <div><span>Platforms</span><strong>Azure · Databricks · APIs · CI/CD</strong></div>
          </div>
        </div>
      </section>

      <footer>
        <div>
          <p className="kicker"><span /> Get in touch</p>
          <h2>Great work starts
              with a conversation.</h2>
        </div>
        <div className="footer-links">
          <a href="mailto:nikolovaleo@gmail.com">nikolovaleo@gmail.com <ArrowIcon /></a>
          <a href="https://www.linkedin.com/in/nikolovaleo/" target="_blank" rel="noreferrer">LinkedIn <ArrowIcon /></a>
        </div>
        <p className="copyright">© 2026 Leonardo Ureña Nikolova · AI engineering & data science · Costa Rica</p>
      </footer>
    </main>
  );
}
