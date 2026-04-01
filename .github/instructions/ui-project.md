---
applyTo: "UI/**"
---

# Qiz UI — Next.js Project Instructions

This is the frontend for the **Qiz** real-time game room application, built with Next.js 15 (App Router).

## Project Overview

- **Framework**: Next.js 15, App Router, `'use client'` on all interactive pages
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **State**: Zustand with `persist` middleware (`store/gameStore.ts`)
- **Port**: `3000`
- **Output**: `standalone` (Docker-compatible)
- **Dev command**: `npm run dev` from `UI/`

---

## Three-Role System

Every session is one of three roles, stored in `store/gameStore.ts` as `userRole`:

| Role | Entry point | Capabilities |
|---|---|---|
| `admin` | `/admin/create` → `/admin/home` | Create room, manage players, add/start/end games, control weight & random games |
| `player` | `/player/join` → `/player/game` | Join room by join code, enter weights, watch scores |
| `presenter` | `/presenter/join` → `/presenter/display` | Mirror the scoreboard + active game in presentation mode |

`useDataRecovery(role)` at the top of every protected page enforces the correct role and redirects otherwise.

---

## Directory Structure

```
UI/
├── next.config.ts          # Rewrites: /api/* → Go API, /ws → Go WS
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page (role selection: Admin / Player / Presenter)
│   ├── admin/
│   │   ├── create/          # Create a new game room (name, colors, max players, point mode)
│   │   ├── home/            # Admin dashboard: player grid + active game component
│   │   ├── games/           # Game list: add / start / end / delete games
│   │   └── settings/        # Room settings (colors, join code, presentation code)
│   ├── player/
│   │   ├── join/            # Player joins a room by join code
│   │   └── game/            # Player in-game: WeightGameComponent / RandomGameComponent
│   └── presenter/
│       ├── join/            # Presenter joins by presentation code
│       └── display/         # Live scoreboard + active game display
├── components/
│   ├── RandomGameComponent.tsx   # Admin + player random spin game UI
│   ├── WeightGameComponent.tsx   # Admin + player weight entry game UI
│   ├── PlayerPopup.tsx           # Admin: edit individual player modal
│   ├── admin/                    # Admin-only modals (GameSettingsModal, GameSelectorModal, etc.)
│   ├── common/                   # Shared UI primitives
│   ├── player/                   # Player-facing components
│   ├── presenter/                # Presenter-facing components (QR code, scoreboard)
│   └── providers/                # Context providers (theme, etc.)
├── hooks/
│   ├── useRealTimeUpdates.ts     # WebSocket subscription + polling fallback
│   └── useDataRecovery.ts        # Rehydrates room/player from store on mount; role guard
├── lib/
│   ├── config.ts                 # API_URL (empty string) and WS_URL exports
│   ├── websocket/
│   │   └── client.ts             # WSHub class + initSocket / disconnectSocket / emit / on helpers
│   ├── games/
│   │   ├── BaseGame.ts           # Abstract base: calculatePoints(), getResults()
│   │   ├── WeightGameLogic.ts    # initializeEntries, updateStartWeight, updateEndWeight, endGame
│   │   ├── RandomGameLogic.ts    # getAvailablePlayers, spinWheel, calculatePointsAwarded, recordWinner, endGame
│   │   ├── types.ts              # PointMode enum ('mode1' | 'mode2') and shared game types
│   │   └── index.ts              # Re-exports
│   └── utils/
│       ├── helpers.ts            # toCamelCase, getPlayerDisplayId (P01, P02…), etc.
│       └── gameLogic.ts          # Weight game result calculation utilities
├── store/
│   └── gameStore.ts              # Zustand store (see State Management below)
└── types/
    └── index.ts                  # Shared TypeScript interfaces (see Types below)
```

---

## API Communication

### REST Calls

- **Always use relative paths** — `fetch('/api/rooms')`, never `fetch('http://localhost:3001/api/rooms')`.
- `API_URL` in `lib/config.ts` is always `''` (empty string).
- Next.js rewrites in `next.config.ts` proxy `/api/*` → `http://localhost:3001/api/*` server-side, so no CORS preflight is triggered.
- Import pattern: `import { API_URL } from '@/lib/config'` then `` fetch(`${API_URL}/api/rooms/...`) ``.

