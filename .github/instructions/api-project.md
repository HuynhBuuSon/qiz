---
applyTo: "API/**"
---

# Qiz API — Go Buffalo Project Instructions

This is the backend API for the **Qiz** real-time game room application, built with [Go Buffalo](https://gobuffalo.io) v1.1.4 and PostgreSQL. It mirrors the Next.js `/app/api` route structure exactly.

## Project Overview

- **Module**: `github.com/canhan/qiz-api`
- **Framework**: Buffalo v1.1.4 (routing via Gorilla Mux)
- **Database**: PostgreSQL — raw SQL via `sqlx`; Pop v6 used **only** for `buffalo db migrate`
- **Transport**: REST JSON + WebSocket (`GET /ws?room_id=<id>`)
- **Entry point**: `main.go` (root) — calls `actions.App().Serve()`
- **Dev server**: `buffalo dev` from `API/` directory (requires `.buffalo.dev.yml` at root)

---

## Directory Structure

```
API/
├── main.go              # Entry point — buffalo dev builds from here
├── .buffalo.dev.yml     # Buffalo dev server config (hot reload)
├── .env                 # Local env vars (never commit secrets)
├── database.yml         # Pop database config (reads DB_* env vars)
├── actions/
│   ├── app.go           # Buffalo app init, middleware, all route definitions
│   ├── render.go        # JSON render engine (r variable)
│   ├── home.go          # GET / — health check
│   ├── rooms.go         # /api/rooms CRUD
│   ├── players.go       # /api/rooms/{room_id}/players CRUD
│   ├── games.go         # /api/rooms/{room_id}/games CRUD
│   ├── results.go       # /api/rooms/{room_id}/games/{game_id}/results
│   ├── random.go        # /api/rooms/{room_id}/games/{game_id}/random/winner(s)
│   ├── swagger.go       # GET /api/swagger.json — OpenAPI 3.0 spec
│   ├── websocket.go     # WebSocket hub + /ws handler
│   └── helpers.go       # Shared utilities: generateCode, recalcRanks, broadcastEvent, etc.
├── models/
│   ├── models.go        # models.DB (Pop) + models.SQL (*sqlx.DB)
│   ├── types.go         # RawJSON type for JSONB columns
│   ├── game_room.go     # GameRoom struct → game_rooms table
│   ├── player.go        # Player struct → players table
│   ├── game.go          # Game struct → games table
│   ├── weight.go        # WeightGameData + WeightEntry structs
│   ├── random.go        # RandomGameData + RandomWinner structs
│   └── submission.go    # GameResult struct → game_results table
├── migrations/          # Raw SQL up/down files
│   └── 20260331000001_create_game_schema.up/down.sql
├── grifts/              # CLI tasks (buffalo task <name>)
└── cmd/app/main.go      # Alternate entry (not used by buffalo dev)
```

---

## Database Schema

All tables use `UUID` primary keys with `DEFAULT gen_random_uuid()`.

| Table | Purpose |
|-------|---------|
| `game_rooms` | Game rooms with join/presentation codes and color settings |
| `players` | Players in a room; have `score`, `rank`, `sequence_number` |
| `games` | Games inside a room; `type` is `'weight'` or `'random'` |
| `weight_game_data` | Config for weight-type games |
| `weight_entries` | Individual weight entries per game |
| `random_game_data` | Config for random-type games |
| `random_winners` | Winners recorded in random games |
| `game_results` | Points earned per player per game; unique on `(game_id, player_id)` |

---

## API Endpoints

All REST endpoints are under `/api`. No versioning prefix.

```
GET  /api/swagger.json
GET  /api/swagger        (development only — Swagger UI)

GET  /api/rooms
POST /api/rooms

GET   /api/rooms/{room_id}
PATCH /api/rooms/{room_id}

GET    /api/rooms/{room_id}/players
POST   /api/rooms/{room_id}/players
GET    /api/rooms/{room_id}/players/{player_id}
PATCH  /api/rooms/{room_id}/players/{player_id}
DELETE /api/rooms/{room_id}/players/{player_id}

GET    /api/rooms/{room_id}/games
POST   /api/rooms/{room_id}/games
GET    /api/rooms/{room_id}/games/{game_id}
PATCH  /api/rooms/{room_id}/games/{game_id}
DELETE /api/rooms/{room_id}/games/{game_id}

GET  /api/rooms/{room_id}/games/{game_id}/results
POST /api/rooms/{room_id}/games/{game_id}/results
PUT  /api/rooms/{room_id}/games/{game_id}/results

POST /api/rooms/{room_id}/games/{game_id}/random/winner
GET  /api/rooms/{room_id}/games/{game_id}/random/winners

GET /ws    (WebSocket — query param: room_id)
```

---

## Conventions & Patterns

### Handlers

- All handlers live in `actions/` with the signature `func FooHandler(c buffalo.Context) error`.
- Return `c.Render(http.StatusXXX, r.JSON(...))` for all responses.
- Use `c.Error(http.StatusNotFound, errNotFound("entity"))` for 404s.
- **Never** extract a Pop transaction from context — handlers use `models.SQL` (sqlx) directly.
- No CSRF middleware — this is a pure JSON API.

### Models

- Struct tags: `db:"column_name"` for sqlx, `json:"field_name"` for responses.
- JSONB columns use `models.RawJSON` (defined in `models/types.go`) — implements `sql.Scanner`, `driver.Valuer`, and JSON marshaling.
- No Pop associations, no `Validate()` methods — validation is done inline in handlers.

### sqlx Usage

```go
// SELECT list
var items []models.Foo
models.SQL.Select(&items, `SELECT * FROM foo WHERE bar=$1`, val)

// SELECT single
var item models.Foo
models.SQL.Get(&item, `SELECT * FROM foo WHERE id=$1`, id)

// INSERT RETURNING
var item models.Foo
models.SQL.QueryRowx(`INSERT INTO foo (...) VALUES (...) RETURNING *`, ...).StructScan(&item)

// EXISTS check
var exists bool
models.SQL.Get(&exists, `SELECT EXISTS(SELECT 1 FROM foo WHERE id=$1)`, id)
```

### Dynamic UPDATE helper

Use `field(col, &idx)` from `helpers.go` to build `SET` clauses safely:

```go
parts := []string{}
args := []any{}
idx := 1
if body.Name != nil {
    parts = append(parts, field("name", &idx))
    args = append(args, *body.Name)
}
args = append(args, recordID)
models.SQL.QueryRowx(
    `UPDATE foo SET `+strings.Join(parts, ", ")+` WHERE id=$`+itoa(idx)+` RETURNING *`,
    args...,
).StructScan(&result)
```

### WebSocket

- `hub` in `actions/websocket.go` manages connections keyed by `room_id`.
- Broadcast from any handler via `broadcastEvent(eventType, payload)` — `payload` must be a `map[string]any` containing `"room_id"`.
- Event type names match the UI's Socket.IO events exactly:

| Event | Trigger |
|-------|---------|
| `player:joined` | Player added to room |
| `player:left` | Player deleted |
| `game:update` | Game status/settings patched |
| `game:ended` | Game deleted |
| `points:updated` | Batch results PUT committed |
| `randomGame:winnerSelected` | Random winner recorded |

### Shared Helpers (`actions/helpers.go`)

| Function | Purpose |
|----------|---------|
| `generateCode(n)` | Random uppercase alphanumeric string of length n |
| `randIntn(n)` | Random int in [0, n) |
| `field(col, &idx)` | Build `col = $N` fragment and increment idx |
| `itoa(n)` | int → string |
| `errNotFound(entity)` | Standard not-found error |
| `errMsg(msg)` | Plain string error |
| `recalcRanks(roomID)` | Re-rank all players in room by score DESC, joined_at ASC |
| `broadcastEvent(type, payload)` | Send WS event to all clients in the room |
| `roomExists(roomID)` | EXISTS check on game_rooms |
| `gameExistsInRoom(gameID, roomID)` | EXISTS check on games |

### Migrations

- Files in `migrations/` named `YYYYMMDDHHMMSS_description.up.sql` / `.down.sql`.
- Run with `buffalo db migrate` / `buffalo db rollback`.
- Current migration: `20260331000001_create_game_schema.up.sql` — creates all 8 tables idempotently.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GO_ENV` | `development` | Runtime environment |
| `PORT` | `3000` | Buffalo server port (set `addr` in options if needed) |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `game` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `SESSION_SECRET` | — | Required in production |

---

## Common Commands

```bash
# Must be run from API/ directory
cd API/

# Start dev server with hot reload
buffalo dev

# Run migrations
buffalo db migrate

# Rollback last migration
buffalo db rollback

# Build production binary
buffalo build

# Run grift tasks
buffalo task db:seed
```

---

## Key Business Logic

### Room creation
- Generate unique 4-digit `room_number` (1000–9999, retry up to 100×).
- Generate `join_code` and `presentation_code` as 6-char uppercase alphanumeric (via `generateCode(6)`).

### Player ranking
- On any score change, call `recalcRanks(roomID)` to re-rank all players `ORDER BY score DESC, joined_at ASC`.
- `sequence_number` = `MAX(sequence_number) + 1` on insert (starts at 1).

### Game deletion
- Block delete if `status = 'active'`.
- Delete dependents in order: `weight_entries` → `weight_game_data` → `random_winners` → `random_game_data` → `game_results` → `games`.

### Batch results (PUT)
- Upsert each `game_result` with `ON CONFLICT (game_id, player_id) DO UPDATE`.
- Increment each player's cumulative `score` by `points_earned`.
- Call `recalcRanks(roomID)` after all updates.
- Broadcast `points:updated` event.

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
