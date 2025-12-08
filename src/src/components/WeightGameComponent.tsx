'use client';

import { useState } from 'react';
import { Play, Square } from 'lucide-react';

interface WeightGameComponentProps {
  gameId: string;
  roomId: string;
  isAdmin: boolean;
  currentStep: 'settings' | 'step1' | 'step2' | 'ended';
  onGameComplete?: () => void;
}

export default function WeightGameComponent({
  gameId,
  roomId,
  isAdmin,
  currentStep,
  onGameComplete,
}: WeightGameComponentProps) {
  const [gameSettings, setGameSettings] = useState({
    weightLimitFrom: 0,
    weightLimitTo: 100,
    weightUnit: 'kg' as 'g' | 'kg',
    gameMode: 'most' as 'most' | 'least',
  });

  const [startWeights, setStartWeights] = useState<Record<string, number>>({});
  const [endWeights, setEndWeights] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/rooms/${roomId}/games/${gameId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'active',
            settings: gameSettings,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to start game');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndGame = async () => {
    setLoading(true);
    try {
      // Fetch all weight entries
      const entriesResponse = await fetch(
        `/api/rooms/${roomId}/games/${gameId}/weight/entries`
      );
      if (!entriesResponse.ok) throw new Error('Failed to fetch entries');
      const entries = await entriesResponse.json();

      // Calculate results
      const withRanges = entries.map((e: any) => ({
        playerId: e.playerId,
        startWeight: e.startWeight,
        endWeight: e.endWeight,
        weightRange: Math.abs(e.startWeight - e.endWeight),
      }));

      // Sort by game mode
      const sorted = [...withRanges].sort((a, b) => {
        if (gameSettings.gameMode === 'most') {
          return b.weightRange - a.weightRange;
        } else {
          return a.weightRange - b.weightRange;
        }
      });

      // Assign ranks
      let currentRank = 1;
      for (let i = 0; i < sorted.length; i++) {
        const entry = sorted[i];
        const rank = i > 0 && entry.weightRange === sorted[i - 1].weightRange 
          ? (sorted.findIndex(e => e === entry) as any) 
          : i + 1;

        // Update player rank
        await fetch(
          `/api/rooms/${roomId}/players/${entry.playerId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rank: i + 1 }),
          }
        );
      }

      // Update game status
      await fetch(
        `/api/rooms/${roomId}/games/${gameId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }
      );

      onGameComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Weight Game</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {currentStep === 'settings' && isAdmin && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Weight Limit From</label>
            <input
              type="number"
              value={gameSettings.weightLimitFrom}
              onChange={(e) =>
                setGameSettings({
                  ...gameSettings,
                  weightLimitFrom: parseInt(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weight Limit To</label>
            <input
              type="number"
              value={gameSettings.weightLimitTo}
              onChange={(e) =>
                setGameSettings({
                  ...gameSettings,
                  weightLimitTo: parseInt(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Weight Unit</label>
            <select
              value={gameSettings.weightUnit}
              onChange={(e) =>
                setGameSettings({
                  ...gameSettings,
                  weightUnit: e.target.value as 'g' | 'kg',
                })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="g">Grams (g)</option>
              <option value="kg">Kilograms (kg)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Game Mode</label>
            <select
              value={gameSettings.gameMode}
              onChange={(e) =>
                setGameSettings({
                  ...gameSettings,
                  gameMode: e.target.value as 'most' | 'least',
                })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="most">Most Weight Change</option>
              <option value="least">Least Weight Change</option>
            </select>
          </div>

          <button
            onClick={handleStartGame}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        </div>
      )}

      {currentStep === 'step1' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 1: Start Weight</h3>
          {isAdmin ? (
            <p className="text-gray-600">
              Admin can input or edit start weights for all players
            </p>
          ) : (
            <p className="text-gray-600">Enter your start weight</p>
          )}
          <button
            onClick={() => setGameSettings({ ...gameSettings })}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Move to Step 2
          </button>
        </div>
      )}

      {currentStep === 'step2' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Step 2: End Weight</h3>
          {isAdmin ? (
            <p className="text-gray-600">
              Admin can input or edit end weights for all players
            </p>
          ) : (
            <p className="text-gray-600">Enter your end weight</p>
          )}

          {isAdmin && (
            <button
              onClick={handleEndGame}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Calculating...' : 'End Game & Calculate Points'}
            </button>
          )}
        </div>
      )}

      {currentStep === 'ended' && (
        <div className="text-center py-6">
          <p className="text-gray-600">Game has ended. Points calculated.</p>
        </div>
      )}
    </div>
  );
}
