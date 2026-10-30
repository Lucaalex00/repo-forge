# CLAUDE.md — Frontend (Vue 3 + Vite)

## Stack
Vue 3 (`<script setup>`, Composition API) + Vite + TypeScript. Package manager:
<npm|pnpm>.

## Folder structure
```
src/
  components/           # reusable components (PascalCase.vue)
  views/ or pages/      # route-level views
  composables/          # useX() composition functions
  stores/               # Pinia stores (if chosen)
  api/                  # typed API client
  router/               # vue-router config
```

## Patterns
- `<script setup lang="ts">` single-file components; Composition API only.
- State: `ref`/`reactive` locally; **Pinia** for shared state if the interview
  called for it.
- Data access in `src/api`; components call composables, not `fetch` directly.
- Props typed with `defineProps<...>()`; emits typed with `defineEmits<...>()`.

## Naming
- Components: `PascalCase.vue`, one component per file.
- Composables: `useThing.ts`. Stores: `useThingStore`.
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
- No Options API in new code.
- No untyped props/emits; no `any`.
- Keep template logic minimal; move it to computed/composables.
