# Repository safeguards

These rules apply to every coding agent and editor working in this repository.

- Run `npm test` before committing or deploying. Do not publish when the build or tests fail.
- Keep `.openai/hosting.json` and its `project_id` unchanged unless the owner explicitly requests a hosting migration.
- Never add `codex-preview` metadata to production output; it is temporary preview-only metadata.
- Keep tests aligned with intentional production behavior. When a contract changes, update both the implementation and its test in the same commit.
- Do not commit secrets, `.env` files, generated `dist/` output, `.wrangler/`, or `.sites-runtime/`.
- Preserve the accessibility, responsive behavior, and reduced-motion support covered by the existing test suite.
