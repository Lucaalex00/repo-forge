# CLAUDE.md — Frontend (Angular)

## Stack
Angular (standalone components, TypeScript strict). Package manager: <npm|pnpm>.

## Folder structure
```
src/app/
  core/            # singletons: guards, interceptors, app-wide services
  shared/          # reusable UI components, pipes, directives
  features/<name>/ # one folder per feature (components, services, routes)
  app.routes.ts    # route config (lazy-load features)
```

## Patterns
- Standalone components (`standalone: true`); avoid NgModules unless required.
- State: component signals / services with `signal()`; add a store only if the
  interview called for shared complex state.
- Data access through injectable services using `HttpClient`; never call HTTP
  from components directly.
- Use the `async` pipe or signals; unsubscribe is handled by these — avoid
  manual subscriptions that can leak.
- Reactive forms over template-driven forms for non-trivial forms.

## Naming
- Components: `PascalCase` class, files `kebab-case.component.ts` + matching
  `.html`/`.scss` + `.spec.ts`.
- Services: `*.service.ts`; one responsibility each.
- Selectors: `app-<kebab>`.

## Commands (confirm against package.json)
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev | `ng serve` |
| Build | `ng build` |
| Lint | `ng lint` |
| Test | `ng test` |
| E2E | `<Playwright/Cypress>` |

## Must / must-not
- Keep business logic out of templates.
- No `any`; TypeScript strict stays on.
- One component per file; feature code stays inside its feature folder.
