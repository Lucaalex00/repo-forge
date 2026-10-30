# CLAUDE.md — SvelteKit (full-stack or frontend)

## Stack
SvelteKit + TypeScript + Vite. Can be full-stack (pages + `+server.ts`
endpoints + form actions). Package manager: <npm|pnpm>.

## Folder structure
```
src/
  routes/                 # file-based routing
    +page.svelte          # page UI
    +page.server.ts       # load() / form actions (server)
    +server.ts            # API endpoints (GET/POST…)
  lib/                    # shared code (import via $lib)
    server/               # server-only modules (db, secrets)
    components/           # reusable components
  hooks.server.ts         # auth, request hooks
```

## Patterns
- Load data in `load()` (prefer `+page.server.ts` for anything touching the DB
  or secrets); mutate via **form actions** or `+server.ts`.
- Server-only code lives in `$lib/server` and is never imported by client code.
- Env: `$env/static/private` and `$env/dynamic/private` for secrets (server),
  `PUBLIC_*` for client-safe values.
- Validate input (e.g. zod) in actions/endpoints.

## Naming
- Route files are framework-named (`+page.svelte`, `+server.ts`).
- Components: `PascalCase.svelte`. Folders: `kebab-case`.

## Commands (confirm against package.json)
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Check | `npm run check` (svelte-check) |
| Lint | `npm run lint` |
| Test | `npm test` (Vitest/Playwright) |

## Must / must-not
- Never import `$lib/server/*` or `$env/*/private` into client components.
- Keep `PUBLIC_*` free of secrets.
- No business logic in `+page.svelte`; put it in load/actions/`$lib`.
