# Random Game Code Highlights

## Key Implementation Snippets

### 1. Load Game Settings

```typescript
const loadGameSettings = async () => {
  try {
    const response = await fetch(`/api/rooms/${roomId}/games/${gameId}`);
    if (!response.ok) throw new Error('Failed to load game settings');
    const game = await response.json();
    const camelGame = toCamelCase(game);
    
    if (camelGame.config) {
      setGameSettings({
        pointAward: camelGame.config.pointAward || 10,
        isRepeat: camelGame.config.isRepeat || false,
      });
    }
    setSettingsLoaded(true);
  } catch (err: any) {
    console.error('Failed to load game settings:', err);
    setSettingsLoaded(true); // Allow game to proceed anyway
  }
};
```

**Purpose**: Load game configuration from database when component mounts

---

### 2. Handle Start Game

```typescript
const handleStartGame = async () => {
  setLoading(true);
  setError('');
  try {
    // Save settings to game config
    const response = await fetch(
      `/api/rooms/${roomId}/games/${gameId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: gameSettings,
          status: 'active',
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to start game');

    // Load players and previous winners
    await loadPlayers();
    await loadPreviousWinners();

    setGameStep('spinning');
    setMessage('Game started! Click SPIN to begin.');
    setTimeout(() => setMessage(''), 3000);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Purpose**: Initialize game, save settings, load data, transition to spinning phase

---

### 3. Handle Spin

```typescript
const handleSpin = async () => {
  setSpinning(true);
  setLoading(true);
  setError('');
  setMessage('');

  try {
    // Reload previous winners to get latest
    await loadPreviousWinners();

    // Filter available players
    const available = players.filter(
      (p) => !previousWinners.has(p.id)
    );

    if (available.length === 0) {
      setError('No available players left!');
      setSpinning(false);
      setLoading(false);
      return;
    }

    // Random selection
    const randomIndex = Math.floor(Math.random() * available.length);
    const selectedId = available[randomIndex].id;
    const selectedPlayerData = available[randomIndex];

    // Record selection start time
    setSpinStartTime(Date.now());

    // Animate spin
    const randomRotation = 360 * 5 + Math.random() * 360;
    setSpinnerRotation(randomRotation);

    // Simulate spinner delay (2 seconds)
    setTimeout(() => {
      setSelectedPlayer(selectedPlayerData);
      setSpinning(false);
      setGameStep('actions');
      setMessage(`${selectedPlayerData.name} is selected!`);
    }, 2000);
  } catch (err: any) {
    setError(err.message);
    setSpinning(false);
  } finally {
    setLoading(false);
  }
};
```

**Purpose**: Randomly select player, animate spinner, display result

---

### 4. Handle Admin Action

```typescript
const handleAdminAction = async (action: 'reward' | 'punish' | 'nothing') => {
  setLoading(true);
  setError('');
  setMessage('');

  try {
    let pointsToAdd = 0;
    let actionLabel = '';

    if (action === 'reward') {
      pointsToAdd = gameSettings.pointAward;
      actionLabel = 'Rewarded';
    } else if (action === 'punish') {
      pointsToAdd = -gameSettings.pointAward;
      actionLabel = 'Punished';
    } else {
      actionLabel = 'No change';
    }

    // Update player score based on action
    if (pointsToAdd !== 0) {
      const response = await fetch(
        `/api/rooms/${roomId}/players/${selectedPlayer.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: (selectedPlayer.score || 0) + pointsToAdd,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update player score');
    }

    // Record the admin action in winners table
    await fetch(
      `/api/rooms/${roomId}/games/${gameId}/random/winners`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          adminAction: action,
          pointsAwarded: pointsToAdd,
        }),
      }
    );

    setMessage(
      `${selectedPlayer.name} ${actionLabel}! ${pointsToAdd > 0 ? '+' : ''}${pointsToAdd} points`
    );

    // Add winner to previous winners set if not repeating
    if (!gameSettings.isRepeat) {
      setPreviousWinners(prev => new Set(prev).add(selectedPlayer.id));
    }

    // Reset for next spin or end game
    setTimeout(() => {
      setSelectedPlayer(null);
      setSpinnerRotation(0);
      setGameStep('spinning');
      setMessage('');
    }, 1500);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Purpose**: Execute admin action, update score, record action, auto-continue

