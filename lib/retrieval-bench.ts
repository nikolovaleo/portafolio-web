import embeddings from "./data/prism-embeddings.json" with { type: "json" };
import { cosine } from "./openai.ts";
import { documents, documentText, expandQuery, queries, textHash, tokenize, vectorQueryText, type Query, type Slice } from "./prism-corpus.ts";

export const retrievers = ["bm25", "ngram", "hybrid", "dense", "dense-hybrid"] as const;
export type RetrieverId = (typeof retrievers)[number];

const retrieverNames: Record<RetrieverId, string> = {
  bm25: "BM25",
  ngram: "Character n-gram vectors",
  hybrid: "Hybrid RRF · BM25 + n-grams",
  dense: "Dense embeddings",
  "dense-hybrid": "Hybrid RRF · BM25 + dense",
};

type StoredVector = { hash: string; vector: number[] };
type VectorStore = { model: string; dimensions: number; createdAt: string } & Record<"documents" | "queries" | "expandedQueries", Record<string, StoredVector | undefined>>;
const vectorStore = embeddings as VectorStore;

/** Embeddings are precomputed offline by scripts/embed-prism.ts; vectors whose source text changed are reported as stale. */
export function embeddingStatus() {
  const stale = [
    ...documents.filter(document => vectorStore.documents[document.id]?.hash !== textHash(documentText(document))).map(document => document.id),
    ...queries.filter(query => vectorStore.queries[query.id]?.hash !== textHash(vectorQueryText(query.text, false))).map(query => query.id),
    ...queries.filter(query => vectorStore.expandedQueries[query.id]?.hash !== textHash(vectorQueryText(query.text, true))).map(query => `${query.id}+expansion`),
  ];
  return { model: vectorStore.model, dimensions: vectorStore.dimensions, createdAt: vectorStore.createdAt, stale };
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

function denseRank(queryVector: readonly number[]) {
  return documents.map(document => ({ id: document.id, score: cosine(queryVector, vectorStore.documents[document.id]?.vector ?? []) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function rank(query: Query, retriever: RetrieverId, expansion: boolean, hybridWeight: number) {
  const tokens = expandQuery(query.text, expansion);
  const lexical = bm25(tokens);
  if (retriever === "bm25") return lexical;
  if (retriever === "dense" || retriever === "dense-hybrid") {
    const stored = (expansion ? vectorStore.expandedQueries : vectorStore.queries)[query.id];
    const dense = denseRank(stored?.vector ?? []);
    return retriever === "dense" ? dense : rrf(lexical, dense, hybridWeight);
  }
  const vectors = ngramRank(vectorQueryText(query.text, expansion));
  if (retriever === "ngram") return vectors;
  return rrf(lexical, vectors, hybridWeight);
}

/**
 * Knowledge-base search used by the Aegis agent's `search_procedures` tool. With a query
 * embedding it runs the BM25 + dense hybrid; without one it degrades to BM25 + n-grams.
 */
export function searchKnowledgeBase(text: string, queryVector?: readonly number[], k = 4) {
  const lexical = bm25(expandQuery(text, true));
  const semantic = queryVector?.length ? denseRank(queryVector) : ngramRank(vectorQueryText(text, true));
  return {
    retriever: queryVector?.length ? retrieverNames["dense-hybrid"] : retrieverNames.hybrid,
    results: rrf(lexical, semantic, .5).slice(0, k).map(item => {
      const document = documentById.get(item.id)!;
      return { id: document.id, title: document.title, text: document.text, score: Number(item.score.toFixed(4)) };
    }),
  };
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

type Row = { query: Query; recall: number; precision: number; mrr: number; ndcg: number };

function releaseGate(baselineRows: Row[], candidateRows: Row[]) {
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
  return { baseline, candidate, sliceRows, rules, verdict };
}

export function runRetrievalBench(retriever: RetrieverId = "dense-hybrid", expansion = true, k = 5, hybridWeight = .5, inspectId = "Q07") {
  const cutoff = Math.min(10, Math.max(1, Math.round(k)));
  const weight = Math.min(1, Math.max(0, hybridWeight));
  const rowsFor = (id: RetrieverId, expand: boolean) => {
    const rankings = Object.fromEntries(queries.map(query => [query.id, rank(query, id, expand, weight)]));
    return { rankings, rows: queries.map(query => ({ query, ...metricsAtK(rankings[query.id]!, query.relevant, cutoff) })) };
  };
  const { rankings: baselineRankings, rows: baselineRows } = rowsFor("bm25", false);
  const { rankings: candidateRankings, rows: candidateRows } = rowsFor(retriever, expansion);
  const { baseline, candidate, sliceRows, rules, verdict } = releaseGate(baselineRows, candidateRows);
  const leaderboard = retrievers.map(id => {
    const result = id === retriever ? { candidate, verdict } : releaseGate(baselineRows, rowsFor(id, expansion).rows);
    return { id, name: retrieverNames[id], ...roundMetrics(result.candidate), verdict: result.verdict };
  });
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
    candidate: { name: retrieverNames[retriever], ...roundMetrics(candidate) },
    deltas: {
      recall: Number((candidate.recall - baseline.recall).toFixed(3)),
      precision: Number((candidate.precision - baseline.precision).toFixed(3)),
      mrr: Number((candidate.mrr - baseline.mrr).toFixed(3)),
      ndcg: Number((candidate.ndcg - baseline.ndcg).toFixed(3)),
    },
    gate: { verdict, method: "deterministic IR metrics", rules },
    slices: sliceRows,
    leaderboard,
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
      vectors: `Dense vectors are ${vectorStore.model} embeddings (${vectorStore.dimensions} dimensions), precomputed offline for every document and labeled query. N-gram vectors are character-trigram TF-IDF.`,
      embeddings: embeddingStatus(),
      evaluation: "Graded nDCG, MRR, and recall against hand-labeled judgments.",
    },
  };
}
