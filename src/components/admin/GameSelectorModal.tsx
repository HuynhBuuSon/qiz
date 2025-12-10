'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface GameSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (gameType: string) => void;
}

const AVAILABLE_GAMES = [
  {
    id: 'weight',
    name: 'Weight Game',
    description: 'Players report start and end weight. Rank by weight lost.',
    icon: '⚖️',
  },
  {
    id: 'random',
    name: 'Random Game',
    description: 'Admin spins wheel to pick random players. Can reward/punish.',
    icon: '🎡',
  },
];

export default function GameSelectorModal({
  isOpen,
  onClose,
  onSelectGame,
}: GameSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4"
        style={{
          position: 'relative',
          zIndex: 10000,
        }}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Select Game Type</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {AVAILABLE_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                onSelectGame(game.id);
                onClose();
              }}
              className="w-full p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{game.icon}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{game.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{game.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
