'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { Home, Gamepad2, Settings, LogOut } from 'lucide-react';
import AdminDashboardHeader from '@/components/admin/AdminDashboardHeader';

export default function AdminHome() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'settings'>(
    'home'
  );

  const players = useGameStore((state) => state.players);
  const currentRoom = useGameStore((state) => state.currentRoom);
  const reset = useGameStore((state) => state.reset);

  const handleLogout = () => {
    reset();
    router.push('/');
  };

  const columns = Math.ceil(Math.sqrt(players.length));

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
            
            {players.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No players joined yet
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(100px, 1fr))`,
                }}
              >
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="bg-white rounded-lg shadow p-4 text-center cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      // TODO: Show player details popup
                    }}
                  >
                    <div
                      className="h-32 rounded mb-3 flex items-center justify-center text-white font-bold text-2xl"
                      style={{
                        backgroundColor:
                          player.color || currentRoom?.mainColor || '#3b82f6',
                      }}
                    >
                      {player.rank || 'N/A'}
                    </div>
                    <p className="font-semibold text-sm text-gray-800">
                      {player.id}
                    </p>
                    <p className="text-xs text-gray-600">{player.name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {player.score} pts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'games' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Games Management</h2>
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Games management to be implemented
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Settings to be implemented
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
    </div>
  );
}
