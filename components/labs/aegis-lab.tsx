"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import type { AgentStep, Evidence } from "@/lib/aegis-agent";
import type { AgentPayload } from "@/lib/aegis-service";
import type { investigateIncident } from "@/lib/platform";
import { EndpointBadge, LabError, LiveSummary, useLabEndpoint, type LabVariant } from "./lab-kit";

type BaselineResult = ReturnType<typeof investigateIncident>;
type CaseOption = { id: string; label: string; reference: string; kind: string; templated: boolean };
export type AgentMeta = { model: string; promptVersion: string; createdAt: string; live: boolean; passes: number; runs: number };
type Mode = "agent" | "baseline";

const defaultQuestion = "What happened, what evidence supports it, and what should we do next?";
const idleTrace = [
  { step: "Planner", status: "idle", detail: "Chooses read-only tools for the selected case." },
  { step: "Tool executor", status: "idle", detail: "Queries identity, endpoint, threat intel, and graph context." },
  { step: "Procedure retrieval", status: "idle", detail: "Ranks response procedures by keyword and incident context." },
  { step: "Evidence synthesis", status: "idle", detail: "Composes cited statements from returned records." },
  { step: "Approval gate", status: "idle", detail: "Blocks containment until a human approves." },
];
const statusLabel: Record<string, string> = { complete: "Done", waiting: "Waiting", blocked: "Blocked", idle: "Ready" };
const approvalLabel: Record<string, string> = { executed: "Approved · action recorded", blocked: "Blocked by the policy gate", awaiting_approval: "Human approval required", failed: "Run failed" };
const dispositionLabel: Record<string, string> = { contain: "Contain", monitor: "Monitor", close_benign: "Close as benign" };
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const REPLAY_BUDGET_MS = 3200;

function parseStatements(answer: string) {
  return answer.split(/(?<=\]\.)\s+/).map(sentence => {
    const match = sentence.match(/^(.*)\s\[([^\]]+)\]\.$/);
    return match ? { text: match[1], cites: match[2].split(/,\s*/) } : { text: sentence, cites: [] };
  });
}

/** Reveals a recorded run step by step at compressed real timings, so the loop is visible. */
function useReplay(steps: AgentStep[] | undefined, key: string | undefined, animate: boolean) {
  const [progress, setProgress] = useState<{ key?: string; count: number }>({ count: 0 });
  const instant = !animate || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (!steps || instant) return;
    const total = steps.reduce((sum, step) => sum + step.latencyMs, 0) || 1;
    const scale = Math.min(1, REPLAY_BUDGET_MS / total);
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    let at = 0;
    steps.forEach((step, index) => {
      at += Math.max(90, step.latencyMs * scale);
      timers.push(setTimeout(() => setProgress({ key, count: index + 1 }), at));
    });
    return () => timers.forEach(clearTimeout);
    // Replays restart only when a different run arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (!steps) return 0;
  if (instant) return steps.length;
  return progress.key === key ? Math.min(progress.count, steps.length) : 0;
}

function StepRow({ step, index, evidence }: { step: AgentStep; index: number; evidence: Map<string, Evidence> }) {
  if (step.kind === "model") return <li data-status="complete" data-kind="model">
    <span className="trace-index">{index}</span>
    <div>
      <strong>Model turn {step.turn}</strong>
      <p>{step.requested.length ? <>Requested {step.requested.map((name, i) => <code key={`${name}-${i}`}>{name}</code>)}</> : "Returned the structured, cited answer"}</p>
      <p className="trace-meta">{step.inputTokens.toLocaleString()} in · {step.outputTokens.toLocaleString()} out{step.reasoningTokens ? ` (${step.reasoningTokens} reasoning)` : ""}</p>
    </div>
    <em>{seconds(step.latencyMs)}</em>
  </li>;
  if (step.kind === "search") return <li data-status="complete" data-kind="search">
    <span className="trace-index">{index}</span>
    <div>
      <strong><code>search_procedures</code></strong>
      <p>“{step.query}”</p>
      <p className="trace-meta">{step.retriever} → {step.results.join(", ")}</p>
    </div>
    <em>{step.latencyMs} ms</em>
  </li>;
  const record = evidence.get(step.evidenceId);
  return <li data-status={step.status === "ok" ? "complete" : "waiting"} data-kind="tool" data-trust={step.trust}>
    <span className="trace-index">{index}</span>
    <div>
      <strong><code>{step.tool}</code><span className="trace-args">({Object.entries(step.args).map(([key, value]) => `${key}: ${value}`).join(", ")})</span></strong>
      <p>{step.evidenceId} · {record?.source}{step.trust === "untrusted" ? " · untrusted content" : ""}{step.status === "not_found" ? " · no record" : ""}</p>
      {step.flags.map(flag => <p className="trace-flag" key={flag}>⚠ {flag} — quarantined as data</p>)}
    </div>
    <em>{step.evidenceId}</em>
  </li>;
}

