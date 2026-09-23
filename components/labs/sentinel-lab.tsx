"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { runModelLab } from "@/lib/platform";
import { EndpointBadge, LabError, LiveSummary, Metric, RangeField, useLabEndpoint, type LabVariant } from "./lab-kit";

type ModelResult = ReturnType<typeof runModelLab>;
type Controls = { drift: number; threshold: number; sampleIndex: number };

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

function ScoreHistogram({ distribution, threshold, drift }: { distribution: ModelResult["distribution"]; threshold: number; drift: number }) {
  const max = Math.max(1, ...distribution.reference, ...distribution.current);
  const label = `Champion score distribution in ten bins. Reference counts: ${distribution.reference.join(", ")}. Current counts: ${distribution.current.join(", ")}. Decision threshold at ${threshold}%.`;
  return <figure className="histogram">
    <div className="histogram-plot" role="img" aria-label={label}>
      {distribution.reference.map((count, index) => <div className="histogram-bin" key={index}>
        <i style={{ height: `${(count / max) * 100}%` }} />
        <b style={{ height: `${(distribution.current[index] / max) * 100}%` }} />
      </div>)}
      <span className="histogram-threshold" style={{ left: `${threshold}%` }}><em>threshold</em></span>
    </div>
    <div className="histogram-axis" aria-hidden="true"><span>0.0</span><span>0.5</span><span>1.0</span></div>
    <figcaption>
      <span><i className="swatch swatch-reference" />Reference population</span>
      <span><i className="swatch swatch-current" />Current · {drift}% drift</span>
    </figcaption>
  </figure>;
}

