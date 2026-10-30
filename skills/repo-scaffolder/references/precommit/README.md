# Pre-commit guards (templates)

Two pure-Node, cross-platform pre-commit guards to copy into generated projects:

- **`secret-guard.js`** — blocks commits that add a real `.env` file or stage an
  obvious secret (private keys, AWS/Google/GitHub/Slack tokens,
  `password = "..."`-style literals).
- **`lock-guard.js`** — enforces the Repo Forge structure lock for **any** tool
  (Codex, other agents, manual `git commit`, CI), not just Claude Code's
  PreToolUse hook. It blocks a commit that stages a change to a file in
  `.repoforge/locked.json` unless a valid `.repoforge/unlock.json` window covers
  it.

Copy them into the project (e.g. `scripts/secret-guard.js`, `scripts/lock-guard.js`)
and run both from the pre-commit hook.

## Install (choose one)

**Husky (JS projects):**
```bash
npm install --save-dev husky
npx husky init
# put these lines in .husky/pre-commit:
node scripts/secret-guard.js
node scripts/lock-guard.js
```

**No Node toolchain / any stack — plain git hooks path:**
```bash
git config core.hooksPath .githooks
```
`.githooks/pre-commit` (make it executable on macOS/Linux: `chmod +x`):
```sh
#!/bin/sh
node scripts/secret-guard.js || exit 1
node scripts/lock-guard.js || exit 1
```
On Windows, git runs the hook via its bundled `sh`, so the same file works.

**pre-commit framework (Python/polyglot):** add a local hook that runs
`node scripts/secret-guard.js`.

## Notes
- `.env.example` / `.env.sample` are allowed; real `.env` files are blocked.
- A genuine false positive can be bypassed once with `git commit --no-verify`.
- This complements, and does not replace, a server-side secret scanner.
