# Repo Forge — Test Report

Date: 2026-10-30 · Plugin version: 1.1.0

This report documents the conformance review, end-to-end simulation, fixes and
open items from the hardening session. Chat with the user is in Italian; this
report and all plugin artifacts are in English.

## 1. Environment

- OS: Linux (cloud container). Primary user target: **Windows** (`C:\Progetti`).
- Toolchains present: Node v22.22.0, npm 10.9.4, Python 3.13, PHP 8.3, Java.
- Toolchains **absent**: .NET SDK (`dotnet`); `composer` disabled in this
  non-interactive container.
- Official CLI available: `claude` 2.1.314 — used for `claude plugin validate`.

## 2. Phase A — Schema conformance

Checked against the current official docs (code.claude.com/docs: plugin manifest
reference, marketplace reference, skills, slash commands, hooks).

| Area | Result |
| --- | --- |
| `plugin.json` location/fields | Conformant. `name` required; `author` corrected to an **object** `{name, url}`. |
| `marketplace.json` | Conformant: `name`, `owner` (object), `plugins[]` with `name` + `source: "./"`. |
| Skill frontmatter | `name` + `description` present; keys validated against the documented set. |
| Command frontmatter | `description` + `argument-hint`; `name`/`paths` correctly **not** used (disallowed for commands). |
| `hooks.json` | Shape `{ "hooks": { "PreToolUse": [ { matcher, hooks:[{type:"command", command, timeout}] } ] } }`. |
| Exit codes | `guard-locked.js` uses **exit 2** to block (stderr shown to Claude), exit 0 to allow. |
| `${CLAUDE_PLUGIN_ROOT}` | Used (quoted) in the hook command to locate `guard-locked.js`. |

`claude plugin validate .` → **Validation passed** (only non-blocking notes:
missing README — since added — and missing icon). `node scripts/validate-plugin.js`
→ 0 errors, 0 warnings.

## 3. Phase B — End-to-end simulation (sandbox/, git-ignored)

Real scaffolding CLIs were run where the toolchain allowed; the governance
mechanism (docs + `locked.json` + guard hook) was exercised in each scenario.

| # | Scenario | Scaffolding run | Build | Lint | Governance guard |
| --- | --- | --- | --- | --- | --- |
| 1 | Beginner bakery ("fai tu") → Next.js + SQLite, monorepo, docs at root | (reused S4 Next.js) | — | — | Edit to locked `PROJECT_BRIEF.md` → **blocked (exit 2)** ✅ |
| 2 | Angular + .NET Web API + SQL Server, docs at root | Angular 19 `ng new` + build | **OK** | — | PowerShell `Set-Content` on locked → **blocked** ✅; `.env.example` holds placeholder only, no secret value ✅ |
| 3 | React (Vite) + FastAPI + SQLite, separate repos, dedicated docs repo | Vite react-ts + FastAPI app | FE **OK** (222 kB) | FE **FAILED** (see F1); BE ruff **OK** | Write to locked doc → **blocked**; write to source → **allowed**; `sed -i` on locked → **blocked** ✅ |
| 4 | Next.js full-stack (no separate backend) | `create-next-app` + build | **OK** | **OK** (eslint) | Write to source → allowed; valid 10-min unlock on `ARCHITECTURE.md` → allowed ✅ |

Notes:
- Scenario 2 backend could not be scaffolded (no `dotnet` SDK in this
  container). The Angular frontend was scaffolded and built successfully; the
  .NET path is covered by the `dotnet.md` template and must be verified on a
  machine with the SDK.
- The interview and Project Brief steps are conversational (model-driven) and
  cannot be run non-interactively; their instructions were reviewed for the
  required gates (50-word vision gate, ≥10 rules, Brief-before-files, explicit
  approval) and the artifacts/templates they produce were verified.

## 4. Findings and resolutions

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| F1 | Medium | Current Vite React template wires `npm run lint` to `oxlint`, which exits non-zero ("No files found to lint") on a fresh project. | `repo-scaffolder` now requires verifying the generated lint/test scripts actually run and repairing a broken default; `react.md` template notes the caveat. |
| F2 | Medium | Angular CLI `latest` refused to run on Node v22.22.0 (needs v22.22.3+). A patch-level gap blocked scaffolding. | `repo-scaffolder` now checks tool/runtime versions before scaffolding and pins the CLI to a compatible version when needed (used `@angular/cli@19`). |
| F3 | Low | Interview lacked explicit probes that strongly shape the stack. | Added **core data/entities** and **third-party integrations (API keys → .env)** probes to `repo-interview`. |
| F4 | Low | `plugin.json` `author` was initially a string. | Corrected to an object per the manifest schema. |