function AgentView({ payload, revealed, compact, id, onApprove, onTamper, loading }: { payload: AgentPayload; revealed: number; compact: boolean; id: string; onApprove: () => void; onTamper: (value: boolean) => void; loading: boolean }) {
  const { run, gate } = payload;
  const evidence = new Map(run.evidence.map(item => [item.id, item]));
  const procedures = new Map(run.procedures.map(item => [item.id, item]));
  const done = revealed >= run.steps.length;
  const answer = done ? run.answer : null;
  const passed = gate.checks.filter(check => check.passed).length;

  const cite = (citationId: string) => {
    const record = evidence.get(citationId);
    const label = record ? `${citationId} · ${record.source}` : citationId;
    return compact || !record
      ? <span className="cite" key={citationId} title={record?.record} data-trust={record?.trust}>{label}</span>
      : <a className="cite" key={citationId} href={`#${id}-evidence-${citationId}`} data-trust={record.trust}>{label}</a>;
  };

  return <>
    <dl className="metrics agent-metrics">
      <div className="metric"><dt>Source</dt><dd><strong>{run.source === "live" ? "Live" : "Replay"}</strong><small data-tone={payload.evalTrial ? (payload.evalTrial.pass ? "good" : "alert") : undefined}>{run.source === "live" ? "just ran" : payload.evalTrial ? `eval trial 1 · ${payload.evalTrial.pass ? "passed" : "failed"}` : "recorded"}</small></dd></div>
      <div className="metric"><dt>Model turns</dt><dd><strong>{run.usage.modelTurns}</strong><small>{run.model}</small></dd></div>
      <div className="metric"><dt>Tool calls</dt><dd><strong>{run.usage.toolCalls}</strong><small>chosen by the model</small></dd></div>
      <div className="metric"><dt>Tokens</dt><dd><strong>{((run.usage.inputTokens + run.usage.outputTokens) / 1000).toFixed(1)}k</strong><small>{run.usage.inputTokens.toLocaleString()} in · {run.usage.outputTokens.toLocaleString()} out</small></dd></div>
      <div className="metric"><dt>Wall time</dt><dd><strong>{seconds(run.latencyMs)}</strong><small>{run.source === "live" ? "live" : "real run; replayed faster"}</small></dd></div>
    </dl>
    <div className="lab-body aegis-body">
      <section className="panel" aria-labelledby={`${id}-trace`}>
        <header className="panel-head"><h3 id={`${id}-trace`}>Agent trace</h3><p>{payload.incident.id} · model-planned tool loop</p></header>
        <ol className="trace agent-trace">
          {run.steps.slice(0, revealed).map((step, index) => <StepRow key={index} step={step} index={index + 1} evidence={evidence} />)}
          {!done && <li data-status="waiting" className="trace-pending"><span className="trace-index" aria-hidden="true">…</span><div><strong>{run.steps[revealed]?.kind === "model" ? "Model is planning" : "Calling tool"}</strong><p>Replaying the recorded run</p></div><em>Running</em></li>}
          {done && <li data-status={gate.status === "blocked" || gate.status === "failed" ? "blocked" : gate.status === "executed" ? "complete" : "waiting"}>
            <span className="trace-index">{run.steps.length + 1}</span>
            <div><strong>Policy gate</strong><p>{passed}/{gate.checks.length} deterministic checks passed</p></div>
            <em>{gate.status === "awaiting_approval" ? "Waiting" : gate.status === "executed" ? "Done" : "Blocked"}</em>
          </li>}
        </ol>
      </section>
      <section className="panel conclusion-panel" aria-labelledby={`${id}-conclusion`}>
        <header className="panel-head"><h3 id={`${id}-conclusion`}>Cited conclusion</h3><p>{answer ? `${dispositionLabel[answer.disposition]} · ${answer.confidence} confidence` : "Waiting for the agent"}</p></header>
        {answer ? <>
          <p className="agent-summary">{answer.summary}</p>
          <ul className="statements">{answer.findings.map(finding => <li key={finding.text}><p>{finding.text}</p><span className="cites">{finding.citations.map(cite)}</span></li>)}</ul>
          {answer.procedure_id && <p className="agent-procedure"><span>Procedure</span><strong>{answer.procedure_id} · {procedures.get(answer.procedure_id)?.title ?? "not retrieved"}</strong></p>}
          {answer.untrusted_instructions.length > 0 && <div className="quarantine">
            <span>Ignored instructions found in untrusted content</span>
            {answer.untrusted_instructions.map(text => <blockquote key={text}>{text}</blockquote>)}
          </div>}
          <div className="checks">
            <p className="checks-head"><strong>{passed}/{gate.checks.length}</strong> policy checks passed</p>
            <ul>{gate.checks.map(check => <li key={check.id} data-passed={check.passed}><span aria-hidden="true">{check.passed ? "✓" : "✕"}</span><span>{check.name}{!compact && <small>{check.detail}</small>}</span><span className="visually-hidden">{check.passed ? " (passed)" : " (failed)"}</span></li>)}</ul>
          </div>
        </> : <p className="empty-state">{run.error ?? "The model is gathering evidence. Findings appear when it returns its structured answer."}</p>}
      </section>
    </div>
    {done && <div className={`approval is-${gate.status}`}>
      <div>
        <span className="approval-label">{approvalLabel[gate.status]}</span>
        <strong>{gate.proposal}</strong>
        <p>{gate.detail}</p>
      </div>
      {gate.status === "awaiting_approval"
        ? <button type="button" className="button button-outline" onClick={onApprove} disabled={loading}>{run.answer?.actions.length ? "Approve action" : "Confirm closure"}</button>
        : gate.status === "executed" ? <span className="approval-done">✓ Recorded</span> : <span className="approval-blocked">✕ Not approvable</span>}
    </div>}
    {done && run.answer && <div className="red-team">
      <p><strong>{payload.tampered ? "Simulated compromised output." : "Red-team the gate."}</strong> {payload.tampered
        ? "A hallucinated finding citing evidence that does not exist, plus an action the injected text asked for. The gate refuses both."
        : "Rewrite this answer as if the model had obeyed injected text and invented evidence, then watch the deterministic checks respond."}</p>
      <button type="button" className="button button-outline" onClick={() => onTamper(!payload.tampered)} disabled={loading}>{payload.tampered ? "Restore the real output" : "Simulate a compromised model"}</button>
    </div>}
    {done && compact && <details className="evidence-details">
      <summary>Show the {run.evidence.length} evidence records the model gathered</summary>
      <ul className="evidence-list">{run.evidence.map(item => <li key={item.id} data-trust={item.trust}><span>{item.id} · {item.source} · {item.trust}</span><p>{item.record}</p></li>)}</ul>
    </details>}
    {done && !compact && <div className="lab-body aegis-body">
      <section className="panel" aria-labelledby={`${id}-evidence`}>
        <header className="panel-head"><h3 id={`${id}-evidence`}>Evidence records</h3><p>Returned by read-only tools · untrusted content flagged</p></header>
        <div className="evidence-grid">{run.evidence.map(item => <article key={item.id} id={`${id}-evidence-${item.id}`} data-trust={item.trust}>
          <span>{item.id} · {item.source} · {item.trust}</span><p>{item.record}</p>
        </article>)}</div>
      </section>
      <section className="panel" aria-labelledby={`${id}-procedures`}>
        <header className="panel-head"><h3 id={`${id}-procedures`}>Retrieved procedures</h3><p>Prism BM25 + dense hybrid</p></header>
        <ol className="ranking">{run.procedures.map(item => <li key={item.id} data-top={item.id === run.answer?.procedure_id || undefined}>
          <span>{item.id}</span><strong>{item.title}</strong><em>{item.score.toFixed(3)}</em>
        </li>)}</ol>
        <p className="lab-note">The alert given to the model: {payload.incident.alert}</p>
      </section>
    </div>}
  </>;
}

