export const retrievers = ["bm25", "ngram", "hybrid"] as const;
export type RetrieverId = (typeof retrievers)[number];

type Document = { id: string; title: string; text: string };
type Slice = "exact" | "paraphrase" | "acronym" | "typo" | "multi";
type Query = { id: string; text: string; slice: Slice; relevant: Record<string, number> };

const documents: Document[] = [
  { id: "KB-01", title: "Phishing-resistant MFA enrollment", text: "Require phishing-resistant multifactor authentication for privileged users. FIDO2 security keys replace SMS and push prompts. Enrollment is handled at the identity gateway." },
  { id: "KB-02", title: "Session revocation after takeover", text: "Revoke active sessions, reset credentials, inspect multifactor methods, and preserve timestamps when an identity is suspected compromised." },
  { id: "KB-03", title: "Cloud credential rotation", text: "Disable the exposed service credential, rotate dependent secrets, review warehouse reads, and preserve cloud audit logs before any remediation." },
  { id: "KB-04", title: "Least privilege for warehouse roles", text: "Remove standing write access to the data warehouse. Finance applications should use least privilege roles reviewed quarterly." },
  { id: "KB-05", title: "Backup network segmentation", text: "Segment the backup vault from the warehouse replication path. Network segmentation removes the remaining hop to critical archives." },
  { id: "KB-06", title: "Endpoint detection isolation", text: "Endpoint detection and response isolation contains a compromised laptop. Capture process evidence, block confirmed indicators, then reimage." },
  { id: "KB-07", title: "Public API web application firewall", text: "Apply a web application firewall policy to the public API. The WAF sits in front of the exposed service and drops unauthenticated probes." },
  { id: "KB-08", title: "Entity resolution field matching", text: "Join duplicate device records with weighted field comparison. Hostname, device id, and owner agreement produce a match; borderline pairs go to review." },
  { id: "KB-09", title: "Population stability index monitor", text: "The population stability index measures covariate drift between a reference score distribution and live traffic. Raise a watch when PSI exceeds 0.1." },
  { id: "KB-10", title: "Identity compromise procedure", text: "Procedure for identity takeover: revoke sessions, reset credentials, inspect MFA, isolate the assigned endpoint if execution evidence is present." },
  { id: "KB-11", title: "Cloud credential procedure", text: "Procedure for leaked cloud keys: disable the credential, rotate secrets, review data access, and keep audit evidence." },
  { id: "KB-12", title: "Endpoint malware procedure", text: "Procedure for endpoint execution: isolate the host, collect process and network evidence, block indicators, and scope related devices." },
  { id: "KB-13", title: "Evidence quality policy", text: "Every material claim must cite a returned tool record. Missing evidence produces an explicit abstention rather than an inferred fact." },
  { id: "KB-14", title: "Attack path enumeration", text: "Enumerate every path from an external entry point to critical data. Path score multiplies assumed edge likelihoods to rank exposure." },
  { id: "KB-15", title: "Conditional access for finance SSO", text: "Require device compliance and phishing-resistant MFA before the identity gateway issues a finance application session." },
  { id: "KB-16", title: "Secret rotation for public API", text: "Rotate the public API service credential on a 30-day cycle. Stale service credentials are a common warehouse path." },
  { id: "KB-17", title: "CMDB and EDR record hygiene", text: "Configuration management and endpoint records describe the same laptop with different identifiers. Normalize hostname and owner before graph join." },
  { id: "KB-18", title: "Wire transfer impersonation response", text: "Business email compromise requesting a wire transfer is handled as impersonation. Verify the request out of band and freeze the beneficiary payment." },
  { id: "KB-19", title: "Lookalike domain takedown", text: "Payroll lookalike domains harvest direct-deposit updates. Block the domain, warn staff, and reset any submitted credentials." },
  { id: "KB-20", title: "Authentication overview", text: "Authentication covers passwords, sessions, tokens, and device posture. Long-lived sessions and reused passwords remain a common failure mode across applications." },
  { id: "KB-21", title: "Network overview", text: "Networks connect public services, identity gateways, finance applications, warehouses, and backup archives. Segmentation and firewall policy bound east-west movement." },
  { id: "KB-22", title: "Data warehouse access review", text: "Warehouse access reviews list every identity with read or write roles. Standing write access should be removed unless a ticket justifies it." },
  { id: "KB-23", title: "Incident evidence collection", text: "Collect identity, endpoint, threat intelligence, and graph context before recommending containment. Do not execute containment without approval." },
  { id: "KB-24", title: "Threshold selection for classifiers", text: "A classifier threshold trades recall for analyst workload. Lowering the threshold catches more attacks and sends more benign mail to review." },
  { id: "KB-25", title: "BM25 lexical retrieval notes", text: "BM25 ranks documents by term frequency with inverse document frequency. Exact rare terms dominate. Typos and acronyms without expansion miss." },
  { id: "KB-26", title: "Character n-gram retrieval notes", text: "Character trigram vectors recover misspellings through overlapping substrings. They are lexical features, not neural embeddings, and can dilute exact rare terms." },
  { id: "KB-27", title: "Hybrid rank fusion notes", text: "Reciprocal rank fusion combines independent rankings. A hybrid of BM25 and character n-grams often lifts typos without giving up exact-term recall." },
  { id: "KB-28", title: "Query expansion lexicon", text: "A curated thesaurus expands acronyms such as EDR, MFA, PSI, SOP, BEC, CMDB, and WAF into the phrases operators actually wrote in procedures." },
  { id: "KB-29", title: "Release gate for retrieval changes", text: "Promote a retriever only when recall at k rises, MRR does not drop, and no query slice regresses by more than ten points against the frozen baseline." },
  { id: "KB-30", title: "SOC investigation workflow", text: "Investigations retrieve trusted procedures, cite tool evidence, and pause at a human approval gate. Retrieval quality determines whether the right procedure is on the page." },
  { id: "KB-31", title: "Acronym disambiguation glossary", text: "MFA also means mail forwarding alias and metadata file archive. EDR is a drawing revision. PSI is a pressure unit. SOP is a start-of-packet flag. BEC is a billing entity code. CMDB is sometimes misread as a commute database. WAF is used here as a warehouse allocation forecast. These senses are unrelated to the security procedures." },
  { id: "KB-32", title: "Operations status log", text: "Warehouse role write index monitor field matching public API session login path hop archives data finance application identity gateway laptop records extra access stolen login keeping a session. The log lists tokens without stating the control that should be applied." },
];

