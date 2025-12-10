# 🎮 IMPLEMENTATION GUIDE - Missing Features

## Quick Start: What to Build Next

---

## 1️⃣ ADMIN CREATE GAME FORM (2.1) - HIGH PRIORITY

### Location
`/src/app/admin/create/page.tsx`

### Form Fields Required

```typescript
// Type definition
interface CreateRoomRequest {
  name: string;                  // Game name
  mainColor: string;             // Hex color #000000
  colorFrom: string;             // Gradient start
  colorTo: string;               // Gradient end
  maxPlayers: 4 | 10 | 15 | 20 | 30 | 50;
  pointMode: 1 | 2;              // Linear or Proportional
  pointFrom: number;             // Min points (0, 10, etc)
  pointTo: number;               // Max points (100, 50, etc)
  createdBy: string;             // UUID from state
}
```

### Implementation Template

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';

export default function AdminCreate() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    mainColor: '#3b82f6',
    colorFrom: '#10b981',
    colorTo: '#1e40af',
    maxPlayers: 10,
    pointMode: 1,
    pointFrom: 0,
    pointTo: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // POST to /api/rooms
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: '550e8400-e29b-41d4-a716-446655440000', // Replace with actual admin ID
        }),
      });

      if (!response.ok) throw new Error('Failed to create room');
      
      const room = await response.json();
      
      // Store in Zustand
      // useGameStore.setState({ currentRoom: room });
      
      router.push('/admin/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-6">Create Game Room</h1>
        
        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Room Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        {/* Color Picker */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Main Color</label>
            <input
              type="color"
              value={formData.mainColor}
              onChange={(e) => setFormData({...formData, mainColor: e.target.value})}
              className="w-full h-10 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color From</label>
            <input
              type="color"
              value={formData.colorFrom}
              onChange={(e) => setFormData({...formData, colorFrom: e.target.value})}
              className="w-full h-10 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color To</label>
            <input
              type="color"
              value={formData.colorTo}
              onChange={(e) => setFormData({...formData, colorTo: e.target.value})}
              className="w-full h-10 border rounded"
            />
          </div>
        </div>

        {/* Max Players */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Max Players</label>
          <select
            value={formData.maxPlayers}
            onChange={(e) => setFormData({...formData, maxPlayers: parseInt(e.target.value) as any})}
            className="w-full border rounded px-3 py-2"
          >
            {[4, 10, 15, 20, 30, 50].map(n => (
              <option key={n} value={n}>{n} Players</option>
            ))}
          </select>
        </div>

        {/* Point Mode */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Point Mode</label>
          <div className="space-y-2">
            <label>
              <input
                type="radio"
                value={1}
                checked={formData.pointMode === 1}
                onChange={() => setFormData({...formData, pointMode: 1})}
              />
              {' '}Mode 1: Linear (1 point difference per rank)
            </label>
            <label>
              <input
                type="radio"
                value={2}
                checked={formData.pointMode === 2}
                onChange={() => setFormData({...formData, pointMode: 2})}
              />
              {' '}Mode 2: Proportional (equal gap)
            </label>
          </div>
        </div>

        {/* Point Range */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Points From</label>
            <input
              type="number"
              value={formData.pointFrom}
              onChange={(e) => setFormData({...formData, pointFrom: parseInt(e.target.value)})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Points To</label>
            <input
              type="number"
              value={formData.pointTo}
              onChange={(e) => setFormData({...formData, pointTo: parseInt(e.target.value)})}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Room'}
        </button>
      </form>
    </div>
  );
}
```

---

## 2️⃣ WEIGHT GAME LOGIC - CRITICAL

### Location
Create `/src/lib/utils/gameLogic.ts`

```typescript
// Weight Game Calculation Logic

export function calculateWeightRange(
  startWeight: number, 
  endWeight: number
): number {
  return Math.abs(startWeight - endWeight);
}

export interface PlayerWeightEntry {
  playerId: string;
  startWeight: number;
  endWeight: number;
  weightRange: number;
}

export function rankPlayersByWeightRange(
  entries: PlayerWeightEntry[],
  mode: 'most' | 'least'
): Array<{ playerId: string; rank: number; weightRange: number }> {
  // Sort by weight range
  const sorted = [...entries].sort((a, b) => {
    if (mode === 'most') {
      return b.weightRange - a.weightRange; // Descending
    } else {
      return a.weightRange - b.weightRange; // Ascending
    }
  });

  // Assign ranks (handling ties)
  let currentRank = 1;
  const results = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    
    // If same weight as previous, use same rank
    if (i > 0 && entry.weightRange === sorted[i - 1].weightRange) {
      results.push({
        playerId: entry.playerId,
        rank: results[i - 1].rank,
        weightRange: entry.weightRange,
      });
    } else {
      results.push({
        playerId: entry.playerId,
        rank: currentRank,
        weightRange: entry.weightRange,
      });
      currentRank = i + 1;
    }
  }

  return results;
}

export function calculatePointsMode1(
  rank: number,
  pointFrom: number,
  pointTo: number
): number {
  // Linear: pointTo - (rank - 1)
  // Rank 1: 100, Rank 2: 99, etc.
  return Math.max(pointFrom, pointTo - (rank - 1));
}

export function calculatePointsMode2(
  rank: number,
  pointFrom: number,
  pointTo: number,
  totalPlayers: number
): number {
  // Proportional: pointTo - ((rank - 1) * pointGap)
  // pointGap = (pointTo - pointFrom) / totalPlayers
  const pointGap = (pointTo - pointFrom) / totalPlayers;
  return Math.max(pointFrom, pointTo - (rank - 1) * pointGap);
}

// Main Weight Game Result Calculation
export async function calculateWeightGameResults(
  gameId: string,
  roomId: string,
  pointMode: 1 | 2,
  pointFrom: number,
  pointTo: number,
  weightMode: 'most' | 'least'
) {
  try {
    // 1. Get all weight entries for this game
    const entriesResponse = await fetch(
      `/api/rooms/${roomId}/games/${gameId}/weight/entries`
    );
    const entries = await entriesResponse.json();

    // 2. Calculate weight ranges
    const withRanges = entries.map((e: any) => ({
      ...e,
      weightRange: calculateWeightRange(e.startWeight, e.endWeight),
    }));

    // 3. Rank players by weight
    const ranked = rankPlayersByWeightRange(withRanges, weightMode);

    // 4. Calculate points
    const results = ranked.map(r => ({
      playerId: r.playerId,
      rank: r.rank,
      points: pointMode === 1
        ? calculatePointsMode1(r.rank, pointFrom, pointTo)
        : calculatePointsMode2(r.rank, pointFrom, pointTo, entries.length),
    }));

    // 5. Store results
    for (const result of results) {
      await fetch(
        `/api/rooms/${roomId}/players/${result.playerId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: (await getPlayerScore(roomId, result.playerId)) + result.points,
            rank: result.rank,
          }),
        }
      );
    }

    return results;
  } catch (error) {
    console.error('Error calculating weight game results:', error);
    throw error;
  }
}

async function getPlayerScore(roomId: string, playerId: string): Promise<number> {
  const response = await fetch(
    `/api/rooms/${roomId}/players/${playerId}`
  );
  const player = await response.json();
  return player.score || 0;
}
```

---

## 3️⃣ RANDOM GAME LOGIC - CRITICAL

### Location
Create `/src/lib/utils/randomGameLogic.ts`

```typescript
// Random Game Spin Logic

export function getRandomPlayer(
  players: Array<{ id: string; name: string }>,
  previousWinners: string[] = []
): string {
  // Filter out previous winners if isRepeat = false
  const available = players.filter(p => !previousWinners.includes(p.id));
  
  if (available.length === 0) {
    throw new Error('No available players left');
  }

  // Random selection
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex].id;
}

export interface SpinResult {
  selectedPlayerId: string;
  selectedPlayerName: string;
  spinDuration: number; // in ms
}

export function simulateSpin(players: any[], previousWinners: string[]): SpinResult {
  const selectedId = getRandomPlayer(players, previousWinners);
  const selectedPlayer = players.find(p => p.id === selectedId);

  return {
    selectedPlayerId: selectedId,
    selectedPlayerName: selectedPlayer?.name || 'Unknown',
    spinDuration: 3000, // 3 second spin animation
  };
}

export async function applyAdminAction(
  gameId: string,
  roomId: string,
  playerId: string,
  action: 'reward' | 'punish' | 'nothing',
  pointAward: number,
  pointMode: 1 | 2,
  totalPlayers: number,
  pointFrom: number,
  pointTo: number
) {
  let pointsToAdd = 0;

  if (action === 'reward') {
    pointsToAdd = pointAward;
  } else if (action === 'punish') {
    pointsToAdd = -pointAward;
  } else {
    pointsToAdd = 0;
  }

  // Get current player score
  const playerResponse = await fetch(
    `/api/rooms/${roomId}/players/${playerId}`
  );
  const player = await playerResponse.json();
  const currentScore = player.score || 0;
  const newScore = currentScore + pointsToAdd;

  // Update player score
  await fetch(
    `/api/rooms/${roomId}/players/${playerId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: newScore }),
    }
  );

  // Store winner record
  await fetch(
    `/api/rooms/${roomId}/games/${gameId}/random/winner`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        action,
        pointsAwarded: pointsToAdd,
      }),
    }
  );

  return { success: true, newScore };
}

