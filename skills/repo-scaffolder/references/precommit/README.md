# Pre-commit guards (templates)

Two pure-Node, cross-platform pre-commit guards for generated projects:

- **`secret-guard.js`** — blocks commits that add a real `.env` file or stage an
  obvious secret (private keys, AWS/Google/GitHub/Slack tokens,
  `password = "..."`-style literals).
- **`lock-guard.js`** — enforces the Repo Forge structure lock for **any** tool
  (Codex, other agents, manual `git commit`, CI), not just Claude Code's
  PreToolUse hook. It blocks a commit that changes a file in
  `.repoforge/locked.json` unless a valid `.repoforge/unlock.json` window covers
  it. The **first** addition of a locked file (e.g. the initial commit) is
  allowed — only changes to already-committed files are blocked.

## Install (always with the helper)

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/install-guards.js" --dir <project-root>
```

It copies the guards (and `unlock`) into `scripts/` as **`.cjs`** files — always
CommonJS, so they also run in `"type": "module"` projects — and wires them in
front of the existing pre-commit commands:

- **Husky** present → prepends `node scripts/secret-guard.cjs || exit 1` and
  `node scripts/lock-guard.cjs || exit 1` to `.husky/pre-commit`
  (active after `npm install` runs Husky's `prepare` script);
- a custom `core.hooksPath` → wires `<hooksPath>/pre-commit`;
- otherwise → creates `.githooks/pre-commit` and sets
  `git config core.hooksPath .githooks` (on Windows git runs the hook with its
  bundled `sh`).

Re-running it is safe (idempotent) and refreshes the copied scripts.
`/repo-forge:check` warns when the guards are missing.

## Notes
- `.env.example` / `.env.sample` are allowed; real `.env` files are blocked.
- A genuine false positive can be bypassed once with `git commit --no-verify`
  (never do this to get around the lock — use `/repo-forge:change`).
- This complements, and does not replace, a server-side secret scanner.
