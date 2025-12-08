'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { useDataRecovery } from '@/hooks/useDataRecovery';
import { toCamelCase } from '@/lib/utils/helpers';
import { Home, Gamepad2, Settings, LogOut } from 'lucide-react';
import AdminDashboardHeader from '@/components/admin/AdminDashboardHeader';
import PlayerPopup from '@/components/PlayerPopup';

export default function AdminHome() {
  const router = useRouter();
  const { isReady, currentRoom } = useDataRecovery('admin');
  const reset = useGameStore((state) => state.reset);
  const setCurrentRoom = useGameStore((state) => state.setCurrentRoom);
  
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'settings'>(
    'home'
  );
  
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    
    if (!currentRoom?.id) {
      router.push('/admin/create');
      return;
    }

    loadPlayers();
    loadActiveGame();
    loadGames();
    
    const interval = setInterval(() => {
      loadPlayers();
      loadActiveGame();
      loadGames();
    }, 2000); // Refresh every 2 seconds
    
    return () => clearInterval(interval);
  }, [isReady, currentRoom?.id, router]);

  const loadPlayers = async () => {
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/players`);
      if (!response.ok) throw new Error('Failed to load players');
      const data = await response.json();
      setPlayers(Array.isArray(data) ? data.map(toCamelCase) : []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadGames = async () => {
    try {
      setLoadingGames(true);
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games`);
      if (!response.ok) throw new Error('Failed to load games');
      const data = await response.json();
      setGames(Array.isArray(data) ? data.map(toCamelCase) : []);
    } catch (err: any) {
      console.error('Error loading games:', err);
    } finally {
      setLoadingGames(false);
    }
  };

  const loadActiveGame = async () => {
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games`);
      if (!response.ok) return;
      const games = await response.json();
      // Find the active game
      const gamesArray = Array.isArray(games) ? games.map(toCamelCase) : [];
      const active = gamesArray.find((g: any) => g.status === 'active');
      setActiveGame(active || null);
    } catch (err: any) {
      console.error('Failed to load games:', err);
    }
  };

  const handleAddGame = async () => {
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Game ${games.length + 1}`,
          type: 'weight',
          status: 'pending',
        }),
      });
      if (!response.ok) throw new Error('Failed to add game');
      loadGames();
    } catch (err: any) {
      setError(err.message || 'Failed to add game');
    }
  };

  const handleStartGame = async (gameId: string) => {
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (!response.ok) throw new Error('Failed to start game');
      loadGames();
      loadActiveGame();
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    }
  };

  const handleEndGame = async (gameId: string) => {
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!response.ok) throw new Error('Failed to end game');
      loadGames();
      loadActiveGame();
    } catch (err: any) {
      setError(err.message || 'Failed to end game');
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games/${gameId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete game');
      loadGames();
    } catch (err: any) {
      setError(err.message || 'Failed to delete game');
    }
  };

  const handleLogout = () => {
    reset();
    router.push('/');
  };

  // Calculate gradient color based on rank
  const getPlayerColor = (rank: number, totalPlayers: number) => {
    if (!currentRoom) return '#3b82f6';
    
    const colorFrom = currentRoom.colorFrom || '#10b981';
    const colorTo = currentRoom.colorTo || '#1e40af';
    
    // Interpolate between colors based on rank
    const ratio = (rank - 1) / Math.max(1, totalPlayers - 1);
    
    // Parse hex colors to RGB
    const fromHex = colorFrom.replace('#', '');
    const toHex = colorTo.replace('#', '');
    
    const r1 = parseInt(fromHex.substring(0, 2), 16);
    const g1 = parseInt(fromHex.substring(2, 4), 16);
    const b1 = parseInt(fromHex.substring(4, 6), 16);
    
    const r2 = parseInt(toHex.substring(0, 2), 16);
    const g2 = parseInt(toHex.substring(2, 4), 16);
    const b2 = parseInt(toHex.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const columns = Math.max(2, Math.ceil(Math.sqrt(players.length)));

  if (!currentRoom?.id) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Please create or select a room first.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'home' && (
          <div className="max-w-6xl mx-auto">
            <AdminDashboardHeader />

            {/* Active Game Section */}
            {activeGame && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-800">
                      🎮 Active Game: {activeGame.name || 'Game'}
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Type: <span className="font-semibold">{activeGame.type}</span> • 
                      Status: <span className="font-semibold">{activeGame.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => window.location.href = '/admin/games'}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                      Manage Game
                    </button>
                  </div>
                </div>
              </div>
            )}

            <h2 className="text-2xl font-bold mb-6 mt-6">Players Display</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="text-center text-gray-500">Loading players...</div>
            ) : players.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No players joined yet
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(120px, 1fr))`,
                }}
              >
                {players
                  .sort((a, b) => (a.rank || 999) - (b.rank || 999))
                  .map((player) => (
                    <div
                      key={player.id}
                      className="rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div
                        className="h-40 flex items-center justify-center text-white font-bold text-5xl transition-colors"
                        style={{
                          backgroundColor: getPlayerColor(player.rank || 999, players.length),
                        }}
                      >
                        {player.rank || '—'}
                      </div>
                      <div className="bg-white p-3">
                        <p className="font-semibold text-sm text-gray-800 truncate">
                          ID: {player.id.substring(0, 8)}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {player.name}
                        </p>
                        {!player.isScoreHidden && (
                          <p className="text-xs text-blue-600 font-semibold mt-1">
                            {player.score || 0} pts
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'games' && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Games Management</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleAddGame}
              className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Game
            </button>

            {loadingGames ? (
              <div className="text-center text-gray-500">Loading games...</div>
            ) : games.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No games yet. Create a game to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div
                      className="h-1"
                      style={{
                        backgroundColor:
                          game.status === 'active'
                            ? '#147834'
                            : game.status === 'completed'
                            ? '#7e3c3c'
                            : '#154c79',
                      }}
                    ></div>
                    <div className="p-6 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800">
                          {game.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Type: <span className="font-medium">{game.type}</span> • 
                          Status: <span className="font-medium capitalize">{game.status}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {game.status === 'pending' && (
                          <button
                            onClick={() => handleStartGame(game.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {game.status === 'active' && (
                          <button
                            onClick={() => handleEndGame(game.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium transition-colors"
                          >
                            End
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteGame(game.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Room Settings</h2>
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Room Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Room Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Name
                    </label>
                    <input
                      type="text"
                      value={currentRoom?.name || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentRoom?.id || ''}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentRoom?.id || '');
                          alert('Room ID copied!');
                        }}
                        className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Access Codes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Access Codes</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Join Code (for Players)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentRoom?.joinCode || ''}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentRoom?.joinCode || '');
                          alert('Join code copied!');
                        }}
                        className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Presentation Code (for Presenters)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentRoom?.presentationCode || ''}
                        disabled
                        className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600 font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentRoom?.presentationCode || '');
                          alert('Presentation code copied!');
                        }}
                        className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Configuration */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Game Configuration</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Players
                    </label>
                    <input
                      type="number"
                      value={currentRoom?.maxPlayers || 0}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Point Mode
                    </label>
                    <input
                      type="text"
                      value={currentRoom?.pointMode === 'mode1' ? 'Mode 1 (Linear)' : 'Mode 2 (Proportional)'}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points From
                    </label>
                    <input
                      type="number"
                      value={currentRoom?.pointFrom || 0}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points To
                    </label>
                    <input
                      type="number"
                      value={currentRoom?.pointTo || 0}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                    />
                  </div>
                </div>
              </div>

              {/* Color Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Color Settings</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Color
                    </label>
                    <div
                      className="w-full h-12 rounded border-2"
                      style={{ backgroundColor: currentRoom?.mainColor || '#3b82f6' }}
                    ></div>
                    <p className="text-xs text-gray-600 mt-1">{currentRoom?.mainColor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color From
                    </label>
                    <div
                      className="w-full h-12 rounded border-2"
                      style={{ backgroundColor: currentRoom?.colorFrom || '#10b981' }}
                    ></div>
                    <p className="text-xs text-gray-600 mt-1">{currentRoom?.colorFrom}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color To
                    </label>
                    <div
                      className="w-full h-12 rounded border-2"
                      style={{ backgroundColor: currentRoom?.colorTo || '#1e40af' }}
                    ></div>
                    <p className="text-xs text-gray-600 mt-1">{currentRoom?.colorTo}</p>
                  </div>
                </div>
              </div>

              {/* Room Stats */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Room Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">Players Joined</p>
                    <p className="text-3xl font-bold text-blue-600">{players.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">Games Created</p>
                    <p className="text-3xl font-bold text-green-600">{games.length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600">Active Games</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {games.filter((g) => g.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Menu */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="flex gap-4 p-4 max-w-6xl mx-auto justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 rounded ${
              activeTab === 'home'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('games')}
            className={`flex flex-col items-center gap-1 p-2 rounded ${
              activeTab === 'games'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-xs">Games</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 p-2 rounded ${
              activeTab === 'settings'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>

      {/* Player Popup */}
      {selectedPlayer && (
        <PlayerPopup
          player={selectedPlayer}
          roomId={currentRoom.id}
          onClose={() => setSelectedPlayer(null)}
          onUpdate={loadPlayers}
        />
      )}
    </div>
  );
}