### REST Endpoints Used by the UI

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/rooms` | Create room |
| `GET` | `/api/rooms/:roomId` | Get room by ID |
| `GET` | `/api/rooms/code/:joinCode` | Get room by join code |
| `POST` | `/api/rooms/:roomId/join` | Player join room |
| `GET` | `/api/rooms/:roomId/players` | List players |
| `PUT` | `/api/rooms/:roomId/players/:playerId` | Full update player |
| `PATCH` | `/api/rooms/:roomId/players/:playerId` | Partial update player (score, rank) |
| `DELETE` | `/api/rooms/:roomId/players/:playerId` | Remove player |
| `POST` | `/api/rooms/:roomId/games` | Create game |
| `GET` | `/api/rooms/:roomId/games/:gameId` | Get game (includes `config`) |
| `PATCH` | `/api/rooms/:roomId/games/:gameId` | Update game status / config |
| `DELETE` | `/api/rooms/:roomId/games/:gameId` | Delete game |
| `GET` | `/api/rooms/:roomId/games/:gameId/results` | Get game results |
| `PUT` | `/api/rooms/:roomId/games/:gameId/results` | Finalize game: calculate rankings + save |
| `GET` | `/api/rooms/:roomId/games/:gameId/random/winners` | Get previous random-game winners |
| `POST` | `/api/rooms/:roomId/games/:gameId/random/winners` | Record admin action (reward/punish/nothing) |

### WebSocket

- WebSocket connects **directly** from the browser to `ws://localhost:3001/ws?room_id=<id>` — it bypasses the Next.js proxy.
- `WS_URL` in `lib/config.ts` converts `NEXT_PUBLIC_WS_URL` from `http://` → `ws://` (or `https://` → `wss://`).
- Use `initSocket(roomId)` to connect; `disconnectSocket()` to disconnect.
- Native WebSocket only — **no Socket.IO**.
- Message format: `{ type: string, payload: any }` matching the Go server's `WSMessage` struct.

### WS Event Names (Go server → UI)

| Event type | Meaning |
|---|---|
| `room:update` | Room config changed |
| `players:update` | Player list changed |
| `game:update` | Game state changed |
| `player:joined` | New player joined |
| `player:left` | Player left |
| `game:started` | Game status → active |
| `game:ended` | Game status → completed |
| `points:updated` | Score/rank updated |
| `randomGame:spinning` | Spin triggered |
| `randomGame:spinComplete` | Spin animation done |
| `randomGame:playerSelected` | Player selected by spin |
| `randomGame:actionTaken` | Admin took reward/punish/nothing action |
| `randomGame:winnerSelected` | Winner confirmed (triggers 5s blink) |

---

## State Management

`store/gameStore.ts` is a Zustand store persisted to `localStorage`. Key fields:

| Field | Type | Purpose |
|---|---|---|
| `userRole` | `'admin' \| 'player' \| 'presenter' \| null` | Current user's role |
| `roomId` | `string \| null` | Active room UUID |
| `playerId` | `string \| null` | Player's own UUID (player role only) |
| `adminId` | `string \| null` | Admin session UUID |
| `currentRoom` | `GameRoom \| null` | Full room object |
| `players` | `Player[]` | Cached player list |
| `games` | `Game[]` | Cached game list |
| `mainColor` | `string` | Room primary color (default `#3b82f6`) |
| `colorFrom` | `string` | Room gradient start color |
| `colorTo` | `string` | Room gradient end color |

Use `useDataRecovery(role)` at the top of every protected page — it ensures the store is hydrated before rendering and redirects if the user is not in the correct role.

---

## Hooks

### `useRealTimeUpdates`

Subscribes to a WebSocket event for a room, with automatic polling fallback if the socket is disconnected.

```ts
useRealTimeUpdates({
  roomId: currentRoom?.id,
  eventName: 'players:update',
  fetchCallback: loadPlayers,  // async () => void
  pollingInterval: 2000,       // ms — see standard intervals below
  enabled: Boolean(isReady && currentRoom?.id),
});
```

Standard polling intervals used across the app:
- **Admin home** — `players:update`, `games:update`, `game:active`: **2000 ms**
- **Player game** — `player:{playerId}:update`, `game:active`, `players:update`: **2000 ms**
- **Presenter display** — `players:update`, `game:active`: **1000 ms** (faster for display)
- **Room sync** (`useDataRecovery`) — `room:update`: **5000 ms**

### `useDataRecovery`

Call at the top of every protected page. Returns `{ isReady, currentRoom }`.

```ts
const { isReady, currentRoom } = useDataRecovery('admin');
// Wait for isReady before rendering or redirecting
```

---

## Game System

### Game Types

| Type | `game.type` | Description |
|---|---|---|
| Weight Game | `'weight'` | Players submit start/end weights; system ranks by weight change |
| Random Game | `'random'` | Admin spins a wheel; picks a player and applies reward/punish/nothing |

### Game Status

| Status | Color | Meaning |
|---|---|---|
| `'pending'` | `#154c79` (blue) | Created, not started |
| `'started'` | `#147834` (green) | Active / in progress |
| `'completed'` | `#7e3c3c` (red) | Ended, results saved |

### Point Modes

Configured at the room level (`game.settings.pointMode` or `room.pointMode`):

