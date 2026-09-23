"use client";

import { useId, useState } from "react";
import type { analyzeGraph } from "@/lib/platform";
import { EndpointBadge, LabError, LiveSummary, Metric, useLabEndpoint, type LabVariant } from "./lab-kit";

type GraphResult = ReturnType<typeof analyzeGraph>;
type GraphPath = GraphResult["paths"][number];
type Resolution = GraphResult["entityResolution"];

const NODE_RADIUS = 15;
const layout: Record<string, { x: number; y: number; above?: boolean }> = {
  internet: { x: 70, y: 150 },
  "public-api": { x: 250, y: 74, above: true },
  riley: { x: 250, y: 226 },
  "identity-gw": { x: 450, y: 74, above: true },
  "fin-lt-042": { x: 450, y: 226 },
  "finance-app": { x: 630, y: 150 },
  warehouse: { x: 785, y: 150 },
  backup: { x: 900, y: 150 },
};
const round = (value: number) => Math.round(value * 10) / 10;

function AttackGraph({ graph, path }: { graph: GraphResult; path?: GraphPath }) {
  const pathEdges = new Set(path?.edgeIds ?? []);
  const pathNodes = new Set(path?.ids ?? []);
  const description = path
    ? `Highlighted path: ${path.labels.join(" to ")}, score ${path.risk}%.`
    : "No path to critical data remains under this scenario.";
  return <div className="graph-canvas" role="group" aria-label="Attack graph, scrolls horizontally on small screens" tabIndex={0}>
    <svg viewBox="0 0 960 300" role="img" aria-labelledby="atlas-graph-title atlas-graph-desc">
      <title id="atlas-graph-title">Synthetic security graph</title>
      <desc id="atlas-graph-desc">{`${graph.summary.entities} entities and ${graph.summary.activeEdges} active relationships. ${description}`}</desc>
      <defs>
        <marker id="atlas-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" className="arrow-idle" /></marker>
        <marker id="atlas-arrow-path" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" className="arrow-path" /></marker>
      </defs>
      {graph.edges.map(edge => {
        const from = layout[edge.from];
        const to = layout[edge.to];
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
        const x1 = round(from.x + cos * (NODE_RADIUS + 4));
        const y1 = round(from.y + sin * (NODE_RADIUS + 4));
        const x2 = round(to.x - cos * (NODE_RADIUS + 7));
        const y2 = round(to.y - sin * (NODE_RADIUS + 7));
        const state = !edge.active ? "removed" : pathEdges.has(edge.id) ? "path" : "idle";
        return <g key={edge.id} className={`graph-edge is-${state}`}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} markerEnd={state === "removed" ? undefined : state === "path" ? "url(#atlas-arrow-path)" : "url(#atlas-arrow)"} />
          {state === "path" && <text className="edge-label" x={round((x1 + x2) / 2 + sin * 11)} y={round((y1 + y2) / 2 - cos * 11)}>{Math.round(edge.likelihood * 100)}%</text>}
          {state === "removed" && <text className="edge-cut" x={round((x1 + x2) / 2)} y={round((y1 + y2) / 2 + 4)}>×</text>}
          <title>{`${edge.relation} · likelihood ${edge.likelihood} · control: ${edge.control}${edge.active ? "" : " (applied)"}`}</title>
        </g>;
      })}
      {graph.nodes.map(node => {
        const { x, y, above } = layout[node.id];
        return <g key={node.id} className={`graph-node kind-${node.kind}${pathNodes.has(node.id) ? " is-path" : ""}`} transform={`translate(${x} ${y})`}>
          <circle className="node-ring" r={NODE_RADIUS} />
          <circle className="node-core" r={5} />
          <text className="node-label" y={above ? -26 : 34}>{node.label}</text>
          <text className="node-kind" y={above ? -42 : 50}>{node.kind}</text>
        </g>;
      })}
    </svg>
  </div>;
}

const decisionLabel = { MATCH: "Linked", REVIEW: "Needs review", NO_MATCH: "Not linked" } as const;

function RecordFields({ record }: { record: Resolution["anchor"]["record"] }) {
  const fields = [["Hostname", record.hostname], ["Device ID", record.deviceId], ["IP", record.ip], ["Owner", record.owner], ["OS", record.os]];
  return <dl className="record-fields">{fields.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value || "—"}</dd></div>)}</dl>;
}

