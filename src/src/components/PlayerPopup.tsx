'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface PlayerPopupProps {
  player: {
    id: string;
    name: string;
    score: number;
    rank: number;
    isScoreHidden: boolean;
    isRankHidden: boolean;
  };
  roomId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PlayerPopup({
  player,
  roomId,
  onClose,
  onUpdate,
}: PlayerPopupProps) {
  const [formData, setFormData] = useState({
    name: player.name,
    score: player.score,
    rank: player.rank,
    isScoreHidden: player.isScoreHidden,
    isRankHidden: player.isRankHidden,
    startWeight: (player as any).startWeight || null,
    endWeight: (player as any).endWeight || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/players/${player.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            score: formData.score,
            rank: formData.rank,
            isScoreHidden: formData.isScoreHidden,
            isRankHidden: formData.isRankHidden,
            startWeight: formData.startWeight,
            endWeight: formData.endWeight,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update player');

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Edit Player</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player ID (Read-only)
            </label>
            <input
              type="text"
              value={player.id}
              disabled
              className="w-full px-3 py-2 border rounded bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Player Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Score
            </label>
            <input
              type="number"
              value={formData.score}
              onChange={(e) =>
                setFormData({ ...formData, score: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rank
            </label>
            <input
              type="number"
              value={formData.rank}
              onChange={(e) =>
                setFormData({ ...formData, rank: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Weight
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.startWeight || ''}
              onChange={(e) =>
                setFormData({ 
                  ...formData, 
                  startWeight: e.target.value === '' ? null : parseFloat(e.target.value)
                })
              }
              placeholder="Optional"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Weight
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.endWeight || ''}
              onChange={(e) =>
                setFormData({ 
                  ...formData, 
                  endWeight: e.target.value === '' ? null : parseFloat(e.target.value)
                })
              }
              placeholder="Optional"
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isScoreHidden}
                onChange={(e) =>
                  setFormData({ ...formData, isScoreHidden: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Hide Score
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isRankHidden}
                onChange={(e) =>
                  setFormData({ ...formData, isRankHidden: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Hide Rank
              </span>
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
