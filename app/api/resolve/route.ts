type Asset = {
  hostname?: string;
  ip?: string;
  owner?: string;
  os?: string;
  deviceId?: string;
};

const clean = (value = "") =>
  value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

function bigramSimilarity(a = "", b = "") {
  const left = clean(a);
  const right = clean(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const pairs = (value: string) =>
    Array.from({ length: Math.max(0, value.length - 1) }, (_, index) =>
      value.slice(index, index + 2),
    );
  const leftPairs = pairs(left);
  const rightPairs = pairs(right);
  const remaining = [...rightPairs];
  let overlap = 0;
  for (const pair of leftPairs) {
    const index = remaining.indexOf(pair);
    if (index >= 0) {
      overlap += 1;
      remaining.splice(index, 1);
    }
  }
  return (2 * overlap) / Math.max(1, leftPairs.length + rightPairs.length);
}

export async function POST(request: Request) {
  const started = Date.now();
  const body = (await request.json()) as {
    left?: Asset;
    right?: Asset;
    threshold?: number;
  };
  const left = body.left ?? {};
  const right = body.right ?? {};
  const threshold = Math.min(0.95, Math.max(0.45, body.threshold ?? 0.72));

  const features = [
    { feature: "Device ID", weight: 0.36, match: clean(left.deviceId) === clean(right.deviceId) && Boolean(clean(left.deviceId)) ? 1 : 0 },
    { feature: "Hostname", weight: 0.27, match: bigramSimilarity(left.hostname, right.hostname) },
    { feature: "Owner", weight: 0.15, match: bigramSimilarity(left.owner, right.owner) },
    { feature: "IP address", weight: 0.12, match: clean(left.ip) === clean(right.ip) && Boolean(clean(left.ip)) ? 1 : 0 },
    { feature: "Operating system", weight: 0.1, match: bigramSimilarity(left.os, right.os) },
  ].map((item) => ({
    ...item,
    contribution: Number((item.weight * item.match).toFixed(3)),
    match: Number(item.match.toFixed(3)),
  }));

  const score = Number(
    features.reduce((total, feature) => total + feature.contribution, 0).toFixed(3),
  );
  const decision =
    score >= threshold ? "MATCH" : score >= threshold - 0.12 ? "REVIEW" : "NO_MATCH";
  const confidence =
    decision === "MATCH"
      ? Math.min(0.99, 0.68 + (score - threshold) * 1.25)
      : decision === "REVIEW"
        ? 0.55
        : Math.min(0.98, 0.66 + (threshold - score) * 0.8);

  const best = (a?: string, b?: string) =>
    (a?.trim().length ?? 0) >= (b?.trim().length ?? 0) ? a || b || "unknown" : b || a || "unknown";

  return Response.json({
    decision,
    score,
    threshold,
    confidence: Number(confidence.toFixed(2)),
    features,
    unifiedRecord:
      decision === "MATCH"
        ? {
            canonicalId: "asset_" + (clean(best(left.deviceId, right.deviceId)) || "generated"),
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
