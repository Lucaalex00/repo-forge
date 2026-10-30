# Changelog

All notable changes to Repo Forge are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-30

Hardening and test release: made the plugin conformant to the current Claude
Code plugin schema, verified end-to-end, and added automated tests.

### Added
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
