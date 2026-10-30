---
name: repo-adopt
description: Bring an already-existing repository under Repo Forge governance — infer the real stack/layout/conventions from the code, run a short confirming interview, generate the constitution documents from the actual repo, and lock them. Use for /repo-forge:check adopt, never for a brand-new project.
---

# Repo Adopt

Apply Repo Forge to a repository that **already exists**, without re-scaffolding
it. Add governance; do not move or rewrite source files.

## 1. Read the real repository
Infer, from the actual code:
- Stack per part (frontend/backend/database) — from manifests (`package.json`,
  `*.csproj`, `pyproject.toml`, `composer.json`), lockfiles, and config.
- Layout — monorepo vs single app; where docs and DB scripts already live.
- Conventions actually in use — naming, folder structure, test setup, commit
  history style, lint/format config, real build/test/lint commands from scripts.
Record what you could and could not determine.

## 2. Short confirming interview
Do not re-ask what the code already answers. Confirm the **vision** (still apply
the 50-word gate — the user must articulate it), and fill only the gaps the code
cannot reveal: target users, NFRs, constraints, and which existing conventions
should become **guardrails** (locked) vs **guidelines** (soft).

## 3. Generate the constitution from the real repo
Use the `repo-docs` templates, but every statement must reflect what is actually
in the repository:
- `ARCHITECTURE.md` describes the real folders and data flow (include a tree
  generated from the repo).
- `CONVENTIONS.md` captures the conventions already observed.
- `GUARDRAILS.md`/`GUIDELINES.md` encode the rules the user confirmed, derived
  from existing practice.
- Per-part `CLAUDE.md` uses the real build/test/lint commands found in the repo.
- Start `CHANGELOG.md` at the current state; first ADR records the adoption.

## 4. Lock and verify
- Create `.repoforge/locked.json` listing the generated constitution files.
- Ensure `.env`/secret files are git-ignored; if secrets are already committed,
  flag it as a risk (do not try to rewrite history unasked).
- Run `/repo-forge:check` (verification checklist) and report.

## Guardrails for adopt mode
- Never delete, move, or rewrite existing source files.
- Never invent conventions the repo does not follow — document reality, then
  propose improvements separately.
- If the repo is empty or barely started, recommend `/repo-forge:new-repo`
  instead.