export async function calculateRandomGameResults(
  gameId: string,
  roomId: string,
  pointMode: 1 | 2,
  pointFrom: number,
  pointTo: number
) {
  // Get all winners from this game
  const winnersResponse = await fetch(
    `/api/rooms/${roomId}/games/${gameId}/random/winners`
  );
  const winners = await winnersResponse.json();

  // Get all players
  const playersResponse = await fetch(
    `/api/rooms/${roomId}/players`
  );
  const players = await playersResponse.json();

  // Sort by score descending and assign final ranks
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Update ranks
  for (let i = 0; i < sorted.length; i++) {
    await fetch(
      `/api/rooms/${roomId}/players/${sorted[i].id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank: i + 1 }),
      }
    );
  }

  return { success: true, ranked: sorted };
}
```

---

## 4️⃣ PLAYER JOIN INTEGRATION

### Current File
`/src/app/player/join/page.tsx`

### Changes Needed

Replace the mock join logic with actual API call:

```typescript
const handleJoin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // 1. Verify room exists by join code
    const roomsResponse = await fetch('/api/rooms');
    const rooms = await roomsResponse.json();
    const room = rooms.find((r: any) => r.join_code === joinCode);
    
    if (!room) {
      setError('Invalid room code');
      return;
    }

    // 2. Add player to room
    const playerResponse = await fetch(
      `/api/rooms/${room.id}/players`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName }),
      }
    );

    if (!playerResponse.ok) {
      throw new Error('Failed to join room');
    }

    const player = await playerResponse.json();

    // 3. Store in Zustand + localStorage
    setPlayerId(player.id);
    setRoomId(room.id);
    setCurrentRoom(room);

    // Navigate to player home
    router.push('/player/game');
  } catch (err: any) {
    setError(err.message || 'Failed to join room');
  } finally {
    setLoading(false);
  }
};
```

---

## 5️⃣ ADMIN GAMES MANAGEMENT

### Location
Enhance `/src/app/admin/games/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import useGameStore from '@/store/gameStore';
import { Trash2, Play, Square, Edit } from 'lucide-react';

export default function AdminGames() {
  const currentRoom = useGameStore((state) => state.currentRoom);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentRoom?.id) {
      loadGames();
    }
  }, [currentRoom]);

  const loadGames = async () => {
    try {
      const response = await fetch(
        `/api/rooms/${currentRoom?.id}/games`
      );
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async (gameId: string) => {
    await fetch(
      `/api/rooms/${currentRoom?.id}/games/${gameId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      }
    );
    loadGames();
  };

  const handleEndGame = async (gameId: string) => {
    await fetch(
      `/api/rooms/${currentRoom?.id}/games/${gameId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      }
    );
    loadGames();
  };

  const handleDeleteGame = async (gameId: string) => {
    if (confirm('Delete this game?')) {
      await fetch(
        `/api/rooms/${currentRoom?.id}/games/${gameId}`,
        { method: 'DELETE' }
      );
      loadGames();
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#154c79',  // Dark blue
      active: '#147834',   // Green
      completed: '#7e3c3c', // Red
    };
    return colors[status] || '#154c79';
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Games Management</h2>

      <div className="grid gap-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="p-4 rounded border"
            style={{ borderLeftColor: getStatusColor(game.status), borderLeftWidth: 4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{game.name}</h3>
                <p className="text-sm text-gray-600">{game.type} game</p>
                <p
                  className="text-sm text-white px-2 py-1 rounded mt-2 inline-block"
                  style={{ backgroundColor: getStatusColor(game.status) }}
                >
                  {game.status}
                </p>
              </div>
              <div className="flex gap-2">
                {game.status === 'pending' && (
                  <button
                    onClick={() => handleStartGame(game.id)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                )}
                {game.status === 'active' && (
                  <button
                    onClick={() => handleEndGame(game.id)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    <Square className="w-4 h-4" /> End
                  </button>
                )}
                <button
                  onClick={() => handleDeleteGame(game.id)}
                  className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        + Add Game
      </button>
    </div>
  );
}
```

---

## 🚀 IMPLEMENTATION ORDER

1. **Day 1:** Admin Create Game Form (2.1)
2. **Day 2:** Player Join API Integration (4.1)
3. **Day 3:** Admin Games Management (2.4)
4. **Day 4-5:** Weight Game Logic (5.2)
5. **Day 6-7:** Random Game Logic (5.3)
6. **Day 8:** WebSocket Integration
7. **Day 9-10:** UI Polish & Edge Cases

---

## ✅ VERIFICATION

After implementing each section, verify:

```bash
# 1. Run tests
npm run test:api

# 2. Check Swagger
http://localhost:3000/api/docs

# 3. Test manually in browser
http://localhost:3000

# 4. Check console for errors
npm run dev
```

---

## 📚 KEY UTILITIES

**Already Available:**
- Point calculation functions in `/src/lib/utils/helpers.ts`
- API client (axios) configured
- Zustand store setup
- localStorage persistence

**Need to Create:**
- Game logic functions (this guide)
- Component wrappers for forms
- WebSocket event handlers
