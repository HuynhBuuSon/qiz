'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCw } from 'lucide-react';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { toCamelCase, getPlayerDisplayId } from '@/lib/utils/helpers';
import { initSocket, onRandomGamePlayerSelected, onRandomGameActionTaken, emitRandomGameSpin } from '@/lib/websocket/client';
import { RandomGameLogic } from '@/lib/games/RandomGameLogic';
import { PointMode } from '@/lib/games/types';

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
  // Game settings state
  const [gameSettings, setGameSettings] = useState<any>({
    gameName: 'Random Game',
    pointAward: 10,
    isRepeat: false,
    pointMode: PointMode.MODE_2,
    pointFrom: 0,
    pointTo: 100,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Game flow state
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [previousWinners, setPreviousWinners] = useState<Set<string>>(new Set());
  const [spinning, setSpinning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [spinnerRotation, setSpinnerRotation] = useState(0);
  const [gameStep, setGameStep] = useState<'settings' | 'spinning' | 'actions' | 'ended'>('settings');

  // Game logic instance - memoized with full settings
  const [gameLogic] = useState<RandomGameLogic>(() => {
    return new RandomGameLogic(gameId, {
      gameName: 'Random Game',
      pointAward: 10,
      isRepeat: false,
      pointMode: PointMode.MODE_2,
      pointFrom: 0,
      pointTo: 100,
    });
  });

  // Initialize WebSocket and event listeners (admin only)
  useEffect(() => {
    if (!isAdmin) return;

    try {
      const socket = initSocket();
      
      // Listen for spin complete event
      onRandomGamePlayerSelected((data: any) => {
        if (data.gameId === gameId) {
          const selectedPlayerData = players.find(p => p.id === data.playerId);
          if (selectedPlayerData) {
            setSelectedPlayer(selectedPlayerData);
            setSpinning(false);
            setGameStep('actions');
            setMessage(`${selectedPlayerData.name} is selected!`);
          }
        }
      });

      // Listen for action complete event
      onRandomGameActionTaken((data: any) => {
        if (data.gameId === gameId) {
          setMessage(data.message);
          setTimeout(() => {
            setSelectedPlayer(null);
            setSpinnerRotation(0);
            setGameStep('spinning');
            setMessage('');
          }, 1500);
        }
      });
    } catch (err) {
      console.error('WebSocket initialization failed:', err);
    }
  }, [isAdmin, gameId, players]);

  // Load game settings on mount
  useEffect(() => {
    if (!settingsLoaded && isAdmin) {
      loadGameSettings();
    }
  }, [isAdmin, settingsLoaded]);

  // Load players for the spinner
  const loadPlayers = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${roomId}/players`);
      if (!response.ok) throw new Error('Failed to load players');
      const data = await response.json();
      const camelCasePlayers = toCamelCase(data);
      setPlayers(Array.isArray(camelCasePlayers) ? camelCasePlayers : []);
    } catch (err: any) {
      console.error('Failed to load players:', err);
      setError(err.message);
    }
  }, [roomId]);

  // Load game settings from API
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
        // Update game logic with loaded settings
        gameLogic['settings'] = camelGame.config;
      }
      setSettingsLoaded(true);
    } catch (err: any) {
      console.error('Failed to load game settings:', err);
      setSettingsLoaded(true);
    }
  };

  // Load previous winners if isRepeat is false
  const loadPreviousWinners = useCallback(async () => {
    if (gameSettings.isRepeat) {
      setPreviousWinners(new Set());
      return;
    }

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/games/${gameId}/random/winners`
      );
      if (response.ok) {
        const winners = await response.json();
        const winnerIds: string[] = winners.map(
          (w: any) => (w.player_id || w.playerId) as string
        );
        setPreviousWinners(new Set(winnerIds));
      }
    } catch (err: any) {
      console.error('Failed to load winners:', err);
    }
  }, [roomId, gameId, gameSettings.isRepeat]);

  // Real-time updates for players during spinning
  useRealTimeUpdates({
    roomId: roomId,
    eventName: 'players:update',
    fetchCallback: loadPlayers,
    pollingInterval: 2000,
    enabled: Boolean(roomId && gameStep === 'spinning'),
  });

  // Handle start game - saves settings to database
  const handleStartGame = async () => {
    setLoading(true);
    setError('');
    try {
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

  // Handle spin - admin only, uses WebSocket
  const handleSpin = async () => {
    // ADMIN ONLY CHECK
    if (!isAdmin) {
      setError('Only admins can spin the wheel');
      return;
    }

    setSpinning(true);
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await loadPreviousWinners();

      // Use game logic to get available players
      const availablePlayers = gameLogic.getAvailablePlayers(
        players.map(p => p.id)
      );

      if (availablePlayers.length === 0) {
        setError('No available players left!');
        setSpinning(false);
        setLoading(false);
        return;
      }

      // Use game logic to spin
      const selectedId = gameLogic.spinWheel(availablePlayers);

      if (!selectedId) {
        setError('Failed to select player');
        setSpinning(false);
        setLoading(false);
        return;
      }

      // Emit spin via WebSocket (admin only)
      const socket = initSocket();
      const adminId = 'admin'; // TODO: Get from auth context
      emitRandomGameSpin(roomId, gameId, adminId);

      // Animate spin
      const randomRotation = 360 * 5 + Math.random() * 360;
      setSpinnerRotation(randomRotation);

      // Simulate spinner delay (2 seconds)
      setTimeout(() => {
        const selectedPlayerData = players.find(p => p.id === selectedId);
        setSelectedPlayer(selectedPlayerData);
        setSpinning(false);
        setGameStep('actions');
        setMessage(`${selectedPlayerData?.name} is selected!`);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle admin action - Reward, Punish, or Nothing (uses game logic)
  const handleAdminAction = async (action: 'reward' | 'punish' | 'nothing') => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!selectedPlayer) {
        setError('No player selected');
        setLoading(false);
        return;
      }

      // Use game logic to calculate points
      let pointsToAdd = gameLogic.calculatePointsAwarded(action);
      let actionLabel = '';

      if (action === 'reward') {
        actionLabel = 'Rewarded';
      } else if (action === 'punish') {
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
      const recordResponse = await fetch(
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

      if (!recordResponse.ok) {
        console.warn('Failed to record admin action, continuing anyway...');
      }

      // Emit action via WebSocket
      try {
        emitRandomGameSpin(roomId, gameId, 'admin'); // Broadcast action
      } catch (wsErr) {
        console.warn('WebSocket emission failed:', wsErr);
      }

      setMessage(`${selectedPlayer.name} ${actionLabel}! ${pointsToAdd > 0 ? '+' : ''}${pointsToAdd} points`);

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

  // Handle end game - finalize and calculate rankings (uses game logic)
  const handleEndGame = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Get all players for final ranking
      const playersResponse = await fetch(`/api/rooms/${roomId}/players`);
      if (!playersResponse.ok) throw new Error('Failed to fetch players');
      const allPlayers = await playersResponse.json();

      // Build results array from current player data
      const results = allPlayers.map((player: any) => ({
        playerId: player.id,
        playerName: player.name,
        pointsEarned: player.score || 0,
      }));

      // Use game logic to end game and calculate rankings
      // This sorts results by points and assigns ranks
      gameLogic['results'] = results;
      const finalResults = await gameLogic.endGame();

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

      // Save game results - API will calculate rankings
      const resultsResponse = await fetch(
        `/api/rooms/${roomId}/games/${gameId}/results`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: finalResults }),
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">🎡 Random Game</h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          ✅ {message}
        </div>
      )}

      {/* STEP 1: SETTINGS */}
      {gameStep === 'settings' && isAdmin && (
        <div className="space-y-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800">Step 1: Game Settings</h3>

          {/* Point Award Input */}
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

          {/* IsRepeat Checkbox */}
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

          {!gameSettings.isRepeat && (
            <p className="text-xs bg-blue-50 border border-blue-200 rounded p-3 text-blue-700">
              ℹ️ When unchecked, each player can only win once
            </p>
          )}

          {/* Start Game Button */}
          <button
            onClick={handleStartGame}
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
          >
            {loading ? '⏳ Starting...' : '▶️ Start Game'}
          </button>
        </div>
      )}

      {/* STEP 2: SPINNING */}
      {gameStep === 'spinning'  && isAdmin && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 text-center">
            Step 2: Pick a Player
          </h3>

          {/* Spinner with Players Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Left Column - Players */}
            <div className="md:col-span-1 order-2 md:order-1">
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

            {/* Center Column - Spinner */}
            <div className="md:col-span-1 order-1 md:order-2 flex flex-col items-center">
              {/* Animated Spinner */}
              <div className="relative mb-6">
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
              </div>

              {/* Spin Button */}
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

            {/* Right Column - Selected Player */}
            {selectedPlayer && (
              <div className="md:col-span-1 order-3 md:order-3 flex flex-col items-center justify-center">
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
        </div>
      )}

      {/* STEP 3: ADMIN ACTION */}
      {gameStep === 'actions' && selectedPlayer && isAdmin && (
        <div className="space-y-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 text-center">
            Step 3: Admin Decision
          </h3>

          {/* Selected Player Display */}
          <div className="bg-white rounded-lg p-4 text-center border-2 border-orange-300">
            <p className="text-sm text-gray-600 mb-1">Selected Player</p>
            <p className="text-3xl font-bold text-orange-600">
              {getPlayerDisplayId(selectedPlayer.sequenceNumber)} - {selectedPlayer.name}
            </p>
            <p className="text-gray-600 mt-2">Current Points: {selectedPlayer.score || 0}</p>
          </div>

          {/* Admin Control Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Reward Button */}
            <button
              onClick={() => handleAdminAction('reward')}
              disabled={loading}
              className="p-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm">REWARD</div>
              <div className="text-lg font-bold">+{gameSettings.pointAward}</div>
            </button>

            {/* Nothing Button */}
            <button
              onClick={() => handleAdminAction('nothing')}
              disabled={loading}
              className="p-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <div className="text-2xl mb-2">🚫</div>
              <div className="text-sm">DO NOTHING</div>
              <div className="text-lg font-bold">0</div>
            </button>

            {/* Punish Button */}
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

          {/* Continue Spinning */}
          {!loading && (
            <p className="text-sm text-gray-600 text-center">
              Auto-continue to next spin in a moment...
            </p>
          )}
        </div>
      )}

      {/* STEP 4: GAME ENDED */}
      {gameStep === 'ended' && (
        <div className="space-y-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-gray-800">🎉 Game Ended</h3>
          <p className="text-gray-600">Final rankings have been calculated and updated.</p>

          {/* End Game Button */}
          {isAdmin && (
            <button
              onClick={handleEndGame}
              disabled={loading}
              className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {loading ? '⏳ Finalizing...' : '✅ Finalize Game'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
