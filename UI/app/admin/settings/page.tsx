'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { useDataRecovery } from '@/hooks/useDataRecovery';
import { Copy, Check, ArrowLeft } from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function AdminSettings() {
  const router = useRouter();
  const { isReady, currentRoom } = useDataRecovery('admin');
  
  const [mainColor, setMainColor] = useState(
    currentRoom?.mainColor || '#3b82f6'
  );
  const [colorFrom, setColorFrom] = useState(
    currentRoom?.colorFrom || '#3b82f6'
  );
  const [colorTo, setColorTo] = useState(
    currentRoom?.colorTo || '#1e40af'
  );
  const [message, setMessage] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${currentRoom?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorFrom,
          colorTo,
        }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to save settings');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isReady || !currentRoom) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-50 p-4">
        <div className="max-w-md mx-auto w-full flex items-center justify-center">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-blue-600 text-white p-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => router.push('/admin/home')}
          className="p-2 hover:bg-blue-700 rounded flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-xl font-bold">Room Settings</h1>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-2xl mx-auto w-full">
          <p className="text-gray-600 mb-6">Manage your game room configuration</p>

        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Room Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Room Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm mb-1">Room Name</p>
              <p className="text-lg font-semibold text-gray-800">{currentRoom.name}</p>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-1">Room ID</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-gray-800">
                  {currentRoom.id?.substring(0, 12)}...
                </p>
                <button
                  onClick={() => handleCopy(currentRoom.id, 'roomId')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {copiedField === 'roomId' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-1">Join Code</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold text-blue-600">
                  {currentRoom.joinCode}
                </p>
                <button
                  onClick={() => handleCopy(currentRoom.joinCode, 'joinCode')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {copiedField === 'joinCode' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-1">Presentation Code</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold text-purple-600">
                  {currentRoom.presentationCode}
                </p>
                <button
                  onClick={() => handleCopy(currentRoom.presentationCode, 'presentCode')}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {copiedField === 'presentCode' ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-1">Max Players</p>
              <p className="text-lg font-semibold text-gray-800">
                {currentRoom.maxPlayers} players
              </p>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-1">Point Mode</p>
              <p className="text-lg font-semibold text-gray-800">
                {parseInt(currentRoom.pointMode as any) === 1 ? 'Mode 1 (Linear)' : 'Mode 2 (Proportional)'}
              </p>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-1">Point Range</p>
              <p className="text-lg font-semibold text-gray-800">
                {currentRoom.pointFrom} to {currentRoom.pointTo}
              </p>
            </div>

            <div>
              <p className="text-gray-600 text-sm mb-1">Created By</p>
              <p className="text-sm font-mono text-gray-800">
                {currentRoom.createdBy?.substring(0, 12)}...
              </p>
            </div>
          </div>
        </div>

        {/* Color Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Color Settings</h2>
          <p className="text-gray-600 text-sm mb-6">
            Customize the colors used for your game display
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Main Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={mainColor}
                  onChange={(e) => setMainColor(e.target.value)}
                  className="w-20 h-12 rounded cursor-pointer border-2 border-gray-300"
                />
                <div>
                  <p className="text-sm text-gray-600">Color Value</p>
                  <p className="text-lg font-mono font-semibold text-gray-800">
                    {mainColor}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gradient Start Color (Color From)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={colorFrom}
                  onChange={(e) => setColorFrom(e.target.value)}
                  className="w-20 h-12 rounded cursor-pointer border-2 border-gray-300"
                />
                <div>
                  <p className="text-sm text-gray-600">For Best Rank (1st)</p>
                  <p className="text-lg font-mono font-semibold text-gray-800">
                    {colorFrom}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gradient End Color (Color To)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={colorTo}
                  onChange={(e) => setColorTo(e.target.value)}
                  className="w-20 h-12 rounded cursor-pointer border-2 border-gray-300"
                />
                <div>
                  <p className="text-sm text-gray-600">For Worst Rank (Last)</p>
                  <p className="text-lg font-mono font-semibold text-gray-800">
                    {colorTo}
                  </p>
                </div>
              </div>
            </div>

            {/* Gradient Preview */}
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm font-medium text-gray-700 mb-3">Gradient Preview</p>
              <div
                className="w-full h-12 rounded"
                style={{
                  background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
                }}
              ></div>
            </div>

            <button
              onClick={handleSave}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
