# Game System Architecture

## Overview

The game system is designed to be fully extensible, allowing new games to be added without modifying core logic. All games follow a consistent structure with base classes and interfaces.

## Directory Structure

```
src/lib/games/
├── index.ts              # Central export point
├── types.ts              # Type definitions for all games
├── BaseGame.ts           # Abstract base class for all games
├── WeightGameLogic.ts    # Weight game implementation
└── RandomGameLogic.ts    # Random game implementation
```

```
src/components/admin/
├── GameSelectorModal.tsx    # Modal to select game type
└── GameSettingsModal.tsx    # Modal to configure game settings
```

## Game Types

### 1. Weight Game

**Purpose**: Players report start and end weight. Game calculates weight lost/gained and ranks accordingly.

**Game Flow**:
1. **Step 1**: Admin and players enter start weight
2. **Step 2**: Admin and players enter end weight
3. **End Game**: System calculates weight range, ranks players, and awards points

**Settings**:
- Weight Limit: from X to Y (e.g., 0-100 kg)
- Weight Unit: grams (g) or kilograms (kg)
- Game Mode: 
  - "most" = Most weight lost (highest weight loss ranks first)
  - "least" = Least weight lost (lowest weight loss ranks first)
- Point Mode: Global setting (Mode 1 or Mode 2)
- Point Range: Global setting (from X to Y points)

**Ranking Logic**:
- Calculate weight_range = start_weight - end_weight
- Sort by weight_range (ascending for least, descending for most)
- If weight_range = 0, assign lowest point value
- Apply point calculation based on point mode

### 2. Random Game

**Purpose**: Admin spins a wheel to randomly select players. Admin can reward/punish selected player.

**Game Flow**:
1. **Step 1**: Game ready for spinning
2. **Step 2**: Admin clicks "Spin" → wheel appears for all players
3. **Step 3**: Wheel stops on random player
   - If isRepeat = false, already selected players are excluded
4. **Admin Actions**: 
   - Reward: +pointAward points
   - Punish: -pointAward points
   - Do Nothing: 0 points
5. **End Game**: Calculate final ranks and points

**Settings**:
- Point Award: Number of points to award (e.g., 10)
- IsRepeat: true/false - Can same player be selected multiple times
- Point Mode: Global setting (Mode 1 or Mode 2)
- Point Range: Global setting (from X to Y points)

## Game Status Colors

- **#154c79** (Blue): Pending - Not started
- **#147834** (Green): Started - Active
- **#7e3c3c** (Red): Ended - Completed

## Point Calculation Modes

### Mode 1: -1 Per Rank
```
Rank 1 = pointTo
Rank 2 = pointTo - 1
Rank 3 = pointTo - 2
...
Last Rank = pointFrom (minimum)
```

### Mode 2: Proportional
```
Points distributed proportionally across the range based on rank
Points = pointFrom + (ranksBelow / (totalPlayers - 1)) × (pointTo - pointFrom)
```

## Extending the System - Adding New Games

### Step 1: Create Game Logic Class

```typescript
// src/lib/games/MyGameLogic.ts
import { BaseGame } from './BaseGame';
import { GameBaseSettings, GameResult } from './types';

export class MyGameLogic extends BaseGame {
  async startGame(): Promise<void> {
    // Initialize game
  }

  async endGame(): Promise<GameResult[]> {
    // Calculate and return results
  }

  async updateGameState(data: any): Promise<void> {
    // Handle game state updates
  }
}
```

### Step 2: Add Game Settings to GameSettingsModal

Edit `src/components/admin/GameSettingsModal.tsx`:

```typescript
// Add to AVAILABLE_GAMES
{
  id: 'mygame',
  name: 'My Game',
  description: 'Description of my game',
  icon: '🎮',
}

// Add settings form in conditional rendering
{gameType === 'mygame' && (
  <div>
    {/* Game-specific settings */}
  </div>
)}
```

### Step 3: Export New Game

Edit `src/lib/games/index.ts`:

```typescript
export { MyGameLogic } from './MyGameLogic';
```

### Step 4: Update GameSelectorModal

Edit `src/components/admin/GameSelectorModal.tsx` to add the new game to AVAILABLE_GAMES.

## API Integration

### Create Game Endpoint

```
POST /api/rooms/{roomId}/games
Body: {
  name: "Game Name",
  type: "weight" | "random",
  status: "pending",
  gameOrder: 1,
  settings: {
    pointMode: "mode1",
    pointFrom: 10,
    pointTo: 1,
    // Game-specific settings
  }
}
```

### Update Game Endpoint

```
PATCH /api/rooms/{roomId}/games/{gameId}
Body: {
  status: "pending" | "active" | "completed",
  settings: { /* updated settings */ }
}
```

### Get Game Results Endpoint

```
GET /api/rooms/{roomId}/games/{gameId}/results
Response: GameResult[]
```

## Game Result Structure

```typescript
interface GameResult {
  playerId: string;
  playerName: string;
  pointsEarned: number;
  rank: number;
}
```

## Weight Entry Structure

```typescript
interface WeightEntry {
  playerId: string;
  playerName: string;
  startWeight: number | null;
  endWeight: number | null;
  weightRange: number | null;
  pointsEarned: number;
  rank: number | null;
}
```

## Admin Game Management Screen (2.4)

### List View
- Display all games with status-based color indicator
- Show game type and current status
- Actions available based on status

### Actions by Status

**Pending**:
- Start Game → Changes status to "active"
- Edit → Modify game settings
- Delete → Remove game

**Active (Started)**:
- End Game → Changes status to "completed", calculates results
- Edit → Modify game settings
- Delete → Remove game

**Completed (Ended)**:
- View Results → Show game results
- Delete → Remove game

### Add Game Flow
1. Click "+ Add Game" button
2. Select game type (Weight or Random)
3. Configure game settings
4. Save → Game added to list with "pending" status

## Database Tables

### game_rooms
```sql
id, name, room_number, join_code, presentation_code,
main_color, color_from, color_to,
max_players, point_mode, point_from, point_to,
created_at, created_by, status, settings
```

### games
```sql
id, room_id, name, type, game_order, status,
created_at, settings
```

### weight_game_data
```sql
id, game_id, mode, weight_limit_from, weight_limit_to,
weight_unit, step1_started, step2_started, completed
```

### weight_entries
```sql
id, game_id, player_id, start_weight, end_weight,
weight_range, points, final_rank
```

### random_game_data
```sql
id, game_id, point_award, is_repeat,
step2_started, step3_started, current_selected_player_id, completed
```

### game_results
```sql
id, game_id, player_id, points_earned, rank, created_at
```

## Future Enhancements

1. **Quiz Game**: Players answer questions, ranked by score/speed
2. **Leaderboard Game**: Cumulative points across rounds
3. **Team Game**: Team-based competition
4. **Custom Game**: Admin creates custom game rules
