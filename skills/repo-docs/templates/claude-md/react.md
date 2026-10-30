# CLAUDE.md — Frontend (React + Vite)

## Stack
React + Vite + TypeScript (strict). Package manager: <npm|pnpm>.

## Folder structure
```
src/
  components/<Name>/<Name>.tsx   # reusable presentational components
  features/<name>/               # feature logic, hooks, local components
  pages/ or routes/              # route-level components
  hooks/                         # shared custom hooks (use* )
  lib/ or api/                   # API client, helpers
  store/                         # state (Redux Toolkit) if chosen
```

## Patterns
- Function components + hooks only. One component per file.
- State: local `useState`/`useReducer`; server state via <TanStack Query>;
  global client state via Redux Toolkit **only if** the interview called for it.
- Data fetching in a typed API layer (`src/api`), not inline in components.
- Co-locate `Component.tsx`, `Component.module.css`, `Component.test.tsx`.
- Keep side effects in `useEffect`/hooks, not in render.

## Naming
- Components: `PascalCase` file and symbol.
- Hooks: `useThing.ts`. Other files: `kebab-case` or `camelCase` (pick one).
- Folders: `kebab-case`.

## Commands (confirm against package.json)
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test | `npm test` |

## Must / must-not
- No `any`; props and API responses are typed.
- No direct DOM manipulation; use refs when unavoidable.
- No business logic in JSX; extract to hooks/helpers.
