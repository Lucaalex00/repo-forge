---
description: Verify a Repo Forge repository against the final checklist, or adopt Repo Forge into an existing repo.
argument-hint: "[adopt]"
---

# Repo Forge — Check

Mode: `$ARGUMENTS`

- If the argument is **`adopt`**, run **Adopt mode** below.
- Otherwise, run the **Verification checklist**.

---

## Verification checklist (default)

First run the deterministic checker, then review its output and add the parts it
cannot do (build/lint):

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/verify.js" --dir .
```

It covers items 1–6 mechanically (locked.json integrity, locked files exist, no
stale unlock, `.env` ignored/untracked, `.env.example` present, no leftover
placeholders). Then go through every item below, mark ✅ / ❌, and show the user a
summary. Do not claim a check passed unless you actually verified it.

1. **Structure present** — the chosen layout exists (monorepo vs separate
   repos; FE/BE folders; docs location; DB scripts location) as decided in the
   Project Brief.
2. **No secrets committed** — `.env` is git-ignored and absent from the index;
   `.env.example` exists with placeholder keys only.
3. **Constitution complete** — `PROJECT_BRIEF.md`, `ARCHITECTURE.md`,
   `GUIDELINES.md`, `GUARDRAILS.md`, `CONVENTIONS.md`, `WORKFLOW.md`,
   `CHANGELOG.md`, `docs/adr/`, and a `CLAUDE.md` at the root and for each part
   all exist with **no unfilled placeholders** (search for `TODO`, `TBD`,
   `<...>`, `XXX`).
4. **Rules present** — at least 10 project rules split into guardrails and
   guidelines.
5. **Lock active** — `.repoforge/locked.json` lists every constitution file.
6. **Guard works** — the `guard-locked` hook is installed and actually blocks a
   write to a locked file (describe how you verified; do not disable it).
7. **Builds & lints** — the scaffolded app installs, builds, and lints cleanly
   (run the real commands where the environment allows; report output).

Report pass/fail per item and list concrete next steps for any ❌.

---

## Adopt mode (`/repo-forge:check adopt`)

Bring an **already-existing** repository under Repo Forge governance without
re-scaffolding it. Invoke the `repo-adopt` skill, which will:

1. Read the real code to infer the actual stack, layout, and conventions.
2. Run a shortened interview (confirm vision, fill gaps it cannot infer).
3. Generate the constitution documents **from the real repository** (not from
   templates alone), then lock them via `.repoforge/locked.json`.
4. Install the guard hook reference and run the verification checklist.

Never rewrite or move existing source files in adopt mode — only add governance
documents and the lock state.
