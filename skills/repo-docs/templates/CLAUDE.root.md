# CLAUDE.md — <project name> (root)

Project-wide instructions for Claude Code. Read this first, then the `CLAUDE.md`
in the part you are working on.

## What this project is
<One sentence from the Project Brief.>

## Golden rules (see GUARDRAILS.md)
- Code, comments, commits and docs in **English**; chat in the user's language.
- Respect existing patterns strictly; do not introduce a second way of doing
  something that already has a convention.
- Secrets only in `.env` (git-ignored). Never hard-code credentials.
- Do not edit locked constitution files directly — use `/repo-forge:change`.

## Where things live
- Architecture: `ARCHITECTURE.md`
- Rules: `GUARDRAILS.md` (hard), `GUIDELINES.md` (soft)
- Conventions: `CONVENTIONS.md`
- How to work & commands: `WORKFLOW.md`
- Decisions: `docs/adr/`
- Parts: <frontend/ , backend/ , database/ — each has its own CLAUDE.md>

## Before you start a task
1. Read the relevant part's `CLAUDE.md`.
2. Follow `CONVENTIONS.md` for naming and layout.
3. Run format/lint/tests per `WORKFLOW.md` before committing.

## Locked structure
The files listed in `.repoforge/locked.json` are locked. A hook blocks direct
edits. To change them, run `/repo-forge:change`.
