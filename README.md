# Leonardo Ureña — Portfolio

Personal portfolio with five original, public-safe interactive projects.
All demo records are synthetic; none of the project code or data comes from an employer.

## Projects

All five labs are usable directly on the homepage (compact tabbed view) and on their
own project pages (full view with a case study).

- **Atlas Graph** — `/projects/atlas`; POST `/api/graph`.
  Entity resolution with a computed, hand-weighted field-match score (MATCH / REVIEW /
  NO_MATCH), directed attack-path traversal to every critical target, ranked path scores,
  and what-if remediation analysis across five synthetic sources. The path score is a
  heuristic product of hand-set edge likelihoods, not a trained model or a probability
  of compromise.
- **Aegis Investigator** — `/projects/aegis`; POST `/api/agent`.
  Bounded state-machine orchestration with four typed tools, keyword and incident-context
  procedure retrieval, template-based answers where every statement cites a returned
  record, five deterministic rule checks, and a human approval gate that refuses approval
  when an evidence or procedure check fails. The public runtime
  makes no LLM calls; the checks are rule-based assertions, not LLM evaluation.
- **Sentinel ModelOps** — `/projects/sentinel`; POST `/api/monitor`.
  Fixed-seed training (1,400 rows) and evaluation (600 rows) of an L2-regularized logistic
  regression against a 2-feature baseline, threshold analysis, score distributions,
  per-example contributions, and PSI drift monitoring.
  Contributions explain the fitted linear model and are not causal importance.
- **Hermes Triage** — `/projects/hermes`; POST `/api/triage`.
  Fixed-seed training (1,200 reports) and evaluation (600 reports) of an L2-regularized
  logistic email-triage classifier against a hand-written keyword and URL heuristic.
  The baseline is not a trained model. Scores are uncalibrated. Token contributions
  explain this linear model and are not causal importance.
- **Prism Bench** — `/projects/prism`; POST `/api/retrieval`.
  BM25, character-trigram TF-IDF vectors, and hybrid reciprocal rank fusion scored
  against 28 graded queries on a 32-document synthetic knowledge base. Character n-grams
  are not neural embeddings. The release gate uses deterministic IR metrics (recall@k,
  MRR, nDCG, slice regression); there is no LLM judge.

The homepage includes the supplied portrait, professional experience, contact links,
and the original supplied CV as a PDF download. Project pages document baselines,
measurement definitions, failure modes, and production tradeoffs.

## Verification

After building (`npm run build`, or `npx vinext build` on Windows), run:

```sh
node --test tests/portfolio.test.mjs tests/resolve-api.test.mjs
```

These checks exercise the built Worker: page routes, homepage lab rendering, tool
execution and citation grounding, approval policy, model fitting and drift, attack-path
remediation, computed entity resolution, email triage against a keyword-rule baseline,
retrieval evaluation with a deterministic release gate, malformed inputs, and legacy
entity-resolution regression.

## Runtime foundation

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with
  `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper
  module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can
  prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned
  `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build and verify the rendered development-preview metadata
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
