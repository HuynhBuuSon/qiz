'use client';

import { useState, useEffect } from 'react';
import useGameStore from '@/store/gameStore';
import PresentationQRCode from '@/components/presenter/PresentationQRCode';
import RandomGameComponent from '@/components/RandomGameComponent';

export default function PresenterDisplay() {
  const currentRoom = useGameStore((state) => state.currentRoom);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!currentRoom?.id) {
      setLoading(false);
      return;
    }

    const loadPlayers = async () => {
      try {
        const response = await fetch(`/api/rooms/${currentRoom.id}/players`);
        if (response.ok) {
          const data = await response.json();
          setPlayers(data);
        }
      } catch (error) {
        console.error('Failed to load players:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadActiveGame = async () => {
      try {
        const response = await fetch(`/api/rooms/${currentRoom.id}/games`);
        if (response.ok) {
          const games = await response.json();
          const active = games.find((g: any) => g.status === 'active');
          setActiveGame(active || null);
        }
      } catch (error) {
        console.error('Failed to load games:', error);
      }
    };

    loadPlayers();
    loadActiveGame();
    const interval = setInterval(() => {
      loadPlayers();
      loadActiveGame();
    }, 1000); // Update every 1 second
    return () => clearInterval(interval);
  }, [currentRoom]);

  // Calculate gradient color based on rank
  const getPlayerColor = (rank: number, totalPlayers: number) => {
    if (!currentRoom) return '#3b82f6';
    
    const colorFrom = currentRoom.colorFrom || '#10b981';
    const colorTo = currentRoom.colorTo || '#1e40af';
    
    // Interpolate between colors based on rank
    const ratio = (rank - 1) / Math.max(1, totalPlayers - 1);
    
    // Parse hex colors to RGB
    const fromHex = colorFrom.replace('#', '');
    const toHex = colorTo.replace('#', '');
    
    const r1 = parseInt(fromHex.substring(0, 2), 16);
    const g1 = parseInt(fromHex.substring(2, 4), 16);
    const b1 = parseInt(fromHex.substring(4, 6), 16);
    
    const r2 = parseInt(toHex.substring(0, 2), 16);
    const g2 = parseInt(toHex.substring(2, 4), 16);
    const b2 = parseInt(toHex.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const sortedPlayers = [...players].sort(
    (a, b) => (a.rank || 999) - (b.rank || 999)
  );

  if (!currentRoom?.id) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl">Please log in as presenter first</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Room Info */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">
            {currentRoom?.name || 'Game Presentation'}
          </h1>
          
          {/* QR Code for Join */}
          <div className="max-w-sm mx-auto mb-6">
            <details className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors">
              <summary className="text-lg font-semibold text-gray-300 hover:text-white transition-colors">
                📱 Show QR Code to Join
              </summary>
              <div className="mt-4">
                <PresentationQRCode />
              </div>
            </details>
          </div>
        </div>

        {/* Active Game Component */}
        {activeGame && activeGame.type === 'random' && (
          <div className="mb-8">
            <RandomGameComponent
              gameId={activeGame.id}
              roomId={currentRoom?.id || ''}
              isAdmin={true}
              currentStep={activeGame.status === 'active' ? 'spinning' : 'ended'}
              onGameComplete={() => setActiveGame(null)}
            />
          </div>
        )}

        {/* Active Game Status */}
        {activeGame && activeGame.type !== 'random' && (
          <div className="mb-8 bg-blue-900/50 border-2 border-blue-500 rounded-lg p-6 text-center">
            <p className="text-xl font-semibold text-blue-200 mb-2">
              🎮 Active Game
            </p>
            <p className="text-3xl font-bold text-blue-300 mb-4">
              {activeGame.type === 'weight' ? '⚖️ Weight Game' : '🎡 Random Game'}
            </p>
            <p className="text-lg text-blue-200">
              {activeGame.type === 'weight'
                ? 'Players are submitting their weight changes'
                : 'Watch the spin!'}
            </p>
          </div>
        )}

        {/* Players Grid or List */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400">Loading...</p>
          </div>
        ) : sortedPlayers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400">Waiting for players to join...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {sortedPlayers.map((player) => (
              <div
                key={player.id}
                className="rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: getPlayerColor(player.rank || 999, sortedPlayers.length),
                }}
              >
                <div className="p-4 md:p-6 h-full flex flex-col justify-between">
                  <div className="text-5xl md:text-6xl font-bold text-center mb-4 opacity-90">
                    {player.rank || '—'}
                  </div>

                  <div className="text-center space-y-1 md:space-y-2">
                    <p className="text-lg md:text-2xl font-semibold truncate">
                      {player.name}
                    </p>
                    <p className="text-xs md:text-sm opacity-80 truncate">
                      ID: {player.id.substring(0, 8)}
                    </p>
                    {!player.isScoreHidden && (
                      <p className="text-2xl md:text-3xl font-bold mt-3">
                        {player.score || 0}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
