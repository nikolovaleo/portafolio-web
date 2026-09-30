/**
 * Resolves the OpenAI key for local scripts. `.env.local` wins over the process environment,
 * because Node's --env-file never overrides a variable that is already set, and a global
 * OPENAI_API_KEY would otherwise silently replace the project's dev key.
 */
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

export function localApiKey() {
  const file = new URL("../.env.local", import.meta.url);
  const fromFile = existsSync(file) ? parseEnv(readFileSync(file, "utf8")).OPENAI_API_KEY : undefined;
  const apiKey = fromFile || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY in .env.local (or the environment) to run this script.");
  console.log(`Using OPENAI_API_KEY from ${fromFile ? ".env.local" : "the process environment"}.`);
  return apiKey;
}
