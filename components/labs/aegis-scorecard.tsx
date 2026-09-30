import scorecard from "@/lib/data/aegis-eval.json";

const percent = (value: number) => `${Math.round(value * 100)}%`;
const criteriaLabels: Record<string, string> = {
  tools: "Called the required tools",
  disposition: "Correct disposition",
  actions: "Proposed the expected actions",
  procedure: "Retrieved the right procedure",
  grounded: "Passed every policy check",
  injectionSafe: "Did not follow injected text",
};

/** Extra actions are allowed by the rubric, so they are not listed as a reason a trial failed. */
const withoutAllowedNotes = (failure: string) => failure.replace(/Extra [^;]+(; )?/g, "").replace(/;\s*$/, "");

/** Server-rendered scorecard from lib/data/aegis-eval.json, produced by scripts/aegis-eval.ts. */
export function AegisScorecard() {
  const { summary, cases, history, trials } = scorecard;
  const injection = cases.find(item => item.caseId === "injection");
  const versions = [...history.map(entry => ({ id: entry.promptVersion, change: entry.change, runs: entry.runs, passRate: entry.passRate, failures: entry.failures })),
    { id: scorecard.promptVersion, change: scorecard.change, runs: summary.runs, passRate: summary.agentPassRate, failures: cases.flatMap(item => item.agent.trials.filter(trial => !trial.pass).map(trial => `${item.label}: ${trial.notes.join("; ")}`)) }];

  return <section className="scorecard" aria-labelledby="scorecard-title">
    <div className="section-head">
      <div><p className="eyebrow">Agent evaluation · {scorecard.createdAt}</p><h2 id="scorecard-title">Scored against ground truth,<br />not vibes.</h2></div>
      <p className="section-lede">Every case ran {trials} times with {scorecard.model}. Each run is scored on six criteria by deterministic code, with no LLM judge. The replays in the lab are trial 1 of each case, not picked for success.</p>
    </div>
    <dl className="metrics scorecard-metrics">
      <div className="metric"><dt>LLM agent pass rate</dt><dd><strong>{percent(summary.agentPassRate)}</strong><small data-tone="good">{cases.reduce((sum, item) => sum + item.agent.passes, 0)}/{summary.runs} runs · prompt {scorecard.promptVersion}</small></dd></div>
      <div className="metric"><dt>Deterministic baseline</dt><dd><strong>{percent(summary.baselinePassRate)}</strong><small>{cases.filter(item => item.baseline.pass).length}/{cases.length} cases · abstains on unseen types</small></dd></div>
      <div className="metric"><dt>Prompt-injection trials</dt><dd><strong>{injection ? `${injection.agent.trials.filter(trial => trial.criteria.injectionSafe).length}/${injection.agent.trials.length}` : "—"}</strong><small>resisted · gate enforces regardless</small></dd></div>
      <div className="metric"><dt>Latency p50 / p95</dt><dd><strong>{(summary.latencyMs.p50 / 1000).toFixed(1)} s</strong><small>p95 {(summary.latencyMs.p95 / 1000).toFixed(1)} s · {summary.meanToolCalls} tool calls</small></dd></div>
      <div className="metric"><dt>Tokens per run</dt><dd><strong>{(summary.meanTokens / 1000).toFixed(1)}k</strong><small>mean, input + output</small></dd></div>
    </dl>
    <div className="scorecard-grid">
      <div className="panel">
        <header className="panel-head"><h3>Per case</h3><p>Agent trials · baseline</p></header>
        <div className="table-scroll"><table className="data-table scorecard-table">
          <thead><tr><th scope="col">Case</th><th scope="col">Type</th><th scope="col">LLM agent</th><th scope="col">Baseline</th></tr></thead>
          <tbody>{cases.map(item => <tr key={item.caseId}>
            <th scope="row">{item.label}<small>{item.id}{item.templated ? "" : " · unseen by baseline"}</small></th>
            <td>{item.kind}</td>
            <td><span className="trial-dots" aria-label={`${item.agent.passes} of ${item.agent.trials.length} trials passed`}>{item.agent.trials.map((trial, index) => <i key={index} data-pass={trial.pass} title={trial.notes.join("; ") || "Passed"} />)}</span>{item.agent.passes}/{item.agent.trials.length}</td>
            <td data-tone={item.baseline.pass ? "good" : "alert"}>{item.baseline.abstained ? "abstains" : item.baseline.pass ? "pass" : "fail"}</td>
          </tr>)}</tbody>
        </table></div>
      </div>
      <div className="panel">
        <header className="panel-head"><h3>Criteria</h3><p>Share of {summary.runs} runs</p></header>
        <ul className="criteria-bars">{Object.entries(summary.criteria).map(([name, value]) => <li key={name}>
          <span>{criteriaLabels[name] ?? name}</span><i aria-hidden="true"><b style={{ width: percent(value) }} /></i><strong>{percent(value)}</strong>
        </li>)}</ul>
      </div>
    </div>
    <div className="panel iteration">
      <header className="panel-head"><h3>Prompt iterations</h3><p>Error analysis → one targeted change → re-run</p></header>
      <ol>{versions.map(version => <li key={version.id}>
        <span className="iteration-version">{version.id}</span>
        <div>
          <strong>{percent(version.passRate)} <small>of {version.runs} runs</small></strong>
          <p>{version.change}</p>
          {version.failures.length > 0 && <ul>{version.failures.map(failure => <li key={failure}>{withoutAllowedNotes(failure)}</li>)}</ul>}
        </div>
      </li>)}</ol>
      <p className="lab-note"><strong>Read this with care.</strong> Five synthetic cases, and the prompt was tuned on those same cases, so {percent(summary.agentPassRate)} is not a held-out result. The rubric allows reasonable extra actions (for example also blocking a malicious IP). The baseline passes its three cases by construction because its answers were hand-written for them. The eval shows the method; a production claim needs a larger held-out set.</p>
    </div>
  </section>;
}
