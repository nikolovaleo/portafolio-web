"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { runTriageLab } from "@/lib/triage";
import { EndpointBadge, LabError, LiveSummary, Metric, RangeField, useLabEndpoint, type LabVariant } from "./lab-kit";

type TriageResult = ReturnType<typeof runTriageLab>;

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

function HighlightedReport({ text, contributions }: { text: string; contributions: TriageResult["report"]["contributions"] }) {
  const weights = new Map<string, number>(contributions.map(item => [item.key, item.contribution]));
  const parts = text.split(/([A-Za-z][A-Za-z0-9]{2,}|\b(?:\d{1,3}\.){3}\d{1,3}\b)/);
  return <p className="report-text">{parts.map((part, index) => {
    const contribution = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(part) ? weights.get("url_ip") : weights.get(part.toLowerCase());
    if (!contribution) return part;
    return <mark key={`${part}-${index}`} className={contribution > 0 ? "is-phish" : "is-benign"} title={`${contribution > 0 ? "+" : ""}${contribution.toFixed(3)}`}>{part}</mark>;
  })}</p>;
}

function ClassHistogram({ distribution, threshold }: { distribution: TriageResult["distribution"]; threshold: number }) {
  const max = Math.max(1, ...distribution.benign, ...distribution.phishing);
  const label = `Score distribution in ten bins. Benign counts: ${distribution.benign.join(", ")}. Phishing counts: ${distribution.phishing.join(", ")}. Auto-close threshold at ${threshold}%.`;
  return <figure className="histogram">
    <div className="histogram-plot" role="img" aria-label={label}>
      {distribution.benign.map((count, index) => <div className="histogram-bin" key={index}>
        <i style={{ height: `${(count / max) * 100}%` }} />
        <b style={{ height: `${(distribution.phishing[index]! / max) * 100}%` }} />
      </div>)}
      <span className="histogram-threshold" style={{ left: `${threshold}%` }}><em>threshold</em></span>
    </div>
    <div className="histogram-axis" aria-hidden="true"><span>0.0</span><span>0.5</span><span>1.0</span></div>
    <figcaption>
      <span><i className="swatch swatch-reference" />Benign</span>
      <span><i className="swatch swatch-current" />Phishing</span>
    </figcaption>
  </figure>;
}