const queries: Query[] = [
  { id: "Q01", text: "phishing-resistant MFA", slice: "exact", relevant: { "KB-01": 2, "KB-15": 1 } },
  { id: "Q02", text: "least privilege warehouse write role", slice: "exact", relevant: { "KB-04": 2, "KB-22": 1 } },
  { id: "Q03", text: "backup network segmentation", slice: "exact", relevant: { "KB-05": 2, "KB-21": 1 } },
  { id: "Q04", text: "web application firewall public API", slice: "exact", relevant: { "KB-07": 2, "KB-16": 1 } },
  { id: "Q05", text: "population stability index monitor", slice: "exact", relevant: { "KB-09": 2, "KB-24": 1 } },
  { id: "Q06", text: "entity resolution field matching", slice: "exact", relevant: { "KB-08": 2, "KB-17": 1 } },
  { id: "Q07", text: "stop a stolen login from keeping a session", slice: "paraphrase", relevant: { "KB-02": 2, "KB-10": 1 } },
  { id: "Q08", text: "remove extra access to finance data", slice: "paraphrase", relevant: { "KB-04": 2, "KB-22": 1 } },
  { id: "Q09", text: "how do we join duplicate laptop records", slice: "paraphrase", relevant: { "KB-08": 2, "KB-17": 1 } },
  { id: "Q10", text: "cut the last hop to the archives", slice: "paraphrase", relevant: { "KB-05": 2, "KB-14": 1 } },
  { id: "Q11", text: "keep a retrieval change from quietly getting worse", slice: "paraphrase", relevant: { "KB-29": 2, "KB-27": 1 } },
  { id: "Q12", text: "EDR containment steps", slice: "acronym", relevant: { "KB-06": 2, "KB-12": 1 } },
  { id: "Q13", text: "PSI drift alerting", slice: "acronym", relevant: { "KB-09": 2, "KB-24": 1 } },
  { id: "Q14", text: "SOP for BEC wire payment", slice: "acronym", relevant: { "KB-18": 2, "KB-10": 1 } },
  { id: "Q15", text: "CMDB join with EDR", slice: "acronym", relevant: { "KB-17": 2, "KB-08": 1 } },
  { id: "Q16", text: "WAF in front of the public API", slice: "acronym", relevant: { "KB-07": 2, "KB-16": 1 } },
  { id: "Q17", text: "phising resistant mfa", slice: "typo", relevant: { "KB-01": 2, "KB-15": 1 } },
  { id: "Q18", text: "endpont isolation", slice: "typo", relevant: { "KB-06": 2, "KB-12": 1 } },
  { id: "Q19", text: "sesion revocation after takeover", slice: "typo", relevant: { "KB-02": 2, "KB-10": 1 } },
  { id: "Q20", text: "least privlege warehouse role", slice: "typo", relevant: { "KB-04": 2, "KB-22": 1 } },
  { id: "Q21", text: "popultion stability index", slice: "typo", relevant: { "KB-09": 2, "KB-24": 1 } },
  { id: "Q22", text: "entity reslution matching", slice: "typo", relevant: { "KB-08": 2, "KB-17": 1 } },
  { id: "Q23", text: "contain an identity takeover", slice: "multi", relevant: { "KB-10": 2, "KB-02": 2, "KB-01": 1 } },
  { id: "Q24", text: "respond to leaked cloud key", slice: "multi", relevant: { "KB-11": 2, "KB-03": 2, "KB-16": 1 } },
  { id: "Q25", text: "close paths to critical data", slice: "multi", relevant: { "KB-14": 2, "KB-04": 1, "KB-05": 1 } },
  { id: "Q26", text: "investigate endpoint execution with evidence", slice: "multi", relevant: { "KB-12": 2, "KB-06": 1, "KB-13": 1 } },
  { id: "Q27", text: "replace keyword procedure search safely", slice: "multi", relevant: { "KB-29": 2, "KB-27": 1, "KB-30": 1 } },
  { id: "Q28", text: "score reported mail and set a threshold", slice: "multi", relevant: { "KB-24": 2, "KB-19": 1 } },
];

