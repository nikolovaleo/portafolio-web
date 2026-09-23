import { runTriageLab, triageSamples } from "@/lib/triage";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 8192) return Response.json({ error: "Request too large" }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Expected a JSON object" }, { status: 400 });
  const payload = body as { threshold?: unknown; sampleId?: unknown; text?: unknown };
  if (payload.threshold !== undefined && (typeof payload.threshold !== "number" || !Number.isFinite(payload.threshold))) {
    return Response.json({ error: "threshold must be a finite number" }, { status: 400 });
  }
  if (payload.sampleId !== undefined && typeof payload.sampleId !== "string") {
    return Response.json({ error: "sampleId must be a string" }, { status: 400 });
  }
  if (payload.sampleId !== undefined && payload.sampleId !== "custom" && !triageSamples.some(sample => sample.id === payload.sampleId)) {
    return Response.json({ error: "Unknown sample" }, { status: 400 });
  }
  if (payload.text !== undefined && typeof payload.text !== "string") {
    return Response.json({ error: "text must be a string" }, { status: 400 });
  }
  if (typeof payload.text === "string" && payload.text.length > 2000) {
    return Response.json({ error: "text must be at most 2000 characters" }, { status: 400 });
  }
  const threshold = payload.threshold ?? .35;
  const sampleId = typeof payload.sampleId === "string" ? payload.sampleId : "lure";
  const text = typeof payload.text === "string" ? payload.text : undefined;
  return Response.json(runTriageLab(threshold, sampleId, text));
}
