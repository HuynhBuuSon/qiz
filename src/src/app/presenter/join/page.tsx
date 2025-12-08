'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function PresenterJoin() {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState('');
  const [presentationCode, setPresentationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!roomNumber || !presentationCode) {
        setError('Please fill in all fields');
        return;
      }

      // TODO: Implement actual API call
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
                Room Number
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Enter room code"
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
