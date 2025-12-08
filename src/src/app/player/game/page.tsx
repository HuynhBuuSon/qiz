'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { Home, Edit, Menu } from 'lucide-react';

export default function PlayerGame() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'edit'>('home');
  const [showMenu, setShowMenu] = useState(false);

  const playerId = useGameStore((state) => state.playerId);
  const roomId = useGameStore((state) => state.roomId);

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

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'home' && (
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Player Information</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Player ID</p>
                  <p className="text-xl font-semibold text-gray-800">{playerId}</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Player Name</p>
                  <p className="text-xl font-semibold text-gray-800">Player Name</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Room ID</p>
                  <p className="text-xl font-semibold text-gray-800">{roomId}</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-gray-600 text-sm">Your Rank</p>
                  <p className="text-3xl font-bold text-blue-600">-</p>
                </div>

                <div>
                  <p className="text-gray-600 text-sm">Your Points</p>
                  <p className="text-3xl font-bold text-green-600">0</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
              <p className="text-gray-600">Edit functionality to be implemented</p>
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
