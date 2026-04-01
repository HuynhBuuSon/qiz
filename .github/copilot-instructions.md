# Qiz — GitHub Copilot Instructions

This is a full-stack real-time game room application called **Qiz**, split into two independent sub-projects.

---

## Project Structure

```
qiz/
├── API/    # Go Buffalo backend (REST + WebSocket)
└── UI/     # Next.js 15 frontend (App Router)
```

### API — `API/`

- **Language**: Go 1.21+
- **Framework**: Buffalo v1.1.4 (Gorilla Mux routing)
- **Database**: PostgreSQL — raw SQL via `sqlx`; Pop v6 used only for `buffalo db migrate`
- **Port**: `3001`
- **Dev command**: `buffalo dev` from the `API/` directory
- **Detailed instructions**: `.github/instructions/api-project.md` (`applyTo: "API/**"`)

### UI — `UI/`

- **Language**: TypeScript
- **Framework**: Next.js 15 (App Router, standalone output)
- **Port**: `3000`
- **Dev command**: `npm run dev` from the `UI/` directory
- **API communication**: All REST calls go through Next.js rewrites (`/api/*` proxied to `http://localhost:3001/api/*`); WebSocket connects directly to `ws://localhost:3001/ws`
- **Detailed instructions**: `.github/instructions/ui-project.md` (`applyTo: "UI/**"`)

---

## Key Conventions

- **Never mix UI and API code.** Each sub-project is entirely self-contained.
- **REST base URL in UI**: `API_URL` in `UI/lib/config.ts` is an empty string (`''`) — all fetches use relative paths (e.g. `/api/rooms`) which Next.js rewrites to the Go API.
- **WebSocket URL**: `WS_URL` in `UI/lib/config.ts` derives an absolute `ws://` URL from `NEXT_PUBLIC_WS_URL`.
- **CORS**: Handled in Go via `github.com/rs/cors` middleware in `API/actions/app.go`. The Next.js rewrite proxy eliminates browser CORS for REST calls.
- **Database**: Postgres only. Schema lives in `API/migrations/`. The `players` table does **not** have a `sequence_number` column in the live database.

---

## Instruction Files

| File | Scope | Purpose |
|------|-------|---------|
| `.github/copilot-instructions.md` | Entire repo | Top-level project overview (this file) |
| `.github/instructions/api-project.md` | `API/**` | Detailed Go Buffalo conventions, schema, endpoint list, and code patterns |
| `.github/instructions/ui-project.md` | `UI/**` | Detailed Next.js conventions, directory structure, hooks, and state management |

> **Important**: whenever the project structure changes — new directories, renamed packages, added endpoints, schema changes, new environment variables, or changes to how the UI communicates with the API — you **must** update the relevant instruction file(s):
> - Changes inside `API/` → update `.github/instructions/api-project.md`
> - Changes inside `UI/` → update `.github/instructions/ui-project.md`
> - Changes that affect both (e.g. new env vars, new WebSocket events, protocol changes) → update both files and this top-level file.

---

## Environment Variables

### API (`API/.env`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `ADDR` | `:3001` | Server listen address |
| `GO_ENV` | `development` | Environment |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |

### UI (`UI/.env.local`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Used only by Next.js rewrites in `next.config.ts` |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | WebSocket base URL (browser connects directly) |
