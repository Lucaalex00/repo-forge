# CLAUDE.md — Next.js (App Router, full-stack)

## Stack
Next.js (App Router) + TypeScript (strict). Can serve as the whole stack
(frontend + API routes + server actions). Package manager: <npm|pnpm>.

## Folder structure
```
app/
  (routes)/.../page.tsx      # route segments
  .../layout.tsx             # layouts
  api/<name>/route.ts        # route handlers (backend endpoints)
components/                  # shared UI
lib/                         # server/client helpers, db client
server/ or actions/          # server actions, data access
```

## Patterns
- Prefer **Server Components**; add `"use client"` only when you need
  interactivity/state/browser APIs.
- Data mutations via **server actions** or route handlers; validate input
  (e.g. zod). Never trust client input.
- Database access on the server only (`lib/db`); never expose secrets to the
  client. Env vars: server-only unless prefixed `NEXT_PUBLIC_`.
- Use `fetch` caching semantics deliberately; document any `revalidate`.

## Naming
- Route files are framework-named (`page.tsx`, `layout.tsx`, `route.ts`).
- Components: `PascalCase`. Folders: `kebab-case`.

## Commands (confirm against package.json)
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Start | `npm start` |
| Lint | `npm run lint` |
| Test | `<Playwright/Vitest>` |

## Must / must-not
- Never import server-only modules (db, secrets) into client components.
- Keep `NEXT_PUBLIC_*` free of secrets.
- Type every route handler's input and output.
