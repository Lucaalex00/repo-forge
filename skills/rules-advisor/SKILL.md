---
name: rules-advisor
description: Propose at least 10 concrete, project-specific rules split into guardrails (must-never) and guidelines (should), tailored to the chosen stack and the user's answers. Use after stack-advisor, inside /repo-forge:new-repo.
---

# Rules Advisor

Produce **at least 10** rules, tailored to this specific project and stack. The
user can edit any of them. Split them into two groups and keep each rule
**concrete and verifiable** — avoid vague advice like "write clean code".

- **Guardrails** = hard "must never / must always" rules. These become
  `GUARDRAILS.md`, and the structural ones are what the lock protects.
- **Guidelines** = softer "should / prefer" rules. These become `GUIDELINES.md`.

## Default rule profile (always include, adapt to the stack)

1. Code, comments, identifiers, commit messages and documents are in **English**;
   chat/communication is in the user's language.
2. **Respect existing patterns strictly** — match the conventions already in the
   file/folder you touch; do not introduce a second way of doing the same thing.
3. Secrets live only in `.env` (git-ignored); commit `.env.example` with
   placeholder keys. Never hard-code credentials, tokens, or connection strings.
4. Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, …), small
   and logical; one concern per commit.
5. No direct commits to the default branch; use feature branches + review.
6. Do not edit locked constitution files directly — use `/repo-forge:change`.
7. Every new feature ships with at least one test (unit or e2e as appropriate).
8. Keep dependencies minimal and justified; pin or lock versions.
9. Formatting and linting are enforced by tooling, not by hand (e.g. Prettier/
   ESLint, Black/Ruff, dotnet format) and run before commit.
10. Public-facing UI meets the agreed accessibility target (default WCAG 2.1 AA).

## Make them concrete

For each rule, prefer a checkable form. Examples:
- "Components live in `src/components/<Name>/<Name>.tsx`; one component per file."
- "API endpoints return a typed error envelope `{ error: { code, message } }`."
- "Database access only through the repository layer, never raw SQL in handlers."
- "File names: kebab-case for folders, PascalCase for React components."

Add stack-specific guardrails/guidelines drawn from the chosen frameworks (see
the matching per-part `CLAUDE.md` template in `repo-docs`). Aim for rules that a
reviewer — or the guard hook — could actually check.

## Output

A numbered list under two headings (**Guardrails**, **Guidelines**), ready to be
written into `GUARDRAILS.md` and `GUIDELINES.md` by the `repo-docs` skill.
