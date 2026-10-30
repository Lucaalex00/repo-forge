---
name: repo-docs
description: Generate the separate "constitution" documents (PROJECT_BRIEF, ARCHITECTURE, GUIDELINES, GUARDRAILS, CONVENTIONS, WORKFLOW, CHANGELOG, ADRs, and CLAUDE.md at the root and per part) filled from the real decisions, then lock them via .repoforge/locked.json. Use at the end of /repo-forge:new-repo after scaffolding.
---

# Repo Docs (the constitution)

Generate the governance documents, fill them from the **real** decisions made in
the interview, stack, rules and workflow phases — **no placeholders left behind**
(no `TODO`, `TBD`, `<...>`, `XXX`). Then lock them.

Templates live in `templates/`; the lock format is described in
`references/lock-format.md`. Adapt every template to the project — do not copy a
template verbatim.

## Documents to create (each a separate file)

| File | Purpose |
| --- | --- |
| `PROJECT_BRIEF.md` | The approved vision, features, NFRs, constraints, decisions. |
| `ARCHITECTURE.md` | Chosen stack, layout, data flow, folder structure, boundaries. |
| `GUIDELINES.md` | The "should/prefer" rules (from rules-advisor). |
| `GUARDRAILS.md` | The "must never/always" rules — what the lock protects. |
| `CONVENTIONS.md` | Naming, file layout, commit style, branch model. |
| `WORKFLOW.md` | How to work; recommended tools with verified setup. |
| `CHANGELOG.md` | Keep-a-Changelog format; start at Unreleased. |
| `docs/adr/0001-record-architecture-decisions.md` | First ADR (adopt ADRs). |
| `CLAUDE.md` (root) | Project-wide instructions for Claude Code. |
| `<part>/CLAUDE.md` | One per part (frontend, backend, database, …). |

Place the files according to the **approved docs location** (root / under FE /
under BE / dedicated docs repo). The per-part `CLAUDE.md` always sits in that
part's folder.

## Per-part CLAUDE.md

Use the matching template in `templates/claude-md/` as a starting point:
`angular.md`, `react.md`, `nextjs.md`, `vue.md`, `dotnet.md`, `nest-express.md`,
`fastapi.md`, `django.md`, `laravel.md`. Each covers patterns, naming, folder
structure and the real build/test/lint commands for that stack. Fill in the
project's actual choices; delete rows that do not apply.

## Locking

1. Create `.repoforge/locked.json` listing every constitution file you created
   (project-relative paths). See `references/lock-format.md` for the schema.
2. Make sure the plugin's `guard-locked` hook is active (it ships with the
   plugin; nothing to copy into the project). From now on, edits to listed files
   are blocked unless `/repo-forge:change` opens a temporary unlock window.
3. Tell the user which files are locked and how to change them later.

## Quality bar

Before finishing, grep the generated docs for leftover placeholders and fix
them. Every statement in the docs must reflect a real decision; if something was
delegated to the user and still open, record it explicitly in `PROJECT_BRIEF.md`
under "Open decisions", not as a placeholder.
