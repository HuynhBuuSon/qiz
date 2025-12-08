'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { Home, Gamepad2, Settings, LogOut } from 'lucide-react';
import AdminDashboardHeader from '@/components/admin/AdminDashboardHeader';
import PlayerPopup from '@/components/PlayerPopup';

export default function AdminHome() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'settings'>(
    'home'
  );

  const currentRoom = useGameStore((state) => state.currentRoom);
  const reset = useGameStore((state) => state.reset);
  
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentRoom?.id) {
      loadPlayers();
      const interval = setInterval(loadPlayers, 2000); // Refresh every 2 seconds
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  const loadPlayers = async () => {
    try {
      const response = await fetch(`/api/rooms/${currentRoom?.id}/players`);
      if (!response.ok) throw new Error('Failed to load players');
      const data = await response.json();
      setPlayers(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Games Management</h2>
            <button
              onClick={() => router.push('/admin/games')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Games
            </button>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={currentRoom?.name || ''}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Join Code
                  </label>
                  <input
                    type="text"
                    value={currentRoom?.joinCode || ''}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Presentation Code
                  </label>
                  <input
                    type="text"
                    value={currentRoom?.presentationCode || ''}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100"
                  />
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
