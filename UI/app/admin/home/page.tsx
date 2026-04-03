'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { useDataRecovery } from '@/hooks/useDataRecovery';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { toCamelCase, getPlayerDisplayId } from '@/lib/utils/helpers';
import { API_URL } from '@/lib/config';
import { Gamepad2, Settings, LogOut, ArrowRight } from 'lucide-react';
import AdminDashboardHeader from '@/components/admin/AdminDashboardHeader';
import PlayerPopup from '@/components/PlayerPopup';

export default function AdminHome() {
  const router = useRouter();
  const { isReady, currentRoom } = useDataRecovery('admin');
  const reset = useGameStore((state) => state.reset);
  
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeGame, setActiveGame] = useState<any>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const loadPlayers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${currentRoom?.id}/players`);
      if (!response.ok) throw new Error('Failed to load players');
      const data = await response.json();
      setPlayers(Array.isArray(data) ? data.map(toCamelCase) : []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentRoom?.id]);

  const loadActiveGame = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${currentRoom?.id}/games`);
      if (!response.ok) return;
      const games = await response.json();
      // Find the active game
      const gamesArray = Array.isArray(games) ? games.map(toCamelCase) : [];
      const active = gamesArray.find((g: any) => g.status === 'active');
      setActiveGame(active || null);
    } catch (err: any) {
      console.error('Failed to load games:', err);
    }
  }, [currentRoom?.id]);

  // Set up real-time updates after all functions are defined
  useEffect(() => {
    // Use a small timer to ensure we don't redirect too early during hydration
    const timer = setTimeout(() => {
      if (!isReady || !currentRoom?.id) {
        setShouldRedirect(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isReady, currentRoom?.id]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/admin/create');
    }
  }, [shouldRedirect, router]);

  useEffect(() => {
    if (!isReady || !currentRoom?.id) {
      return;
    }

    // Initial load
    loadPlayers();
    loadActiveGame();
  }, [isReady, currentRoom?.id, loadPlayers, loadActiveGame]);

  // Real-time updates for players
  useRealTimeUpdates({
    roomId: currentRoom?.id,
    eventName: 'players:update',
    fetchCallback: loadPlayers,
    pollingInterval: 3000,
    enabled: Boolean(isReady && currentRoom?.id),
  });

  // Real-time updates for active game
  useRealTimeUpdates({
    roomId: currentRoom?.id,
    eventName: 'game:update',
    fetchCallback: loadActiveGame,
    pollingInterval: 3000,
    enabled: Boolean(isReady && currentRoom?.id),
  });

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
      <div className="flex-1 p-4 overflow-auto pb-24">
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
                    onClick={() => router.push('/admin/games')}
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
                        ID: {getPlayerDisplayId(player.sequenceNumber)}
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
      </div>

      {/* Footer Navigation */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="flex gap-4 p-4 max-w-6xl mx-auto justify-end">
          <button
            onClick={() => router.push('/admin/games')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
          >
            <Gamepad2 className="w-5 h-5" />
            Games
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/admin/settings')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
          >
            <Settings className="w-5 h-5" />
            Settings
            <ArrowRight className="w-4 h-4" />
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
