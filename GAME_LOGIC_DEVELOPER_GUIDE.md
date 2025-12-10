# Game Logic Classes - Developer Guide

## Overview

The game logic is organized into specialized classes that handle all game rules, calculations, and state management.

```
BaseGame (abstract)
├── RandomGameLogic
├── WeightGameLogic
└── [Future game types]
```

## BaseGame (Abstract Base Class)

**File:** `src/lib/games/BaseGame.ts`

### Purpose
Provides common interface and utilities for all games.

### Key Methods
```typescript
protected calculatePoints(rank: number, totalPlayers: number): number
// Calculates points based on PointMode setting
// MODE_1: Decreasing points per rank (-1 per rank)
// MODE_2: Proportional points based on rank position

getResults(): GameResult[]
// Returns sorted results by rank

abstract startGame(): Promise<void>
abstract endGame(): Promise<GameResult[]>
abstract updateGameState(data: any): Promise<void>
```

### Constructor
```typescript
constructor(gameId: string, settings: GameBaseSettings)
```

## RandomGameLogic

**File:** `src/lib/games/RandomGameLogic.ts`

### Purpose
Manages random player selection game with admin actions.

### Configuration
```typescript
interface RandomGameSettings extends GameBaseSettings {
  pointAward: number;        // Points to award for actions
  isRepeat: boolean;         // Can same player be selected multiple times
}
```

### Key Methods

#### `getAvailablePlayers(allPlayerIds: string[]): string[]`
Returns list of players available for selection.
- Filters out previously selected players if `isRepeat = false`
- All players available if `isRepeat = true`

```typescript
const available = gameLogic.getAvailablePlayers(['player1', 'player2', 'player3']);
// If isRepeat=false and 'player1' already selected: ['player2', 'player3']
// If isRepeat=true: ['player1', 'player2', 'player3']
```

#### `spinWheel(availablePlayerIds: string[]): string | null`
Randomly selects a player from available players.
- Marks selected player in internal state if `isRepeat = false`
- Returns selected player ID or null if no players available

```typescript
const selectedId = gameLogic.spinWheel(availablePlayers);
// Returns: 'player2' (randomly selected)
```

#### `calculatePointsAwarded(action: 'reward' | 'punish' | 'nothing'): number`
Calculates points based on action type.

```typescript
const rewardPoints = gameLogic.calculatePointsAwarded('reward');
// Returns: gameSettings.pointAward (e.g., 10)

const punishPoints = gameLogic.calculatePointsAwarded('punish');
// Returns: -gameSettings.pointAward (e.g., -10)

const nothingPoints = gameLogic.calculatePointsAwarded('nothing');
// Returns: 0
```

#### `recordWinner(winner: RandomWinner): void`
Records a winner selection internally.

```typescript
gameLogic.recordWinner({
  playerId: 'player1',
  action: 'reward',
  pointsAwarded: 10,
  timestamp: new Date(),
});
```

#### `endGame(): Promise<GameResult[]>`
Finalizes game and returns ranked results.
- Calculates final rankings based on points
- Assigns ranks to all players
- Returns sorted results

```typescript
const results = await gameLogic.endGame();
// Returns: [
//   { playerId: 'p1', playerName: 'Alice', pointsEarned: 30, rank: 1 },
//   { playerId: 'p2', playerName: 'Bob', pointsEarned: 20, rank: 2 },
// ]
```

### Usage Example

```typescript
import { RandomGameLogic } from '@/lib/games/RandomGameLogic';
import { PointMode } from '@/lib/games/types';

// Create instance
const gameLogic = new RandomGameLogic('game-123', {
  gameName: 'Random Game',
  pointAward: 10,
  isRepeat: false,
  pointMode: PointMode.MODE_1,
  pointFrom: 0,
  pointTo: 100,
});

// Get available players
const available = gameLogic.getAvailablePlayers(['p1', 'p2', 'p3']);

// Spin and select
const selected = gameLogic.spinWheel(available);

// Admin action
const points = gameLogic.calculatePointsAwarded('reward');
// Apply to database...

// Repeat for multiple spins...

// End game
const results = await gameLogic.endGame();
```

## WeightGameLogic

**File:** `src/lib/games/WeightGameLogic.ts`

### Purpose
Manages weight loss/gain tracking game with 2-step process.

### Configuration
```typescript
interface WeightGameSettings extends GameBaseSettings {
  weightLimit: {
    from: number;
    to: number;
  };
  weightUnit: 'g' | 'kg';
  gameMode: 'most' | 'least';  // Most weight lost or least lost
}
```

