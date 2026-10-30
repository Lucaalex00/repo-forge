---
name: workflow-advisor
user-invocable: false
description: Recommend working methods and tooling (state management, testing, MCP servers, git hooks, containers) for the project, and verify every install command on the web before presenting it. Use after rules-advisor, inside /repo-forge:new-repo.
---

# Workflow Advisor

Recommend how the team should *work*, and which tools help. Match the user's
skill level and keep the toolbox small. **Never invent install commands, flags,
or package names.** Before you show any install/setup command, verify the
current official instructions on the web (official docs or the package's
registry page) and cite where you confirmed it. If you cannot verify it, say so
and give the link to the official docs instead of a command.

## Candidate tools (recommend only what fits)

- **State management** (frontend): e.g. Redux Toolkit (RTK) for large React
  apps with shared state; built-in signals/stores for Angular/Svelte/Vue;
  nothing extra for small apps.
- **Testing & browser automation**: Playwright for e2e; the **Playwright MCP**
  server so Claude can drive a real browser during development.
- **Up-to-date library docs**: the **Context7 MCP** server to pull current docs
  into context instead of relying on memory.
- **Reusable agent skills**: the **Superpowers** plugin for extra skills.
- **GitHub integration**: the **GitHub MCP** server for issues/PRs/CI from
  inside Claude Code.
- **Git hooks / pre-commit**: Husky + lint-staged (JS ecosystems) or the
  `pre-commit` framework (Python/polyglot) to run format/lint/test before commit.
- **Containers**: Docker + docker-compose when the stack needs a server DB or
  reproducible environments; otherwise keep it out to reduce friction.
- Any project-specific helper the interview surfaced.

## How to present

For each recommended tool give: **what it is**, **why it fits this project**,
and the **verified** install/setup step (with the source you checked). Mark
clearly anything the user must do manually (e.g. provide an API key, which goes
in `.env`). Group by "set up now" vs "optional, add later".

## Output

A short "Recommended workflow & tools" section for `WORKFLOW.md`, with verified
commands or official-doc links, ready for the Project Brief.
