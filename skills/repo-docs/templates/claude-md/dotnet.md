# CLAUDE.md — Backend (.NET / ASP.NET Core Web API)

## Stack
ASP.NET Core Web API (C#, nullable enabled). Data: EF Core. DB: <SQLite default
| SQL Server via connection string in .env / user-secrets>.

## Folder structure
```
src/
  <App>.Api/            # controllers/endpoints, Program.cs, DI
  <App>.Application/    # use cases, DTOs, validation
  <App>.Domain/         # entities, domain logic
  <App>.Infrastructure/ # EF Core DbContext, repositories, migrations
tests/
  <App>.Tests/
```

## Patterns
- Layered/clean architecture: Api → Application → Domain; Infrastructure
  implements interfaces. Dependencies point inward.
- Data access through repositories/`DbContext` in Infrastructure; no EF queries
  in controllers.
- DTOs at the boundary; never return entities directly. Validate input
  (FluentValidation or data annotations).
- Config/secrets via `appsettings.json` + environment / user-secrets; the DB
  connection string comes from `.env`/environment, never committed.

## Naming
- Types/methods: `PascalCase`; private fields `_camelCase`; interfaces `IName`.
- One public type per file, file name = type name.

## Commands (confirm against the solution)
| Task | Command |
| --- | --- |
| Restore | `dotnet restore` |
| Run | `dotnet run --project src/<App>.Api` |
| Build | `dotnet build` |
| Format | `dotnet format` |
| Test | `dotnet test` |
| Migration | `dotnet ef migrations add <Name>` |

## Must / must-not
- No business logic in controllers.
- No raw SQL outside Infrastructure.
- Keep nullable reference types enabled; handle nulls explicitly.
