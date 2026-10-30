# Changelog

All notable changes to Repo Forge are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-30

Hardening and test release: made the plugin conformant to the current Claude
Code plugin schema, verified end-to-end, and added automated tests.

### Added
- **Two interview paths**: Beginner ("decide for me", mostly fixed-choice
  questions with recommended defaults) and Expert ("I drive", open questions,
  full control). `/repo-forge:new-repo [beginner|expert]` selects one; the
  50-word vision gate applies to both.
- **Deterministic lock/unlock helpers** `scripts/lock.js` and `scripts/unlock.js`,
  invoked by `/repo-forge:new-repo` and `/repo-forge:change`, so `locked.json`
  and the 10-minute unlock window are written by code, not hand-typed.
- **`scripts/verify.js`** — deterministic project health check used by
  `/repo-forge:check` (locked.json integrity, locked files exist, constitution
  completeness, ≥10 rules, no stale unlock, `.env` ignored/untracked, no
  placeholders), so the check is fast and reliable instead of model-only.
- **`scripts/adr.js`** — creates the next-numbered ADR for `/repo-forge:change`
  so numbering never collides.
- **Docker Compose templates** for server databases (PostgreSQL, MySQL, SQL
  Server, MongoDB) wired to `.env`, under `repo-scaffolder/references/db-compose/`.
- Helper skills (interview, advisors, scaffolder, docs, adopt) are now
  `user-invocable: false` — the `/` menu shows only `new-repo`, `change`, `check`.
- **Pre-commit secret guard** template (`skills/repo-scaffolder/references/
  precommit/`) installed into generated projects to block committing `.env` or
  obvious secrets; cross-platform (pure Node).
- Four more per-stack `CLAUDE.md` templates: SvelteKit, Astro, Go, Symfony
  (13 total).
- Local validator `scripts/validate-plugin.js` (JSON + skill/command frontmatter).
- Zero-dependency test suite in `tests/` (guard logic, file/bash/PowerShell
  writes, relative/absolute/Windows paths, unlock + expiry, malformed input,
  innocent reads, plugin schema/frontmatter) with an `npm test` script.
- GitHub Actions workflow running the suite on Ubuntu (Node 18/20/22) and
  Windows (Node 20).
- A 512px plugin icon (`.claude-plugin/icon.png`).
- `repo-adopt` skill and `/repo-forge:check adopt` mode to bring an existing
  repository under Repo Forge governance.
- Per-stack `CLAUDE.md` templates for Angular, React, Next.js, Vue, .NET,
  NestJS/Express, FastAPI, Django and Laravel.
- Interview probes for core data/entities and third-party integrations.
- Prerequisite/version checks and lint-script verification guidance in the
  scaffolder.
- README (Italian) with step-by-step Windows install, and this changelog.

### Changed
- `author` in `plugin.json` is now an object, per the manifest schema.
- `guard-locked.js` refactored into pure, unit-testable decision functions with
  cross-platform (Windows + POSIX) path and command handling. Detection now also
  covers interpreter write one-liners (`python open(...,'w')`, Node
  `writeFileSync`, PHP `file_put_contents`, Ruby `File.write`) without flagging
  their read counterparts. Verified firing inside real `claude` sessions.

### Fixed
- Documented and guarded against starter templates whose default `lint` script
  fails on a fresh project (observed with the current Vite React template).

## [1.0.0]

### Added
- Initial plugin: `/repo-forge:new-repo`, `/repo-forge:change`,
  `/repo-forge:check`; interview, stack-advisor, rules-advisor,
  workflow-advisor, repo-scaffolder and repo-docs skills; the structure-lock
  guard hook.
