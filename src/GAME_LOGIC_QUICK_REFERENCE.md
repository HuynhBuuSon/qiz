# Game Logic Refactoring - Quick Reference

## What Was Done

Refactored **RandomGameComponent** and **WeightGameComponent** to properly utilize dedicated game logic classes, improving code organization and maintainability.

## Key Changes

### 1. RandomGameLogic (src/lib/games/RandomGameLogic.ts)
```typescript
// Added missing abstract methods
async startGame(): Promise<void>
async updateGameState(data: any): Promise<void>
```

**Methods used in components:**
- `getAvailablePlayers(playerIds)` - Get eligible players
- `spinWheel(available)` - Randomly select a player
- `calculatePointsAwarded(action)` - Get points for action
- `recordWinner(winner)` - Record selection
- `endGame()` - Calculate final rankings

### 2. RandomGameComponent (src/components/RandomGameComponent.tsx)

**New Imports:**
```typescript
import { RandomGameLogic } from '@/lib/games/RandomGameLogic';
import { PointMode } from '@/lib/games/types';
import { initSocket, emitRandomGameSpin, onRandomGamePlayerSelected, onRandomGameActionTaken } from '@/lib/websocket/client';
```

**Key Refactoring:**
- ✅ `handleSpin()` - Uses game logic + WebSocket + Admin check
- ✅ `handleAdminAction()` - Uses `calculatePointsAwarded()`
- ✅ `handleEndGame()` - Uses game logic's `endGame()`
- ✅ WebSocket events for real-time coordination

**New Feature:** Admin-only protection on spin

### 3. WeightGameComponent (src/components/WeightGameComponent.tsx)

**New Imports:**
```typescript
import { WeightGameLogic } from '@/lib/games/WeightGameLogic';
import { PointMode } from '@/lib/games/types';
```

**Key Refactoring:**
- ✅ `handleEndGame()` - Uses game logic for all calculations
  - `initializeEntries()` - Setup player entries
  - `updateStartWeight()` - Add start weights
  - `updateEndWeight()` - Add end weights
  - `endGame()` - Calculate rankings and points

## Architecture

```
Component Layer (React)
  ↓
Game Logic Layer (TypeScript Classes)
  ↓
Database Layer (PostgreSQL)
  ↓
WebSocket Layer (Socket.IO) - Optional real-time
```

## Game Flow - Random Game

```
1. Admin creates game with settings
   ↓
2. Component initializes RandomGameLogic
   ↓
3. Game starts (handleStartGame)
   ↓
4. Loop: Admin spins
   - Gets available players (logic)
   - Selects random player (logic)
   - Emits WebSocket event (admin only)
   ↓
5. Admin takes action (reward/punish/nothing)
   - Calculates points (logic)
   - Updates database
   - Records winner (logic)
   ↓
6. Admin ends game
   - Game logic calculates final rankings
   - Results saved to database
   ↓
7. Display updated rankings
```

## Game Flow - Weight Game

```
1. Admin creates game with settings
   ↓
2. Component initializes WeightGameLogic
   ↓
3. Game starts (handleStartGame)
   ↓
4. Step 1: Collect start weights
   - Players submit weights
   - Admin can override
   - Logic tracks submissions
   ↓
5. Step 2: Collect end weights
   - Players submit weights
   - Admin can override
   - Logic calculates weight ranges
   ↓
6. Admin ends game
   - Game logic ranks players (most/least lost)
   - Points calculated based on rank
   - Results saved to database
   ↓
7. Display updated rankings
```

## Settings Structure

### RandomGameSettings
```typescript
{
  gameName: 'Random Game',
  pointAward: 10,          // Points per action
  isRepeat: false,         // Same player multiple times?
  pointMode: PointMode.MODE_1,
  pointFrom: 0,
  pointTo: 100,
}
```

### WeightGameSettings
```typescript
{
  gameName: 'Weight Game',
  weightLimit: {           // Note: Nested structure!
    from: 0,
    to: 100,
  },
  weightUnit: 'kg',
  gameMode: 'most',        // or 'least'
  pointMode: PointMode.MODE_1,
  pointFrom: 0,
  pointTo: 100,
}
```

## Admin-Only Operations

### Random Game
```typescript
// handleSpin() checks isAdmin
if (!isAdmin) {
  setError('Only admins can spin the wheel');
  return;
}

// WebSocket event (admin only)
emitRandomGameSpin(roomId, gameId, adminId);
```

### Weight Game
```typescript
// Weight override (admin parameter)
gameLogic.updateStartWeight(playerId, weight, true); // Admin can override
gameLogic.updateStartWeight(playerId, weight, false); // Player can't edit after submission
```

## Common Methods

### Get Game State
```typescript
const state = gameLogic.getGameState();
// Returns: { gameId, settings, entries/winners, results }
```