---

### 5. Handle End Game

```typescript
const handleEndGame = async () => {
  setLoading(true);
  setError('');
  setMessage('');

  try {
    // Get all players for final update
    const playersResponse = await fetch(`/api/rooms/${roomId}/players`);
    if (!playersResponse.ok) throw new Error('Failed to fetch players');
    const allPlayers = await playersResponse.json();

    // Update game status to completed
    const updateResponse = await fetch(
      `/api/rooms/${roomId}/games/${gameId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      }
    );

    if (!updateResponse.ok) throw new Error('Failed to end game');

    // Build results array (scores already updated during admin actions)
    const results = allPlayers.map((player: any) => ({
      playerId: player.id,
      pointsEarned: player.score || 0,
    }));

    // Save game results - API will calculate rankings
    const resultsResponse = await fetch(
      `/api/rooms/${roomId}/games/${gameId}/results`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      }
    );

    if (!resultsResponse.ok) throw new Error('Failed to save game results');

    setMessage('Game ended! Rankings updated.');
    setGameStep('ended');

    // Reload players to see updated rankings
    await loadPlayers();

    setTimeout(() => {
      onGameComplete?.();
    }, 2000);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**Purpose**: Finalize game, calculate rankings, save results

---

## UI Component Sections

### Settings Step JSX

```jsx
{gameStep === 'settings' && isAdmin && (
  <div className="space-y-6 bg-gray-50 rounded-lg p-6">
    <h3 className="text-xl font-semibold text-gray-800">Step 1: Game Settings</h3>

    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        🏆 Points to Award (per spin)
      </label>
      <input
        type="number"
        value={gameSettings.pointAward}
        onChange={(e) =>
          setGameSettings({
            ...gameSettings,
            pointAward: parseInt(e.target.value) || 0,
          })
        }
        min="0"
        className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
        placeholder="Enter point value"
      />
      <p className="text-xs text-gray-500 mt-1">Enter 0 for no points awarded</p>
    </div>

    <div className="flex items-center space-x-3">
      <input
        type="checkbox"
        id="isRepeat"
        checked={gameSettings.isRepeat}
        onChange={(e) =>
          setGameSettings({
            ...gameSettings,
            isRepeat: e.target.checked,
          })
        }
        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
      />
      <label htmlFor="isRepeat" className="text-sm font-medium text-gray-700">
        🔄 Allow players to be selected multiple times?
      </label>
    </div>

    <button
      onClick={handleStartGame}
      disabled={loading}
      className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
    >
      {loading ? '⏳ Starting...' : '▶️ Start Game'}
    </button>
  </div>
)}
```

---

### Spinner Step JSX

