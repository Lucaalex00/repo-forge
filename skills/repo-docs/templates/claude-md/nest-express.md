# CLAUDE.md — Backend (Node: NestJS / Express)

## Stack
Node + TypeScript (strict). Framework: <NestJS | Express/Fastify>.
ORM: <Prisma | Drizzle | TypeORM>. DB: <SQLite default | server DB via .env>.

## Folder structure (NestJS)
```
src/
  modules/<name>/      # <name>.controller.ts, .service.ts, .module.ts, dto/
  common/              # guards, interceptors, filters, pipes
  config/              # typed config loading from env
  main.ts
prisma/ or drizzle/    # schema + migrations
test/
```
For Express: `src/routes`, `src/controllers`, `src/services`, `src/repositories`,
`src/middleware` — keep the same layering.

## Patterns
- Controllers/routes are thin; business logic lives in services; data access in
  repositories/ORM. Dependencies injected (Nest DI) or passed explicitly.
- Validate request input (class-validator / zod); return a typed error envelope.
- Config and secrets from env (`.env`, git-ignored); never hard-code.
- Async/await everywhere; handle and log errors; no unhandled rejections.

## Naming
- Files: `kebab-case` with role suffix (`*.service.ts`, `*.controller.ts`).
- Classes/types: `PascalCase`; variables/functions: `camelCase`.

## Commands (confirm against package.json)
| Task | Command |
| --- | --- |
| Install | `npm install` |
| Dev | `npm run start:dev` (Nest) / `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Migrate | `npx prisma migrate dev` (if Prisma) |

## Must / must-not
- No DB queries in controllers/routes.
- No `any`; DTOs typed and validated.
- One module/responsibility per folder.