### Get Results
```typescript
const results = gameLogic.getResults();
// Returns sorted by rank: GameResult[]
```

### Check Submissions (Weight)
```typescript
gameLogic.hasPlayerSubmittedStartWeight(playerId)
gameLogic.hasPlayerSubmittedEndWeight(playerId)
```

## Point Calculation Modes

### MODE_1 (Decreasing)
- 1st: pointTo
- 2nd: pointTo - 1
- 3rd: pointTo - 2
- ...

### MODE_2 (Proportional)
- Distributed evenly across range
- Better for many players

## WebSocket Events

### Random Game
```typescript
// Admin spins (broadcast)
emitRandomGameSpin(roomId, gameId, adminId)

// Player selected (real-time)
onRandomGamePlayerSelected((data) => {
  // Update UI with selected player
})

// Action taken (real-time)
onRandomGameActionTaken((data) => {
  // Update UI with result
})
```

## Error Handling

```typescript
try {
  // Use game logic
  const selected = gameLogic.spinWheel(available);
  if (!selected) {
    throw new Error('No players available');
  }
  
  // Update database
  await fetch(...);
  
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

## Testing Scenarios

### Random Game Tests
- [ ] Admin starts game successfully
- [ ] Non-admin cannot spin (error shown)
- [ ] Spin selects available player
- [ ] Admin action updates score
- [ ] Game ends and ranks calculated
- [ ] Results saved correctly

### Weight Game Tests
- [ ] Players submit start weight
- [ ] Admin can override start weight
- [ ] Players cannot re-submit (error)
- [ ] Players submit end weight
- [ ] Game end calculates weight range
- [ ] Players ranked by weight lost
- [ ] Points assigned correctly

## Build Status

✅ **All checks passed:**
- TypeScript compilation successful
- No type errors
- Production build ready
- All routes generated

## Files Modified

1. ✅ `src/lib/games/RandomGameLogic.ts` - Added startGame(), updateGameState()
2. ✅ `src/components/RandomGameComponent.tsx` - Integrated game logic
3. ✅ `src/components/WeightGameComponent.tsx` - Integrated game logic

## Next Steps

1. **Test the games** - Manual testing of all flows
2. **Verify WebSocket** - Real-time updates working
3. **Edge cases** - No players, all eliminated
4. **Security** - Admin operations enforced

## Performance Considerations

✅ **Already optimized:**
- Game logic memoized in useState
- Settings loaded once on mount
- Batch updates to database
- Real-time polling when needed

## Reference Links

- 📖 Full Developer Guide: `GAME_LOGIC_DEVELOPER_GUIDE.md`
- 📋 Completion Checklist: `IMPLEMENTATION_COMPLETION_CHECKLIST.md`
- 📝 Session Summary: `GAME_LOGIC_REFACTORING_SESSION.md`

## Quick Code Examples

### Random Game - Admin Spin
```typescript
const handleSpin = async () => {
  if (!isAdmin) throw new Error('Admin only');
  
  const available = gameLogic.getAvailablePlayers(playerIds);
  const selected = gameLogic.spinWheel(available);
  
  emitRandomGameSpin(roomId, gameId, 'admin');
  // Animate spinner...
};
```

### Random Game - Admin Action
```typescript
const handleAdminAction = async (action: 'reward' | 'punish') => {
  const points = gameLogic.calculatePointsAwarded(action);
  
  // Update database with points
  await updatePlayerScore(selectedPlayer.id, points);
  
  // Record in game logic
  gameLogic.recordWinner({
    playerId: selectedPlayer.id,
    action,
    pointsAwarded: points,
    timestamp: new Date(),
  });
};
```

### Weight Game - End Game
```typescript
const handleEndGame = async () => {
  // Prepare entries
  gameLogic.initializeEntries(playerIds, playerNames);
  playerWeights.forEach(pw => {
    gameLogic.updateStartWeight(pw.id, pw.start, true);
    gameLogic.updateEndWeight(pw.id, pw.end, true);
  });
  
  // Calculate results
  const results = await gameLogic.endGame();
  
  // Save to database
  await saveGameResults(gameId, results);
};
```

## Troubleshooting

### Q: Non-admin can spin the wheel
**A:** Check `isAdmin` prop passed to component. Should be protected in multiple places:
1. Component UI check
2. Button disabled state
3. Function guard clause
4. API validation

### Q: WebSocket events not received
**A:** Check:
1. Socket.IO server running
2. Event names match exactly
3. Room ID correct
4. Check browser console for errors

### Q: Wrong rankings calculated
**A:** Verify:
1. All weights submitted
2. Game mode set correctly (most vs least)
3. Point mode configuration
4. No data loss between submission and calculation

### Q: Build fails with type errors
**A:** Ensure:
1. `WeightGameSettings` uses nested `weightLimit` structure
2. `PointMode` enum values used (not numbers)
3. All abstract methods implemented
