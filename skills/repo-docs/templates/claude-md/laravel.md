# CLAUDE.md — Laravel (PHP, full-stack or API)

## Stack
Laravel (PHP). DB: <SQLite default | server DB via .env>. Frontend: <Blade +
Livewire | Inertia + React/Vue | API only>. Tooling: Pint (format), PHPStan/
Larastan.

## Folder structure
```
app/
  Models/              # Eloquent models
  Http/Controllers/    # thin controllers
  Http/Requests/       # form request validation
  Services/            # business logic
  Repositories/        # optional data-access layer
routes/web.php, routes/api.php
database/migrations/   # schema
resources/views/       # Blade (if used)
tests/
```

## Patterns
- Controllers are thin; logic in services/actions. Validate via Form Requests.
- Data access via Eloquent models; keep complex queries in the model or a
  repository, not in controllers.
- Config/secrets in `.env` (git-ignored); commit `.env.example`. Never commit
  `APP_KEY` or DB credentials.
- Use migrations + seeders; never edit the DB schema by hand.

## Naming
- Classes: `PascalCase` (`BookingController`, `Booking`). Methods/vars:
  `camelCase`. DB tables: `snake_case` plural; columns `snake_case`.

## Commands (confirm against the project)
| Task | Command |
| --- | --- |
| Install | `composer install && npm install` |
| Key | `php artisan key:generate` |
| Migrate | `php artisan migrate` |
| Dev | `php artisan serve` (+ `npm run dev`) |
| Format | `./vendor/bin/pint` |
| Static analysis | `./vendor/bin/phpstan analyse` |
| Test | `php artisan test` |

## Must / must-not
- No business logic in controllers or Blade templates.
- No secrets committed; `.env` stays local.
- Every schema change via a migration.
