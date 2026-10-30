# Conventions — <project name>

> Naming, layout and process conventions. Change only via `/repo-forge:change`.

## Naming
- Folders: <kebab-case>
- Files: <stack convention, e.g. PascalCase for React components>
- Variables/functions: <camelCase>
- Types/classes: <PascalCase>
- Constants: <UPPER_SNAKE_CASE>
- Database tables/columns: <snake_case>

## File & folder layout
<Where things live: components, services, routes, tests, assets. One example
 path per kind.>

## Git
- Branches: `<type>/<short-description>` (e.g. `feat/booking-form`).
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`,
  `refactor:`, `style:`, `perf:`, `ci:`). Small and logical.
- Default branch: `<main>`. No direct pushes; PR + review.

## Pull requests
<Checklist: tests pass, lint clean, docs updated, no secrets.>

## Code style
- Enforced by <formatter/linter> — run before commit (see WORKFLOW.md).