const lexicon: Record<string, string[]> = {
  edr: ["endpoint", "detection", "response", "isolation"],
  mfa: ["multifactor", "authentication", "fido", "phishing-resistant"],
  psi: ["population", "stability", "index", "drift"],
  sop: ["procedure", "playbook"],
  bec: ["wire", "transfer", "beneficiary", "impersonation"],
  cmdb: ["configuration", "management", "inventory", "asset"],
  waf: ["web", "application", "firewall"],
  stolen: ["compromised", "takeover"],
  archives: ["backup", "vault", "segmentation"],
  extra: ["standing", "privilege"],
  quietly: ["regress", "gate", "promote"],
};

const tokenize = (text: string) => text.toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [];

function expandQuery(text: string, expansion: boolean) {
  const tokens = tokenize(text);
  if (!expansion) return tokens;
  const extra = tokens.flatMap(token => lexicon[token] ?? []);
  return [...tokens, ...extra];
}

function ngrams(text: string) {
  const compact = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const grams: string[] = [];
  for (const word of compact.split(" ")) {
    const padded = ` ${word} `;
    for (let index = 0; index < padded.length - 2; index++) grams.push(padded.slice(index, index + 3));
  }
  return grams;
}

function termFrequency(tokens: string[]) {
  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

const N = documents.length;
const docTokens = documents.map(document => tokenize(`${document.title} ${document.text}`));
const docLength = docTokens.map(tokens => tokens.length);
const avgLength = docLength.reduce((sum, length) => sum + length, 0) / N;
const documentFrequency = new Map<string, number>();
for (const tokens of docTokens) {
  for (const token of new Set(tokens)) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
}

const gramDocs = documents.map(document => ngrams(`${document.title} ${document.text}`));
const gramFrequency = new Map<string, number>();
for (const grams of gramDocs) {
  for (const gram of new Set(grams)) gramFrequency.set(gram, (gramFrequency.get(gram) ?? 0) + 1);
}

function idf(df: number) {
  return Math.log((N - df + 0.5) / (df + 0.5) + 1);
}

function bm25(queryTokens: string[]) {
  const queryTf = termFrequency(queryTokens);
  return documents.map((document, index) => {
    let score = 0;
    const tf = termFrequency(docTokens[index]!);
    for (const [term, queryCount] of queryTf) {
      const freq = tf.get(term) ?? 0;
      if (!freq) continue;
      const k1 = 1.5, b = 0.75;
      const denom = freq + k1 * (1 - b + b * docLength[index]! / avgLength);
      score += queryCount * idf(documentFrequency.get(term) ?? 0) * (freq * (k1 + 1)) / denom;
    }
    return { id: document.id, score };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function ngramRank(queryText: string) {
  const queryGrams = ngrams(queryText);
  const queryTf = termFrequency(queryGrams);
  const queryNorm = Math.sqrt([...queryTf].reduce((sum, [gram, tf]) => {
    const weight = (1 + Math.log(tf)) * idf(gramFrequency.get(gram) ?? 0);
    return sum + weight * weight;
  }, 0)) || 1;
  return documents.map((document, index) => {
    const docTf = termFrequency(gramDocs[index]!);
    let dot = 0;
    let docNorm = 0;
    for (const [gram, tf] of docTf) {
      const weight = (1 + Math.log(tf)) * idf(gramFrequency.get(gram) ?? 0);
      docNorm += weight * weight;
      const queryCount = queryTf.get(gram);
      if (queryCount) dot += weight * (1 + Math.log(queryCount)) * idf(gramFrequency.get(gram) ?? 0);
    }
    const score = dot / (Math.sqrt(docNorm) * queryNorm || 1);
    return { id: document.id, score };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function rrf(left: Array<{ id: string; score: number }>, right: Array<{ id: string; score: number }>, weight: number) {
  const ranks = new Map<string, number>();
  left.forEach((item, index) => ranks.set(item.id, (1 - weight) / (60 + index + 1)));
  right.forEach((item, index) => ranks.set(item.id, (ranks.get(item.id) ?? 0) + weight / (60 + index + 1)));
  return [...ranks.entries()].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function rank(query: Query, retriever: RetrieverId, expansion: boolean, hybridWeight: number) {
  const tokens = expandQuery(query.text, expansion);
  const lexical = bm25(tokens);
  if (retriever === "bm25") return lexical;
  const expandedText = expansion ? `${query.text} ${tokens.join(" ")}` : query.text;
  const vectors = ngramRank(expandedText);
  if (retriever === "ngram") return vectors;
  return rrf(lexical, vectors, hybridWeight);
}

function metricsAtK(ranking: Array<{ id: string }>, relevant: Record<string, number>, k: number) {
  const cutoff = ranking.slice(0, k);
  const relevantIds = Object.keys(relevant);
  const hits = cutoff.filter(item => relevant[item.id] > 0);
  const first = cutoff.findIndex(item => relevant[item.id] > 0);
  const gains = cutoff.map(item => relevant[item.id] ?? 0);
  const ideal = Object.values(relevant).sort((a, b) => b - a).concat(Array(k).fill(0)).slice(0, k);
  const dcg = (values: number[]) => values.reduce((sum, gain, index) => sum + ((2 ** gain) - 1) / Math.log2(index + 2), 0);
  return {
    recall: hits.length / Math.max(1, relevantIds.length),
    precision: hits.length / k,
    mrr: first === -1 ? 0 : 1 / (first + 1),
    ndcg: dcg(gains) / Math.max(1e-9, dcg(ideal)),
  };
}

function mean(rows: Array<{ recall: number; precision: number; mrr: number; ndcg: number }>) {
  const n = rows.length;
  return {
    recall: rows.reduce((sum, row) => sum + row.recall, 0) / n,
    precision: rows.reduce((sum, row) => sum + row.precision, 0) / n,
    mrr: rows.reduce((sum, row) => sum + row.mrr, 0) / n,
    ndcg: rows.reduce((sum, row) => sum + row.ndcg, 0) / n,
  };
}

function roundMetrics(metrics: { recall: number; precision: number; mrr: number; ndcg: number }) {
  return {
    recall: Number(metrics.recall.toFixed(3)),
    precision: Number(metrics.precision.toFixed(3)),
    mrr: Number(metrics.mrr.toFixed(3)),
    ndcg: Number(metrics.ndcg.toFixed(3)),
  };
}

const slices: Slice[] = ["exact", "paraphrase", "acronym", "typo", "multi"];
const documentById = new Map(documents.map(document => [document.id, document]));

export function runRetrievalBench(retriever: RetrieverId = "hybrid", expansion = true, k = 5, hybridWeight = .5, inspectId = "Q17") {
  const cutoff = Math.min(10, Math.max(1, Math.round(k)));
  const weight = Math.min(1, Math.max(0, hybridWeight));
  const baselineRankings = Object.fromEntries(queries.map(query => [query.id, rank(query, "bm25", false, 0)]));
  const candidateRankings = Object.fromEntries(queries.map(query => [query.id, rank(query, retriever, expansion, weight)]));
  const baselineRows = queries.map(query => ({ query, ...metricsAtK(baselineRankings[query.id]!, query.relevant, cutoff) }));
  const candidateRows = queries.map(query => ({ query, ...metricsAtK(candidateRankings[query.id]!, query.relevant, cutoff) }));
  const baseline = mean(baselineRows);
  const candidate = mean(candidateRows);
  const sliceRows = slices.map(slice => {
    const base = mean(baselineRows.filter(row => row.query.slice === slice));
    const next = mean(candidateRows.filter(row => row.query.slice === slice));
    return { slice, baseline: Number(base.recall.toFixed(3)), candidate: Number(next.recall.toFixed(3)), delta: Number((next.recall - base.recall).toFixed(3)) };
  });
  const recallGain = candidate.recall - baseline.recall;
  const mrrDrop = candidate.mrr < baseline.mrr - 1e-9;
  const sliceRegression = sliceRows.find(row => row.delta < -0.1);
  const rules = [
    { name: "Recall@k improves by at least 0.03", passed: recallGain >= 0.03, detail: `Δ recall ${recallGain >= 0 ? "+" : ""}${recallGain.toFixed(3)}` },
    { name: "MRR does not drop", passed: !mrrDrop, detail: `Δ MRR ${candidate.mrr - baseline.mrr >= 0 ? "+" : ""}${(candidate.mrr - baseline.mrr).toFixed(3)}` },
    { name: "No slice regresses by more than 0.10", passed: !sliceRegression, detail: sliceRegression ? `${sliceRegression.slice} Δ ${sliceRegression.delta.toFixed(3)}` : "No slice below −0.10" },
  ];
  const verdict = rules.every(rule => rule.passed) ? "PROMOTE" : "HOLD";
  const perQuery = queries.map((query, index) => {
    const base = baselineRows[index]!;
    const next = candidateRows[index]!;
    const delta = next.recall - base.recall;
    const status = delta > 1e-9 ? "fixed" : delta < -1e-9 ? "regressed" : next.recall < 1 ? "still failing" : "unchanged";
    return { id: query.id, text: query.text, slice: query.slice, baselineRecall: Number(base.recall.toFixed(3)), candidateRecall: Number(next.recall.toFixed(3)), delta: Number(delta.toFixed(3)), status };
  });
  const inspect = queries.find(query => query.id === inspectId) ?? queries.find(query => query.slice === "typo") ?? queries[0]!;
  const pack = (ranking: Array<{ id: string; score: number }>) => ranking.slice(0, 5).map((item, index) => {
    const document = documentById.get(item.id)!;
    return { rank: index + 1, id: item.id, title: document.title, score: Number(item.score.toFixed(4)), grade: inspect.relevant[item.id] ?? 0 };
  });
  const failures = perQuery.filter(row => row.candidateRecall < 1).slice(0, 6).map(row => {
    const query = queries.find(item => item.id === row.id)!;
    const top = candidateRankings[row.id]![0];
    const distractor = documentById.get(top!.id);
    return { id: row.id, text: query.text, slice: query.slice, missed: Object.keys(query.relevant).filter(id => !candidateRankings[row.id]!.slice(0, cutoff).some(item => item.id === id)), distractor: distractor ? `${distractor.id} · ${distractor.title}` : "" };
  });
  return {
    dataset: { documents: documents.length, queries: queries.length, slices: slices.length },
    controls: { retriever, expansion, k: cutoff, hybridWeight: Number(weight.toFixed(2)), inspectId: inspect.id },
    baseline: { name: "BM25 without expansion", ...roundMetrics(baseline) },
    candidate: { name: retriever === "hybrid" ? "Hybrid RRF" : retriever === "ngram" ? "Character n-gram vectors" : "BM25", ...roundMetrics(candidate) },
    deltas: {
      recall: Number((candidate.recall - baseline.recall).toFixed(3)),
      precision: Number((candidate.precision - baseline.precision).toFixed(3)),
      mrr: Number((candidate.mrr - baseline.mrr).toFixed(3)),
      ndcg: Number((candidate.ndcg - baseline.ndcg).toFixed(3)),
    },
    gate: { verdict, method: "deterministic IR metrics", rules },
    slices: sliceRows,
    queries: perQuery,
    inspect: {
      id: inspect.id,
      text: inspect.text,
      slice: inspect.slice,
      relevant: inspect.relevant,
      baseline: pack(baselineRankings[inspect.id]!),
      candidate: pack(candidateRankings[inspect.id]!),
    },
    failures,
    notes: {
      vectors: "Character trigram TF-IDF with cosine similarity. These are not neural embeddings.",
      evaluation: "Graded nDCG, MRR, and recall against hand-labeled judgments. Not LLM evaluation.",
    },
  };
}
