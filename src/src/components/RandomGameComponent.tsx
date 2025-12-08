'use client';

import { useState, useEffect } from 'react';
import { RotateCw } from 'lucide-react';

interface RandomGameComponentProps {
  gameId: string;
  roomId: string;
  isAdmin: boolean;
  currentStep: 'settings' | 'spinning' | 'actions' | 'ended';
  players?: any[];
  onStepChange?: (step: string) => void;
  onGameComplete?: () => void;
}

export default function RandomGameComponent({
  gameId,
  roomId,
  isAdmin,
  currentStep,
  players: initialPlayers,
  onStepChange,
  onGameComplete,
}: RandomGameComponentProps) {
  const [gameSettings, setGameSettings] = useState({
    pointAward: 10,
    isRepeat: false,
  });

  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [spinnerRotation, setSpinnerRotation] = useState(0);

  useEffect(() => {
    if (currentStep === 'spinning') {
      loadPlayers();
    }
  }, [currentStep]);

  const loadPlayers = async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/players`);
      if (!response.ok) throw new Error('Failed to load players');
      const data = await response.json();
      setPlayers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSpin = async () => {
    setSpinning(true);
    setLoading(true);

    try {
      // Get previous winners if isRepeat is false
      let previousWinners: string[] = [];
      if (!gameSettings.isRepeat) {
        const winnersResponse = await fetch(
          `/api/rooms/${roomId}/games/${gameId}/random/winners`
        );
        if (winnersResponse.ok) {
          const winners = await winnersResponse.json();
          previousWinners = winners.map((w: any) => w.player_id);
        }
      }

      // Filter available players
      const available = players.filter(p => !previousWinners.includes(p.id));
      
      if (available.length === 0) {
        setError('No available players left');
        setSpinning(false);
        setLoading(false);
        return;
      }

      // Random selection
      const randomIndex = Math.floor(Math.random() * available.length);
      const selectedId = available[randomIndex].id;
      const selectedPlayerData = players.find(p => p.id === selectedId);

      // Record winner when spinning starts (before animation)
      await fetch(
        `/api/rooms/${roomId}/games/${gameId}/random/winner`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: selectedId,
            action: 'selected',
            pointsAwarded: 0,
          }),
        }
      );

      // Animate spin
      const randomRotation = 360 * 5 + Math.random() * 360;
      setSpinnerRotation(randomRotation);

      // Simulate spinner delay
      setTimeout(() => {
        setSelectedPlayer(selectedPlayerData);
        setSpinning(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (action: 'reward' | 'punish' | 'nothing') => {
    setLoading(true);
    try {
      let pointsToAdd = 0;
      
      if (action === 'reward') {
        pointsToAdd = gameSettings.pointAward;
      } else if (action === 'punish') {
        pointsToAdd = -gameSettings.pointAward;
      }

      // Update winner record with admin action and points
      await fetch(
        `/api/rooms/${roomId}/games/${gameId}/random/winner`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: selectedPlayer.id,
            action,
            pointsAwarded: pointsToAdd,
          }),
        }
      );

      // Reset for next spin
      setSelectedPlayer(null);
      setSpinnerRotation(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndGame = async () => {
    setLoading(true);
    try {
      // Get all winner records for this game
      const winnersResponse = await fetch(
        `/api/rooms/${roomId}/games/${gameId}/random/winners`
      );
      const winners = winnersResponse.ok ? await winnersResponse.json() : [];

      // Get all players for reference
      const playersResponse = await fetch(`/api/rooms/${roomId}/players`);
      const allPlayers = await playersResponse.json();

      // Calculate results: sum all points earned for each player
      const playerPointsMap = new Map<string, number>();
      winners.forEach((winner: any) => {
        const current = playerPointsMap.get(winner.player_id) || 0;
        playerPointsMap.set(winner.player_id, current + winner.points_awarded);
      });

      // Build results array
      const results = allPlayers.map((player: any) => ({
        playerId: player.id,
        pointsEarned: playerPointsMap.get(player.id) || 0,
        rank: 0, // Will be calculated by API
      }));

      // Step 1: Update game status to completed
      await fetch(
        `/api/rooms/${roomId}/games/${gameId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }
      );

      // Step 2: Save results and update player points/ranks
      await fetch(
        `/api/rooms/${roomId}/games/${gameId}/results`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results }),
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
      <h2 className="text-2xl font-bold mb-6">Random Game</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {currentStep === 'settings' && isAdmin && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Point Award</label>
            <input
              type="number"
              value={gameSettings.pointAward}
              onChange={(e) =>
                setGameSettings({
                  ...gameSettings,
                  pointAward: parseInt(e.target.value),
                })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium">
              <input
                type="checkbox"
                checked={gameSettings.isRepeat}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    isRepeat: e.target.checked,
                  })
                }
                className="mr-2"
              />
              Allow Player Repeat
            </label>
          </div>

          <button
            onClick={() => handleSpin()}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Start Spinning
          </button>
        </div>
      )}

      {currentStep === 'spinning' && (
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div
              className="w-48 h-48 rounded-full border-8 border-blue-600 flex items-center justify-center bg-gradient-to-r from-blue-100 to-purple-100 transition-transform duration-2000"
              style={{
                transform: `rotate(${spinnerRotation}deg)`,
              }}
            >
              <RotateCw className="w-16 h-16 text-blue-600" />
            </div>
          </div>

          {!selectedPlayer && (
            <button
              onClick={handleSpin}
              disabled={spinning || loading}
              className="mx-auto px-8 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {spinning ? 'Spinning...' : 'SPIN'}
            </button>
          )}

          {selectedPlayer && isAdmin && (
            <div className="space-y-4">
              <div className="text-2xl font-bold text-gray-800">
                {selectedPlayer.name}
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleAdminAction('reward')}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Reward
                </button>
                <button
                  onClick={() => handleAdminAction('nothing')}
                  disabled={loading}
                  className="px-6 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  Do Nothing
                </button>
                <button
                  onClick={() => handleAdminAction('punish')}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Punish
                </button>
              </div>

              <button
                onClick={handleSpin}
                disabled={loading}
                className="mx-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Next Spin
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep === 'ended' && (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">Game has ended. Final rankings calculated.</p>
          {isAdmin && (
            <button
              onClick={handleEndGame}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Finalizing...' : 'Finalize Game'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
