"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { RetrieverId, runRetrievalBench } from "@/lib/retrieval-bench";
import { EndpointBadge, LabError, LiveSummary, Metric, RangeField, useLabEndpoint, type LabVariant } from "./lab-kit";

type BenchResult = ReturnType<typeof runRetrievalBench>;

const retrieverOptions: Array<{ id: RetrieverId; label: string; detail: string }> = [
  { id: "bm25", label: "BM25", detail: "lexical baseline" },
  { id: "ngram", label: "N-gram vectors", detail: "character trigrams" },
  { id: "hybrid", label: "Hybrid RRF", detail: "rank fusion" },
];

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const signed = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(3)}`;

function Ranking({ items, label }: { items: BenchResult["inspect"]["candidate"]; label: string }) {
  return <ol className="ranking" aria-label={label}>{items.map((item, index) => <li key={item.id} data-top={item.grade > 0 || undefined}>
    <span>{item.id}</span>
    <strong>{item.title}{item.grade > 0 ? ` · grade ${item.grade}` : ""}</strong>
    <em>{index + 1}</em>
  </li>)}</ol>;
}

export function PrismLab({ initial, variant }: { initial: BenchResult; variant: LabVariant }) {
  const id = useId();
  const compact = variant === "compact";
  const [retriever, setRetriever] = useState<RetrieverId>(initial.controls.retriever);
  const [expansion, setExpansion] = useState(initial.controls.expansion);
  const [k, setK] = useState(initial.controls.k);
  const [hybridWeight, setHybridWeight] = useState(Math.round(initial.controls.hybridWeight * 100));
  const [inspectId, setInspectId] = useState(initial.controls.inspectId);
  const { data, loading, error, latency, run } = useLabEndpoint<BenchResult>("/api/retrieval", initial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function request(next: { retriever: RetrieverId; expansion: boolean; k: number; hybridWeight: number; inspectId: string }, immediate = false) {
    const body = { retriever: next.retriever, expansion: next.expansion, k: next.k, hybridWeight: next.hybridWeight / 100, inspectId: next.inspectId };
    clearTimeout(timer.current);
    if (immediate) void run(body);
    else timer.current = setTimeout(() => void run(body), 160);
  }

  const controls = { retriever, expansion, k, hybridWeight, inspectId };
  const { candidate, baseline, deltas, gate, slices } = data;
  const maxRecall = Math.max(0.001, ...slices.flatMap(slice => [slice.baseline, slice.candidate]));

  return <div className="lab lab-prism" data-variant={variant} aria-busy={loading}>
    <div className="lab-toolbar">
      <fieldset className="choice-group">
        <legend>Candidate retriever</legend>
        <div className="choices">{retrieverOptions.map(option => <label className="choice" key={option.id}>
          <input type="radio" name={`${id}-retriever`} value={option.id} checked={retriever === option.id} onChange={() => { setRetriever(option.id); request({ ...controls, retriever: option.id }, true); }} />
          <span>{option.label}<small>{option.detail}</small></span>
        </label>)}</div>
      </fieldset>
      <label className="check-field">
        <input type="checkbox" checked={expansion} onChange={event => { setExpansion(event.target.checked); request({ ...controls, expansion: event.target.checked }, true); }} />
        <span>Query expansion</span>
      </label>
      <div className="range-group prism-ranges">
        <RangeField id={`${id}-k`} label="Cutoff k" value={k} min={1} max={10} format={value => `@${value}`} onChange={value => { setK(value); request({ ...controls, k: value }); }} />
        {!compact && <RangeField id={`${id}-weight`} label="Hybrid n-gram weight" value={hybridWeight} min={0} max={100} disabled={retriever !== "hybrid"} format={value => `${value}%`} onChange={value => { setHybridWeight(value); request({ ...controls, hybridWeight: value }); }} />}
      </div>
      <EndpointBadge endpoint="/api/retrieval" latency={latency} loading={loading} />
    </div>
    <LabError message={error} />
    <dl className="metrics">
      <Metric label={`Recall@${k}`} value={percent(candidate.recall)} detail={`${signed(deltas.recall)} vs BM25`} tone={deltas.recall > 0 ? "good" : deltas.recall < 0 ? "alert" : undefined} />
      <Metric label={`Precision@${k}`} value={percent(candidate.precision)} detail={`${signed(deltas.precision)} vs BM25`} />
      <Metric label="MRR" value={candidate.mrr.toFixed(3)} detail={`${signed(deltas.mrr)} vs BM25`} tone={deltas.mrr < 0 ? "alert" : "good"} />
      <Metric label={`nDCG@${k}`} value={candidate.ndcg.toFixed(3)} detail={`${signed(deltas.ndcg)} vs BM25`} />
    </dl>
    <div className={`gate is-${gate.verdict.toLowerCase()}`}>
      <div>
        <span className="gate-label">{gate.verdict}</span>
        <strong>{gate.verdict === "PROMOTE" ? "Candidate clears the release gate." : "Candidate is held against the frozen BM25 baseline."}</strong>
        <p>{gate.method}. Not LLM evaluation — no LLM judge.</p>
      </div>
      <ul>{gate.rules.map(rule => <li key={rule.name} data-passed={rule.passed}><span aria-hidden="true">{rule.passed ? "✓" : "✕"}</span>{rule.name}<small>{rule.detail}</small></li>)}</ul>
    </div>
    <div className="lab-body sentinel-body">
      <section className="panel" aria-labelledby={`${id}-slices`}>
        <header className="panel-head"><h3 id={`${id}-slices`}>Recall by query slice</h3><p>Gate fails if any slice drops more than 0.10</p></header>
        <ul className="slice-bars">{slices.map(slice => <li key={slice.slice}>
          <span>{slice.slice}</span>
          <i aria-hidden="true">
            <b className="slice-baseline" style={{ width: `${(slice.baseline / maxRecall) * 100}%` }} />
            <b className="slice-candidate" style={{ width: `${(slice.candidate / maxRecall) * 100}%` }} />
          </i>
          <strong data-tone={slice.delta < -0.1 ? "alert" : slice.delta > 0 ? "good" : undefined}>{signed(slice.delta)}</strong>
        </li>)}</ul>
        <p className="lab-note"><span className="swatch swatch-reference" /> BM25 baseline · <span className="swatch swatch-current" /> candidate</p>
      </section>
      <section className="panel" aria-labelledby={`${id}-inspect`}>
        <header className="panel-head"><h3 id={`${id}-inspect`}>Query inspector</h3><p>{data.inspect.id} · {data.inspect.slice} · “{data.inspect.text}”</p></header>
        <div className="inspect-grid">
          <div>
            <h4>BM25 top 5</h4>
            <Ranking items={data.inspect.baseline} label="Baseline ranking" />
          </div>
          <div>
            <h4>{candidate.name} top 5</h4>
            <Ranking items={data.inspect.candidate} label="Candidate ranking" />
          </div>
        </div>
      </section>
    </div>
    {!compact && <div className="lab-body sentinel-body">
      <section className="panel" aria-labelledby={`${id}-queries`}>
        <header className="panel-head"><h3 id={`${id}-queries`}>Per-query recall</h3><p>Select a row to inspect rankings</p></header>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th scope="col">Query</th><th scope="col">Slice</th><th scope="col">BM25</th><th scope="col">Candidate</th><th scope="col">Status</th></tr></thead>
          <tbody>{data.queries.map(query => <tr key={query.id}>
            <th scope="row"><button type="button" className="query-pick" aria-pressed={inspectId === query.id} onClick={() => { setInspectId(query.id); request({ ...controls, inspectId: query.id }, true); }}>{query.id} · {query.text}</button></th>
            <td>{query.slice}</td>
            <td>{query.baselineRecall.toFixed(2)}</td>
            <td>{query.candidateRecall.toFixed(2)}</td>
            <td>{query.status}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
      <section className="panel" aria-labelledby={`${id}-fail`}>
        <header className="panel-head"><h3 id={`${id}-fail`}>Remaining misses</h3><p>Still incomplete at k={k}</p></header>
        {data.failures.length ? <ul className="failure-list">{data.failures.map(item => <li key={item.id}>
          <span>{item.id} · {item.slice}</span>
          <strong>{item.text}</strong>
          <p>Missed {item.missed.join(", ") || "—"}. Top distractor: {item.distractor}</p>
        </li>)}</ul> : <p className="empty-state">Every labeled document is inside the cutoff.</p>}
      </section>
    </div>}
    <p className="lab-note"><strong>Synthetic judgments.</strong> {data.dataset.documents} documents and {data.dataset.queries} queries. {data.notes.vectors} {data.notes.evaluation} Baseline is {baseline.name}.</p>
    <LiveSummary>{loading ? "" : `${gate.verdict}. Recall ${percent(candidate.recall)}, MRR ${candidate.mrr.toFixed(3)}.`}</LiveSummary>
  </div>;
}
