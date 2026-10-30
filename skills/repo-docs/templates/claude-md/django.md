# CLAUDE.md — Backend (Python / Django)

## Stack
Django (+ Django REST Framework if an API is needed). DB: <SQLite default |
server DB via .env>. Tooling: Ruff + Black. Package/venv: <uv | pip + venv>.

## Folder structure
```
<project>/
  settings/            # base.py, dev.py, prod.py (reads env)
  urls.py, wsgi.py, asgi.py
apps/<name>/           # one Django app per domain
  models.py, views.py, serializers.py, urls.py, admin.py, tests.py
```

## Patterns
- One Django app per bounded domain; keep apps cohesive.
- Business logic in services/model methods, not fat views.
- DRF serializers at the API boundary; validate there.
- Settings split by environment; secrets and DB config from env (`.env`,
  git-ignored) via `os.environ`/`django-environ` — never commit `SECRET_KEY`.
- Use the ORM and migrations; avoid raw SQL unless justified.

## Naming
- Apps/modules/files: `snake_case`; models/classes: `PascalCase`.

## Commands (confirm against the project)
| Task | Command |
| --- | --- |
| Install | `pip install -r requirements.txt` |
| Migrate | `python manage.py migrate` |
| Dev | `python manage.py runserver` |
| Make migrations | `python manage.py makemigrations` |
| Lint/Format | `ruff check . && black .` |
| Test | `python manage.py test` (or `pytest`) |

## Must / must-not
- No secrets or `DEBUG=True` in committed settings.
- Keep views thin; no business logic in templates.
- Every model change ships a migration.
