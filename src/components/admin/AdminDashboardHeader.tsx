'use client';

import useGameStore from '@/store/gameStore';
import { Users, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboardHeader() {
  const currentRoom = useGameStore((state) => state.currentRoom);
  const players = useGameStore((state) => state.players);
  const [copiedCode, setCopiedCode] = useState<'join' | 'presentation' | null>(
    null
  );

  const handleCopyCode = (code: string, type: 'join' | 'presentation') => {
    navigator.clipboard.writeText(code);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!currentRoom) {
    return null;
  }

  return (
    <div
      className="bg-gradient-to-r p-4 mb-6 rounded-lg shadow-md"
      style={{
        backgroundImage: `linear-gradient(135deg, ${currentRoom.mainColor}80, ${currentRoom.colorTo}80)`,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Room Name */}
        <div className="bg-white bg-opacity-90 rounded p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Room Name</p>
          <p className="text-lg font-bold text-gray-800">
            {currentRoom.name}
          </p>
        </div>

        {/* Room Number */}
        <div className="bg-white bg-opacity-90 rounded p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Room Number</p>
          <p className="text-lg font-mono font-bold text-gray-800">
            {currentRoom.joinCode}
          </p>
        </div>

        {/* Players Count */}
        <div className="bg-white bg-opacity-90 rounded p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Players</p>
            <p className="text-lg font-bold text-gray-800">
              {players.length} / {currentRoom.maxPlayers}
            </p>
          </div>
          <Users className="w-8 h-8 text-blue-600 opacity-50" />
        </div>

        {/* Join Code */}
        <div className="bg-white bg-opacity-90 rounded p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Join Code</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-mono font-bold text-gray-800">
              {currentRoom.joinCode}
            </p>
            <button
              onClick={() =>
                handleCopyCode(currentRoom.joinCode, 'join')
              }
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Copy join code"
            >
              {copiedCode === 'join' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Presentation Code */}
        <div className="bg-white bg-opacity-90 rounded p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            Presentation Code
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-mono font-bold text-gray-800">
              {currentRoom.presentationCode}
            </p>
            <button
              onClick={() =>
                handleCopyCode(currentRoom.presentationCode, 'presentation')
              }
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Copy presentation code"
            >
              {copiedCode === 'presentation' ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Point Mode */}
        <div className="bg-white bg-opacity-90 rounded p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">
            Point Mode
          </p>
          <p className="text-sm font-bold text-gray-800">
            {currentRoom.pointMode === 'mode1'
              ? 'Mode 1: Linear'
              : 'Mode 2: Proportional'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {currentRoom.pointFrom} - {currentRoom.pointTo} pts
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="bg-white bg-opacity-80 rounded px-3 py-2">
          <span className="font-semibold text-gray-700">Room Status: </span>
          <span
            className={`font-bold ${
              currentRoom.status === 'active'
                ? 'text-green-600'
                : 'text-gray-600'
            }`}
          >
            {currentRoom.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="bg-white bg-opacity-80 rounded px-3 py-2">
          <span className="font-semibold text-gray-700">Created: </span>
          <span className="font-mono text-gray-600">
            {new Date(currentRoom.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
