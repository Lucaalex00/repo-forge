# CLAUDE.md — Symfony (PHP, API or full-stack)

## Stack
Symfony (PHP). DB: <SQLite default | server DB via .env> with Doctrine ORM.
Frontend: <Twig | API only + separate SPA>. Tooling: PHP-CS-Fixer, PHPStan.

## Folder structure
```
src/
  Controller/            # thin controllers
  Entity/                # Doctrine entities
  Repository/            # Doctrine repositories
  Service/               # business logic
  Dto/ + Form/           # input shapes / validation
config/                  # services, routes, packages
migrations/              # Doctrine migrations
templates/               # Twig (if used)
tests/
```

## Patterns
- Controllers are thin; logic in services; data via Doctrine repositories.
- Validate input with the Validator component / DTOs; never trust request data.
- Config and secrets via `.env` + `.env.local` (git-ignored); commit
  `.env` with non-secret defaults only, never real credentials or `APP_SECRET`.
- Use migrations; do not edit the schema by hand.

## Naming
- Classes: `PascalCase` (`BookingController`, `Booking`). Methods/vars:
  `camelCase`. DB tables/columns: `snake_case`.

## Commands (confirm against the project)
| Task | Command |
| --- | --- |
| Install | `composer install` |
| Serve | `symfony serve` (or `php -S`) |
| Migrate | `php bin/console doctrine:migrations:migrate` |
| Cache | `php bin/console cache:clear` |
| Static analysis | `vendor/bin/phpstan analyse` |
| Format | `vendor/bin/php-cs-fixer fix` |
| Test | `php bin/phpunit` |

## Must / must-not
- No business logic in controllers or Twig templates.
- No secrets committed; real values go in `.env.local`.
- Every schema change via a Doctrine migration.