### Key Methods

#### `initializeEntries(playerIds: string[], playerNames: Map<string, string>): void`
Sets up initial weight entries for all players.

```typescript
const playerNames = new Map([
  ['p1', 'Alice'],
  ['p2', 'Bob'],
]);
gameLogic.initializeEntries(['p1', 'p2'], playerNames);
```

#### `updateStartWeight(playerId: string, weight: number, isAdmin?: boolean): boolean`
Records player's start weight (Step 1).
- Players can only submit once (unless admin)
- Admin can always override

```typescript
// Player submission
const success = gameLogic.updateStartWeight('p1', 75.5, false);
// Returns: true if successful

// Try to submit again
const retry = gameLogic.updateStartWeight('p1', 76, false);
// Returns: false (already submitted)

// Admin override
const override = gameLogic.updateStartWeight('p1', 75, true);
// Returns: true (admin can override)
```

#### `updateEndWeight(playerId: string, weight: number, isAdmin?: boolean): boolean`
Records player's end weight (Step 2).
- Players can only submit once (unless admin)
- Admin can always override

```typescript
const success = gameLogic.updateEndWeight('p1', 73, false);
// Returns: true if successful
// Weight range calculated: 75.5 - 73 = 2.5 kg
```

#### `hasPlayerSubmittedStartWeight(playerId: string): boolean`
Checks if player has submitted start weight.

```typescript
const submitted = gameLogic.hasPlayerSubmittedStartWeight('p1');
// Returns: true/false
```

#### `hasPlayerSubmittedEndWeight(playerId: string): boolean`
Checks if player has submitted end weight.

```typescript
const submitted = gameLogic.hasPlayerSubmittedEndWeight('p1');
// Returns: true/false
```

#### `endGame(): Promise<GameResult[]>`
Finalizes game and returns ranked results.
- Calculates weight ranges (start - end)
- Ranks based on weight change and game mode
- Assigns points based on rank
- Zero-range entries get lowest points
- Missing data entries get lowest points

```typescript
const results = await gameLogic.endGame();
// Sorted by rank automatically
// Returns: [
//   { playerId: 'p1', playerName: 'Alice', pointsEarned: 100, rank: 1 },
//   { playerId: 'p2', playerName: 'Bob', pointsEarned: 95, rank: 2 },
//   { playerId: 'p3', playerName: 'Charlie', pointsEarned: 50, rank: 3 },
// ]
```

### Usage Example

```typescript
import { WeightGameLogic } from '@/lib/games/WeightGameLogic';
import { PointMode } from '@/lib/games/types';

// Create instance
const gameLogic = new WeightGameLogic('game-456', {
  gameName: 'Weight Game',
  weightLimit: { from: 0, to: 100 },
  weightUnit: 'kg',
  gameMode: 'most',
  pointMode: PointMode.MODE_1,
  pointFrom: 0,
  pointTo: 100,
});

// Initialize
const playerNames = new Map([
  ['p1', 'Alice'],
  ['p2', 'Bob'],
]);
gameLogic.initializeEntries(['p1', 'p2'], playerNames);

// Step 1: Collect start weights
gameLogic.updateStartWeight('p1', 85, false);
gameLogic.updateStartWeight('p2', 90, false);

// Step 2: Collect end weights
gameLogic.updateEndWeight('p1', 82, false); // Lost 3 kg
gameLogic.updateEndWeight('p2', 88, false); // Lost 2 kg

// End game
const results = await gameLogic.endGame();
// Alice ranks first (lost more weight)
// Bob ranks second
// Results include calculated points based on PointMode
```

## Point Modes

### PointMode.MODE_1 (Decreasing)
Points decrease by 1 for each rank.
- 1st place: `pointTo` points
- 2nd place: `pointTo - 1` points
- 3rd place: `pointTo - 2` points
- etc.

**Use Case:** Reward excellence significantly

### PointMode.MODE_2 (Proportional)
Points distributed proportionally based on rank position.
- Formula: `pointFrom + (ranksBelow / (totalPlayers - 1)) * (pointTo - pointFrom)`
- More granular distribution
- Better for many players

**Use Case:** Fair distribution across many participants

## Game Results Structure

```typescript
interface GameResult {
  playerId: string;
  playerName: string;
  pointsEarned: number;
  rank: number;  // 1-based ranking
}
```