function EntityResolution({ resolution }: { resolution: Resolution }) {
  return <section className="panel resolution-panel" aria-labelledby="atlas-er-title">
    <header className="panel-head">
      <h3 id="atlas-er-title">Entity resolution · {resolution.label}</h3>
      <p>Weighted field comparison against the EDR record · link ≥ {resolution.threshold.toFixed(2)} · review ≥ {resolution.reviewFloor.toFixed(2)}</p>
    </header>
    <div className="resolution-grid">
      <article className="record-card is-anchor">
        <div className="record-head"><span>{resolution.anchor.source}</span><b>Anchor record</b></div>
        <RecordFields record={resolution.anchor.record} />
      </article>
      {resolution.candidates.map(candidate => <article className="record-card" key={candidate.source}>
        <div className="record-head"><span>{candidate.source}</span><b data-decision={candidate.decision}>{decisionLabel[candidate.decision]}</b></div>
        <RecordFields record={candidate.record} />
        <div className="record-score"><strong>{candidate.score.toFixed(2)}</strong><span>weighted score</span></div>
        <ul className="feature-bars">{candidate.features.map(feature => <li key={feature.feature}>
          <span>{feature.feature}</span>
          <i aria-hidden="true"><b style={{ width: `${feature.match * 100}%` }} /></i>
          <small>+{feature.contribution.toFixed(2)}</small>
        </li>)}</ul>
      </article>)}
    </div>
    <p className="lab-note">{resolution.linked} of {resolution.candidates.length + 1} records link automatically; borderline pairs go to analyst review. Weights are hand-set for this demo, so scores rank candidates and are not calibrated probabilities.</p>
  </section>;
}

export function AtlasLab({ initial, remediations, variant }: { initial: GraphResult; remediations: Array<{ id: string; label: string }>; variant: LabVariant }) {
  const groupName = useId();
  const compact = variant === "compact";
  const [remediation, setRemediation] = useState(initial.remediation.id);
  const [selected, setSelected] = useState(0);
  const { data: graph, loading, error, latency, run } = useLabEndpoint<GraphResult>("/api/graph", initial);
  const { summary } = graph;
  const visiblePaths = graph.paths.slice(0, compact ? 3 : 6);
  const highlighted = graph.paths[Math.min(selected, graph.paths.length - 1)];

  function choose(id: string) {
    setRemediation(id);
    setSelected(0);
    void run({ remediation: id });
  }

  return <div className="lab lab-atlas" data-variant={variant} aria-busy={loading}>
    <div className="lab-toolbar">
      <fieldset className="choice-group">
        <legend>Remediation scenario</legend>
        <div className="choices">{remediations.map(option => <label className="choice" key={option.id}>
          <input type="radio" name={groupName} value={option.id} checked={remediation === option.id} onChange={() => choose(option.id)} />
          <span>{option.label}</span>
        </label>)}</div>
      </fieldset>
      <EndpointBadge endpoint="/api/graph" latency={latency} loading={loading} />
    </div>
    <LabError message={error} />
    <dl className="metrics">
      <Metric label="Reachable critical paths" value={summary.paths} detail={`of ${summary.baselinePaths} before remediation`} />
      <Metric label="Paths removed" value={summary.eliminated} detail={summary.eliminated > 0 ? "by this control" : "no change"} tone={summary.eliminated > 0 ? "good" : undefined} />
      <Metric label="Top path score" value={summary.paths ? `${summary.highestRisk.toFixed(1)}%` : "—"} detail={summary.paths ? "edge-likelihood product" : `was ${summary.baselineHighestRisk.toFixed(1)}% before remediation`} tone={summary.paths ? undefined : "good"} />
      {!compact && <Metric label="Graph coverage" value={summary.entities} detail={`entities from ${summary.sources} synthetic sources`} />}
    </dl>
    <div className="lab-body atlas-body">
      <section className="panel graph-panel" aria-label="Attack graph">
        <AttackGraph graph={graph} path={highlighted} />
        <ul className="graph-legend" aria-hidden="true">
          <li><i className="legend-path" />Selected path</li>
          <li><i className="legend-removed" />Removed by control</li>
          <li><i className="legend-entry" />Entry point</li>
          <li><i className="legend-data" />Critical data</li>
        </ul>
      </section>
      <section className="panel path-panel" aria-labelledby={`${groupName}-paths`}>
        <header className="panel-head"><h3 id={`${groupName}-paths`}>Ranked critical paths</h3><p>Select a path to trace it on the graph</p></header>
        {visiblePaths.length ? <ol className="path-list">{visiblePaths.map((path, index) => <li key={path.ids.join(">")}>
          <button type="button" aria-pressed={highlighted === path} onClick={() => setSelected(index)}>
            <span className="path-rank">{index + 1}</span>
            <span className="path-route">{path.labels.join(" → ")}</span>
            <strong>{path.risk.toFixed(1)}%</strong>
          </button>
        </li>)}</ol> : <p className="empty-state">No path to critical data remains under this scenario.</p>}
        {compact && summary.paths > visiblePaths.length && <p className="lab-note">+{summary.paths - visiblePaths.length} more paths in the full lab.</p>}
      </section>
    </div>
    {!compact && <EntityResolution resolution={graph.entityResolution} />}
    <p className="lab-note">Path score multiplies assumed edge likelihoods to rank paths. It is a heuristic, not a trained model or a probability of compromise.</p>
    <LiveSummary>{loading ? "" : summary.paths ? `${summary.paths} reachable critical paths. Top path score ${summary.highestRisk}%.` : "No reachable critical paths remain."}</LiveSummary>
  </div>;
}
