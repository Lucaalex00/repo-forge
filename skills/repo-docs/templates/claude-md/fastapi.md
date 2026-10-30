# CLAUDE.md — Backend (Python / FastAPI)

## Stack
FastAPI + Pydantic v2 + SQLAlchemy (async). DB: <SQLite default | server DB via
.env>. Tooling: Ruff + Black + mypy. Package/venv: <uv | pip + venv>.

## Folder structure
```
app/
  main.py              # app factory, router registration
  api/<name>.py        # routers (endpoints)
  schemas/             # Pydantic models (request/response)
  models/              # SQLAlchemy ORM models
  services/            # business logic
  repositories/        # data access
  core/                # config (reads env), security, deps
tests/
```

## Patterns
- Endpoints are thin; logic in `services`, data in `repositories`.
- Request/response typed with Pydantic schemas; never return ORM models raw.
- Dependency injection via FastAPI `Depends` (db session, current user).
- Config/secrets via Pydantic `BaseSettings` reading `.env` (git-ignored).
- Async DB access; migrations with Alembic.

## Naming
- Modules/files: `snake_case`; classes: `PascalCase`; functions/vars:
  `snake_case`.

## Commands (confirm against the project)
| Task | Command |
| --- | --- |
| Install | `pip install -r requirements.txt` (or `uv sync`) |
| Dev | `uvicorn app.main:app --reload` |
| Lint | `ruff check .` |
| Format | `black . && ruff check --fix .` |
| Types | `mypy app` |
| Test | `pytest` |
| Migrate | `alembic upgrade head` |

## Must / must-not
- No business logic in routers.
- No DB session created inside endpoints — inject it.
- Type everything; keep mypy clean.
