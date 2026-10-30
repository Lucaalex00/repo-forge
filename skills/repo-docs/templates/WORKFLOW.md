# Workflow — <project name>

> How we work and the tools we use. Setup commands here were verified against
> official docs at generation time — re-verify if they fail.

## Day-to-day
1. Create a feature branch.
2. Implement with tests.
3. Run format + lint + tests locally (git hook enforces this).
4. Open a PR; pass review and CI.
5. Merge to the default branch.

## Commands
| Task | Command | Notes |
| --- | --- | --- |
| Install | <...> | |
| Dev server | <...> | |
| Build | <...> | |
| Lint | <...> | |
| Test | <...> | |

## Tools
<For each tool chosen in the workflow phase: what it is, why, and verified setup
 (with the source checked). Mark anything needing a manual step such as an API
 key in .env.>

- State management: <... or none>
- Testing / browser: <Playwright, Playwright MCP, …>
- Docs in context: <Context7 MCP, …>
- GitHub integration: <GitHub MCP, …>
- Git hooks: <Husky + lint-staged | pre-commit>
- Containers: <Docker Compose | none>

## Changing the architecture
Use `/repo-forge:change`: write an ADR, get approval, apply within the 10-minute
unlock window, then it re-locks automatically.
