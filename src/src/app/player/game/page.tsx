'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { Home, Edit, Menu, Gamepad2 } from 'lucide-react';

interface PlayerData {
  id: string;
  name: string;
  score: number;
  rank: number;
  isScoreHidden?: boolean;
  isRankHidden?: boolean;
}

export default function PlayerGame() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'edit' | 'game'>('home');
  const [showMenu, setShowMenu] = useState(false);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<Partial<PlayerData> | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeGame, setActiveGame] = useState<any>(null);

  const playerId = useGameStore((state) => state.playerId);
  const roomId = useGameStore((state) => state.roomId);

  // Fetch player data
  useEffect(() => {
    if (!roomId || !playerId) {
      router.push('/player/join');
      return;
    }

    const fetchPlayerData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/rooms/${roomId}/players/${playerId}`
        );
        if (!response.ok) throw new Error('Failed to fetch player');
        const data = await response.json();
        setPlayer(data);
        setEditData(data);
      } catch (error) {
        console.error('Error fetching player:', error);
        setMessage('Error loading player data');
      } finally {
        setLoading(false);
      }
    };

    const fetchActiveGame = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/games`);
        if (!response.ok) return;
        const games = await response.json();
        const active = games.find((g: any) => g.status === 'active');
        setActiveGame(active || null);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchPlayerData();
    fetchActiveGame();
    
    // Auto-refresh every 2 seconds
    const interval = setInterval(() => {
      fetchPlayerData();
      fetchActiveGame();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [roomId, playerId, router]);

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
          body: JSON.stringify(editData),
        }
      );

      if (!response.ok) throw new Error('Failed to update player');

      const updatedPlayer = await response.json();
      setPlayer(updatedPlayer);
      setEditData(updatedPlayer);
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
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold">Player</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading player data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">Player</h1>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-blue-700 rounded"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`mx-4 mt-4 p-3 rounded text-sm ${
            message.includes('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'home' && player && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Player Information</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Player ID</p>
                  <p className="text-sm font-mono text-gray-800">
                    {player.id.substring(0, 8)}...
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Player Name</p>
                  <p className="text-xl font-semibold text-gray-800">
                    {player.name}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-gray-600 text-sm">Your Rank</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {player.isRankHidden ? '—' : `#${player.rank}`}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Your Points</p>
                  <p className="text-4xl font-bold text-green-600">
                    {player.isScoreHidden ? '—' : player.score}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded text-sm text-gray-700">
                  <p className="font-semibold mb-2">Current Room Status:</p>
                  <p>Room: {roomId?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit' && editData && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Player Name
                  </label>
                  <input
                    type="text"
                    value={editData.name || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editLoading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Score
                  </label>
                  <input
                    type="number"
                    value={editData.score || 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        score: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rank
                  </label>
                  <input
                    type="number"
                    value={editData.rank || 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        rank: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editLoading}
                  />
                </div>

                <div className="space-y-2 bg-gray-50 p-4 rounded">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.isScoreHidden || false}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          isScoreHidden: e.target.checked,
                        })
                      }
                      disabled={editLoading}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Hide score from others
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editData.isRankHidden || false}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          isRankHidden: e.target.checked,
                        })
                      }
                      disabled={editLoading}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Hide rank from others
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
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
                    className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:bg-gray-200 font-medium"
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
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Active Game</h2>

              {activeGame ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Game Type</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {activeGame.type === 'weight' ? '⚖️ Weight Game' : '🎡 Random Game'}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Status</p>
                    <p className="text-lg font-semibold text-green-600">
                      {activeGame.status === 'active' ? '🎮 In Progress' : activeGame.status}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Your Rank</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {player?.isRankHidden ? '—' : `#${player?.rank || '—'}`}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Your Score</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {player?.isScoreHidden ? '—' : player?.score || 0}
                    </p>
                  </div>

                  {activeGame.type === 'weight' && (
                    <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
                      <p className="text-sm text-gray-700">
                        💡 Weight game is in progress. Check your weight submission status.
                      </p>
                    </div>
                  )}

                  {activeGame.type === 'random' && (
                    <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-400">
                      <p className="text-sm text-gray-700">
                        🎡 Random spinner is active. Watch the presenter display!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-lg mb-4">😴 No active game right now</p>
                  <p className="text-gray-500 text-sm">
                    Wait for the admin to start a game...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Menu */}
      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="flex gap-4 p-4 max-w-md mx-auto justify-around">
          <button
            onClick={() => {
              setActiveTab('home');
              setShowMenu(false);
            }}
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
            onClick={() => {
              setActiveTab('game');
              setShowMenu(false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded ${
              activeTab === 'game'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-xs">Game</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('edit');
              setShowMenu(false);
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded ${
              activeTab === 'edit'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Edit className="w-6 h-6" />
            <span className="text-xs">Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
