'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { Trash2, Edit, Play, Square } from 'lucide-react';

export default function AdminGames() {
  const router = useRouter();
  const games = useGameStore((state) => state.games);
  const removeGame = useGameStore((state) => state.removeGame);
  const [showAddForm, setShowAddForm] = useState(false);

  const statusColors: Record<string, string> = {
    pending: '#154c79',
    started: '#147834',
    completed: '#7e3c3c',
  };

  const handleAddGame = () => {
    setShowAddForm(true);
  };

  const handleDelete = (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      removeGame(gameId);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Games Management
        </h1>

        <button
          onClick={handleAddGame}
          className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Game
        </button>

        {games.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No games yet. Add a game to get started.
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
                  style={{ backgroundColor: statusColors[game.status] }}
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
                    <button className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors">
                      <Play className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors">
                      <Square className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(game.id)}
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
    </div>
  );
}