export function SentinelLab({ initial, variant }: { initial: ModelResult; variant: LabVariant }) {
  const id = useId();
  const compact = variant === "compact";
  const [controls, setControls] = useState<Controls>({ drift: initial.controls.drift, threshold: Math.round(initial.controls.threshold * 100), sampleIndex: initial.sample.index });
  const { data: model, loading, error, latency, run } = useLabEndpoint<ModelResult>("/api/monitor", initial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const pending = timer;
    return () => clearTimeout(pending.current);
  }, []);

  function update(key: keyof Controls, value: number) {
    const next = { ...controls, [key]: value };
    setControls(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void run({ drift: next.drift, threshold: next.threshold / 100, sampleIndex: next.sampleIndex }), 160);
  }

  const [baseline, champion] = model.models;
  const { metrics, dataset, sample } = model;
  const driftTone = metrics.driftStatus === "ACTION" ? "alert" : metrics.driftStatus === "WATCH" ? "warn" : "good";
  const maxContribution = Math.max(0.001, ...sample.contributions.map(item => Math.abs(item.contribution)));

  return <div className="lab lab-sentinel" data-variant={variant} aria-busy={loading}>
    <div className="lab-toolbar">
      <div className="range-group">
        <RangeField id={`${id}-drift`} label="Population drift" value={controls.drift} min={0} max={100} format={value => `${value}%`} onChange={value => update("drift", value)} />
        <RangeField id={`${id}-threshold`} label="Decision threshold" value={controls.threshold} min={20} max={85} format={value => `${value}%`} onChange={value => update("threshold", value)} />
        {!compact && <RangeField id={`${id}-sample`} label="Explain test sample" value={controls.sampleIndex} min={0} max={99} format={value => `#${value}`} onChange={value => update("sampleIndex", value)} />}
      </div>
      <EndpointBadge endpoint="/api/monitor" latency={latency} loading={loading} />
    </div>
    <LabError message={error} />
    <dl className="metrics">
      <Metric label="Precision" value={percent(metrics.precision)} detail="champion" />
      <Metric label="Recall" value={percent(metrics.recall)} detail="champion" />
      <Metric label="F1" value={metrics.f1.toFixed(3)} detail={`baseline ${baseline.f1.toFixed(3)}`} />
      {!compact && <Metric label="False-positive rate" value={percent(metrics.falsePositiveRate)} detail={`${metrics.confusion.fp} of ${metrics.confusion.fp + metrics.confusion.tn} normal rows`} />}
      <Metric label="Score drift (PSI)" value={metrics.psi.toFixed(3)} detail={metrics.driftStatus} tone={driftTone} />
    </dl>
    <div className="lab-body sentinel-body">
      <section className="panel" aria-labelledby={`${id}-dist`}>
        <header className="panel-head"><h3 id={`${id}-dist`}>Score distribution</h3><p>Champion scores on reference vs. shifted traffic</p></header>
        <ScoreHistogram distribution={model.distribution} threshold={controls.threshold} drift={controls.drift} />
      </section>
      <section className="panel" aria-labelledby={`${id}-compare`}>
        <header className="panel-head"><h3 id={`${id}-compare`}>Champion vs. baseline</h3><p>Same {dataset.testRows}-row test population and threshold</p></header>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th scope="col">Model</th><th scope="col">Precision</th><th scope="col">Recall</th><th scope="col">F1</th>{!compact && <th scope="col">FPR</th>}</tr></thead>
          <tbody>{[champion, baseline].map(item => <tr key={item.name}>
            <th scope="row">{item.name}</th><td>{percent(item.precision)}</td><td>{percent(item.recall)}</td><td>{item.f1.toFixed(3)}</td>{!compact && <td>{percent(item.falsePositiveRate)}</td>}
          </tr>)}</tbody>
        </table></div>
        {!compact && <div className="confusion" role="table" aria-label="Champion confusion matrix">
          <div role="row"><span role="columnheader" /><span role="columnheader">Predicted attack</span><span role="columnheader">Predicted normal</span></div>
          <div role="row"><span role="rowheader">Actual attack</span><strong role="cell" data-tone="good">{metrics.confusion.tp}<small>true positive</small></strong><strong role="cell" data-tone="warn">{metrics.confusion.fn}<small>missed</small></strong></div>
          <div role="row"><span role="rowheader">Actual normal</span><strong role="cell" data-tone="warn">{metrics.confusion.fp}<small>false alarm</small></strong><strong role="cell" data-tone="good">{metrics.confusion.tn}<small>true negative</small></strong></div>
        </div>}
      </section>
    </div>
    {!compact && <div className="lab-body sentinel-body">
      <section className="panel" aria-labelledby={`${id}-explain`}>
        <header className="panel-head"><h3 id={`${id}-explain`}>Prediction explanation</h3><p>Test sample #{sample.index} · actual label: {sample.label}</p></header>
        <div className="prediction">
          <div><strong>{percent(sample.probability)}</strong><span>champion score (uncalibrated)</span></div>
          <b data-decision={sample.decision}>{sample.decision}</b>
        </div>
        <ul className="contributions">{sample.contributions.map(item => <li key={item.feature}>
          <span>{item.feature}</span>
          <i aria-hidden="true"><b className={item.contribution < 0 ? "is-negative" : undefined} style={{ width: `${(Math.abs(item.contribution) / maxContribution) * 100}%` }} /></i>
          <strong>{item.contribution > 0 ? "+" : ""}{item.contribution.toFixed(3)}</strong>
        </li>)}</ul>
        <p className="logit-sum">Intercept <strong>{model.model.bias.toFixed(3)}</strong> + contributions = logit <strong>{(model.model.bias + sample.contributions.reduce((sum, item) => sum + item.contribution, 0)).toFixed(3)}</strong></p>
        <p className="lab-note">Logit contributions (weight × feature value) explain this linear model’s output. They are not causal effects.</p>
      </section>
      <section className="panel" aria-labelledby={`${id}-model`}>
        <header className="panel-head"><h3 id={`${id}-model`}>Fitted champion</h3><p>{model.model.type} · {model.model.epochs} epochs · seed {dataset.seed}</p></header>
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th scope="col">Feature</th><th scope="col">Weight</th></tr></thead>
          <tbody>
            {model.model.features.map((feature, index) => <tr key={feature}><th scope="row">{feature}</th><td>{model.model.weights[index].toFixed(3)}</td></tr>)}
            <tr><th scope="row">bias</th><td>{model.model.bias.toFixed(3)}</td></tr>
          </tbody>
        </table></div>
      </section>
    </div>}
    <p className="lab-note"><strong>Synthetic data.</strong> {dataset.trainRows.toLocaleString("en-US")} training and {dataset.testRows} test rows generated with a fixed seed, inspired by the UNSW-NB15 feature domain. These are not official benchmark results.</p>
    <LiveSummary>{loading ? "" : `Precision ${percent(metrics.precision)}, recall ${percent(metrics.recall)}, PSI ${metrics.psi.toFixed(3)}, ${metrics.driftStatus.toLowerCase()}.`}</LiveSummary>
  </div>;
}
