# CLAUDE.md — Astro (content / marketing site)

## Stack
Astro + TypeScript. Islands for interactivity (optionally React/Vue/Svelte).
Content via content collections. Package manager: <npm|pnpm>.

## Folder structure
```
src/
  pages/                 # file-based routes (.astro, .md, .mdx)
  layouts/               # shared page layouts
  components/            # .astro + island components
  content/               # content collections (+ config.ts schema)
  styles/
public/                  # static assets served as-is
```

## Patterns
- Default to **static** `.astro` components (zero JS). Add an island with a
  `client:*` directive only where interactivity is actually needed.
- Use **content collections** with a typed schema for blog/menu/catalog content.
- Keep data fetching at build time where possible (SSG) for SEO/perf; use SSR
  adapters only when needed.
- Secrets via `import.meta.env` (server), `PUBLIC_*` for client-exposed values.

## Naming
- Components/layouts: `PascalCase.astro`. Pages: route-named. Folders: `kebab-case`.

## Commands (confirm against package.json)
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Preview | `npm run preview` |
| Check | `npx astro check` |

## Must / must-not
- Do not add `client:*` to a component that needs no JS.
- Keep `PUBLIC_*` free of secrets.
- Validate content with a collection schema; no untyped frontmatter.
