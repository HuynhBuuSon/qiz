'use client';

import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { Gamepad2, Users, Monitor } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const setUserRole = useGameStore((state) => state.setUserRole);

  const handleJoinRoom = () => {
    setUserRole('player');
    router.push('/player/join');
  };

  const handleCreateGame = () => {
    setUserRole('admin');
    router.push('/admin/create');
  };

  const handlePresentation = () => {
    setUserRole('presenter');
    router.push('/presenter/join');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Game App
          </h1>
          <p className="text-blue-100 text-lg">Interactive Gaming Platform</p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full mt-8">
          <button
            onClick={handleJoinRoom}
            className="flex items-center gap-4 w-full px-6 py-4 bg-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold text-lg text-blue-600"
          >
            <Users className="w-6 h-6" />
            <span>Join Room</span>
          </button>

          <button
            onClick={handleCreateGame}
            className="flex items-center gap-4 w-full px-6 py-4 bg-green-500 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold text-lg text-white hover:bg-green-600"
          >
            <Gamepad2 className="w-6 h-6" />
            <span>Create Game</span>
          </button>

          <button
            onClick={handlePresentation}
            className="flex items-center gap-4 w-full px-6 py-4 bg-orange-500 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold text-lg text-white hover:bg-orange-600"
          >
            <Monitor className="w-6 h-6" />
            <span>Presentation</span>
          </button>
        </div>

        <div className="mt-12 text-center text-blue-100 text-sm">
          <p>Real-time multiplayer gaming experience</p>
        </div>
      </div>
    </div>
  );
}
