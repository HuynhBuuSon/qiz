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

  // Real-time updates for games
  useRealTimeUpdates({
    roomId: currentRoom?.id,
    eventName: 'games:update',
    fetchCallback: loadGames,
    pollingInterval: 1000,
    enabled: Boolean(isReady && currentRoom?.id),
  });

  // Real-time updates for players
  useRealTimeUpdates({
    roomId: currentRoom?.id,
    eventName: 'players:update',
    fetchCallback: loadPlayers,
    pollingInterval: 1000,
    enabled: Boolean(isReady && currentRoom?.id),
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
        <div className="bg-blue-600 text-white p-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => router.push('/admin/home')}
            className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold">Games Management</h1>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center text-gray-500">
            Please create or select a room first.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        <div className="bg-blue-600 text-white p-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => router.push('/admin/home')}
            className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-xl font-bold">Games Management</h1>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center text-gray-500">
            Loading games...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-blue-600 text-white p-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => router.push('/admin/home')}
          className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-xl font-bold">Games Management</h1>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-4xl mx-auto w-full">

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={() => {
            console.log('Add Game button clicked, setting showGameSelector to true');
            setShowGameSelector(true);
          }}
          className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Game
        </button>

        {games.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No games yet. Create a game to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <div
                key={game.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div
                  className="h-2"
                  style={{ backgroundColor: getStatusColor(game.status) }}
                ></div>

                <div className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {game.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Type: {game.type} | Status: {game.status}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {game.status === 'pending' && (
                      <button
                        onClick={() => handleGameControlClick(game)}
                        title="Configure & Start Game"
                        className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    
                    {game.status === 'active' && (
                      <button
                        onClick={() => handleGameControlClick(game)}
                        title="View Game Control"
                        className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    )}

                    {game.status === 'active' && game.type === 'weight' && (
                      <button
                        onClick={() => handleMoveToStep2(game)}
                        title="Move to Step 2"
                        className="px-3 py-2 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        Step 2
                      </button>
                    )}
                    
                    <button
                      title="Delete Game"
                      onClick={() => handleDeleteGame(game.id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
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