function BaselineView({ result, compact, id, onApprove, loading }: { result: BaselineResult; compact: boolean; id: string; onApprove: () => void; loading: boolean }) {
  const citationsById = new Map(result.citations.map(citation => [citation.id, citation]));
  const cite = (citationId: string) => {
    const citation = citationsById.get(citationId);
    const label = citation ? `${citationId}: ${citation.title}` : citationId;
    return compact
      ? <span className="cite" key={citationId} title={citation?.excerpt}>{label}</span>
      : <a className="cite" key={citationId} href={`#${id}-evidence-${citationId}`}>{label}</a>;
  };
  return <>
    <div className="lab-body aegis-body">
      <section className="panel" aria-labelledby={`${id}-trace`}>
        <header className="panel-head"><h3 id={`${id}-trace`}>Execution trace</h3><p>{result.incident.id} · {result.incident.label}</p></header>
        <ol className="trace">{result.trace.map((step, index) => <li key={step.step} data-status={step.status}>
          <span className="trace-index">{index + 1}</span>
          <div><strong>{step.step}</strong><p>{step.detail}</p></div>
          <em>{statusLabel[step.status] ?? step.status}</em>
        </li>)}</ol>
      </section>
      <section className="panel conclusion-panel" aria-labelledby={`${id}-conclusion`}>
        <header className="panel-head"><h3 id={`${id}-conclusion`}>Cited conclusion</h3><p>Template-based statements</p></header>
        <ul className="statements">{parseStatements(result.answer).map(statement => <li key={statement.text}><p>{statement.text}.</p><span className="cites">{statement.cites.map(cite)}</span></li>)}</ul>
        <div className="checks">
          <p className="checks-head"><strong>{result.evaluation.score}/{result.evaluation.total}</strong> deterministic checks passed</p>
          <ul>{result.evaluation.checks.map(check => <li key={check.name} data-passed={check.passed}><span aria-hidden="true">{check.passed ? "✓" : "✕"}</span>{check.name}<span className="visually-hidden">{check.passed ? " (passed)" : " (failed)"}</span></li>)}</ul>
        </div>
      </section>
    </div>
    <div className={`approval is-${result.action.status}`}>
      <div>
        <span className="approval-label">{approvalLabel[result.action.status]}</span>
        <strong>{result.proposal}</strong>
        <p>{result.action.detail}</p>
      </div>
      {result.action.status === "awaiting_approval"
        ? <button type="button" className="button button-outline" onClick={onApprove} disabled={loading}>Approve action</button>
        : result.action.status === "blocked" ? <span className="approval-blocked">✕ Not approvable</span> : <span className="approval-done">✓ Recorded</span>}
    </div>
    {!compact && <div className="lab-body aegis-body">
      <section className="panel" aria-labelledby={`${id}-tools`}>
        <header className="panel-head"><h3 id={`${id}-tools`}>Typed tool calls</h3><p>Fixed order · inputs and outputs</p></header>
        <ul className="tool-calls">{result.toolCalls.map(call => <li key={call.tool}>
          <div className="tool-call-head"><code>{call.tool}</code><span>{call.id} · {call.status}</span></div>
          <code className="tool-input">{JSON.stringify(call.input)}</code>
          <p><strong>{call.output.source}</strong>{call.output.record}</p>
        </li>)}</ul>
      </section>
      <section className="panel" aria-labelledby={`${id}-retrieval`}>
        <header className="panel-head"><h3 id={`${id}-retrieval`}>Procedure ranking</h3><p>Keyword match + incident-context boost</p></header>
        <ol className="ranking">{result.retrieval.map((document, index) => <li key={document.id} data-top={index === 0 || undefined}>
          <span>{document.id}</span><strong>{document.title}</strong><em>{document.score.toFixed(1)}</em>
        </li>)}</ol>
        <div className="evidence-grid">{result.citations.map(citation => <article key={citation.id} id={`${id}-evidence-${citation.id}`}>
          <span>{citation.id} · {citation.title}</span><p>{citation.excerpt}</p>
        </article>)}</div>
      </section>
    </div>}
  </>;
}

