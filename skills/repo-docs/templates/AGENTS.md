# AGENTS.md — <project name>

Cross-agent instructions (read by Codex and other AI coding agents, in addition
to Claude Code's `CLAUDE.md`). This file mirrors the project's governance so the
rules hold whichever tool edits the repo.

## What this project is
<One sentence from the Project Brief.>

## Golden rules
- Code, comments, commits and docs in **English**; chat in the user's language.
- Respect existing patterns strictly; do not add a second way to do something
  that already has a convention here.
- Secrets only in `.env` (git-ignored). Never hard-code credentials.
- The files listed in `.repoforge/locked.json` are **locked**: do not edit them
  directly. To change one, record an ADR in `docs/adr/`, then make the change
  during an unlock window (see below). A git pre-commit hook enforces this for
  every agent and for manual commits.

## Where things are
- Architecture: `ARCHITECTURE.md` · Rules: `GUARDRAILS.md` (hard),
  `GUIDELINES.md` (soft) · Conventions: `CONVENTIONS.md` · Workflow &
  commands: `WORKFLOW.md` · Decisions: `docs/adr/`.
- Each part (frontend/backend/…) has its own `CLAUDE.md` / section.

## Changing a locked file (any agent)
1. Add a numbered ADR under `docs/adr/` explaining the change.
2. Open the unlock window: `node scripts/unlock.js --dir . --paths "<file>" --minutes 10 --reason "<why>" --adr "<adr path>"` (if the scripts were installed into the project), or follow `WORKFLOW.md`.
3. Make the edit, update `CHANGELOG.md`, then close the window
   (`node scripts/unlock.js --dir . --clear`).

In Claude Code, `/repo-forge:change` does all of this for you.