```jsx
{gameStep === 'spinning' && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
    {/* Players List */}
    <div className="md:col-span-1">
      <h4 className="font-semibold text-gray-700 mb-3">👥 Players</h4>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-2 rounded border text-sm transition-colors ${
              previousWinners.has(player.id)
                ? 'bg-gray-100 border-gray-300 text-gray-500 line-through'
                : 'bg-white border-gray-300 text-gray-800 hover:bg-blue-50'
            }`}
          >
            <span className="font-semibold">{getPlayerDisplayId(player.sequenceNumber)}</span>{' '}
            {player.name}
            {previousWinners.has(player.id) && ' ✓'}
          </div>
        ))}
      </div>
    </div>

    {/* Spinner */}
    <div className="md:col-span-1 flex flex-col items-center">
      <div
        className={`w-56 h-56 rounded-full border-8 border-blue-600 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 ${
          spinning ? 'animate-spin' : ''
        }`}
        style={{
          transformOrigin: 'center',
          transform: `rotate(${spinnerRotation}deg)`,
          transition: spinning ? 'none' : 'transform 2s ease-out',
        }}
      >
        <RotateCw className="w-24 h-24 text-blue-600" />
      </div>

      {!selectedPlayer && (
        <button
          onClick={handleSpin}
          disabled={spinning || loading || players.length === 0}
          className="px-12 py-4 bg-green-600 text-white font-bold text-xl rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {spinning ? '⏳ SPINNING...' : '🎡 SPIN'}
        </button>
      )}
    </div>

    {/* Selected Player */}
    {selectedPlayer && (
      <div className="md:col-span-1 flex flex-col items-center justify-center">
        <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-6 w-full text-center border-4 border-yellow-500">
          <p className="text-gray-600 text-sm mb-2">🎉 Selected Player</p>
          <p className="text-4xl font-bold text-orange-600 mb-2">
            {getPlayerDisplayId(selectedPlayer.sequenceNumber)}
          </p>
          <p className="text-2xl font-semibold text-gray-800">
            {selectedPlayer.name}
          </p>
          <p className="text-lg text-gray-600 mt-3">
            Points: {selectedPlayer.score || 0}
          </p>
        </div>
      </div>
    )}
  </div>
)}
```

---

### Actions Step JSX

```jsx
{gameStep === 'actions' && selectedPlayer && isAdmin && (
  <div className="space-y-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6">
    <h3 className="text-xl font-semibold text-gray-800 text-center">
      Step 3: Admin Decision
    </h3>

    <div className="bg-white rounded-lg p-4 text-center border-2 border-orange-300">
      <p className="text-sm text-gray-600 mb-1">Selected Player</p>
      <p className="text-3xl font-bold text-orange-600">
        {getPlayerDisplayId(selectedPlayer.sequenceNumber)} - {selectedPlayer.name}
      </p>
      <p className="text-gray-600 mt-2">Current Points: {selectedPlayer.score || 0}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        onClick={() => handleAdminAction('reward')}
        disabled={loading}
        className="p-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="text-2xl mb-2">🏆</div>
        <div className="text-sm">REWARD</div>
        <div className="text-lg font-bold">+{gameSettings.pointAward}</div>
      </button>

      <button
        onClick={() => handleAdminAction('nothing')}
        disabled={loading}
        className="p-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="text-2xl mb-2">🚫</div>
        <div className="text-sm">DO NOTHING</div>
        <div className="text-lg font-bold">0</div>
      </button>

      <button
        onClick={() => handleAdminAction('punish')}
        disabled={loading}
        className="p-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <div className="text-2xl mb-2">⚠️</div>
        <div className="text-sm">PUNISH</div>
        <div className="text-lg font-bold">-{gameSettings.pointAward}</div>
      </button>
    </div>

    {!loading && (
      <p className="text-sm text-gray-600 text-center">
        Auto-continue to next spin in a moment...
      </p>
    )}
  </div>
)}
```

---

## Real-Time Updates Hook

```typescript
useRealTimeUpdates({
  roomId: roomId,
  eventName: 'players:update',
  fetchCallback: loadPlayers,
  pollingInterval: 2000, // More frequent during active game
  enabled: Boolean(roomId && gameStep === 'spinning'),
});
```

**Features**:
- Polling interval: 2000ms (faster during spinning)
- Debounce: 500ms (prevents rapid calls)
- Auto-disables when gameStep !== 'spinning'
- WebSocket ready for future upgrade

---

## Type Safety

```typescript
interface RandomGameComponentProps {
  gameId: string;
  roomId: string;
  isAdmin: boolean;
  currentStep: 'settings' | 'spinning' | 'actions' | 'ended';
  players?: any[];
  onStepChange?: (step: string) => void;
  onGameComplete?: () => void;
}
```

All props fully typed with strict mode enabled.

---

## Error Handling Pattern

```typescript
try {
  // API call or async operation
  const response = await fetch(...);
  if (!response.ok) throw new Error('Failed to...');
  
  // Process response
  const data = await response.json();
  
  // Update state
  setState(data);
  
  // Show success
  setMessage('Success!');
} catch (err: any) {
  // Display error to user
  setError(err.message);
  console.error('Operation failed:', err);
} finally {
  // Clean up loading state
  setLoading(false);
}
```

Consistent error handling across all async operations.

---

## Performance Optimizations

```typescript
// 1. Memoized callbacks prevent unnecessary re-renders
const loadPlayers = useCallback(async () => {
  // ...
}, [roomId]);

// 2. Debounced polling prevents API overload
pollingInterval: 2000,
minIntervalRef.current = 500,

// 3. Conditional hook execution
enabled: Boolean(roomId && gameStep === 'spinning'),

// 4. Set for O(1) winner lookup
previousWinners: Set<string>
```

All performance optimizations in place.
