---
name: stack-advisor
user-invocable: false
description: Recommend a Frontend, Backend and Database stack separately, with justification, based on the interview answers. Defaults the database to SQLite; server databases only when the user provides credentials (kept in .env). Use after repo-interview, inside /repo-forge:new-repo.
---

# Stack Advisor

Recommend the stack as **three separate decisions** — Frontend, Backend,
Database — each with a one-paragraph justification tied to the user's answers.
Always give a clear primary recommendation plus one alternative. Match the
user's skill level: do not recommend something they cannot maintain.

Do **not** invent versions or commands here — that is the scaffolder's job and
must be verified on the web. Here you choose *what*, not *how*.

## Frontend options

- **React (Vite)** — flexible SPA, huge ecosystem; good default for dashboards/apps.
- **Next.js** — React + SSR/SSG, routing, API routes; great for SEO sites and
  full-stack-in-one.
- **Angular** — batteries-included, opinionated; good for large enterprise teams.
- **Vue (Vite)** / **Nuxt** — approachable, strong DX.
- **Svelte / SvelteKit** — minimal, fast.
- **Astro** — content/marketing sites with islands; excellent SEO and performance.

Pick based on: SEO needs (favor Next/Astro/Nuxt for content sites), team skill,
interactivity (SPA vs content), and whether the user wants full-stack-in-one.

## Backend options

- **Node** — NestJS (structured, enterprise) or Express/Fastify (lightweight).
- **.NET** — ASP.NET Core Web API; strong typing, great for enterprise + SQL Server.
- **Python** — FastAPI (modern, async, APIs) or Django (batteries-included, admin).
- **PHP** — Laravel (full-featured) or Symfony (modular).
- **Java** — Spring Boot.
- **Go** — small, fast services.
- **BaaS** — Supabase / Firebase when the user wants minimal backend ownership.

A **full-stack single framework** (Next.js, Nuxt, SvelteKit, Laravel, Django)
can remove the separate backend entirely — recommend this when the project is
small or SEO-driven and the user wants fewer moving parts.

## Database — SQLite is the default

- **Default: SQLite.** Zero-config, file-based, perfect to start, trivially
  swappable later via an ORM. Recommend it unless a requirement rules it out.
- **Server databases** — SQL Server, PostgreSQL, MySQL/MariaDB, MongoDB — only
  if the user **provides credentials** or an explicit need (concurrency, scale,
  managed hosting). Credentials go **only** into `.env`; never in code, docs, or
  the repo. Always commit a `.env.example` with placeholder keys.
- Recommend an ORM/driver that keeps the DB swappable where possible (Prisma,
  Drizzle, EF Core, SQLAlchemy, TypeORM, Eloquent) so starting on SQLite does
  not lock the project in.

## Output

A short "Recommended stack" block:
```
Frontend: <choice> — <why>
Backend:  <choice> — <why>   (or "none — full-stack via <framework>")
Database: <choice, default SQLite> — <why>  (+ .env note if server DB)
Alternatives considered: <1 line>
Open decisions delegated to the user: <...>
```
