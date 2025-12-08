'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { Trash2, Edit, Play, Square } from 'lucide-react';

export default function AdminGames() {
  const router = useRouter();
  const currentRoom = useGameStore((state) => state.currentRoom);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingGame, setAddingGame] = useState(false);

  useEffect(() => {
    if (currentRoom?.id) {
      loadGames();
    } else {
      setLoading(false);
    }
  }, [currentRoom]);

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms/${currentRoom?.id}/games`);
      
      if (!response.ok) throw new Error('Failed to load games');
      
      const data = await response.json();
      setGames(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

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

  const handleEndGame = async (gameId: string) => {
    try {
      const response = await fetch(
        `/api/rooms/${currentRoom?.id}/games/${gameId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' }),
        }
      );

      if (!response.ok) throw new Error('Failed to end game');
      
      loadGames();
    } catch (err: any) {
      setError(err.message || 'Failed to end game');
    }
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

  const handleAddGame = async () => {
    try {
      setAddingGame(true);
      setError('');

      // Create a new game with default settings
      const response = await fetch(
        `/api/rooms/${currentRoom?.id}/games`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Game ${games.length + 1}`,
            type: 'weight', // Default to weight game
            status: 'pending',
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add game');
      
      await loadGames();
    } catch (err: any) {
      setError(err.message || 'Failed to add game');
    } finally {
      setAddingGame(false);
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
      <div className="min-h-screen w-full flex flex-col bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Games Management
          </h1>
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Please create or select a room first.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Games Management
          </h1>
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading games...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Games Management
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleAddGame}
          disabled={addingGame}
          className="mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {addingGame ? 'Adding...' : '+ Add Game'}
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
                        onClick={() => handleStartGame(game.id)}
                        title="Start Game"
                        className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    
                    {game.status === 'active' && (
                      <button
                        onClick={() => handleEndGame(game.id)}
                        title="End Game"
                        className="p-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button
                      title="Edit Game"
                      className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteGame(game.id)}
                      title="Delete Game"
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
