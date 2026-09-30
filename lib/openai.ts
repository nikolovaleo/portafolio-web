/** Minimal fetch-based OpenAI client shared by the Worker runtime and the offline scripts. */

export const EMBEDDING_MODEL = "text-embedding-3-large";
export const EMBEDDING_DIMENSIONS = 256;
export const AGENT_MODEL = "gpt-5.4-mini";

const API = "https://api.openai.com/v1";

type Options = { apiKey: string; signal?: AbortSignal };

async function post<T>(path: string, body: unknown, { apiKey, signal }: Options): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
    signal,
  });
  const json = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(`OpenAI ${path} ${response.status}: ${json.error?.message ?? "request failed"}`);
  return json;
}

/** Embeds texts and returns unit-length vectors rounded for compact storage. */
export async function embed(texts: string[], options: Options & { model?: string; dimensions?: number }) {
  const { data } = await post<{ data: Array<{ index: number; embedding: number[] }> }>("/embeddings", {
    model: options.model ?? EMBEDDING_MODEL,
    dimensions: options.dimensions ?? EMBEDDING_DIMENSIONS,
    input: texts,
  }, options);
  return data.sort((a, b) => a.index - b.index).map(item => normalize(item.embedding));
}

export function normalize(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map(value => Number((value / norm).toFixed(5)));
}

export function cosine(left: readonly number[], right: readonly number[]) {
  let dot = 0;
  for (let index = 0; index < left.length; index++) dot += left[index]! * right[index]!;
  return dot;
}

export type ResponseItem =
  | { type: "function_call"; call_id: string; name: string; arguments: string; id?: string; status?: string }
  | { type: "message"; content: Array<{ type: string; text?: string }>; role?: string; id?: string; status?: string }
  | { type: "reasoning"; id?: string; summary?: unknown[]; encrypted_content?: string }
  | { type: string; [key: string]: unknown };

export type ResponseUsage = { input_tokens: number; output_tokens: number; output_tokens_details?: { reasoning_tokens?: number } };

/** One call to the Responses API. `store: false` keeps runs stateless; reasoning is round-tripped encrypted. */
export function createResponse(body: Record<string, unknown>, options: Options) {
  return post<{ id: string; model: string; output: ResponseItem[]; usage: ResponseUsage }>("/responses", {
    store: false,
    include: ["reasoning.encrypted_content"],
    ...body,
  }, options);
}
