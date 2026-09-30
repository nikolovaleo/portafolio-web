/**
 * Serves Aegis agent runs to the public site. Default objectives replay a recorded run
 * (trial 1 of the committed eval). Live runs are opt-in on the server (OPENAI_API_KEY plus
 * AEGIS_LIVE=on), rate limited, and cached. Limits are per Worker isolate: they bound
 * cost on a portfolio, and a production deployment would move them to a shared store.
 */
import recorded from "./data/aegis-recorded.json" with { type: "json" };
import scorecard from "./data/aegis-eval.json" with { type: "json" };
import { agentCases, defaultObjective, type AgentCaseId } from "./aegis-cases.ts";
import { evaluateRun, runAgent, simulateCompromisedAnswer, type AgentRun } from "./aegis-agent.ts";
import { AGENT_MODEL } from "./openai.ts";
import { runtimeSecret } from "./runtime-env.ts";

const recordedRuns = (recorded as unknown as { runs: Record<AgentCaseId, AgentRun> }).runs;
const trialOne = Object.fromEntries(scorecard.cases.map(item => [item.caseId, item.agent.trials[0]]));

const limits = { perClient: 4, perClientWindowMs: 10 * 60_000, global: 40, globalWindowMs: 60 * 60_000, cacheSize: 60, timeoutMs: 45_000 };
const liveCache = new Map<string, AgentRun>();
const runsById = new Map<string, AgentRun>();
const clientHits = new Map<string, number[]>();
let globalHits: number[] = [];

export function liveStatus() {
  return { available: Boolean(runtimeSecret("OPENAI_API_KEY")) && runtimeSecret("AEGIS_LIVE") === "on", model: AGENT_MODEL };
}

const normalize = (question: string) => question.trim().replace(/\s+/g, " ").toLowerCase();

function remember(key: string, run: AgentRun) {
  liveCache.set(key, run);
  runsById.set(run.runId, run);
  while (liveCache.size > limits.cacheSize) {
    const [oldest, stale] = liveCache.entries().next().value!;
    liveCache.delete(oldest);
    runsById.delete(stale.runId);
  }
}

function allow(client: string, now: number) {
  globalHits = globalHits.filter(time => now - time < limits.globalWindowMs);
  const hits = (clientHits.get(client) ?? []).filter(time => now - time < limits.perClientWindowMs);
  if (hits.length >= limits.perClient) return "You have used this demo's live runs for now. Try again in a few minutes, or replay the recorded run.";
  if (globalHits.length >= limits.global) return "The live demo has reached its hourly budget. Showing the recorded run instead.";
  hits.push(now);
  clientHits.set(client, hits);
  globalHits.push(now);
  return null;
}

type Request = { caseId: AgentCaseId; question: string; live: boolean; approved: boolean; runId?: string; tamper: boolean; client: string };

function respond(run: AgentRun, { approved, tamper }: Pick<Request, "approved" | "tamper">, notice?: string) {
  const shown = tamper ? simulateCompromisedAnswer(run) : run;
  const trial = run.source === "recorded" && run.runId === recordedRuns[run.caseId]?.runId ? trialOne[run.caseId] : undefined;
  return {
    run: shown,
    gate: evaluateRun(shown, approved),
    tampered: tamper,
    notice,
    evalTrial: trial ? { pass: trial.pass, notes: trial.notes } : undefined,
    live: liveStatus(),
    incident: { id: agentCases[run.caseId].id, label: agentCases[run.caseId].label, alert: agentCases[run.caseId].alert },
  };
}

export type AgentPayload = ReturnType<typeof respond>;

export async function serveAgent(request: Request): Promise<AgentPayload> {
  const replay = recordedRuns[request.caseId];

  if (request.runId) {
    const known = replay?.runId === request.runId ? replay : runsById.get(request.runId);
    if (known && known.caseId === request.caseId) return respond(known, request);
    return respond(replay, { ...request, approved: false }, "That live run is no longer cached, so approval applies to nothing. Showing the recorded run; run again to continue.");
  }

  const custom = normalize(request.question) !== normalize(defaultObjective);
  if (!request.live && !custom) return respond(replay, request);

  const status = liveStatus();
  if (!status.available) return respond(replay, request, custom ? "Live runs are switched off on this deployment, so your objective was not sent to a model. Showing the recorded run for the default objective." : undefined);

  const key = `${request.caseId}|${normalize(request.question)}`;
  const cached = liveCache.get(key);
  if (cached) return respond(cached, request, "Served from the live-run cache; this exact objective ran recently.");

  const refusal = allow(request.client, Date.now());
  if (refusal) return respond(replay, request, refusal);

  const run = await runAgent({ caseId: request.caseId, question: request.question.trim(), apiKey: runtimeSecret("OPENAI_API_KEY")!, signal: AbortSignal.timeout(limits.timeoutMs) });
  if (run.error) return respond(replay, request, "The live run failed before it finished. Showing the recorded run instead.");
  remember(key, run);
  return respond(run, request);
}
