'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Gamepad2, Settings, LogOut } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  initialTab?: 'home' | 'games' | 'settings';
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'home' | 'games' | 'settings'>(
    'home'
  );

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1">{children}</div>

      <div className="bg-white border-t border-gray-200 sticky bottom-0">
        <div className="flex gap-4 p-4 max-w-6xl mx-auto justify-around">
          <button
            onClick={() => {
              setActiveTab('home');
              router.push('/admin/home');
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
              setActiveTab('games');
              router.push('/admin/games');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded ${
              activeTab === 'games'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Gamepad2 className="w-6 h-6" />
            <span className="text-xs">Games</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              router.push('/admin/settings');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded ${
              activeTab === 'settings'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
