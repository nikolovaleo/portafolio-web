import { runModelLab } from "@/lib/platform";

export async function POST(request: Request) {
  const started = Date.now();
  let body: { drift?: number; threshold?: number; sampleIndex?: number };
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const values = [body?.drift, body?.threshold, body?.sampleIndex];
  if (!body || typeof body !== "object" || values.some(value => value !== undefined && (typeof value !== "number" || !Number.isFinite(value)))) {
    return Response.json({ error: "Expected finite numeric controls" }, { status: 400 });
  }
  const drift = Math.min(100, Math.max(0, body.drift ?? 25));
  const threshold = Math.min(.9, Math.max(.1, body.threshold ?? .55));
  const sampleIndex = Math.round(Math.min(599, Math.max(0, body.sampleIndex ?? 12)));
  return Response.json({ ...runModelLab(drift, threshold, sampleIndex), meta: { latencyMs: Date.now() - started } });
}
