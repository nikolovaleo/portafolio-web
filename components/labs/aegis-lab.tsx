"use client";

import { useId, useState } from "react";
import type { investigateIncident } from "@/lib/platform";
import { EndpointBadge, LabError, LiveSummary, useLabEndpoint, type LabVariant } from "./lab-kit";

type AgentResult = ReturnType<typeof investigateIncident>;
type CaseOption = { id: string; label: string; reference: string };

const defaultQuestion = "What happened, what evidence supports it, and what should we do next?";
const idleTrace = [
  { step: "Planner", status: "idle", detail: "Chooses read-only tools for the selected case." },
  { step: "Tool executor", status: "idle", detail: "Queries identity, endpoint, threat intel, and graph context." },
  { step: "Procedure retrieval", status: "idle", detail: "Ranks response procedures by keyword and incident context." },
  { step: "Evidence synthesis", status: "idle", detail: "Composes cited statements from returned records." },
  { step: "Approval gate", status: "idle", detail: "Blocks containment until a human approves." },
];
const statusLabel: Record<string, string> = { complete: "Done", waiting: "Waiting", blocked: "Blocked", idle: "Ready" };
const approvalLabel: Record<string, string> = { executed: "Approved · synthetic action recorded", blocked: "Blocked by a failed check", awaiting_approval: "Human approval required" };

function parseStatements(answer: string) {
  return answer.split(/(?<=\]\.)\s+/).map(sentence => {
    const match = sentence.match(/^(.*)\s\[([^\]]+)\]\.$/);
    return match ? { text: match[1], cites: match[2].split(/,\s*/) } : { text: sentence, cites: [] };
  });
}

export function AegisLab({ cases, variant }: { cases: CaseOption[]; variant: LabVariant }) {
  const id = useId();
  const compact = variant === "compact";
  const [caseId, setCaseId] = useState(cases[0].id);
  const [question, setQuestion] = useState(defaultQuestion);
  const { data: result, loading, error, latency, run, reset } = useLabEndpoint<AgentResult | null>("/api/agent", null);
  const validQuestion = question.trim().length >= 3;
  const citationsById = new Map(result?.citations.map(citation => [citation.id, citation]) ?? []);

  function chooseCase(next: string) {
    setCaseId(next);
    reset(null);
  }

  function investigate(approved: boolean) {
    if (validQuestion) void run({ caseId, question: question.trim(), approved });
  }

  const cite = (citationId: string) => {
    const citation = citationsById.get(citationId);
    const label = citation ? `${citationId}: ${citation.title}` : citationId;
    return compact
      ? <span className="cite" key={citationId} title={citation?.excerpt}>{label}</span>
      : <a className="cite" key={citationId} href={`#${id}-evidence-${citationId}`}>{label}</a>;
  };

  return <div className="lab lab-aegis" data-variant={variant} aria-busy={loading}>
    <div className="lab-toolbar">
      <fieldset className="choice-group">
        <legend>Incident case</legend>
        <div className="choices">{cases.map(option => <label className="choice" key={option.id}>
          <input type="radio" name={`${id}-case`} value={option.id} checked={caseId === option.id} onChange={() => chooseCase(option.id)} />
          <span>{option.label}<small>{option.reference}</small></span>
        </label>)}</div>
      </fieldset>
      <EndpointBadge endpoint="/api/agent" latency={latency} loading={loading} />
    </div>
    <div className="aegis-command">
      {!compact && <div className="field">
        <label htmlFor={`${id}-question`}>Investigation objective</label>
        <textarea id={`${id}-question`} value={question} rows={2} maxLength={1000} aria-describedby={`${id}-question-help`} onChange={event => setQuestion(event.target.value)} />
        <p id={`${id}-question-help`}>Keywords in the objective influence which procedure is retrieved.</p>
      </div>}
      <button type="button" className="button" onClick={() => investigate(false)} disabled={loading || !validQuestion}>{loading ? "Investigating…" : result ? "Run again" : "Run investigation"}</button>
      <p className="runtime-note">Deterministic runtime: fixed planner, template-based synthesis, no LLM calls. Checks are rule-based assertions, not LLM evaluation.</p>
    </div>
    <LabError message={error} />
    <div className="lab-body aegis-body">
      <section className="panel" aria-labelledby={`${id}-trace`}>
        <header className="panel-head"><h3 id={`${id}-trace`}>Execution trace</h3><p>{result ? `${result.incident.id} · ${result.incident.label}` : "Bounded state machine · five steps"}</p></header>
        <ol className="trace">{(result?.trace ?? idleTrace).map((step, index) => <li key={step.step} data-status={step.status}>
          <span className="trace-index">{index + 1}</span>
          <div><strong>{step.step}</strong><p>{step.detail}</p></div>
          <em>{statusLabel[step.status] ?? step.status}</em>
        </li>)}</ol>
      </section>
      <section className="panel conclusion-panel" aria-labelledby={`${id}-conclusion`}>
        <header className="panel-head"><h3 id={`${id}-conclusion`}>Cited conclusion</h3><p>{result ? "Each statement links to a returned record" : "Waiting for a run"}</p></header>
        {result ? <>
          <ul className="statements">{parseStatements(result.answer).map(statement => <li key={statement.text}><p>{statement.text}.</p><span className="cites">{statement.cites.map(cite)}</span></li>)}</ul>
          <div className="checks">
            <p className="checks-head"><strong>{result.evaluation.score}/{result.evaluation.total}</strong> deterministic checks passed</p>
            <ul>{result.evaluation.checks.map(check => <li key={check.name} data-passed={check.passed}><span aria-hidden="true">{check.passed ? "✓" : "✕"}</span>{check.name}<span className="visually-hidden">{check.passed ? " (passed)" : " (failed)"}</span></li>)}</ul>
          </div>
        </> : <p className="empty-state">Choose an incident and run the investigation to see cited findings, rule-based checks, and the approval gate. Nothing runs until you click.</p>}
      </section>
    </div>
    {result && <div className={`approval is-${result.action.status}`}>
      <div>
        <span className="approval-label">{approvalLabel[result.action.status]}</span>
        <strong>{result.proposal}</strong>
        <p>{result.action.detail}</p>
      </div>
      {result.action.status === "awaiting_approval"
        ? <button type="button" className="button button-outline" onClick={() => investigate(true)} disabled={loading}>Approve synthetic action</button>
        : result.action.status === "blocked"
          ? <span className="approval-blocked">✕ Not approvable</span>
          : <span className="approval-done">✓ Recorded</span>}
    </div>}
    {result && compact && <details className="evidence-details">
      <summary>Show the {result.citations.length} evidence records</summary>
      <ul className="evidence-list">{result.citations.map(citation => <li key={citation.id}><span>{citation.id} · {citation.title}</span><p>{citation.excerpt}</p></li>)}</ul>
    </details>}
    {result && !compact && <div className="lab-body aegis-body">
      <section className="panel" aria-labelledby={`${id}-tools`}>
        <header className="panel-head"><h3 id={`${id}-tools`}>Typed tool calls</h3><p>Read-only · inputs and outputs</p></header>
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
    <LiveSummary>{loading ? "" : result ? `${result.incident.label}: ${result.evaluation.score} of ${result.evaluation.total} checks passed. ${approvalLabel[result.action.status]}.` : ""}</LiveSummary>
  </div>;
}
