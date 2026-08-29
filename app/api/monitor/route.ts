function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const safeDivide = (a: number, b: number) => (b ? a / b : 0);

export async function POST(request: Request) {
  const started = Date.now();
  const body = (await request.json()) as { drift?: number; threshold?: number };
  const drift = Math.min(100, Math.max(0, body.drift ?? 35));
  const threshold = Math.min(0.9, Math.max(0.1, body.threshold ?? 0.58));
  const random = mulberry32(2048 + Math.round(drift * 13));
  const bins = Array.from({ length: 10 }, (_, index) => ({
    label: index * 10 + "–" + (index * 10 + 10) + "%",
    baseline: 0,
    current: 0,
  }));
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  const featureSums = { urlRisk: 0, senderNovelty: 0, languageShift: 0, attachmentRisk: 0 };

  for (let index = 0; index < 600; index += 1) {
    const malicious = random() < 0.22;
    const shift = (drift / 100) * (random() * 0.42);
    const urlRisk = Math.min(1, (malicious ? 0.48 : 0.08) + random() * 0.35 + shift);
    const senderNovelty = Math.min(1, (malicious ? 0.42 : 0.05) + random() * 0.4 + shift * 0.7);
    const languageShift = Math.min(1, random() * (0.25 + drift / 170));
    const attachmentRisk = Math.min(1, (malicious ? 0.3 : 0.03) + random() * 0.42);
    const score = Math.min(
      0.99,
      0.38 * urlRisk + 0.3 * senderNovelty + 0.12 * languageShift + 0.2 * attachmentRisk,
    );
    const prediction = score >= threshold;
    if (prediction && malicious) tp += 1;
    if (prediction && !malicious) fp += 1;
    if (!prediction && !malicious) tn += 1;
    if (!prediction && malicious) fn += 1;
    bins[Math.min(9, Math.floor(score * 10))].current += 1;
    featureSums.urlRisk += urlRisk * 0.38;
    featureSums.senderNovelty += senderNovelty * 0.3;
    featureSums.languageShift += languageShift * 0.12;
    featureSums.attachmentRisk += attachmentRisk * 0.2;
  }

  const baselineRandom = mulberry32(77);
  for (let index = 0; index < 600; index += 1) {
    const malicious = baselineRandom() < 0.22;
    const score = Math.min(
      0.99,
      0.38 * ((malicious ? 0.48 : 0.08) + baselineRandom() * 0.35) +
        0.3 * ((malicious ? 0.42 : 0.05) + baselineRandom() * 0.4) +
        0.12 * (baselineRandom() * 0.25) +
        0.2 * ((malicious ? 0.3 : 0.03) + baselineRandom() * 0.42),
    );
    bins[Math.min(9, Math.floor(score * 10))].baseline += 1;
  }

  const psi = bins.reduce((total, bin) => {
    const expected = Math.max(0.001, bin.baseline / 600);
    const actual = Math.max(0.001, bin.current / 600);
    return total + (actual - expected) * Math.log(actual / expected);
  }, 0);
  const precision = safeDivide(tp, tp + fp);
  const recall = safeDivide(tp, tp + fn);
  const f1 = safeDivide(2 * precision * recall, precision + recall);
  const totalFeature = Object.values(featureSums).reduce((a, b) => a + b, 0);

  return Response.json({
    metrics: {
      precision: Number(precision.toFixed(3)),
      recall: Number(recall.toFixed(3)),
      f1: Number(f1.toFixed(3)),
      falsePositiveRate: Number(safeDivide(fp, fp + tn).toFixed(3)),
      psi: Number(psi.toFixed(3)),
      driftStatus: psi > 0.25 ? "HIGH" : psi > 0.1 ? "WATCH" : "STABLE",
    },
    confusion: { tp, fp, tn, fn },
    distribution: bins.map((bin) => ({
      ...bin,
      baseline: Number((bin.baseline / 6).toFixed(1)),
      current: Number((bin.current / 6).toFixed(1)),
    })),
    featureImpact: Object.entries(featureSums)
      .map(([feature, value]) => ({
        feature,
        impact: Number(((value / totalFeature) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.impact - a.impact),
    config: { drift, threshold, samples: 600, seed: 2048 },
    meta: { synthetic: true, model: "risk-score-v3", latencyMs: Date.now() - started },
  });
}