## Best Practices

### 1. Initialize Logic Early
```typescript
// ✅ Do this
const gameLogic = new RandomGameLogic(gameId, settings);

// ❌ Don't recreate every render
useEffect(() => {
  const gameLogic = new RandomGameLogic(gameId, settings);
}, [dependency]);
```

### 2. Use React.useState with Callback
```typescript
// ✅ Memoize logic instance
const [gameLogic] = useState(() => 
  new RandomGameLogic(gameId, settings)
);

// ❌ Don't create inline
const gameLogic = new RandomGameLogic(gameId, settings);
```

### 3. Handle Both API and Logic Updates
```typescript
// ✅ Update database AND game logic
await updatePlayerScore(playerId, points);
gameLogic.recordWinner({ playerId, points, ... });

// ❌ Only update one
gameLogic.recordWinner(...); // Lost if component unmounts
```

### 4. Always Check Admin Status
```typescript
// ✅ Check isAdmin before dangerous operations
if (!isAdmin) {
  throw new Error('Only admins can perform this action');
}
gameLogic.updateStartWeight(playerId, weight, true);

// ❌ Don't trust client-side only
gameLogic.updateStartWeight(playerId, weight, true);
```

## Common Patterns

### Pattern 1: Spin and Action
```typescript
const available = gameLogic.getAvailablePlayers(playerIds);
if (available.length === 0) {
  setError('No players available');
  return;
}

const selected = gameLogic.spinWheel(available);
const points = gameLogic.calculatePointsAwarded('reward');

// Update database...
gameLogic.recordWinner({
  playerId: selected,
  action: 'reward',
  pointsAwarded: points,
  timestamp: new Date(),
});
```

### Pattern 2: Weight Submission
```typescript
const success = gameLogic.updateStartWeight(playerId, weight, isAdmin);
if (!success && !isAdmin) {
  setError('You have already submitted your weight');
  return;
}

// Update database...
await saveWeight(playerId, 'start', weight);

// Check step completion
const allSubmitted = playerIds.every(id => 
  gameLogic.hasPlayerSubmittedStartWeight(id)
);
if (allSubmitted) {
  moveToNextStep();
}
```

### Pattern 3: Game Finalization
```typescript
// Populate logic with current state
gameLogic.initializeEntries(playerIds, playerNames);
playerWeights.forEach(pw => {
  if (pw.startWeight !== null) {
    gameLogic.updateStartWeight(pw.playerId, pw.startWeight, true);
  }
  if (pw.endWeight !== null) {
    gameLogic.updateEndWeight(pw.playerId, pw.endWeight, true);
  }
});

// Calculate results
const results = await gameLogic.endGame();

// Save to database
await saveGameResults(roomId, gameId, results);
```

## Debugging

### Enable Console Logging
Game logic classes log important events:
```
Random Game game-123 started
Weight Game game-456 started - Step 1 (Start Weight collection)
```

### Check Game State
```typescript
const state = gameLogic.getGameState();
console.log('Selected players:', state.selectedPlayerIds);
console.log('Current results:', state.results);
```

### Verify Results
```typescript
const results = gameLogic.getResults();
results.forEach(r => {
  console.log(`${r.playerName}: Rank ${r.rank}, ${r.pointsEarned} points`);
});
```

## Migration Guide

### From Old Implementation to Logic Classes

**Before:**
```typescript
const pointsToAdd = action === 'reward' ? pointAward : -pointAward;
const selectedId = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
```

**After:**
```typescript
const pointsToAdd = gameLogic.calculatePointsAwarded(action);
const selectedId = gameLogic.spinWheel(availablePlayers);
```

## TypeScript Interfaces

```typescript
// Game settings base
interface GameBaseSettings {
  gameName: string;
  pointMode: PointMode;
  pointFrom: number;
  pointTo: number;
}

// Results
interface GameResult {
  playerId: string;
  playerName: string;
  pointsEarned: number;
  rank: number;
}

// Random game specific
interface RandomWinner {
  playerId: string;
  action: 'reward' | 'punish' | 'nothing';
  pointsAwarded: number;
  timestamp: Date;
}

// Weight game specific
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

## Performance Considerations

- **Memoization:** Use `useState` with callback for game logic instances
- **Batch Updates:** Group multiple weight updates before calling `endGame()`
- **Lazy Loading:** Load game settings from API once on component mount
- **Memory:** Game logic stores references to results; clear on game completion if needed
