# 📖 Complete API Reference

## Available NPM Scripts

### Development
```bash
npm run dev
```
- Starts Next.js development server on http://localhost:3000
- Hot-reload enabled (changes auto-refresh)
- Turbopack compilation
- Watch mode for all files

### Production
```bash
npm run build
```
- Creates optimized production build
- TypeScript compilation
- Minification and code splitting
- Output in `.next/` directory

```bash
npm start
```
- Starts production server
- Must run `npm run build` first
- Optimized performance

### Database
```bash
npm run migrate
```
- Runs database migrations
- Creates all 8 required tables
- Idempotent (safe to run multiple times)
- Sets up foreign keys and indexes

### Code Quality
```bash
npm run lint
```
- Runs ESLint
- Checks code style
- Reports errors and warnings
- TypeScript validation

---

## API Endpoints Reference

### Room Management

#### Create Game Room
```http
POST /api/rooms
Content-Type: application/json

{
  "name": "Game Name",
  "mainColor": "#3b82f6",
  "colorFrom": "#3b82f6",
  "colorTo": "#1e40af",
  "maxPlayers": 10,
  "pointMode": "mode1",
  "pointFrom": 0,
  "pointTo": 100,
  "createdBy": "admin-uuid"
}
```

#### Get Room by ID
```http
GET /api/rooms/:roomId
```

#### Get Room by Join Code
```http
GET /api/rooms/code/:joinCode
```

### Player Management

#### Join Room
```http
POST /api/rooms/:roomId/join
Content-Type: application/json

{
  "playerName": "Player Name",
  "joinCode": "CODE123"
}
```

#### List Players
```http
GET /api/rooms/:roomId/players
```

Response:
```json
[
  {
    "id": "uuid",
    "name": "Player Name",
    "roomId": "uuid",
    "score": 100,
    "rank": 1,
    "color": "#3b82f6"
  }
]
```

#### Update Player
```http
PUT /api/rooms/:roomId/players/:playerId
Content-Type: application/json

{
  "name": "New Name",
  "score": 150,
  "rank": 2,
  "isHiddenRank": false,
  "isHiddenScore": false
}
```

#### Remove Player
```http
DELETE /api/rooms/:roomId/players/:playerId
```

### Game Management

#### Create Game
```http
POST /api/rooms/:roomId/games
Content-Type: application/json

{
  "name": "Weight Game 1",
  "type": "weight",
  "order": 1,
  "settings": {
    "mode": "most",
    "weightLimitFrom": 50,
    "weightLimitTo": 100,
    "weightUnit": "kg"
  }
}
```

#### List Games
```http
GET /api/rooms/:roomId/games
```

#### Start Game
```http
POST /api/rooms/:roomId/games/:gameId/start
```

#### End Game
```http
POST /api/rooms/:roomId/games/:gameId/end
```

#### Delete Game
```http
DELETE /api/rooms/:roomId/games/:gameId
```

### Weight Game Endpoints

#### Start Weight Step 1
```http
POST /api/rooms/:roomId/games/:gameId/weight/step1
Content-Type: application/json

{
  "playerWeights": {
    "player-uuid": 75.5
  }
}
```

#### Submit Weight Step 2
```http
POST /api/rooms/:roomId/games/:gameId/weight/step2
Content-Type: application/json

{
  "playerWeights": {
    "player-uuid": 70.2
  }
}
```

### Random Game Endpoints

#### Start Spin
```http
POST /api/rooms/:roomId/games/:gameId/random/spin
```

#### Submit Result
```http
POST /api/rooms/:roomId/games/:gameId/random/result
Content-Type: application/json

{
  "selectedPlayerId": "player-uuid",
  "adminAction": "reward"
}
```

---

## WebSocket Events

### Connection Events
```javascript
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('error', (error) => {
  console.error('Connection error:', error);
});
```

### Room Events
```javascript
// Listen for room updates
socket.on('room:update', (roomData) => {
  // Room settings changed
});

// Listen for player joined
socket.on('player:joined', (playerData) => {
  // New player joined
});

// Listen for player left
socket.on('player:left', (playerId) => {
  // Player left the room
});

// Emit join room
socket.emit('room:join', {
  roomId: 'room-uuid',
  playerData: { name: 'Player' }
});

// Emit leave room
socket.emit('room:leave', { roomId: 'room-uuid' });
```

### Game Events
```javascript
// Listen for game start
socket.on('game:started', (gameData) => {
  // Game has started
});

// Listen for game end
socket.on('game:ended', (results) => {
  // Game has ended
});

// Listen for game update
socket.on('game:update', (gameData) => {
  // Game state changed
});

// Listen for points update
socket.on('points:updated', (playerRankings) => {
  // Points and rankings updated
});

// Emit game update
socket.emit('game:update', {
  roomId: 'room-uuid',
  gameData: { /* game data */ }
});

// Emit players update
socket.emit('players:update', {
  roomId: 'room-uuid',
  players: [/* player list */]
});
```

---

## Zustand Store API

### Access Store
```typescript
import useGameStore from '@/store/gameStore';

const userRole = useGameStore((state) => state.userRole);
const players = useGameStore((state) => state.players);
```

