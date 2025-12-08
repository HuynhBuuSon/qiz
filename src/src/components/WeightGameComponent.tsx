'use client';

import { useState, useEffect } from 'react';
import { Play, Square, Edit2, Check } from 'lucide-react';

interface PlayerWeight {
  playerId: string;
  playerName: string;
  startWeight: number | null;
  endWeight: number | null;
  weightRange: number | null;
  rank: number | null;
  pointsEarned: number;
}

interface WeightGameComponentProps {
  gameId: string;
  roomId: string;
  playerId?: string | null;
  isAdmin: boolean;
  currentStep: 'settings' | 'step1' | 'step2' | 'ended';
  players: any[];
  onStepChange?: (step: string) => void;
  onGameComplete?: () => void;
}

export default function WeightGameComponent({
  gameId,
  roomId,
  playerId,
  isAdmin,
  currentStep,
  players,
  onStepChange,
  onGameComplete,
}: WeightGameComponentProps) {
  const [gameSettings, setGameSettings] = useState({
    weightLimitFrom: 0,
    weightLimitTo: 100,
    weightUnit: 'kg' as 'g' | 'kg',
    gameMode: 'most' as 'most' | 'least',
  });

  const [playerWeights, setPlayerWeights] = useState<Record<string, PlayerWeight>>({});
  const [currentPlayerWeight, setCurrentPlayerWeight] = useState<number | ''>('');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (players && players.length > 0) {
      const weights: Record<string, PlayerWeight> = {};
      players.forEach((player) => {
        weights[player.id] = {
          playerId: player.id,
          playerName: player.name,
          startWeight: null,
          endWeight: null,
          weightRange: null,
          rank: null,
          pointsEarned: 0,
        };
      });
      setPlayerWeights(weights);
    }
  }, [players]);

  const handleStartGame = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/rooms/${roomId}/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          settings: gameSettings,
        }),
      });

      if (!response.ok) throw new Error('Failed to start game');
      onStepChange?.('step1');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToStep2 = async () => {
    setError('');
    try {
      const allHaveStartWeights = Object.values(playerWeights).every(
        (pw) => pw.startWeight !== null
      );
      if (!allHaveStartWeights && !isAdmin) {
        throw new Error('Not all players have entered start weight');
      }
      onStepChange?.('step2');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculatePoints = (rank: number, totalPlayers: number, isZeroRange: boolean): number => {
    const maxPoints = Math.max(gameSettings.weightLimitFrom, gameSettings.weightLimitTo);
    const minPoints = Math.min(gameSettings.weightLimitFrom, gameSettings.weightLimitTo);

    // If weight range is 0, assign lowest points
    if (isZeroRange) {
      return minPoints;
    }

    // Mode 1: -1 per rank (1st = max, 2nd = max-1, etc)
    const points = maxPoints - (rank - 1);
    return Math.max(points, minPoints);
  };

  const handleEndGame = async () => {
    setLoading(true);
    setError('');
    try {
      const results: any[] = [];
      const allPlayerWeights = Object.values(playerWeights);
      
      // Separate players with weight ranges from those without
      const withRanges = allPlayerWeights
        .filter((pw) => pw.startWeight !== null && pw.endWeight !== null)
        .map((pw) => ({
          ...pw,
          weightRange: pw.startWeight! - pw.endWeight!,
        }));

      const withoutRanges = allPlayerWeights
        .filter((pw) => pw.startWeight === null || pw.endWeight === null);

      // Sort players with ranges
      const sorted = [...withRanges].sort((a, b) => {
        if (gameSettings.gameMode === 'most') {
          return b.weightRange! - a.weightRange!;
        } else {
          return a.weightRange! - b.weightRange!;
        }
      });

      // Separate zero range entries
      const zeroRangeEntries = sorted.filter((e) => e.weightRange === 0);
      const validRangeEntries = sorted.filter((e) => e.weightRange !== 0);

      // Assign ranks and points to valid entries
      validRangeEntries.forEach((entry, index) => {
        const rank = index + 1;
        const points = calculatePoints(rank, validRangeEntries.length, false);

        results.push({
          playerId: entry.playerId,
          playerName: entry.playerName,
          rank,
          pointsEarned: points,
          weightRange: entry.weightRange,
        });
      });

      // Assign lowest points to zero range entries
      const lowestRank = validRangeEntries.length + 1;
      zeroRangeEntries.forEach((entry) => {
        const lowestPoints = Math.min(gameSettings.weightLimitFrom, gameSettings.weightLimitTo);
        results.push({
          playerId: entry.playerId,
          playerName: entry.playerName,
          rank: lowestRank,
          pointsEarned: lowestPoints,
          weightRange: entry.weightRange,
        });
      });

      // Assign lowest points to players without data
      withoutRanges.forEach((entry) => {
        const lowestPoints = Math.min(gameSettings.weightLimitFrom, gameSettings.weightLimitTo);
        results.push({
          playerId: entry.playerId,
          playerName: entry.playerName,
          rank: allPlayerWeights.length,
          pointsEarned: lowestPoints,
          weightRange: null,
        });
      });

      // Step 1: Update game status to 'completed'
      const statusResponse = await fetch(`/api/rooms/${roomId}/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
        }),
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update game status');
      }

      // Step 2: Save results to game_results table using PUT
      const resultsResponse = await fetch(
        `/api/rooms/${roomId}/games/${gameId}/results`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: results.map((r) => ({
              playerId: r.playerId,
              pointsEarned: r.pointsEarned,
              rank: r.rank,
            })),
          }),
        }
      );

      if (!resultsResponse.ok) {
        throw new Error('Failed to save game results');
      }

      setSuccess('Game ended! Points calculated and updated.');
      onGameComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPlayerWeight = async (
    targetPlayerId: string,
    weight: number,
    step: 'step1' | 'step2'
  ) => {
    setError('');
    try {
      if (!isAdmin && playerId === targetPlayerId) {
        const playerData = playerWeights[targetPlayerId];
        if (step === 'step1' && playerData.startWeight !== null) {
          setError('You have already submitted your start weight');
          return;
        }
        if (step === 'step2' && playerData.endWeight !== null) {
          setError('You have already submitted your end weight');
          return;
        }
      }

      setPlayerWeights((prev) => ({
        ...prev,
        [targetPlayerId]: {
          ...prev[targetPlayerId],
          [step === 'step1' ? 'startWeight' : 'endWeight']: weight,
        },
      }));

      setCurrentPlayerWeight('');
      setEditingPlayerId(null);
      setSuccess(`Weight recorded for ${playerWeights[targetPlayerId]?.playerName}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Weight Game</h2>
        <p className="text-gray-600 mt-2">
          Current Step: {currentStep === 'settings' ? 'Settings' : currentStep === 'step1' ? 'Step 1 - Start Weight' : currentStep === 'step2' ? 'Step 2 - End Weight' : 'Game Ended'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {currentStep === 'settings' && isAdmin && (
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Limit From ({gameSettings.weightUnit})
              </label>
              <input
                type="number"
                value={gameSettings.weightLimitFrom}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    weightLimitFrom: parseInt(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Limit To ({gameSettings.weightUnit})
              </label>
              <input
                type="number"
                value={gameSettings.weightLimitTo}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    weightLimitTo: parseInt(e.target.value),
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight Unit
              </label>
              <select
                value={gameSettings.weightUnit}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    weightUnit: e.target.value as 'g' | 'kg',
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Mode
              </label>
              <select
                value={gameSettings.gameMode}
                onChange={(e) =>
                  setGameSettings({
                    ...gameSettings,
                    gameMode: e.target.value as 'most' | 'least',
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="most">Most Weight Lost</option>
                <option value="least">Least Weight Lost</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
          >
            <Play className="w-5 h-5" />
            {loading ? 'Starting...' : 'Start Game (Step 1)'}
          </button>
        </div>
      )}

      {currentStep === 'step1' && (
        <div className="space-y-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Step 1: Start Weight</h3>
            <p className="text-blue-800 text-sm">
              {isAdmin
                ? 'Admin can add or edit start weights for all players'
                : 'Enter your start weight (can only submit once)'}
            </p>
          </div>

          <div className="space-y-3">
            {Object.values(playerWeights).map((pw) => (
              <div key={pw.playerId} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{pw.playerName}</p>
                    {pw.startWeight !== null && (
                      <p className="text-sm text-gray-600">
                        Start Weight: {pw.startWeight} {gameSettings.weightUnit}
                      </p>
                    )}
                  </div>

                  {(isAdmin || playerId === pw.playerId) && (
                    <div className="flex items-center gap-2">
                      {editingPlayerId === pw.playerId ? (
                        <>
                          <input
                            type="number"
                            value={currentPlayerWeight}
                            onChange={(e) =>
                              setCurrentPlayerWeight(
                                e.target.value === '' ? '' : parseInt(e.target.value)
                              )
                            }
                            placeholder="Weight"
                            className="w-20 border border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            onClick={() =>
                              handleSubmitPlayerWeight(
                                pw.playerId,
                                currentPlayerWeight as number,
                                'step1'
                              )
                            }
                            className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPlayerId(pw.playerId);
                            setCurrentPlayerWeight(pw.startWeight || '');
                          }}
                          disabled={!isAdmin && pw.startWeight !== null}
                          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <button
              onClick={handleMoveToStep2}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Moving...' : 'Move to Step 2'}
            </button>
          )}
        </div>
      )}

      {currentStep === 'step2' && (
        <div className="space-y-6 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Step 2: End Weight</h3>
            <p className="text-purple-800 text-sm">
              {isAdmin
                ? 'Admin can add or edit end weights for all players'
                : 'Enter your end weight (can only submit once)'}
            </p>
          </div>

          <div className="space-y-3">
            {Object.values(playerWeights).map((pw) => (
              <div key={pw.playerId} className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{pw.playerName}</p>
                    {pw.startWeight !== null && (
                      <p className="text-xs text-gray-600">
                        Start: {pw.startWeight} {gameSettings.weightUnit}
                      </p>
                    )}
                    {pw.endWeight !== null && (
                      <p className="text-sm text-gray-600">
                        End Weight: {pw.endWeight} {gameSettings.weightUnit}
                        {pw.startWeight !== null && (
                          <span className="ml-2">
                            (Range: {pw.startWeight - pw.endWeight})
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  {(isAdmin || playerId === pw.playerId) && (
                    <div className="flex items-center gap-2">
                      {editingPlayerId === pw.playerId ? (
                        <>
                          <input
                            type="number"
                            value={currentPlayerWeight}
                            onChange={(e) =>
                              setCurrentPlayerWeight(
                                e.target.value === '' ? '' : parseInt(e.target.value)
                              )
                            }
                            placeholder="Weight"
                            className="w-20 border border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            onClick={() =>
                              handleSubmitPlayerWeight(
                                pw.playerId,
                                currentPlayerWeight as number,
                                'step2'
                              )
                            }
                            className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPlayerId(pw.playerId);
                            setCurrentPlayerWeight(pw.endWeight || '');
                          }}
                          disabled={!isAdmin && pw.endWeight !== null}
                          className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() => onStepChange?.('step1')}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-semibold"
              >
                Back to Step 1
              </button>
              <button
                onClick={handleEndGame}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
              >
                <Square className="w-5 h-5" />
                {loading ? 'Calculating...' : 'End Game & Calculate'}
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep === 'ended' && (
        <div className="text-center py-8">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-xl font-bold text-green-900 mb-2">Game Ended</h3>
            <p className="text-green-800">Points have been calculated and updated.</p>
          </div>
        </div>
      )}
    </div>
  );
}
