/**
 * Precomputes dense embeddings for the Prism Bench corpus and its labeled queries.
 *
 *   node scripts/embed-prism.ts          (key from .env.local, see scripts/local-env.ts)
 *
 * Vectors are stored in lib/data/prism-embeddings.json so the public site ranks with
 * real embeddings at zero runtime cost. Each vector carries a hash of the exact text it
 * was computed from; the test suite fails if the corpus changes without re-embedding.
 */
import { writeFile } from "node:fs/promises";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL, embed } from "../lib/openai.ts";
import { documents, documentText, queries, textHash, vectorQueryText } from "../lib/prism-corpus.ts";
import { localApiKey } from "./local-env.ts";

const apiKey = localApiKey();

const entries = [
  ...documents.map(document => ({ group: "documents", id: document.id, text: documentText(document) })),
  ...queries.map(query => ({ group: "queries", id: query.id, text: vectorQueryText(query.text, false) })),
  ...queries.map(query => ({ group: "expandedQueries", id: query.id, text: vectorQueryText(query.text, true) })),
] as const;

const vectors = await embed(entries.map(entry => entry.text), { apiKey });
const output: Record<string, unknown> = { model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS, createdAt: new Date().toISOString().slice(0, 10) };
for (const group of ["documents", "queries", "expandedQueries"]) output[group] = {};
entries.forEach((entry, index) => {
  (output[entry.group] as Record<string, unknown>)[entry.id] = { hash: textHash(entry.text), vector: vectors[index] };
});

await writeFile(new URL("../lib/data/prism-embeddings.json", import.meta.url), `${JSON.stringify(output)}\n`);
console.log(`Embedded ${entries.length} texts with ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS} dimensions).`);
