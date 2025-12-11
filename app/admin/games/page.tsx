'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { useDataRecovery } from '@/hooks/useDataRecovery';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { toCamelCase } from '@/lib/utils/helpers';
import { Trash2, Edit, Play, Square, ArrowLeft } from 'lucide-react';
import GameSelectorModal from '@/components/admin/GameSelectorModal';
import GameSettingsModal from '@/components/admin/GameSettingsModal';
import GameControlModal from '@/components/admin/GameControlModal';

export default function AdminGames() {
  const router = useRouter();
  const { isReady, currentRoom } = useDataRecovery('admin');
  const [games, setGames] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [showGameSettings, setShowGameSettings] = useState(false);
  const [showGameControl, setShowGameControl] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState('');
  const [selectedGame, setSelectedGame] = useState<any>(null);

  const loadPlayers = useCallback(async () => {
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/players`);

      if (!response.ok) throw new Error('Failed to load players');

      const data = await response.json();
      setPlayers(Array.isArray(data) ? data.map(toCamelCase) : []);
    } catch (err: any) {
      console.error('Failed to load players:', err.message);
    }
  }, [currentRoom?.id]);

  const loadGames = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games`);

      if (!response.ok) throw new Error('Failed to load games');

      const data = await response.json();
      setGames(Array.isArray(data) ? data.map(toCamelCase) : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }, [currentRoom?.id]);

  useEffect(() => {
    if (!isReady) return;

    if (currentRoom?.id) {
      loadGames();
      loadPlayers();
    } else {
      setLoading(false);
    }
  }, [isReady, currentRoom?.id, loadGames, loadPlayers]);

  // Real-time updates for games - DISABLED when modal is open to prevent constant refreshes
  useRealTimeUpdates({
    roomId: currentRoom?.id,
    eventName: 'games:update',
    fetchCallback: loadGames,
    pollingInterval: 5000,
    enabled: Boolean(isReady && currentRoom?.id && !showGameControl),
  });

  // Real-time updates for players - DISABLED when modal is open to prevent constant refreshes
  useRealTimeUpdates({
    roomId: currentRoom?.id,
    eventName: 'players:update',
    fetchCallback: loadPlayers,
    pollingInterval: 5000,
    enabled: Boolean(isReady && currentRoom?.id && !showGameControl),
  });

  const handleStartGame = async (gameId: string) => {
    try {
      const response = await fetch(
        `/api/rooms/${currentRoom?.id}/games/${gameId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active' }),
        }
      );

      if (!response.ok) throw new Error('Failed to start game');
      
      loadGames();
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    }
  };

  const handleGameControlClick = (game: any) => {
    setSelectedGame(game);
    setShowGameControl(true);
  };

  const handleGameControlClose = () => {
    setShowGameControl(false);
    setSelectedGame(null);
    loadGames();
  };

  const handleGameStatusChange = async (status: string) => {
    if (selectedGame) {
      try {
        const response = await fetch(
          `/api/rooms/${currentRoom?.id}/games/${selectedGame.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) throw new Error('Failed to update game status');
        
        await loadGames();
      } catch (err: any) {
        setError(err.message || 'Failed to update game status');
      }
    }
  };

  const handleMoveToStep2 = (game: any) => {
    setSelectedGame(game);
    setShowGameControl(true);
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;

    try {
      const response = await fetch(
        `/api/rooms/${currentRoom?.id}/games/${gameId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete game');
      
      loadGames();
    } catch (err: any) {
      setError(err.message || 'Failed to delete game');
    }
  };

  const handleAddGame = async (gameType: string) => {
    setSelectedGameType(gameType);
    setShowGameSettings(true);
  };

  const handleSaveGameSettings = async (settings: any) => {
    try {
      const response = await fetch(
        `/api/rooms/${currentRoom?.id}/games`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: settings.gameName,
            type: selectedGameType,
            status: 'pending',
            gameOrder: games.length + 1,
            settings: {
              pointMode: settings.pointMode,
              pointFrom: settings.pointFrom,
              pointTo: settings.pointTo,
              ...(selectedGameType === 'weight' && {
                weightLimit: settings.weightLimit,
                weightUnit: settings.weightUnit,
                gameMode: settings.gameMode,
              }),
              ...(selectedGameType === 'random' && {
                pointAward: settings.pointAward,
                isRepeat: settings.isRepeat,
              }),
            },
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add game');

      setShowGameSettings(false);
      await loadGames();
    } catch (err: any) {
      setError(err.message || 'Failed to add game');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#154c79',
      active: '#147834',
      completed: '#7e3c3c',
    };
    return colors[status] || '#154c79';
  };

  if (!currentRoom?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        <div className="bg-blue-600 text-white px-3 py-3 sm:p-4 flex items-center gap-2 sm:gap-4 sticky top-0 z-10 safe-area-inset-top">
          <button
            onClick={() => router.push('/admin/home')}
            className="p-2 hover:bg-blue-700 rounded active:bg-blue-800 flex-shrink-0 touch-manipulation"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold flex-1 truncate">Games Management</h1>
        </div>
        <div className="flex-1 px-4 py-6 sm:p-4 flex items-center justify-center">
          <div className="text-center text-gray-600 text-sm sm:text-base">
            Please create or select a room first.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        <div className="bg-blue-600 text-white px-3 py-3 sm:p-4 flex items-center gap-2 sm:gap-4 sticky top-0 z-10 safe-area-inset-top">
          <button
            onClick={() => router.push('/admin/home')}
            className="p-2 hover:bg-blue-700 rounded active:bg-blue-800 flex-shrink-0 touch-manipulation"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-bold flex-1 truncate">Games Management</h1>
        </div>
        <div className="flex-1 px-4 py-6 sm:p-4 flex items-center justify-center">
          <div className="text-center text-gray-600 text-sm sm:text-base">
            Loading games...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-blue-600 text-white px-3 py-3 sm:p-4 flex items-center gap-2 sm:gap-4 sticky top-0 z-10 safe-area-inset-top">
        <button
          onClick={() => router.push('/admin/home')}
          className="p-2 hover:bg-blue-700 rounded active:bg-blue-800 flex-shrink-0 touch-manipulation"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold flex-1 truncate">Games Management</h1>
      </div>

      <div className="flex-1 px-3 py-4 sm:p-4 overflow-auto">
        <div className="max-w-4xl mx-auto w-full">

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <button
          onClick={() => {
            console.log('Add Game button clicked, setting showGameSelector to true');
            setShowGameSelector(true);
          }}
          className="w-full sm:w-auto mb-4 sm:mb-6 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base touch-manipulation"
        >
          + Add Game
        </button>

        {games.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No games yet. Create a game to get started.
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {games.map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div
                  className="h-1 sm:h-2"
                  style={{ backgroundColor: getStatusColor(game.status) }}
                ></div>

                <div className="p-3 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                      {game.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Type: <span className="font-medium">{game.type}</span> | Status: <span className="font-medium">{game.status}</span>
                    </p>
                  </div>

                  <div className="flex gap-1 sm:gap-2 flex-wrap justify-end w-full sm:w-auto">
                    {game.status === 'pending' && (
                      <button
                        onClick={() => handleGameControlClick(game)}
                        title="Configure & Start Game"
                        className="p-2 sm:p-2.5 bg-green-100 text-green-600 rounded active:bg-green-200 hover:bg-green-200 transition-colors touch-manipulation flex-shrink-0"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                    
                    {game.status === 'active' && (
                      <button
                        onClick={() => handleGameControlClick(game)}
                        title="View Game Control"
                        className="p-2 sm:p-2.5 bg-blue-100 text-blue-600 rounded active:bg-blue-200 hover:bg-blue-200 transition-colors touch-manipulation flex-shrink-0"
                      >
                        <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}

                    {game.status === 'active' && game.type === 'weight' && (
                      <button
                        onClick={() => handleMoveToStep2(game)}
                        title="Move to Step 2"
                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-100 text-purple-600 rounded active:bg-purple-200 hover:bg-purple-200 transition-colors text-xs sm:text-sm font-medium touch-manipulation flex-shrink-0"
                      >
                        Step 2
                      </button>
                    )}
                    
                    <button
                      title="Delete Game"
                      onClick={() => handleDeleteGame(game.id)}
                      className="p-2 sm:p-2.5 bg-red-100 text-red-600 rounded active:bg-red-200 hover:bg-red-200 transition-colors touch-manipulation flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Selector Modal - rendered at top level */}
      <GameSelectorModal
        isOpen={showGameSelector}
        onClose={() => {
          setShowGameSelector(false);
        }}
        onSelectGame={(gameType) => {
          setSelectedGameType(gameType);
          setShowGameSelector(false);
          setShowGameSettings(true);
        }}
      />

      {/* Game Settings Modal - rendered at top level */}
      <GameSettingsModal
        isOpen={showGameSettings}
        gameType={selectedGameType}
        onClose={() => setShowGameSettings(false)}
        onSave={handleSaveGameSettings}
        globalSettings={currentRoom ? {
          pointMode: currentRoom.pointMode || 'mode1',
          pointFrom: currentRoom.pointFrom || 10,
          pointTo: currentRoom.pointTo || 1,
        } : {
          pointMode: 'mode1',
          pointFrom: 10,
          pointTo: 1,
        }}
      />

      {/* Game Control Modal - for managing active game */}
      {selectedGame && (
        <GameControlModal
          isOpen={showGameControl}
          gameId={selectedGame.id}
          roomId={currentRoom?.id || ''}
          gameName={selectedGame.name}
          gameType={selectedGame.type}
          currentStatus={selectedGame.status}
          players={players}
          onClose={handleGameControlClose}
          onStatusChange={handleGameStatusChange}
          onGameComplete={() => {
            handleGameControlClose();
          }}
        />
      )}
      </div>
    </div>
  );
}