## 5. Phase C — Improvements applied

- Prerequisite/version checks and lint-verification guidance in `repo-scaffolder`.
- Nine per-stack `CLAUDE.md` templates (patterns, naming, folder layout, real
  commands) for Angular, React, Next.js, Vue, .NET, NestJS/Express, FastAPI,
  Django, Laravel.
- `repo-adopt` skill + `/repo-forge:check adopt` for existing repositories.
  **Design decision (not asked):** adopt mode was added under `check` rather than
  as a fourth top-level command, to keep the command surface small and because
  "verify/adopt an existing repo" reads as a mode of checking. It never moves or
  rewrites source files.
- Cross-platform guarantees: all executable code is pure Node; the guard
  recognizes POSIX and Windows paths and bash **and** PowerShell write commands.

## 6. Phase D — Automated tests

- `tests/` runs with `npm test` (Node only, no dependencies): **50 tests, 106
  assertions, all passing**.
- Coverage: locked/unlocked files, expired unlock, scoped unlock, relative,
  absolute and Windows backslash paths, bash write operators (`>`, `>>`, `tee`,
  `sed -i`, `rm`, `mv`), PowerShell cmdlets (`Set-Content`, `Out-File`,
  `Remove-Item`), interpreter write one-liners (`python open(...,'w')`,
  `node writeFileSync`, `php file_put_contents`) with their read counterparts
  confirmed *not* flagged, innocent reads (`cat`, `Get-Content`, `grep`),
  malformed stdin, and plugin JSON/frontmatter validation (including all templates).
- CI: `.github/workflows/test.yml` runs validator + tests on **Ubuntu (Node
  18/20/22) and Windows (Node 20)**.

## 7. Phase F — Deep verification in a real Claude Code session

Beyond spawning `guard-locked.js` directly, the plugin was loaded into real
headless `claude` sessions (`claude -p --plugin-dir /home/user/repo-forge`) to
prove the hook wiring (`hooks.json` + `${CLAUDE_PLUGIN_ROOT}` + exit 2) fires in
the actual harness. Ground truth was the file's md5 before/after, not the
model's narration.

| Test (real session) | Expected | Result |
| --- | --- | --- |
| Edit tool on a locked file | blocked, file unchanged | ✅ blocked; model pointed to `/repo-forge:change` |
| Bash `echo >>` on a locked file | blocked | ✅ blocked; model refused to circumvent |
| `python3 -c "open(...,'a')"` on a locked file | blocked | ✅ blocked |
| Edit tool on an **unlocked** file | succeeds | ✅ changed (no over-block) |
| Edit within a valid 10-min unlock window | succeeds | ✅ changed |
| `/repo-forge:check` slash command | recognized & runs | ✅ recognized and executing (hit the turn cap mid-checklist) |

Plugin install path was also smoke-tested end-to-end: `claude plugin marketplace
add` → `claude plugin install repo-forge@repo-forge` → **enabled, v1.1.0**, and
`claude plugin validate . --profile directory` passes with **no warnings** after
adding the icon.

Laravel backend (relevant to scenarios 2/4) was scaffolded for real once the
download completed: `composer create-project laravel/laravel` → Laravel 13.39.0;
`./vendor/bin/pint --test` **passed**; `php artisan test` **2/2 passed**. This
validates the `laravel.md` template commands.

## 8. Open items / manual verification on the user's Windows PC

- **.NET scaffolding** (scenario 2 backend) — **could not be verified here**:
  the container's egress proxy blocks the .NET SDK download
  (`builds.dotnet.microsoft.com` is not allowed), so `dotnet` cannot be
  installed. Run `dotnet new webapi` + `dotnet build` on the Windows PC and
  confirm the SQL Server connection string lives only in `.env`.
- **Symfony** — not tested (Laravel was). Verify `symfony new` / Composer
  skeleton on the Windows PC when needed.
- **Live install on Windows** — the install path was smoke-tested in this
  (Linux) container and the hook was proven to fire in a real `claude` session;
  re-run `claude plugin marketplace add Lucaalex00/repo-forge` +
  `claude plugin install` once on the Windows PC to confirm the same end-to-end
  there.

Resolved during this session (previously open): the 512px icon was added (the
validator now passes with no warnings), and Laravel was scaffolded and tested.
