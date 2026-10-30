# Scaffolding entry points (confirm current syntax before running)

> These are common, official starting points. CLI names and flags change over
> time — **always confirm the current command on the official docs or registry
> page before running it**, and never invent flags. Run from the parent of the
> target directory unless noted.

## Frontend

| Stack | Typical official entry point | Confirm at |
| --- | --- | --- |
| React (Vite) | `npm create vite@latest <app> -- --template react-ts` | vite.dev |
| Vue (Vite) | `npm create vite@latest <app> -- --template vue-ts` | vite.dev |
| Svelte | `npx sv create <app>` | svelte.dev |
| Next.js | `npx create-next-app@latest <app>` | nextjs.org |
| Nuxt | `npm create nuxt@latest <app>` | nuxt.com |
| Angular | `npm install -g @angular/cli` then `ng new <app>` | angular.dev |
| Astro | `npm create astro@latest <app>` | astro.build |
| SvelteKit | `npx sv create <app>` | svelte.dev |

## Backend

| Stack | Typical official entry point | Confirm at |
| --- | --- | --- |
| NestJS | `npm i -g @nestjs/cli` then `nest new <app>` | nestjs.com |
| Express/Fastify | `npm init -y` + add framework | expressjs.com / fastify.dev |
| .NET Web API | `dotnet new webapi -n <App>` (in a solution) | learn.microsoft.com |
| FastAPI | `pip install fastapi uvicorn` + project files | fastapi.tiangolo.com |
| Django | `pip install django` then `django-admin startproject <app>` | djangoproject.com |
| Laravel | `composer create-project laravel/laravel <app>` | laravel.com |
| Symfony | `symfony new <app>` / `composer create-project symfony/skeleton` | symfony.com |
| Spring Boot | generate at start.spring.io | spring.io |
| Go | `go mod init <module>` | go.dev |

## Database / ORM (default SQLite)

| Tool | Typical entry point | Confirm at |
| --- | --- | --- |
| Prisma | `npm i -D prisma` then `npx prisma init --datasource-provider sqlite` | prisma.io |
| Drizzle | `npm i drizzle-orm` + driver | orm.drizzle.team |
| EF Core (SQLite) | `dotnet add package Microsoft.EntityFrameworkCore.Sqlite` | learn.microsoft.com |
| SQLAlchemy | `pip install SQLAlchemy` | sqlalchemy.org |
| TypeORM | `npm i typeorm` | typeorm.io |

## Tooling

| Tool | Typical entry point | Confirm at |
| --- | --- | --- |
| ESLint/Prettier | framework presets or `npm init @eslint/config` | eslint.org / prettier.io |
| Husky + lint-staged | `npx husky init` | typicode.github.io/husky |
| pre-commit | `pip install pre-commit` then `pre-commit install` | pre-commit.com |
| Docker Compose | add `compose.yaml` | docs.docker.com |

Server databases (SQL Server, PostgreSQL, MySQL/MariaDB, MongoDB) are wired via
a connection string in `.env` only, and typically run via Docker Compose for
local development — confirm the current image tags on Docker Hub.
