'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';

export default function AdminSettings() {
  const router = useRouter();
  const currentRoom = useGameStore((state) => state.currentRoom);
  const setColors = useGameStore((state) => state.setColors);
  const [mainColor, setMainColor] = useState(
    currentRoom?.mainColor || '#3b82f6'
  );
  const [colorFrom, setColorFrom] = useState(
    currentRoom?.colorFrom || '#3b82f6'
  );
  const [colorTo, setColorTo] = useState(
    currentRoom?.colorTo || '#1e40af'
  );

  const handleSave = () => {
    setColors(mainColor, colorFrom, colorTo);
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 p-4">
      <div className="max-w-md mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={mainColor}
                onChange={(e) => setMainColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{mainColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color From (Gradient Start)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorFrom}
                onChange={(e) => setColorFrom(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{colorFrom}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color To (Gradient End)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorTo}
                onChange={(e) => setColorTo(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">{colorTo}</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
