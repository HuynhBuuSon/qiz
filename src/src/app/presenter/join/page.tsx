'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import useGameStore from '@/store/gameStore';
import { toCamelCase } from '@/lib/utils/helpers';

export default function PresenterJoin() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [presentationCode, setPresentationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setCurrentRoom = useGameStore((state) => state.setCurrentRoom);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!roomCode.trim()) {
        setError('Room code is required');
        setLoading(false);
        return;
      }

      if (!presentationCode.trim()) {
        setError('Presentation code is required');
        setLoading(false);
        return;
      }

      if (roomCode.length < 4) {
        setError('Room code must be at least 4 characters');
        setLoading(false);
        return;
      }

      if (presentationCode.length < 4) {
        setError('Presentation code must be at least 4 characters');
        setLoading(false);
        return;
      }

      // Fetch rooms and find matching code
      const roomsResponse = await fetch('/api/rooms');
      if (!roomsResponse.ok) {
        throw new Error('Failed to connect to server');
      }

      const rooms = await roomsResponse.json();
      const room = rooms.find((r: any) => 
        r.join_code === roomCode || 
        r.presentation_code === roomCode
      );

      if (!room) {
        setError('Room code not found. Please check and try again.');
        setLoading(false);
        return;
      }

      // Verify presentation code
      if (room.presentation_code !== presentationCode) {
        setError('Invalid presentation code. Access denied.');
        setLoading(false);
        return;
      }

      // Convert and store room data
      const convertedRoom = toCamelCase(room);
      setCurrentRoom(convertedRoom);

      // Redirect to presentation display
      router.push('/presenter/display');
    } catch (err: any) {
      setError(err.message || 'Failed to join as presenter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-orange-500 to-red-600 p-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white mb-6 hover:opacity-80"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Presentation Mode
          </h1>
          <p className="text-gray-600 mb-6">Join as a presentation screen</p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Enter room code"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presentation Code
              </label>
              <input
                type="password"
                value={presentationCode}
                onChange={(e) => setPresentationCode(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Enter presentation code"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white font-semibold py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors mt-6"
            >
              {loading ? 'Joining...' : 'Join as Presenter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