export function HermesLab({ initial, variant }: { initial: TriageResult; variant: LabVariant }) {
  const id = useId();
  const compact = variant === "compact";
  const [threshold, setThreshold] = useState(Math.round(initial.controls.threshold * 100));
  const [sampleId, setSampleId] = useState(initial.controls.sampleId === "custom" ? "lure" : initial.controls.sampleId);
  const [draft, setDraft] = useState("");
  const { data, loading, error, latency, run } = useLabEndpoint<TriageResult>("/api/triage", initial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const custom = draft.trim().length > 0;

  useEffect(() => () => clearTimeout(timer.current), []);

  function request(nextThreshold: number, nextSample: string, nextText: string, immediate = false) {
    const body = { threshold: nextThreshold / 100, sampleId: nextText.trim() ? "custom" : nextSample, text: nextText.trim() || undefined };
    clearTimeout(timer.current);
    if (immediate) void run(body);
    else timer.current = setTimeout(() => void run(body), 160);
  }

  function chooseSample(next: string) {
    setSampleId(next);
    setDraft("");
    request(threshold, next, "", true);
  }

  const { metrics, baseline, report, dataset } = data;
  const maxContribution = Math.max(0.001, ...report.contributions.map(item => Math.abs(item.contribution)));
  const missedTone = metrics.missed > 0 ? "alert" : "good";

  return <div className="lab lab-hermes" data-variant={variant} aria-busy={loading}>
    <div className="lab-toolbar">
      <fieldset className="choice-group">
        <legend>Sample report</legend>
        <div className="choices">{data.samples.map(sample => <label className="choice" key={sample.id}>
          <input type="radio" name={`${id}-sample`} value={sample.id} checked={!custom && sampleId === sample.id} onChange={() => chooseSample(sample.id)} />
          <span>{sample.title}<small>{sample.label ? "phishing" : "benign"}</small></span>
        </label>)}</div>
      </fieldset>
      <div className="range-group hermes-threshold">
        <RangeField id={`${id}-threshold`} label="Auto-close threshold" value={threshold} min={20} max={85} format={value => `${value}%`} onChange={value => { setThreshold(value); request(value, sampleId, draft); }} />
      </div>
      <EndpointBadge endpoint="/api/triage" latency={latency} loading={loading} />
    </div>
    {!compact && <div className="aegis-command">
      <div className="field">
        <label htmlFor={`${id}-text`}>Score your own text</label>
        <textarea id={`${id}-text`} value={draft} rows={2} maxLength={2000} aria-describedby={`${id}-text-help`} onChange={event => { const next = event.target.value; setDraft(next); request(threshold, sampleId, next); }} />
        <p id={`${id}-text-help`}>Optional. Leave empty to use the selected sample. Synthetic scoring only; nothing is sent to an email system.</p>
      </div>
    </div>}
    <LabError message={error} />
    <dl className="metrics">
      <Metric label="Benign auto-closed" value={percent(metrics.trueNegativeRate)} detail="true-negative rate" />
      <Metric label="Phishing caught" value={percent(metrics.recall)} detail="recall" />
      <Metric label="Analyst workload" value={percent(metrics.workload)} detail={`${percent(metrics.workloadReduction)} vs reviewing all`} />
      <Metric label="Missed phishing" value={metrics.missed} detail={metrics.missed ? "false negatives" : "none missed"} tone={missedTone} />
    </dl>
    <div className="lab-body sentinel-body">
      <section className="panel" aria-labelledby={`${id}-report`}>
        <header className="panel-head">
          <h3 id={`${id}-report`}>{custom ? "Custom text" : report.title ?? "Selected report"}</h3>
          <p>{report.family ?? "Unlabeled"}{report.label === undefined ? "" : report.label ? " · actual phishing" : " · actual benign"}</p>
        </header>
        <div className="prediction">
          <div><strong>{percent(report.probability)}</strong><span>champion score (uncalibrated)</span></div>
          <b data-decision={report.decision}>{report.decision}</b>
        </div>
        <HighlightedReport text={report.text} contributions={report.contributions} />
        <ul className="contributions">{report.contributions.map(item => <li key={item.key}>
          <span>{item.feature}</span>
          <i aria-hidden="true"><b className={item.contribution < 0 ? "is-negative" : undefined} style={{ width: `${(Math.abs(item.contribution) / maxContribution) * 100}%` }} /></i>
          <strong>{item.contribution > 0 ? "+" : ""}{item.contribution.toFixed(3)}</strong>
        </li>)}</ul>
        <p className="logit-sum">Intercept <strong>{report.bias.toFixed(3)}</strong> + contributions = logit <strong>{report.logit.toFixed(3)}</strong></p>
      </section>
      {compact ? <section className="panel" aria-labelledby={`${id}-compare`}>
        <header className="panel-head"><h3 id={`${id}-compare`}>Champion vs. keyword rules</h3><p>Same {dataset.testRows}-report test set</p></header>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th scope="col">System</th><th scope="col">TNR</th><th scope="col">Recall</th><th scope="col">F1</th></tr></thead>
          <tbody>
            <tr><th scope="row">Fitted logistic</th><td>{percent(metrics.trueNegativeRate)}</td><td>{percent(metrics.recall)}</td><td>{metrics.f1.toFixed(3)}</td></tr>
            <tr><th scope="row">{baseline.name}</th><td>{percent(baseline.trueNegativeRate)}</td><td>{percent(baseline.recall)}</td><td>{baseline.f1.toFixed(3)}</td></tr>
          </tbody>
        </table></div>
        <p className="lab-note">The baseline is a hand-written keyword and URL heuristic, not a trained model.</p>
      </section> : <section className="panel" aria-labelledby={`${id}-dist`}>
        <header className="panel-head"><h3 id={`${id}-dist`}>Score distribution</h3><p>Champion scores by true class</p></header>
        <ClassHistogram distribution={data.distribution} threshold={threshold} />
      </section>}
    </div>
    {!compact && <div className="lab-body sentinel-body">
      <section className="panel" aria-labelledby={`${id}-compare`}>
        <header className="panel-head"><h3 id={`${id}-compare`}>Champion vs. keyword rules</h3><p>Same {dataset.testRows}-report test set · rules have a fixed operating point</p></header>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th scope="col">System</th><th scope="col">TNR</th><th scope="col">Recall</th><th scope="col">Precision</th><th scope="col">F1</th><th scope="col">Workload</th></tr></thead>
          <tbody>
            <tr><th scope="row">Fitted logistic</th><td>{percent(metrics.trueNegativeRate)}</td><td>{percent(metrics.recall)}</td><td>{percent(metrics.precision)}</td><td>{metrics.f1.toFixed(3)}</td><td>{percent(metrics.workload)}</td></tr>
            <tr><th scope="row">{baseline.name}</th><td>{percent(baseline.trueNegativeRate)}</td><td>{percent(baseline.recall)}</td><td>{percent(baseline.precision)}</td><td>{baseline.f1.toFixed(3)}</td><td>{percent(baseline.workload)}</td></tr>
          </tbody>
        </table></div>
        <p className="lab-note">The baseline is a hand-written keyword and URL heuristic, not a trained model.</p>
      </section>
      <section className="panel" aria-labelledby={`${id}-confusion`}>
        <header className="panel-head"><h3 id={`${id}-confusion`}>Confusion matrix</h3><p>Champion at this threshold</p></header>
        <div className="confusion" role="table" aria-label="Champion confusion matrix">
          <div role="row"><span role="columnheader" /><span role="columnheader">Sent to analyst</span><span role="columnheader">Auto-closed</span></div>
          <div role="row"><span role="rowheader">Actual phishing</span><strong role="cell" data-tone="good">{metrics.confusion.tp}<small>caught</small></strong><strong role="cell" data-tone="warn">{metrics.confusion.fn}<small>missed</small></strong></div>
          <div role="row"><span role="rowheader">Actual benign</span><strong role="cell" data-tone="warn">{metrics.confusion.fp}<small>false alarm</small></strong><strong role="cell" data-tone="good">{metrics.confusion.tn}<small>auto-closed</small></strong></div>
        </div>
      </section>
    </div>}
    <p className="lab-note"><strong>Synthetic data.</strong> {dataset.trainRows.toLocaleString("en-US")} training and {dataset.testRows} test reports generated with a fixed seed. Scores are uncalibrated. This is a personal lab, not an employer mail filter.</p>
    <LiveSummary>{loading ? "" : `True-negative rate ${percent(metrics.trueNegativeRate)}, recall ${percent(metrics.recall)}, ${metrics.missed} missed phishing. ${report.decision}.`}</LiveSummary>
  </div>;
}