function Choices<T extends string>({ legend, name, options, value, onChange }: { legend: string; name: string; options: Array<{ id: T; label: string; detail: ReactNode }>; value: T; onChange: (value: T) => void }) {
  return <fieldset className="choice-group">
    <legend>{legend}</legend>
    <div className="choices">{options.map(option => <label className="choice" key={option.id}>
      <input type="radio" name={name} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} />
      <span>{option.label}<small>{option.detail}</small></span>
    </label>)}</div>
  </fieldset>;
}

export function AegisLab({ cases, variant, agent }: { cases: CaseOption[]; variant: LabVariant; agent: AgentMeta }) {
  const id = useId();
  const compact = variant === "compact";
  const [mode, setMode] = useState<Mode>("agent");
  const [caseId, setCaseId] = useState(cases[0].id);
  const [question, setQuestion] = useState(defaultQuestion);
  const [live, setLive] = useState(false);
  const agentRun = useLabEndpoint<AgentPayload | null>("/api/agent", null);
  const baselineRun = useLabEndpoint<BaselineResult | null>("/api/agent", null);
  const active = mode === "agent" ? agentRun : baselineRun;
  const payload = agentRun.data;
  const replayKey = payload ? payload.run.runId.replace(/-tampered$/, "") : undefined;
  const revealed = useReplay(payload?.run.steps, replayKey, payload?.run.source === "recorded");
  const selected = cases.find(option => option.id === caseId) ?? cases[0];
  const validQuestion = question.trim().length >= 3;
  const custom = question.trim() !== defaultQuestion;

  function reset() {
    agentRun.reset(null);
    baselineRun.reset(null);
  }

  function investigate() {
    if (!validQuestion) return;
    if (mode === "agent") void agentRun.run({ mode: "agent", caseId, question: question.trim(), live });
    else if (selected.templated) void baselineRun.run({ mode: "baseline", caseId, question: question.trim() });
  }

  const busy = active.loading || (mode === "agent" && payload !== null && revealed < payload.run.steps.length);
  const runLabel = active.loading ? "Investigating…" : mode === "agent" ? (live || (custom && agent.live) ? "Run live investigation" : active.data ? "Run again" : "Run investigation") : active.data ? "Run again" : "Run investigation";
  const note = mode === "agent"
    ? agent.live
      ? `LLM agent (${agent.model}) plans its own tool calls. The default objective replays trial 1 of the committed eval; live runs call the model and are rate-limited.`
      : `LLM agent (${agent.model}) plans its own tool calls. This deployment replays trial 1 of the committed eval for each case, so what you see is a real recorded run, not a mock. Live mode is switched off here.`
    : "Deterministic baseline: fixed tool order, keyword procedure ranking, hand-written templates for three incident types, no model calls.";

  return <div className="lab lab-aegis" data-variant={variant} aria-busy={busy}>
    <div className="lab-toolbar">
      <Choices legend="Investigator" name={`${id}-mode`} value={mode} onChange={next => { setMode(next); reset(); }} options={[
        { id: "agent", label: "LLM agent", detail: agent.model },
        { id: "baseline", label: "Deterministic baseline", detail: "no model" },
      ]} />
      <EndpointBadge endpoint="/api/agent" latency={active.latency} loading={active.loading} />
      <Choices legend="Incident case" name={`${id}-case`} value={caseId} onChange={next => { setCaseId(next); reset(); }} options={cases.map(option => ({
        id: option.id, label: option.label, detail: mode === "baseline" && !option.templated ? "no template" : option.kind,
      }))} />
    </div>
    <div className="aegis-command">
      {!compact && <div className="field">
        <label htmlFor={`${id}-question`}>Investigation objective</label>
        <textarea id={`${id}-question`} value={question} rows={2} maxLength={1000} aria-describedby={`${id}-question-help`} onChange={event => setQuestion(event.target.value)} />
        <p id={`${id}-question-help`}>{mode === "agent" ? (agent.live ? "A custom objective runs the agent live." : "Custom objectives need live mode, which is off on this deployment; the recorded run is shown instead.") : "Keywords in the objective influence which procedure is retrieved."}</p>
      </div>}
      <button type="button" className="button" onClick={investigate} disabled={busy || !validQuestion || (mode === "baseline" && !selected.templated)}>{runLabel}</button>
      {mode === "agent" && agent.live && <label className="check-field"><input type="checkbox" checked={live} onChange={event => setLive(event.target.checked)} /><span>Run live</span></label>}
      <p className="runtime-note">{note}</p>
    </div>
    <LabError message={active.error} />
    {mode === "agent" && payload?.notice && <p className="lab-notice" role="status">{payload.notice}</p>}
    {mode === "agent" && payload && <AgentView payload={payload} revealed={revealed} compact={compact} id={id} loading={agentRun.loading}
      onApprove={() => void agentRun.run({ mode: "agent", caseId, question: payload.run.question, runId: payload.run.runId.replace(/-tampered$/, ""), approved: true, tamper: payload.tampered })}
      onTamper={value => void agentRun.run({ mode: "agent", caseId, question: payload.run.question, runId: payload.run.runId.replace(/-tampered$/, ""), tamper: value })} />}
    {mode === "baseline" && baselineRun.data && <BaselineView result={baselineRun.data} compact={compact} id={id} loading={baselineRun.loading} onApprove={() => void baselineRun.run({ mode: "baseline", caseId, question: question.trim(), approved: true })} />}
    {mode === "baseline" && !selected.templated && <p className="empty-state abstain">The baseline has no template for “{selected.label}”, so it abstains. Its findings and proposals were hand-written for three incident types; the LLM agent works this case from the raw tool records.</p>}
    {!active.data && !(mode === "baseline" && !selected.templated) && <div className="lab-body aegis-body">
      <section className="panel" aria-labelledby={`${id}-idle`}>
        <header className="panel-head"><h3 id={`${id}-idle`}>{mode === "agent" ? "Agent loop" : "Execution trace"}</h3><p>{mode === "agent" ? "Model-planned · policy-gated" : "Bounded state machine · five steps"}</p></header>
        {mode === "agent"
          ? <ol className="trace">{[
            ["Plan", "The model reads the alert and chooses which of five read-only tools to call, with which arguments."],
            ["Gather", "Tools return evidence records with IDs. Email bodies are marked untrusted."],
            ["Retrieve", "The model searches procedures through the Prism BM25 + dense retriever."],
            ["Answer", "Structured JSON: cited findings, disposition, procedure, and proposed actions."],
            ["Gate", "Deterministic checks verify citations, grounding, and action targets. A human approves."],
          ].map(([step, detail], index) => <li key={step} data-status="idle"><span className="trace-index">{index + 1}</span><div><strong>{step}</strong><p>{detail}</p></div><em>Ready</em></li>)}</ol>
          : <ol className="trace">{idleTrace.map((step, index) => <li key={step.step} data-status="idle"><span className="trace-index">{index + 1}</span><div><strong>{step.step}</strong><p>{step.detail}</p></div><em>Ready</em></li>)}</ol>}
      </section>
      <section className="panel conclusion-panel" aria-labelledby={`${id}-waiting`}>
        <header className="panel-head"><h3 id={`${id}-waiting`}>Cited conclusion</h3><p>Waiting for a run</p></header>
        <p className="empty-state">{mode === "agent"
          ? `Choose an incident and run it. The agent passed ${agent.passes} of ${agent.runs} scored eval runs (prompt ${agent.promptVersion}). Try “Poisoned phishing report” to see it handle a prompt injection.`
          : "Choose an incident and run the investigation to see cited findings, rule-based checks, and the approval gate. Nothing runs until you click."}</p>
      </section>
    </div>}
    <LiveSummary>{active.loading ? "" : mode === "agent" && payload && revealed >= payload.run.steps.length ? `${payload.incident.label}: ${approvalLabel[payload.gate.status]}. ${payload.gate.proposal}.` : mode === "baseline" && baselineRun.data ? `${baselineRun.data.incident.label}: ${approvalLabel[baselineRun.data.action.status]}.` : ""}</LiveSummary>
  </div>;
}
