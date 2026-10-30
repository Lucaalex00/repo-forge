---
name: repo-scaffolder
user-invocable: false
description: Scaffold the project with official CLIs according to the approved layout (monorepo vs separate repos; docs and DB-script locations), then wire up .env, .gitignore and base config. Use after the Project Brief is approved, inside /repo-forge:new-repo.
---

# Repo Scaffolder

Only run after the user has **explicitly approved** the Project Brief.

## Golden rules

- Use the **official** scaffolding CLI for each chosen technology. **Verify the
  current command and flags on the web / official docs before running them** —
  CLI syntax changes. `references/scaffolding-commands.md` lists common entry
  points as a starting point, each marked "confirm current syntax".
- Honor the **approved layout** exactly:
  - monorepo (one repo) **or** separate repos;
  - docs at repository root / under FE / under BE / dedicated docs repo;
  - DB scripts inside the backend / in a separate `database/` folder.
- Create `.env` locally (git-ignored) and commit `.env.example` with
  placeholder keys. For a server database, write the connection string into
  `.env` only; never into code or committed files.
- Ensure `.gitignore` covers `node_modules`, build output, `.env`, and
  OS/editor noise. Initialize git if needed.
- After scaffolding, run the stack's **install**, **build** and **lint** to
  prove the skeleton works; report the real output. If a step fails, fix it or
  report it honestly — do not claim success you did not verify.
- **Verify the generated lint/test scripts actually run.** Some starter
  templates ship a `lint` script that fails on a fresh project (observed: the
  current Vite React template wires `lint` to `oxlint`, which exits non-zero
  with "No files found to lint" until a path/config is set). When a default
  script is broken, repair it (add the missing path/config) or replace it with a
  working setup, and record what you changed — do not leave a red `npm run lint`.

## Before you scaffold: check prerequisites

- Check tool versions against what each CLI requires **before** running it.
  Framework CLIs can be strict about the exact runtime — e.g. the Angular CLI
  refuses to run on a Node version even a patch behind its minimum. If the
  installed version is too old, either update it or pin the CLI to a version
  that supports the installed runtime (e.g. `@angular/cli@19`), and say which.
- Confirm the package managers and SDKs the chosen stack needs are installed
  (`node`, `dotnet`, `python`, `php`/`composer`, …). If one is missing, tell the
  user how to install it instead of guessing.

## Procedure

1. Create the target directory (accept Windows `C:\...` and POSIX paths).
2. Scaffold the frontend (and/or full-stack framework) with its official CLI.
3. Scaffold the backend if separate.
4. Set up the database per the choice (SQLite file + ORM by default; server DB
   wired via `.env`). Place DB scripts in the chosen location. For a **server
   database**, copy the matching Compose template from
   `references/db-compose/` into the project and add its keys to `.env` /
   `.env.example` (see that folder's `README.md` for keys and connection
   strings). Confirm the image tag on Docker Hub.
5. For a monorepo, set up the workspace (e.g. npm/pnpm workspaces, a `packages/`
   or `apps/` layout) as the Brief specifies.
6. Add base tooling agreed in the workflow phase (formatter, linter, git hooks,
   Docker) using verified commands.
7. Install the **pre-commit guards**: copy `references/precommit/secret-guard.js`
   and `references/precommit/lock-guard.js` into the project (e.g. under
   `scripts/`) and wire both into the pre-commit hook as described in
   `references/precommit/README.md`. The secret guard blocks committing a real
   `.env` or an obvious secret; the lock guard enforces the structure lock for
   any tool (Codex, manual commits, CI), not just Claude Code. Both are pure
   Node (cross-platform). Also copy `scripts/unlock.js` into the project if you
   want non-Claude agents to open/close unlock windows.
8. Hand off to `repo-docs` to generate and lock the constitution.

## Cross-platform notes

- Prefer `npx`/`npm create` and framework CLIs that run the same on Windows,
  macOS and Linux.
- Do not assume a POSIX shell. When you must give shell commands to the user,
  provide both a POSIX and a PowerShell form if they differ, and use paths the
  user's OS understands.
- Never hard-code absolute paths from this machine into committed files.
