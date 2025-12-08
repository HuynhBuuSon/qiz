// Random Game Spin Logic

export function getRandomPlayer(
  players: Array<{ id: string; name: string }>,
  previousWinners: string[] = []
): string {
  // Filter out previous winners if isRepeat = false
  const available = players.filter(p => !previousWinners.includes(p.id));
  
  if (available.length === 0) {
    throw new Error('No available players left');
  }

  // Random selection
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex].id;
}

export interface SpinResult {
  selectedPlayerId: string;
  selectedPlayerName: string;
  spinDuration: number; // in ms
}

export function simulateSpin(players: any[], previousWinners: string[]): SpinResult {
  const selectedId = getRandomPlayer(players, previousWinners);
  const selectedPlayer = players.find(p => p.id === selectedId);

  return {
    selectedPlayerId: selectedId,
    selectedPlayerName: selectedPlayer?.name || 'Unknown',
    spinDuration: 3000, // 3 second spin animation
  };
}

export async function applyAdminAction(
  gameId: string,
  roomId: string,
  playerId: string,
  action: 'reward' | 'punish' | 'nothing',
  pointAward: number,
  pointMode: 1 | 2,
  totalPlayers: number,
  pointFrom: number,
  pointTo: number
) {
  let pointsToAdd = 0;

  if (action === 'reward') {
    pointsToAdd = pointAward;
  } else if (action === 'punish') {
    pointsToAdd = -pointAward;
  } else {
    pointsToAdd = 0;
  }

  // Get current player score
  const playerResponse = await fetch(
    `/api/rooms/${roomId}/players/${playerId}`
  );
  const player = await playerResponse.json();
  const currentScore = player.score || 0;
  const newScore = currentScore + pointsToAdd;

  // Update player score
  await fetch(
    `/api/rooms/${roomId}/players/${playerId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: newScore }),
    }
  );

  // Store winner record
  await fetch(
    `/api/rooms/${roomId}/games/${gameId}/random/winner`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId,
        action,
        pointsAwarded: pointsToAdd,
      }),
    }
  );

  return { success: true, newScore };
}

export async function calculateRandomGameResults(
  gameId: string,
  roomId: string,
  pointMode: 1 | 2,
  pointFrom: number,
  pointTo: number
) {
  // Get all winners from this game
  const winnersResponse = await fetch(
    `/api/rooms/${roomId}/games/${gameId}/random/winners`
  );
  const winners = await winnersResponse.json();

  // Get all players
  const playersResponse = await fetch(
    `/api/rooms/${roomId}/players`
  );
  const players = await playersResponse.json();

  // Sort by score descending and assign final ranks
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Update ranks
  for (let i = 0; i < sorted.length; i++) {
    await fetch(
      `/api/rooms/${roomId}/players/${sorted[i].id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank: i + 1 }),
      }
    );
  }

  return { success: true, ranked: sorted };
}
