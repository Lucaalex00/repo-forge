# Non-interactive spec (`repoforge.config.json`)

Drop a `repoforge.config.json` at the target directory (or pass its path) to run
`/repo-forge:new-repo` **without the interview** — the agentic, low-token path.
Validate it with `node "${CLAUDE_PLUGIN_ROOT}/scripts/spec.js" --file repoforge.config.json`.

The **50-word vision gate still applies**: a spec with a shorter `vision` is
rejected.

## Fields

| Field | Required | Values / notes |
| --- | --- | --- |
| `level` | no (default `expert`) | `beginner` \| `expert` |
| `vision` | **yes** | string, **≥ 50 words** |
| `targetUsers` | no | string |
| `features.mustHave` | recommended | string[] |
| `features.niceToHave` | no | string[] |
| `nonFunctional` | no | object (seo, a11y, scale, privacy…) |
| `constraints` | no | object (budget, hosting, deadline, mustUse, mustAvoid) |
| `stack.frontend` | no (default `auto`) | `react` \| `next` \| `vue` \| `angular` \| `svelte` \| `astro` \| `auto` |
| `stack.backend` | no (default `auto`) | `node-nest` \| `node-express` \| `dotnet` \| `fastapi` \| `django` \| `laravel` \| `symfony` \| `go` \| `none` \| `auto` |
| `stack.database` | no (default `sqlite`) | `sqlite` \| `postgres` \| `mysql` \| `sqlserver` \| `mongo` |
| `layout.repo` | no (default `monorepo`) | `monorepo` \| `separate` |
| `layout.docs` | no (default `root`) | `root` \| `frontend` \| `backend` \| `dedicated` |
| `layout.dbScripts` | no (default `backend`) | `backend` \| `separate` |
| `integrations` | no | array of `{ name, envKeys: string[] }` |
| `rules.guardrails` | no | string[] (advisor tops up to ≥10) |
| `rules.guidelines` | no | string[] |
| `workflow.tools` | no | string[] |

Secrets are never put in the spec — only integration **names** and the **env key
names**. Real values go in `.env`.

## Example (`repoforge.config.example.json`)

```json
{
  "level": "expert",
  "vision": "A booking site for a small bakery where customers browse the menu, reserve a pickup slot for cakes and pastries, and leave a note; the owner manages products, opening hours and incoming reservations from a simple admin area, receives an email for each booking, and can close days when the bakery is on holiday.",
  "targetUsers": "Local customers and the bakery owner.",
  "features": { "mustHave": ["menu", "reservations", "admin", "opening hours"], "niceToHave": ["gallery"] },
  "stack": { "frontend": "next", "backend": "none", "database": "sqlite" },
  "layout": { "repo": "monorepo", "docs": "root", "dbScripts": "separate" },
  "integrations": [{ "name": "email (SMTP)", "envKeys": ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"] }]
}
```
