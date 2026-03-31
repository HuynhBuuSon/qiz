'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { useDataRecovery } from '@/hooks/useDataRecovery';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { toCamelCase, getPlayerDisplayId } from '@/lib/utils/helpers';
import { initSocket, onRandomGameWinnerSelected } from '@/lib/websocket/client';
import { Home, Edit, Menu, Gamepad2, LogOut } from 'lucide-react';
import WeightGameComponent from '@/components/WeightGameComponent';
import RandomGameComponent from '@/components/RandomGameComponent';

interface PlayerData {
  id: string;
  name: string;
  score: number;
  rank: number;
  sequenceNumber?: number | null;
  isScoreHidden?: boolean;
  isRankHidden?: boolean;
  startWeight?: number | null;
  endWeight?: number | null;
}

export default function PlayerGame() {
  const router = useRouter();
  const { isReady } = useDataRecovery('player');
  const [activeTab, setActiveTab] = useState<'home' | 'edit' | 'game'>('home');
  const [showMenu, setShowMenu] = useState(false);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<Partial<PlayerData> | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeGame, setActiveGame] = useState<any>(null);
  const [roomPlayers, setRoomPlayers] = useState<any[]>([]);
  const [weightGameStep, setWeightGameStep] = useState<'settings' | 'step1' | 'step2' | 'ended'>('settings');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [blinkTimeRemaining, setBlinkTimeRemaining] = useState(0);

  const playerId = useGameStore((state) => state.playerId);
  const roomId = useGameStore((state) => state.roomId);
  const reset = useGameStore((state) => state.reset);

  // Fetch player data
  const fetchPlayerData = useCallback(async () => {
    if (!roomId || !playerId) return;
    try {
      const response = await fetch(
        `/api/rooms/${roomId}/players/${playerId}`
      );
      if (!response.ok) throw new Error('Failed to fetch player');
      const data = await response.json();
      const camelData = toCamelCase(data);
      setPlayer(camelData);
      setEditData(camelData);
    } catch (error) {
      console.error('Error fetching player:', error);
    }
  }, [roomId, playerId]);

  const fetchActiveGame = useCallback(async () => {
    if (!roomId || !playerId) return;
    try {
      const response = await fetch(`/api/rooms/${roomId}/games`);
      if (!response.ok) return;
      const games = await response.json();
      const gamesArray = Array.isArray(games) ? games.map(toCamelCase) : [];
      const active = gamesArray.find((g: any) => g.status === 'active');
      
      if (active) {
        setActiveGame(active);
        
        // For weight games, determine current step based on player weights
        if (active.type === 'weight') {
          const playerResponse = await fetch(`/api/rooms/${roomId}/players/${playerId}`);
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            const camelPlayer = toCamelCase(playerData);
            
            // If player has end weight, they're in step 2 or beyond
            if (camelPlayer.endWeight !== null && camelPlayer.endWeight !== undefined) {
              setWeightGameStep('step2');
            }
            // If player only has start weight, they're in step 1
            else if (camelPlayer.startWeight !== null && camelPlayer.startWeight !== undefined) {
              setWeightGameStep('step1');
            }
            // Default to step 1
            else {
              setWeightGameStep('step1');
            }
          }
        }
      } else {
        setActiveGame(null);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  }, [roomId, playerId]);

  const fetchRoomPlayers = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = await fetch(`/api/rooms/${roomId}/players`);
      if (!response.ok) return;
      const players = await response.json();
      setRoomPlayers(Array.isArray(players) ? players.map(toCamelCase) : []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }, [roomId]);

  // Initialize data on mount
  useEffect(() => {
    if (!isReady || !roomId || !playerId) {
      if (!isReady) return;
      // Use a timer to ensure hydration is complete before redirecting
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 100);
      return () => clearTimeout(timer);
    }

    setLoading(true);
    Promise.all([
      fetchPlayerData(),
      fetchActiveGame(),
      fetchRoomPlayers()
    ]).finally(() => setLoading(false));
  }, [isReady, roomId, playerId, fetchPlayerData, fetchActiveGame, fetchRoomPlayers]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/player/join');
    }
  }, [shouldRedirect, router]);

  // Listen for winner selected event and trigger blinking (only if this player won)
  useEffect(() => {
    try {
      const socket = initSocket();
      onRandomGameWinnerSelected((data: any) => {
        if (playerId === data.playerId) {
          setIsBlinking(true);
          setBlinkTimeRemaining(5);
        }
      });
    } catch (err) {
      console.error('Failed to setup winner listener:', err);
    }
  }, [playerId]);

  // Blinking countdown effect (5 seconds)
  useEffect(() => {
    if (!isBlinking || blinkTimeRemaining <= 0) {
      setIsBlinking(false);
      setBlinkTimeRemaining(0);
      return;
    }

    const timer = setTimeout(() => {
      setBlinkTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsBlinking(false);
        }
        return newTime;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [isBlinking, blinkTimeRemaining]);

  // Sync editData with player data
  useEffect(() => {
    if (player) {
      setEditData(player);
    }
  }, [player]);

  // Real-time updates for player data
  useRealTimeUpdates({
    roomId: roomId,
    eventName: `player:${playerId}:update`,
    fetchCallback: fetchPlayerData,
    pollingInterval: 3000,
    enabled: Boolean(isReady && roomId && playerId),
  });

  // Real-time updates for active game
  useRealTimeUpdates({
    roomId: roomId,
    eventName: 'game:active',
    fetchCallback: fetchActiveGame,
    pollingInterval: 3000,
    enabled: Boolean(isReady && roomId && playerId),
  });

  // Real-time updates for room players
  useRealTimeUpdates({
    roomId: roomId,
    eventName: 'players:update',
    fetchCallback: fetchRoomPlayers,
    pollingInterval: 3000,
    enabled: Boolean(isReady && roomId && playerId),
  });

  const handleWeightGameStepChange = (step: string) => {
    setWeightGameStep(step as 'settings' | 'step1' | 'step2' | 'ended');
  };

  const handleLogout = () => {
    reset();
    router.push('/');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData || !roomId || !playerId) return;

    try {
      setEditLoading(true);
      setMessage('');

      const response = await fetch(
        `/api/rooms/${roomId}/players/${playerId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error('Failed to update player');

      setMessage('Profile updated successfully!');
      setTimeout(() => {
        setMessage('');
        setActiveTab('home');
      }, 1500);
    } catch (error) {
      console.error('Error updating player:', error);
      setMessage('Error updating profile');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        <div className="bg-blue-600 text-white px-3 py-3 sm:p-4 flex items-center justify-between sticky top-0 z-10 safe-area-inset-top">
          <h1 className="text-lg sm:text-xl font-bold">Player</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading player data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col transition-all duration-300 ${
        isBlinking ? 'animate-pulse' : ''
      }`}
      style={{
        backgroundColor: isBlinking ? '#fef3c7' : '#f9fafb',
        animation: isBlinking ? 'playerScreenBlink 0.5s infinite' : 'none',
      }}
    >
      <style>{`
        @keyframes playerScreenBlink {
          0%, 100% { background-color: #f9fafb; color: #1f2937; }
          50% { background-color: #fef3c7; color: #000; }
        }
      `}</style>
      {/* Header */}
      <div className={`text-white px-3 py-3 sm:p-4 flex items-center justify-between sticky top-0 z-10 transition-all duration-300 safe-area-inset-top ${
        isBlinking ? 'bg-yellow-400' : 'bg-blue-600'
      }`}>
        <h1 className="text-lg sm:text-xl font-bold truncate">Player</h1>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-blue-700 rounded active:bg-blue-800 flex items-center gap-1 touch-manipulation"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline text-xs sm:text-sm">Logout</span>
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-blue-700 rounded active:bg-blue-800 touch-manipulation sm:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mx-3 sm:mx-4 mt-3 sm:mt-4 p-2 sm:p-3 rounded text-xs sm:text-sm ${
            message.includes('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 px-3 py-4 sm:p-4 overflow-auto">
        {activeTab === 'home' && player && (
          <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Player Information</h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Player ID</p>
                  <p className="text-xs sm:text-sm font-mono text-gray-800 font-bold mt-1">
                    {getPlayerDisplayId(player.sequenceNumber)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Player Name</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-800">
                    {player.name}
                  </p>
                </div>

                <div className="border-t pt-3 sm:pt-4">
                  <p className="text-gray-600 text-xs sm:text-sm">Your Rank</p>
                  <p className="text-3xl sm:text-4xl font-bold text-blue-600 mt-1">
                    {player.isRankHidden ? '—' : `#${player.rank}`}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-xs sm:text-sm">Your Points</p>
                  <p className="text-3xl sm:text-4xl font-bold text-green-600 mt-1">
                    {player.isScoreHidden ? '—' : player.score}
                  </p>
                </div>

                <div className="bg-blue-50 p-3 sm:p-4 rounded text-xs sm:text-sm text-gray-700">
                  <p className="font-semibold mb-2">Current Room Status:</p>
                  <p className="truncate">Room: {roomId?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit' && editData && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Edit Profile</h2>

              <form onSubmit={handleEditSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Score
                  </label>
                  <input
                    type="number"
                    value={editData.score || 0}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Rank
                  </label>
                  <input
                    type="number"
                    value={editData.rank || 0}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                  />
                </div>

                {activeGame?.type === 'weight' && activeGame?.status === 'active' && (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Start Weight
                      </label>
                      <input
                        type="number"
                        value={editData.startWeight || ''}
                        disabled
                        placeholder="Not set"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set during Step 1 - Read only</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        End Weight
                      </label>
                      <input
                        type="number"
                        value={editData.endWeight || ''}
                        disabled
                        placeholder="Not set"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set during Step 2 - Read only</p>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-3 sm:pt-4">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-sm touch-manipulation"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditData(player);
                      setActiveTab('home');
                    }}
                    disabled={editLoading}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-400 active:bg-gray-500 disabled:bg-gray-200 font-medium text-sm touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'game' && (
          <div className="max-w-md mx-auto">
            {activeGame ? (
              <>
                {activeGame.type === 'weight' ? (
                  <WeightGameComponent
                    gameId={activeGame.id}
                    roomId={roomId!}
                    playerId={playerId}
                    isAdmin={false}
                    currentStep={weightGameStep}
                    players={roomPlayers}
                    onStepChange={handleWeightGameStepChange}
                    onGameComplete={() => setActiveGame(null)}
                  />
                ) : activeGame.type === 'random' ? (
                  <RandomGameComponent
                    gameId={activeGame.id}
                    roomId={roomId!}
                    isAdmin={false}
                    currentStep={activeGame.status === 'active' ? 'spinning' : 'ended'}
                    onGameComplete={() => setActiveGame(null)}
                  />
                ) : (
                  <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Game Status</h2>
                    <p className="text-gray-600 text-sm">Unknown game type</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Active Game</h2>
                <p className="text-gray-600 text-center text-sm">No active game at the moment</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Menu */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0 safe-area-inset-bottom">
        <div className="flex gap-2 sm:gap-4 px-3 py-2 sm:p-4 max-w-md mx-auto justify-around">
          <button
            onClick={() => {
              setActiveTab('home');
              setShowMenu(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-2 sm:p-3 rounded transition-colors touch-manipulation text-xs sm:text-sm ${
              activeTab === 'home'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800 active:text-blue-600'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('game');
              setShowMenu(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-2 sm:p-3 rounded transition-colors touch-manipulation text-xs sm:text-sm ${
              activeTab === 'game'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800 active:text-blue-600'
            }`}
            title="Game"
          >
            <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Game</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('edit');
              setShowMenu(false);
            }}
            className={`flex flex-col items-center gap-0.5 p-2 sm:p-3 rounded transition-colors touch-manipulation text-xs sm:text-sm ${
              activeTab === 'edit'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800 active:text-blue-600'
            }`}
            title="Edit"
          >
            <Edit className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
