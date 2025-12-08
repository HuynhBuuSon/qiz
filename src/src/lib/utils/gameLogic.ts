// Weight Game Calculation Logic

export function calculateWeightRange(
  startWeight: number, 
  endWeight: number
): number {
  return Math.abs(startWeight - endWeight);
}

export interface PlayerWeightEntry {
  playerId: string;
  startWeight: number;
  endWeight: number;
  weightRange: number;
}

export function rankPlayersByWeightRange(
  entries: PlayerWeightEntry[],
  mode: 'most' | 'least'
): Array<{ playerId: string; rank: number; weightRange: number }> {
  // Sort by weight range
  const sorted = [...entries].sort((a, b) => {
    if (mode === 'most') {
      return b.weightRange - a.weightRange; // Descending
    } else {
      return a.weightRange - b.weightRange; // Ascending
    }
  });

  // Assign ranks (handling ties)
  let currentRank = 1;
  const results: Array<{ playerId: string; rank: number; weightRange: number }> = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    
    // If same weight as previous, use same rank
    if (i > 0 && entry.weightRange === sorted[i - 1].weightRange) {
      results.push({
        playerId: entry.playerId,
        rank: results[i - 1].rank,
        weightRange: entry.weightRange,
      });
    } else {
      results.push({
        playerId: entry.playerId,
        rank: currentRank,
        weightRange: entry.weightRange,
      });
      currentRank = i + 1;
    }
  }

  return results;
}

export function calculatePointsMode1(
  rank: number,
  pointFrom: number,
  pointTo: number
): number {
  // Linear: pointTo - (rank - 1)
  // Rank 1: 100, Rank 2: 99, etc.
  return Math.max(pointFrom, pointTo - (rank - 1));
}

export function calculatePointsMode2(
  rank: number,
  pointFrom: number,
  pointTo: number,
  totalPlayers: number
): number {
  // Proportional: pointTo - ((rank - 1) * pointGap)
  // pointGap = (pointTo - pointFrom) / totalPlayers
  const pointGap = (pointTo - pointFrom) / totalPlayers;
  return Math.max(pointFrom, pointTo - (rank - 1) * pointGap);
}

// Main Weight Game Result Calculation
export async function calculateWeightGameResults(
  gameId: string,
  roomId: string,
  pointMode: 1 | 2,
  pointFrom: number,
  pointTo: number,
  weightMode: 'most' | 'least'
) {
  try {
    // 1. Get all weight entries for this game
    const entriesResponse = await fetch(
      `/api/rooms/${roomId}/games/${gameId}/weight/entries`
    );
    const entries = await entriesResponse.json();

    // 2. Calculate weight ranges
    const withRanges = entries.map((e: any) => ({
      ...e,
      weightRange: calculateWeightRange(e.startWeight, e.endWeight),
    }));

    // 3. Rank players by weight
    const ranked = rankPlayersByWeightRange(withRanges, weightMode);

    // 4. Calculate points
    const results = ranked.map(r => ({
      playerId: r.playerId,
      rank: r.rank,
      points: pointMode === 1
        ? calculatePointsMode1(r.rank, pointFrom, pointTo)
        : calculatePointsMode2(r.rank, pointFrom, pointTo, entries.length),
    }));

    // 5. Store results in game_results table
    const resultsData = results.map(r => ({
      playerId: r.playerId,
      pointsEarned: r.points,
      rank: r.rank,
    }));

    await fetch(
      `/api/rooms/${roomId}/games/${gameId}/results`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: resultsData }),
      }
    );

    // 6. Update player scores and ranks
    for (const result of results) {
      const currentScore = await getPlayerScore(roomId, result.playerId);
      await fetch(
        `/api/rooms/${roomId}/players/${result.playerId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: currentScore + result.points,
            rank: result.rank,
          }),
        }
      );
    }

    return results;
  } catch (error) {
    console.error('Error calculating weight game results:', error);
    throw error;
  }
}

async function getPlayerScore(roomId: string, playerId: string): Promise<number> {
  const response = await fetch(
    `/api/rooms/${roomId}/players/${playerId}`
  );
  const player = await response.json();
  return player.score || 0;
}
