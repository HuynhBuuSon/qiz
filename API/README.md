# Qiz API

A Go Buffalo REST API for the Qiz real-time quiz application.

## Tech Stack

- **Framework**: [Buffalo](https://gobuffalo.io) v1.1.4
- **ORM**: [Pop](https://github.com/gobuffalo/pop) v6
- **Database**: PostgreSQL
- **WebSockets**: [gorilla/websocket](https://github.com/gorilla/websocket)
- **Language**: Go 1.23+

## Getting Started

### Prerequisites

- Go 1.23+
- PostgreSQL 14+
- Buffalo CLI: `go install github.com/gobuffalo/cli/cmd/buffalo@latest`

### Setup

```bash
# Install dependencies
go mod download

# Copy environment config
cp .env.example .env
# Edit .env with your database credentials

# Create the database
buffalo db create -a

# Run migrations
buffalo db migrate

# Start the development server (hot reload)
buffalo dev
```

The API will be available at `http://localhost:3001`.

## Project Structure

```
API/
├── actions/          # HTTP handlers and routes
│   ├── app.go       # App setup, middleware, route definitions
│   ├── home.go      # Root/health endpoint
│   ├── render.go    # JSON render engine
│   ├── rooms.go     # Room CRUD handlers
│   ├── games.go     # Game lifecycle handlers
│   ├── questions.go # Question CRUD handlers
│   ├── players.go   # Player handlers
│   ├── websocket.go # WebSocket hub and handler
│   └── helpers.go   # Utility functions
├── models/           # Database models (Pop ORM)
│   ├── models.go    # DB connection init
│   ├── room.go
│   ├── game.go
│   ├── question.go
│   ├── player.go
│   └── submission.go
├── migrations/       # SQL migration files
├── grifts/           # CLI tasks (like Rake tasks)
├── cmd/app/main.go   # Application entry point
├── database.yml      # Database configuration
├── .env              # Local environment variables
└── go.mod
```

## API Endpoints

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/rooms` | List all rooms |
| POST | `/api/v1/rooms` | Create a room |
| GET | `/api/v1/rooms/:room_id` | Get a room |
| PUT | `/api/v1/rooms/:room_id` | Update a room |
| DELETE | `/api/v1/rooms/:room_id` | Delete a room |

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/games` | List all games |
| POST | `/api/v1/games` | Create a game |
| GET | `/api/v1/games/:game_id` | Get a game with questions |
| PUT | `/api/v1/games/:game_id` | Update a game |
| DELETE | `/api/v1/games/:game_id` | Delete a game |
| POST | `/api/v1/games/:game_id/start` | Start a game |
| POST | `/api/v1/games/:game_id/next` | Advance to next question |
| POST | `/api/v1/games/:game_id/end` | End a game |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/questions` | List all questions |
| POST | `/api/v1/questions` | Create a question |
| GET | `/api/v1/questions/:question_id` | Get a question |
| PUT | `/api/v1/questions/:question_id` | Update a question |
| DELETE | `/api/v1/questions/:question_id` | Delete a question |

### Players
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/players` | List all players |
| POST | `/api/v1/players` | Join (create a player) |
| GET | `/api/v1/players/:player_id` | Get a player |

### Game Play
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/games/:game_id/submit` | Submit an answer |
| GET | `/api/v1/games/:game_id/results` | Get game results |
| GET | `/api/v1/games/:game_id/leaderboard` | Get leaderboard |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `GET /ws?room_id=<id>` | Connect to a room via WebSocket |

#### WebSocket Message Types
- `connected` — Connection established
- `player_joined` — A new player joined the room
- `game_started` — Game has started
- `question_changed` — Next question is active
- `answer_submitted` — A player submitted an answer
- `game_ended` — Game has ended

## Development Commands

```bash
# Run the server with hot reload
buffalo dev

# Run tests
buffalo test ./...

# Run database migrations
buffalo db migrate

# Rollback last migration
buffalo db rollback

# Generate a new resource
buffalo generate resource widget name

# Run grift tasks
buffalo task db:seed
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GO_ENV` | `development` | Environment (development/test/production) |
| `PORT` | `3001` | HTTP server port |
| `DATABASE_URL` | (see .env) | PostgreSQL connection string |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `SESSION_SECRET` | — | Session encryption key (required in production) |