- **Mode 1** — Decreasing per rank: `Rank 1 = pointTo`, `Rank 2 = pointTo - 1`, …, last = `pointFrom`.
- **Mode 2** — Proportional: `points = pointFrom + (ranksBelow / (totalPlayers - 1)) × (pointTo - pointFrom)`.

### Weight Game Flow

1. Admin configures: `mode` (`'most'` or `'least'`), weight range, weight unit (`'g'` or `'kg'`).
2. **Step 1**: Admin + players submit start weights.
3. **Step 2**: Admin + players submit end weights.
4. **Finalize**: System calculates `weight_range = start - end`, sorts, assigns ranks and points, saves via `PUT /results`.

### Random Game Flow

1. Admin configures: `pointAward` (points per spin), `isRepeat` (can same player be picked twice).
2. **Spinning phase**: Admin clicks Spin → 2-second animation → random player selected.
   - If `isRepeat = false`, already-selected players are excluded (shown blurred with strikethrough).
3. **Actions phase**: Admin chooses **Reward** (`+pointAward`), **Do Nothing** (`0`), or **Punish** (`-pointAward`).
   - Score updates immediately. Auto-returns to spinning after 1.5 s.
4. **End**: Admin clicks Finalize → rankings calculated → `PUT /results`.

### Game Logic Classes

All game rule logic lives in `lib/games/`, **not** in components.

```
BaseGame (abstract)
├── WeightGameLogic   lib/games/WeightGameLogic.ts
└── RandomGameLogic   lib/games/RandomGameLogic.ts
```

Key methods:
- `BaseGame.calculatePoints(rank, totalPlayers)` — respects PointMode setting.
- `RandomGameLogic.getAvailablePlayers(allPlayerIds)` — filters out previous winners if `isRepeat=false`.
- `RandomGameLogic.spinWheel(availableIds)` — returns a random player ID.
- `RandomGameLogic.calculatePointsAwarded(action)` — returns `+pointAward`, `0`, or `-pointAward`.
- `WeightGameLogic.endGame()` — calculates `weight_range`, sorts, assigns ranks + points.

### Adding a New Game Type

1. Create `lib/games/MyGameLogic.ts` extending `BaseGame`.
2. Add settings UI to `components/admin/GameSettingsModal.tsx`.
3. Create a `MyGameComponent.tsx` that receives `{ roomId, gameId, isAdmin }` props.
4. Render conditionally in `/admin/home`, `/player/game`, and `/presenter/display` based on `game.type`.

---

## Key TypeScript Types (`types/index.ts`)

```ts
interface GameRoom {
  id: string; name: string; roomNumber?: number;
  joinCode: string; presentationCode: string;
  mainColor: string; colorFrom: string; colorTo: string;
  maxPlayers: number;
  pointMode: 'mode1' | 'mode2'; pointFrom: number; pointTo: number;
  status: 'active' | 'ended';
}

interface Player {
  id: string; name: string; roomId: string;
  score: number; rank: number;
  isHidden: { rank: boolean; score: boolean };
  color?: string;
}

interface Game {
  id: string; roomId: string; name: string;
  type: 'weight' | 'random';
  order: number;
  status: 'pending' | 'started' | 'completed';
  settings: GameSettings;   // type-specific config stored as JSON in DB
}
```

Player display IDs (`P01`, `P02`, …) are generated by `getPlayerDisplayId()` from `lib/utils/helpers.ts` — they are **not** stored in the database.

---

## Conventions

- **`toCamelCase`** from `lib/utils/helpers.ts` — always run API responses through this before storing or using them; the Go API returns `snake_case` JSON.
- **`'use client'`** — all pages and components that use hooks or browser APIs must have this directive.
- **No `app/api/` routes** — all API calls go to the Go backend via Next.js rewrites. Do not create route handlers.
- **Controlled inputs** — always provide a fallback (e.g. `parseInt(e.target.value) || 0`) to avoid `NaN` turning a controlled input uncontrolled.
- **Path alias** — use `@/` for all internal imports (configured in `tsconfig.json`).
- **Game logic in classes, not components** — components call logic class methods; they do not re-implement ranking or point algorithms inline.
- **Admin-only guards** — actions like spinning the wheel or recording an admin decision must check `isAdmin` and bail early if false.

---

## Environment Variables (`UI/.env.local`)

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Used by `next.config.ts` rewrites only — never used directly in browser code |
| `NEXT_PUBLIC_WS_URL` | `http://localhost:3001` | WebSocket base URL — converted to `ws://` by `lib/config.ts` |

---

## Docker / Deployment

- `Dockerfile` at `UI/` (multi-stage build, standalone output).
- `docker-compose.yml` at repo root orchestrates the app + PostgreSQL.
- Env var for Docker: `NEXT_PUBLIC_WS_URL=http://localhost:3000` (app acts as its own proxy for REST; WS connects directly to the API container's exposed WS port).
- Migrations are run by the Go API (`buffalo db migrate`), not by the UI.
