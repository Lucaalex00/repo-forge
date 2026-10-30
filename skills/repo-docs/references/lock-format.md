# Lock format (`.repoforge/locked.json` and `unlock.json`)

The lock state lives in the **user's project**, under `.repoforge/`. The
plugin's `guard-locked` PreToolUse hook reads these files to decide whether to
block a write.

## `.repoforge/locked.json` (committed)

```json
{
  "version": 1,
  "lockedAt": "2026-01-01T12:00:00Z",
  "locked": [
    "PROJECT_BRIEF.md",
    "ARCHITECTURE.md",
    "GUIDELINES.md",
    "GUARDRAILS.md",
    "CONVENTIONS.md",
    "WORKFLOW.md",
    "CLAUDE.md",
    "frontend/CLAUDE.md",
    "backend/CLAUDE.md"
  ]
}
```

- `locked` holds **project-relative** paths (POSIX separators). The guard also
  matches absolute references, Windows backslash paths, and bare filenames.
- Do **not** lock `CHANGELOG.md` or `docs/adr/*` — those must keep receiving
  new entries. Lock the stable architecture/decision documents only.
- This file is committed so the lock travels with the repo.

## `.repoforge/unlock.json` (temporary, git-ignored)

Created by `/repo-forge:change` after an ADR is written and the user approves.

```json
{
  "expiresAt": "2026-01-01T12:10:00Z",
  "paths": ["ARCHITECTURE.md"],
  "reason": "Switch database from SQLite to PostgreSQL",
  "adr": "docs/adr/0002-switch-to-postgres.md"
}
```

- `expiresAt` is UTC ISO-8601. When it is in the past, the unlock is ignored and
  the files are locked again. Default window: 10 minutes.
- `paths` scopes the unlock. Use `"all"` (or omit) only when truly needed.
- `/repo-forge:change` deletes this file after applying the change, re-locking
  immediately. It is git-ignored so it never travels with the repo.

## How the guard decides

`PreToolUse` → if the tool (`Write`/`Edit`/`NotebookEdit`/`Bash`) would write to
a locked path and no valid unlock covers it → exit 2 (block) with a reason on
stderr. Otherwise exit 0 (allow). Reads are never blocked.