### Set User Role
```typescript
const setUserRole = useGameStore((state) => state.setUserRole);
setUserRole('admin'); // 'admin' | 'player' | 'presenter'
```

### Room Management
```typescript
setRoomId('room-uuid');
setCurrentRoom(roomObject);
setColors('#3b82f6', '#3b82f6', '#1e40af');
```

### Player Management
```typescript
addPlayer(playerObject);
updatePlayer(playerObject);
removePlayer('player-uuid');
setPlayers([...players]);
```

### Game Management
```typescript
addGame(gameObject);
updateGame(gameObject);
removeGame('game-uuid');
setGames([...games]);
```

### Reset State
```typescript
const reset = useGameStore((state) => state.reset);
reset(); // Clear all state
```

---

## Utility Functions

### Color Utilities

```typescript
import { 
  hexToRgb, 
  rgbToHex, 
  interpolateColor, 
  getColorForRank 
} from '@/lib/utils/helpers';

// Convert hex to RGB
const rgb = hexToRgb('#3b82f6');
// { r: 59, g: 130, b: 246 }

// Convert RGB to hex
const hex = rgbToHex(59, 130, 246);
// "#3b82f6"

// Interpolate between two colors
const color = interpolateColor('#3b82f6', '#1e40af', 0.5);
// Returns middle color

// Get color for rank
const rankColor = getColorForRank(3, 10, '#3b82f6', '#1e40af');
// Returns color based on rank position
```

### Point Calculation

```typescript
import { calculatePoints, calculateRank } from '@/lib/utils/helpers';

// Calculate points for a rank
const points = calculatePoints(2, 10, 0, 100, 'mode1');
// Mode 1: 99 points

const points2 = calculatePoints(2, 10, 0, 100, 'mode2');
// Mode 2: 90 points

// Calculate rankings from scores
const ranks = calculateRank([
  { playerId: 'p1', score: 100 },
  { playerId: 'p2', score: 90 },
  { playerId: 'p3', score: 90 }
]);
// Returns: [
//   { playerId: 'p1', rank: 1 },
//   { playerId: 'p2', rank: 2 },
//   { playerId: 'p3', rank: 2 }
// ]
```

### Code Generation

```typescript
import { generateCode } from '@/lib/utils/helpers';

const code = generateCode(6);
// Returns: "ABC123" (random alphanumeric)
```

---

## Type Definitions

### GameRoom
```typescript
interface GameRoom {
  id: string;
  name: string;
  joinCode: string;
  presentationCode: string;
  mainColor: string;
  colorFrom: string;
  colorTo: string;
  maxPlayers: number;
  pointMode: 'mode1' | 'mode2';
  pointFrom: number;
  pointTo: number;
  createdAt: Date;
  createdBy: string;
  status: 'active' | 'ended';
}
```

### Player
```typescript
interface Player {
  id: string;
  name: string;
  roomId: string;
  joinedAt: Date;
  score: number;
  rank: number;
  isHidden: {
    rank: boolean;
    score: boolean;
  };
  color?: string;
  metadata?: Record<string, any>;
}
```

### Game
```typescript
interface Game {
  id: string;
  roomId: string;
  name: string;
  type: 'weight' | 'random';
  order: number;
  status: 'pending' | 'started' | 'completed';
  createdAt: Date;
  settings: GameSettings;
}
```

---

## Error Handling

### API Errors
```typescript
try {
  await createRoom(roomData);
} catch (error: any) {
  console.error('Error:', error.message);
  console.error('Status:', error.response?.status);
  console.error('Data:', error.response?.data);
}
```

### WebSocket Errors
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Form Validation
```typescript
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateCode = (code: string) => {
  return code.length === 6 && /^[A-Z0-9]+$/.test(code);
};
```

---

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=game
DB_USER=postgres
DB_PASSWORD=YourStrongPassword123!

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000

# Optional
LOG_LEVEL=debug
NODE_ENV=development
```

---

## Database Queries

### Get All Players in Room
```sql
SELECT * FROM players WHERE room_id = $1 ORDER BY rank ASC;
```

### Get Player Scores
```sql
SELECT p.id, p.name, p.score, p.rank 
FROM players p 
WHERE p.room_id = $1 
ORDER BY p.score DESC;
```

### Get Game Results
```sql
SELECT p.id, p.name, gr.points_earned, gr.rank
FROM game_results gr
JOIN players p ON gr.player_id = p.id
WHERE gr.game_id = $1
ORDER BY gr.rank ASC;
```

### Update Player Points
```sql
UPDATE players 
SET score = score + $1, rank = $2 
WHERE id = $3;
```

---

## Performance Tips

1. **Database**: Use indexes on frequently queried columns
2. **API**: Implement pagination for large datasets
3. **Frontend**: Use React.memo for expensive components
4. **State**: Don't store entire datasets in Zustand
5. **Images**: Optimize and compress before upload
6. **Bundle**: Code splitting with dynamic imports

---

**Last Updated**: December 8, 2025
**Version**: 1.0.0
**Status**: Complete ✅
