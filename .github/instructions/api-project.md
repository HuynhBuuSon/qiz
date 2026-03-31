---
applyTo: "API/**"
---

# Qiz API — Go Buffalo Project Instructions

This is the backend API for the **Qiz** real-time quiz application, built with [Go Buffalo](https://gobuffalo.io) v1.1.4 and PostgreSQL.

## Project Overview

- **Module**: `github.com/canhan/qiz-api`
- **Framework**: Buffalo v1.1.4 (routing via Gorilla Mux, ORM via Pop v6)
- **Database**: PostgreSQL (Pop ORM with UUID primary keys)
- **Transport**: REST + WebSocket (`/ws?room_id=<id>`)
- **Entry point**: `cmd/app/main.go`

---

## Directory Structure

```
API/
├── actions/          # HTTP handlers — one file per resource
│   ├── app.go       # Buffalo app init, middleware, all route definitions
│   ├── render.go    # JSON render engine (r variable)
│   ├── home.go      # GET / health check
│   ├── rooms.go     # /api/v1/rooms CRUD
│   ├── games.go     # /api/v1/games + game lifecycle
│   ├── questions.go # /api/v1/questions CRUD
│   ├── players.go   # /api/v1/players
│   ├── websocket.go # WebSocket hub + /ws handler
│   └── helpers.go   # Shared utilities (e.g. mustUUID)
├── models/           # Pop ORM models
│   ├── models.go    # DB connection (models.DB)
│   ├── room.go
│   ├── game.go
│   ├── question.go
│   ├── player.go
│   └── submission.go
├── migrations/       # Raw SQL up/down migration files
├── grifts/           # CLI tasks (buffalo task <name>)
├── cmd/app/main.go   # main() — calls actions.App().Serve()
├── database.yml      # Pop database config (development/test/production)
└── .env              # Local environment variables (never commit)
```

---

## Conventions & Patterns

### Handlers

- All handlers live in `actions/` and follow the signature `func FooHandler(c buffalo.Context) error`.
- Always return `c.Render(http.StatusXXX, r.JSON(...))` for API responses — never plain `c.Response().Write(...)`.
- For 404s use `c.Error(http.StatusNotFound, err)`.
- Always extract the Pop transaction from context: `tx, ok := c.Value("tx").(*pop.Connection)`.

### Models

- All models use `uuid.UUID` primary keys with `db:"id"`.
- Always implement `Validate`, `ValidateCreate`, and `ValidateUpdate` on every model.
- Use `has_many`, `belongs_to`, `has_one` struct tags for Pop associations.
- Slice types (e.g. `Rooms`, `Games`) are defined as `type Rooms []Room` in the same file.

### Routes

- All API routes are grouped under `/api/v1` in `actions/app.go`.
- WebSocket endpoint is `GET /ws?room_id=<uuid>` — no versioning prefix.
- Route parameters use `{param_name}` syntax (Gorilla Mux style).

### WebSocket

- The `connectionHub` in `actions/websocket.go` manages all active connections keyed by `room_id`.
- Use `BroadcastToRoom(roomID, WSMessage{Type: "...", Payload: ...})` from any handler to push real-time events.
- WebSocket message types: `connected`, `player_joined`, `game_started`, `question_changed`, `answer_submitted`, `game_ended`.

### Migrations

- Migration files are in `migrations/` named `YYYYMMDDHHMMSS_description.up.sql` and `.down.sql`.
- Run with `buffalo db migrate` / `buffalo db rollback`.
- Use `gen_random_uuid()` for UUID defaults in PostgreSQL.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GO_ENV` | `development` / `test` / `production` |
| `PORT` | Server port (default `3001`) |
| `DATABASE_URL` | Full PostgreSQL DSN (production) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `SESSION_SECRET` | Required in production |

---

## Common Commands

```bash
# Start dev server with hot reload
buffalo dev

# Run all tests
buffalo test ./...

# Create DB + run all migrations
buffalo db create -a && buffalo db migrate

# Generate a full REST resource
buffalo generate resource <name> field:type ...

# Generate a model only
buffalo generate model <name> field:type ...

# Generate a migration
buffalo generate migration <description>

# Run grift tasks
buffalo task db:seed
```

---

## Code Style

- Use standard Go formatting (`gofmt` / `goimports`).
- Prefer explicit error returns over panics.
- Use `fmt.Errorf("context: %w", err)` for error wrapping.
- Keep handler functions focused — move complex business logic to the `models/` layer or a `services/` package if it grows.
- Do not use `interface{}` — use `any` (Go 1.18+).

## Testing

- Place tests in `actions/` as `*_test.go` files using Buffalo's test suite (`suite.Suite`).
- Use the `test` database config from `database.yml`.
- Run a single test file: `buffalo test ./actions/ -run TestRoomsHandler`.

## Security Notes

- CSRF middleware is enabled for non-GET requests; API clients must send the `X-CSRF-Token` header or use token-based auth.
- SSL redirect is enforced in production via `forcessl` middleware.
- Validate and sanitize all input at the model layer using `pop/validate`.
- Never log or expose raw database errors to clients — wrap with `c.Error(...)`.
