'use client';

import { useState, useEffect } from 'react';
import { X, Play, Square } from 'lucide-react';
import WeightGameComponent from '@/components/WeightGameComponent';
import RandomGameComponent from '@/components/RandomGameComponent';

interface GameControlModalProps {
  isOpen: boolean;
  gameId: string;
  roomId: string;
  gameName: string;
  gameType: string;
  currentStatus: 'pending' | 'active' | 'completed';
  players: any[];
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onGameComplete?: () => void;
}

export default function GameControlModal({
  isOpen,
  gameId,
  roomId,
  gameName,
  gameType,
  currentStatus,
  players,
  onClose,
  onStatusChange,
  onGameComplete,
}: GameControlModalProps) {
  const [weightGameStep, setWeightGameStep] = useState<'settings' | 'step1' | 'step2' | 'ended'>('settings');
  const [randomGameStep, setRandomGameStep] = useState<'settings' | 'spinning' | 'actions' | 'ended'>('settings');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set initial step based on status
      if (currentStatus === 'pending') {
        setWeightGameStep('settings');
        setRandomGameStep('settings');
      } else if (currentStatus === 'active') {
        setWeightGameStep('step1');
        setRandomGameStep('spinning');
      } else if (currentStatus === 'completed') {
        setWeightGameStep('ended');
        setRandomGameStep('ended');
      }
    }
  }, [isOpen, currentStatus]);

  const handleWeightGameStepChange = (step: string) => {
    setWeightGameStep(step as any);
  };

  const handleRandomGameStepChange = (step: string) => {
    setRandomGameStep(step as any);
  };

  const handleGameComplete = () => {
    if (gameType === 'weight') {
      setWeightGameStep('ended');
    } else {
      setRandomGameStep('ended');
    }
    onStatusChange('completed');
    onGameComplete?.();
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
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          position: 'relative',
          zIndex: 10000,
        }}
      >
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{gameName}</h2>
            <p className="text-sm text-gray-600">Type: {gameType} | Status: {currentStatus}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {gameType === 'weight' && (
            <WeightGameComponent
              gameId={gameId}
              roomId={roomId}
              isAdmin={true}
              currentStep={weightGameStep}
              players={players}
              onStepChange={handleWeightGameStepChange}
              onGameComplete={handleGameComplete}
            />
          )}

          {gameType === 'random' && (
            <RandomGameComponent
              gameId={gameId}
              roomId={roomId}
              isAdmin={true}
              currentStep={randomGameStep}
              onStepChange={handleRandomGameStepChange}
              onGameComplete={handleGameComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
