import { retrievers, runRetrievalBench, type RetrieverId } from "@/lib/retrieval-bench";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Expected a JSON object" }, { status: 400 });
  const payload = body as { retriever?: unknown; expansion?: unknown; k?: unknown; hybridWeight?: unknown; inspectId?: unknown };
  if (payload.retriever !== undefined && (typeof payload.retriever !== "string" || !retrievers.includes(payload.retriever as RetrieverId))) {
    return Response.json({ error: "Unknown retriever" }, { status: 400 });
  }
  if (payload.expansion !== undefined && typeof payload.expansion !== "boolean") {
    return Response.json({ error: "expansion must be a boolean" }, { status: 400 });
  }
  if (payload.k !== undefined && (typeof payload.k !== "number" || !Number.isFinite(payload.k))) {
    return Response.json({ error: "k must be a finite number" }, { status: 400 });
  }
  if (payload.hybridWeight !== undefined && (typeof payload.hybridWeight !== "number" || !Number.isFinite(payload.hybridWeight))) {
    return Response.json({ error: "hybridWeight must be a finite number" }, { status: 400 });
  }
  if (payload.inspectId !== undefined && typeof payload.inspectId !== "string") {
    return Response.json({ error: "inspectId must be a string" }, { status: 400 });
  }
  const retriever = (payload.retriever as RetrieverId | undefined) ?? "hybrid";
  const expansion = payload.expansion ?? true;
  const k = payload.k ?? 5;
  const hybridWeight = payload.hybridWeight ?? .5;
  const inspectId = payload.inspectId ?? "Q17";
  return Response.json(runRetrievalBench(retriever, expansion, k, hybridWeight, inspectId));
}
