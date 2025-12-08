'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { toCamelCase } from '@/lib/utils/helpers';
import { ArrowLeft } from 'lucide-react';

export default function AdminCreate() {
  const router = useRouter();
  const setCurrentRoom = useGameStore((state) => state.setCurrentRoom);
  const [formData, setFormData] = useState({
    gameName: '',
    mainColor: '#3b82f6',
    colorFrom: '#3b82f6',
    colorTo: '#1e40af',
    joinPassCode: '',
    presentationPassCode: '',
    maxPlayers: 10,
    pointMode: 'mode1' as 'mode1' | 'mode2',
    pointFrom: 0,
    pointTo: 100,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'maxPlayers' ||
        name === 'pointFrom' ||
        name === 'pointTo'
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.gameName.trim()) {
        setError('Game name is required');
        setLoading(false);
        return;
      }

      if (formData.gameName.length < 2 || formData.gameName.length > 50) {
        setError('Game name must be between 2 and 50 characters');
        setLoading(false);
        return;
      }

      if (formData.joinPassCode.length < 1) {
        setError('Join code must be at least 1 character');
        setLoading(false);
        return;
      }

      if (formData.presentationPassCode.length < 1) {
        setError('Presentation code must be at least 1 character');
        setLoading(false);
        return;
      }

      if (formData.pointFrom >= formData.pointTo) {
        setError('Starting points must be less than ending points');
        setLoading(false);
        return;
      }

      if (formData.pointFrom < 0 || formData.pointTo < 0) {
        setError('Points cannot be negative');
        setLoading(false);
        return;
      }

      if (formData.maxPlayers < 2 || formData.maxPlayers > 100) {
        setError('Max players must be between 2 and 100');
        setLoading(false);
        return;
      }

      // POST to /api/rooms
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.gameName,
          mainColor: formData.mainColor,
          colorFrom: formData.colorFrom,
          colorTo: formData.colorTo,
          maxPlayers: formData.maxPlayers,
          pointMode: formData.pointMode,
          pointFrom: formData.pointFrom,
          pointTo: formData.pointTo,
          createdBy: '550e8400-e29b-41d4-a716-446655440000',
          join_code: formData.joinPassCode,
          presentation_code: formData.presentationPassCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create room');
      }
      
      const room = await response.json();
      
      // Convert snake_case to camelCase
      const convertedRoom = toCamelCase(room);
      
      // Save room to store
      setCurrentRoom(convertedRoom);
      
      // Redirect to admin home after successful creation
      router.push('/admin/home');
    } catch (err: any) {
      setError(err.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 p-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 mb-6 hover:text-blue-700"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="flex-1 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Game</h1>
          <p className="text-gray-600 mb-6">
            Set up your game with custom settings
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Name *
              </label>
              <input
                type="text"
                name="gameName"
                value={formData.gameName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter game name"
                required
              />
            </div>

            {/* Color Selection */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="mainColor"
                    value={formData.mainColor}
                    onChange={handleChange}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.mainColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color From
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="colorFrom"
                    value={formData.colorFrom}
                    onChange={handleChange}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.colorFrom}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color To
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="colorTo"
                    value={formData.colorTo}
                    onChange={handleChange}
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.colorTo}
                  </span>
                </div>
              </div>
            </div>

            {/* Pass Codes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Pass Code *
                </label>
                <input
                  type="text"
                  name="joinPassCode"
                  value={formData.joinPassCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter code"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Presentation Pass Code *
                </label>
                <input
                  type="text"
                  name="presentationPassCode"
                  value={formData.presentationPassCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter code"
                  required
                />
              </div>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Players
              </label>
              <select
                name="maxPlayers"
                value={formData.maxPlayers}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value={4}>4 Players</option>
                <option value={10}>10 Players</option>
                <option value={15}>15 Players</option>
                <option value={20}>20 Players</option>
                <option value={30}>30 Players</option>
                <option value={50}>50 Players</option>
              </select>
            </div>

            {/* Point Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Point Mode
              </label>
              <select
                name="pointMode"
                value={formData.pointMode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="mode1">Mode 1: -1 Point per Rank</option>
                <option value="mode2">
                  Mode 2: Proportional Point Distribution
                </option>
              </select>
            </div>

            {/* Point Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Point From
                </label>
                <input
                  type="number"
                  name="pointFrom"
                  value={formData.pointFrom}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Point To
                </label>
                <input
                  type="number"
                  name="pointTo"
                  value={formData.pointTo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors mt-8"
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
