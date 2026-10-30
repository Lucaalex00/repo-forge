# CLAUDE.md — Backend (Go)

## Stack
Go (modules). HTTP via stdlib `net/http` or a light router (chi/echo). DB:
<SQLite default | server DB via .env>, accessed with `database/sql` + driver or
`sqlc`/`gorm`.

## Folder structure
```
cmd/<app>/main.go        # entry point, wiring
internal/
  http/                  # handlers, router, middleware
  service/               # business logic
  repository/            # data access
  config/                # config loaded from env
migrations/              # SQL migrations
```
Keep packages under `internal/` so they can't be imported externally.

## Patterns
- Handlers are thin; logic in `service`; data in `repository`. Pass
  dependencies explicitly (constructor functions), avoid globals.
- Return errors, wrap with `fmt.Errorf("...: %w", err)`; handle at the edge.
- Config and secrets from environment (`.env` loaded in dev, git-ignored).
- `context.Context` as the first argument on request-scoped calls.

## Naming
- Packages: short lower-case. Exported identifiers: `PascalCase`; unexported:
  `camelCase`. Files: `snake_case.go`; tests `*_test.go`.

## Commands (confirm against the module)
| Task | Command |
| --- | --- |
| Build | `go build ./...` |
| Run | `go run ./cmd/<app>` |
| Test | `go test ./...` |
| Vet | `go vet ./...` |
| Format | `gofmt -w .` (or `go fmt ./...`) |
| Lint | `golangci-lint run` |

## Must / must-not
- No business logic in HTTP handlers.
- Never ignore an error without a comment explaining why.
- No secrets in code; read them from the environment.
