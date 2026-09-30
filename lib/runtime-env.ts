/**
 * Worker bindings arrive per request, not at module scope. The Worker entry stores them
 * here so route handlers can read secrets; Node scripts and tests fall back to process.env.
 */
type Bag = Record<string, unknown>;
const holder = globalThis as typeof globalThis & { __siteRuntimeEnv?: Bag };

export function setRuntimeEnv(env: object) {
  holder.__siteRuntimeEnv = env as Bag;
}

export function runtimeSecret(name: string): string | undefined {
  const value = holder.__siteRuntimeEnv?.[name] ?? (typeof process === "undefined" ? undefined : process.env?.[name]);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
