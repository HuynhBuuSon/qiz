'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface GameSettingsModalProps {
  isOpen: boolean;
  gameType: string;
  onClose: () => void;
  onSave: (settings: any) => void;
  globalSettings: {
    pointMode: string;
    pointFrom: number;
    pointTo: number;
  };
}

export default function GameSettingsModal({
  isOpen,
  gameType,
  onClose,
  onSave,
  globalSettings,
}: GameSettingsModalProps) {
  const [gameName, setGameName] = useState(`${gameType} Game`);
  const [pointMode, setPointMode] = useState(globalSettings.pointMode);
  const [pointFrom, setPointFrom] = useState(globalSettings.pointFrom);
  const [pointTo, setPointTo] = useState(globalSettings.pointTo);

  // Weight game specific
  const [weightLimitFrom, setWeightLimitFrom] = useState(0);
  const [weightLimitTo, setWeightLimitTo] = useState(100);
  const [weightUnit, setWeightUnit] = useState('kg');
  const [gameMode, setGameMode] = useState('most');

  // Random game specific
  const [pointAward, setPointAward] = useState(10);
  const [isRepeat, setIsRepeat] = useState(false);

  const handleSave = () => {
    const settings: any = {
      gameName,
      pointMode,
      pointFrom,
      pointTo,
    };

    if (gameType === 'weight') {
      settings.weightLimit = { from: weightLimitFrom, to: weightLimitTo };
      settings.weightUnit = weightUnit;
      settings.gameMode = gameMode;
    } else if (gameType === 'random') {
      settings.pointAward = pointAward;
      settings.isRepeat = isRepeat;
    }

    onSave(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999,
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          position: 'relative',
          zIndex: 10000,
        }}
      >
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">
            {gameType === 'weight' ? 'Weight Game' : 'Random Game'} Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Settings */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Basic Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game Name
                </label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Point Settings */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Point Settings</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Point Mode
                </label>
                <select
                  value={pointMode}
                  onChange={(e) => setPointMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mode1">Mode 1: -1 per rank</option>
                  <option value="mode2">Mode 2: Proportional</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Point From
                  </label>
                  <input
                    type="number"
                    value={pointFrom}
                    onChange={(e) => setPointFrom(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Point To
                  </label>
                  <input
                    type="number"
                    value={pointTo}
                    onChange={(e) => setPointTo(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weight Game Specific Settings */}
          {gameType === 'weight' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Weight Game Settings</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight From
                    </label>
                    <input
                      type="number"
                      value={weightLimitFrom}
                      onChange={(e) => setWeightLimitFrom(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight To
                    </label>
                    <input
                      type="number"
                      value={weightLimitTo}
                      onChange={(e) => setWeightLimitTo(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight Unit
                  </label>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="g">Gram (g)</option>
                    <option value="kg">Kilogram (kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Game Mode
                  </label>
                  <select
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="most">Most Weight Lost</option>
                    <option value="least">Least Weight Lost</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Random Game Specific Settings */}
          {gameType === 'random' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Random Game Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Point Award
                  </label>
                  <input
                    type="number"
                    value={pointAward}
                    onChange={(e) => setPointAward(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRepeat}
                    onChange={(e) => setIsRepeat(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Allow Player Repeat (same player can be selected multiple times)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
