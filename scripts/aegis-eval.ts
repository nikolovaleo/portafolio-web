/**
 * Runs the Aegis LLM agent against every synthetic case several times, scores each run
 * against ground truth, and compares it with the deterministic baseline.
 *
 *   node scripts/aegis-eval.ts [trials=3]   (key from .env.local, see scripts/local-env.ts)
 *
 * Writes lib/data/aegis-eval.json (the scorecard) and lib/data/aegis-recorded.json (trial 1
 * of every case, replayed on the public site). Replays are not selected for success: if
 * trial 1 failed, the site shows the failure.
 */
import { readFile, writeFile } from "node:fs/promises";
import { agentCaseIds, agentCases, defaultObjective } from "../lib/aegis-cases.ts";
import { promptVersion, promptVersions, runAgent, type AgentRun } from "../lib/aegis-agent.ts";
import { scoreBaseline, scoreRun } from "../lib/aegis-eval.ts";
import { AGENT_MODEL, EMBEDDING_MODEL } from "../lib/openai.ts";
import { localApiKey } from "./local-env.ts";

const apiKey = localApiKey();
const trials = Math.max(1, Number(process.argv[2] ?? 3));

const jobs = agentCaseIds.flatMap(caseId => Array.from({ length: trials }, (_, trial) => ({ caseId, trial })));
const runs = new Map<string, AgentRun>();
let cursor = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (cursor < jobs.length) {
    const job = jobs[cursor++]!;
    const run = await runAgent({ caseId: job.caseId, question: defaultObjective, apiKey, source: "recorded" });
    runs.set(`${job.caseId}:${job.trial}`, run);
    const score = scoreRun(run);
    console.log(`${job.caseId} #${job.trial + 1}: ${score.pass ? "PASS" : "FAIL"} ${run.latencyMs}ms ${score.notes.join("; ")}${run.error ? ` error=${run.error}` : ""}`);
  }
}));

const percentile = (values: number[], p: number) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
};
const all = [...runs.values()];
const cases = agentCaseIds.map(caseId => {
  const caseRuns = Array.from({ length: trials }, (_, trial) => runs.get(`${caseId}:${trial}`)!);
  const scores = caseRuns.map(scoreRun);
  const baseline = scoreBaseline(caseId);
  return {
    caseId, id: agentCases[caseId].id, label: agentCases[caseId].label, kind: agentCases[caseId].kind, templated: agentCases[caseId].templated,
    agent: {
      passes: scores.filter(score => score.pass).length,
      trials: scores.map((score, index) => ({ pass: score.pass, criteria: score.criteria, notes: score.notes, gate: score.gate, latencyMs: caseRuns[index]!.latencyMs, toolCalls: caseRuns[index]!.usage.toolCalls, tokens: caseRuns[index]!.usage.inputTokens + caseRuns[index]!.usage.outputTokens })),
    },
    baseline: { pass: baseline.pass, abstained: baseline.abstained, notes: baseline.notes },
  };
});
const criteriaNames = ["tools", "disposition", "actions", "procedure", "grounded", "injectionSafe"] as const;
const allScores = cases.flatMap(item => item.agent.trials);
const summary = {
  runs: all.length,
  agentPassRate: Number((allScores.filter(score => score.pass).length / allScores.length).toFixed(3)),
  baselinePassRate: Number((cases.filter(item => item.baseline.pass).length / cases.length).toFixed(3)),
  criteria: Object.fromEntries(criteriaNames.map(name => [name, Number((allScores.filter(score => score.criteria[name]).length / allScores.length).toFixed(3))])),
  latencyMs: { p50: percentile(all.map(run => run.latencyMs), .5), p95: percentile(all.map(run => run.latencyMs), .95) },
  meanTokens: Math.round(all.reduce((sum, run) => sum + run.usage.inputTokens + run.usage.outputTokens, 0) / all.length),
  meanToolCalls: Number((all.reduce((sum, run) => sum + run.usage.toolCalls, 0) / all.length).toFixed(1)),
};

// Keep the latest scorecard of every earlier prompt version so the site can show the iteration.
type HistoryEntry = { promptVersion: string; change: string; createdAt: string; runs: number; passRate: number; failures: string[] };
type Scorecard = { promptVersion?: string; createdAt: string; summary: typeof summary; cases: typeof cases; history?: HistoryEntry[] };
const evalFile = new URL("../lib/data/aegis-eval.json", import.meta.url);
const previous = await readFile(evalFile, "utf8").then(text => JSON.parse(text) as Scorecard).catch(() => null);
const previousEntry: HistoryEntry[] = previous ? [{
  promptVersion: previous.promptVersion ?? "v1",
  change: promptVersions.find(version => version.id === (previous.promptVersion ?? "v1"))?.change ?? "",
  createdAt: previous.createdAt, runs: previous.summary.runs, passRate: previous.summary.agentPassRate,
  failures: previous.cases.flatMap(item => item.agent.trials.filter(trial => !trial.pass).map(trial => `${item.label}: ${trial.notes.join("; ")}`)),
}] : [];
const history = [...(previous?.history ?? []), ...previousEntry]
  .filter((entry, index, list) => entry.promptVersion !== promptVersion && list.findLastIndex(other => other.promptVersion === entry.promptVersion) === index);

const createdAt = new Date().toISOString().slice(0, 10);
const change = promptVersions.find(version => version.id === promptVersion)!.change;
await writeFile(evalFile, `${JSON.stringify({ model: AGENT_MODEL, embeddingModel: EMBEDDING_MODEL, promptVersion, change, createdAt, trials, objective: defaultObjective, summary, cases, history }, null, 1)}\n`);
const recorded = Object.fromEntries(agentCaseIds.map(caseId => [caseId, runs.get(`${caseId}:0`)!]));
await writeFile(new URL("../lib/data/aegis-recorded.json", import.meta.url), `${JSON.stringify({ model: AGENT_MODEL, promptVersion, createdAt, runs: recorded })}\n`);
console.log(`\nAgent pass rate ${summary.agentPassRate} over ${all.length} runs · baseline ${summary.baselinePassRate} · p50 ${summary.latencyMs.p50}ms`);
