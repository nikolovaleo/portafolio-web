import {
  matchDecision,
  normalizeKey,
  scoreRecordPair,
  type AssetRecord,
} from "@/lib/entity-resolution";

export async function POST(request: Request) {
  const started = Date.now();
  let body: { left?: AssetRecord; right?: AssetRecord; threshold?: number } | null;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const left = body?.left ?? {};
  const right = body?.right ?? {};
  const requested = Number.isFinite(body?.threshold) ? Number(body?.threshold) : 0.72;
  const threshold = Math.min(0.95, Math.max(0.45, requested));

  const { features, score } = scoreRecordPair(left, right);
  const decision = matchDecision(score, threshold);
  const thresholdGap = Number((score - threshold).toFixed(3));

  const best = (a?: string, b?: string) =>
    (a?.trim().length ?? 0) >= (b?.trim().length ?? 0) ? a || b || "unknown" : b || a || "unknown";

  return Response.json({
    decision,
    score,
    threshold,
    thresholdGap,
    features,
    unifiedRecord:
      decision === "MATCH"
        ? {
            canonicalId: "asset_" + (normalizeKey(best(left.deviceId, right.deviceId)) || "generated"),
            hostname: best(left.hostname, right.hostname),
            ipAddresses: Array.from(new Set([left.ip, right.ip].filter(Boolean))),
            owner: best(left.owner, right.owner),
            os: best(left.os, right.os),
            sourceCount: 2,
          }
        : null,
    meta: {
      model: "weighted-bigram-v1",
      recordsEvaluated: 2,
      synthetic: true,
      latencyMs: Date.now() - started,
    },
  });
}
