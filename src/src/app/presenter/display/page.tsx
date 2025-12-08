'use client';

import { useState, useEffect } from 'react';
import useGameStore from '@/store/gameStore';
import { getColorForRank } from '@/lib/utils/helpers';

export default function PresenterDisplay() {
  const players = useGameStore((state) => state.players);
  const currentRoom = useGameStore((state) => state.currentRoom);
  const [sortedPlayers, setSortedPlayers] = useState(players);

  useEffect(() => {
    // Sort by rank
    const sorted = [...players].sort(
      (a, b) => (a.rank || Infinity) - (b.rank || Infinity)
    );
    setSortedPlayers(sorted);
  }, [players]);

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          {currentRoom?.name || 'Game Presentation'}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedPlayers.map((player) => {
            const color = getColorForRank(
              player.rank || 999,
              players.length,
              currentRoom?.colorFrom || '#3b82f6',
              currentRoom?.colorTo || '#1e40af'
            );

            return (
              <div
                key={player.id}
                className="rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform"
                style={{ backgroundColor: color }}
              >
                <div className="p-6 h-full flex flex-col justify-center">
                  <div className="text-6xl font-bold mb-4 text-center">
                    {player.rank || '-'}
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-2xl font-semibold">
                      {player.id}
                    </p>
                    <p className="text-xl opacity-90">{player.name}</p>
                    <p className="text-lg font-bold mt-4">
                      {player.score} points
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {players.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400">Waiting for players...</p>
          </div>
        )}
      </div>
    </div>
  );
}
