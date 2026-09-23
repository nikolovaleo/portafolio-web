export type AssetRecord = {
  hostname?: string;
  ip?: string;
  owner?: string;
  os?: string;
  deviceId?: string;
};

export const normalizeKey = (value = "") =>
  value.toLowerCase().trim().replace(/[^a-z0-9]/g, "");

export function bigramSimilarity(a = "", b = "") {
  const left = normalizeKey(a);
  const right = normalizeKey(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const pairs = (value: string) =>
    Array.from({ length: Math.max(0, value.length - 1) }, (_, index) =>
      value.slice(index, index + 2),
    );
  const leftPairs = pairs(left);
  const remaining = pairs(right);
  const total = leftPairs.length + remaining.length;
  let overlap = 0;
  for (const pair of leftPairs) {
    const index = remaining.indexOf(pair);
    if (index >= 0) {
      overlap += 1;
      remaining.splice(index, 1);
    }
  }
  return (2 * overlap) / Math.max(1, total);
}

function exactMatch(a?: string, b?: string) {
  const left = normalizeKey(a);
  return left !== "" && left === normalizeKey(b) ? 1 : 0;
}

const fields = [
  { key: "deviceId", feature: "Device ID", weight: 0.36, compare: exactMatch },
  { key: "hostname", feature: "Hostname", weight: 0.27, compare: bigramSimilarity },
  { key: "owner", feature: "Owner", weight: 0.15, compare: bigramSimilarity },
  { key: "ip", feature: "IP address", weight: 0.12, compare: exactMatch },
  { key: "os", feature: "Operating system", weight: 0.1, compare: bigramSimilarity },
] as const;

/** Hand-weighted field comparison. The score ranks candidates; it is not a calibrated probability. */
export function scoreRecordPair(left: AssetRecord, right: AssetRecord) {
  const features = fields.map(({ key, feature, weight, compare }) => {
    const match = compare(left[key], right[key]);
    return {
      feature,
      weight,
      match: Number(match.toFixed(3)),
      contribution: Number((weight * match).toFixed(3)),
    };
  });
  const score = Number(
    features.reduce((total, item) => total + item.contribution, 0).toFixed(3),
  );
  return { features, score };
}

export function matchDecision(score: number, threshold: number): "MATCH" | "REVIEW" | "NO_MATCH" {
  return score >= threshold ? "MATCH" : score >= threshold - 0.12 ? "REVIEW" : "NO_MATCH";
}
