'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { ArrowLeft } from 'lucide-react';

export default function PlayerJoin() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setPlayerId = useGameStore((state) => state.setPlayerId);
  const setRoomId = useGameStore((state) => state.setRoomId);
  const setCurrentRoom = useGameStore((state) => state.setCurrentRoom);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!playerName || !roomNumber || !joinCode) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // 1. Get all rooms and find matching room by code
      const roomsResponse = await fetch('/api/rooms');
      if (!roomsResponse.ok) throw new Error('Failed to fetch rooms');
      
      const rooms = await roomsResponse.json();
      const room = rooms.find((r: any) => r.join_code === joinCode || r.id === roomNumber);
      
      if (!room) {
        setError('Invalid room code or room number');
        setLoading(false);
        return;
      }

      // 2. Add player to room
      const playerResponse = await fetch(
        `/api/rooms/${room.id}/players`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: playerName }),
        }
      );

      if (!playerResponse.ok) {
        const errorData = await playerResponse.json();
        throw new Error(errorData.error || 'Failed to join room');
      }

      const player = await playerResponse.json();

      // 3. Store in Zustand + localStorage
      setPlayerId(player.id);
      setRoomId(room.id);
      setCurrentRoom(room);

      // Navigate to player home
      router.push('/player/game');
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white mb-6 hover:opacity-80"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Join Room</h1>
          <p className="text-gray-600 mb-6">Enter your details to join a game</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Number
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter room code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Join Code
              </label>
              <input
                type="password"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter join code"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors mt-6"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
