'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import useGameStore from '@/store/gameStore';
import { toCamelCase } from '@/lib/utils/helpers';

function PresenterJoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [roomNumber, setRoomNumber] = useState('');
  const [presentationCode, setPresentationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setCurrentRoom = useGameStore((state) => state.setCurrentRoom);
  const setUserRole = useGameStore((state) => state.setUserRole);

  // Load room number and presentation code from URL parameters
  useEffect(() => {
    const urlRoomNumber = searchParams.get('room');
    const urlPresentationCode = searchParams.get('code');
    
    if (urlRoomNumber) {
      setRoomNumber(urlRoomNumber);
    }
    if (urlPresentationCode) {
      setPresentationCode(urlPresentationCode);
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate inputs
      if (!roomNumber.trim() && !presentationCode.trim()) {
        setError('Either room number or presentation code is required');
        setLoading(false);
        return;
      }

      // Fetch rooms and find matching code
      const roomsResponse = await fetch('/api/rooms');
      if (!roomsResponse.ok) {
        throw new Error('Failed to connect to server');
      }

      const rooms = await roomsResponse.json();
      let room = null;

      if (roomNumber.trim()) {
        room = rooms.find((r: any) => r.room_number === parseInt(roomNumber));
      }
      
      if (!room && presentationCode.trim()) {
        room = rooms.find((r: any) => r.presentation_code === presentationCode);
      }

      if (!room) {
        setError('Room not found. Please check and try again.');
        setLoading(false);
        return;
      }

      // Verify presentation code if provided
      if (presentationCode.trim() && room.presentation_code !== presentationCode) {
        setError('Invalid presentation code. Access denied.');
        setLoading(false);
        return;
      }

      // Convert and store room data
      const convertedRoom = toCamelCase(room);
      setUserRole('presenter');
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
                Room Number (4-digit)
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="e.g., 1234"
                disabled={loading}
                maxLength={4}
              />
              <p className="text-xs text-gray-500 mt-1">Or use presentation code below</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Presentation Code
              </label>
              <input
                type="text"
                value={presentationCode}
                onChange={(e) => setPresentationCode(e.target.value.toUpperCase())}
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

export default function PresenterJoin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-orange-500 to-red-600 p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">Loading...</div>
        </div>
      </div>
    }>
      <PresenterJoinContent />
    </Suspense>
  );
}
