import { agentCases, defaultObjective, type AgentCaseId } from "@/lib/aegis-cases";
import { serveAgent } from "@/lib/aegis-service";
import { incidentCases, investigateIncident } from "@/lib/platform";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 8192) return Response.json({error:"Request too large"},{status:413});
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({error:"Invalid JSON"},{status:400}); }
  if (!body || typeof body !== "object") return Response.json({ error: "Expected a JSON object" }, { status: 400 });
  const payload = body as { mode?: unknown; question?: unknown; caseId?: unknown; approved?: unknown; live?: unknown; runId?: unknown; tamper?: unknown };
  const approved = Boolean(payload.approved);

  if (payload.mode === "agent") {
    const question = payload.question ?? defaultObjective;
    if (typeof question !== "string" || question.trim().length < 3 || question.length > 1000) return Response.json({error:"Question must be 3–1000 characters."},{status:400});
    if (typeof payload.caseId !== "string" || !(payload.caseId in agentCases)) return Response.json({ error: "Unknown incident case" }, { status: 400 });
    if (payload.runId !== undefined && (typeof payload.runId !== "string" || payload.runId.length > 80)) return Response.json({ error: "Invalid runId" }, { status: 400 });
    const client = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
    return Response.json(await serveAgent({ caseId: payload.caseId as AgentCaseId, question, live: payload.live === true, approved, runId: payload.runId, tamper: payload.tamper === true, client }));
  }
  if (payload.mode !== undefined && payload.mode !== "baseline") return Response.json({ error: "Unknown mode" }, { status: 400 });

  const question = payload.question;
  if (typeof question !== "string" || question.trim().length < 3 || question.length > 1000) return Response.json({error:"Question must be 3–1000 characters."},{status:400});
  const caseId = payload.caseId ?? "identity";
  if (typeof caseId !== "string" || !(caseId in incidentCases)) return Response.json({ error: "Unknown incident case" }, { status: 400 });
  return Response.json(investigateIncident(caseId as keyof typeof incidentCases, question.trim(), approved));
}
