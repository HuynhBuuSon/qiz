export const generateCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export const interpolateColor = (
  colorFrom: string,
  colorTo: string,
  ratio: number
): string => {
  const from = hexToRgb(colorFrom);
  const to = hexToRgb(colorTo);

  const r = Math.round(from.r + (to.r - from.r) * ratio);
  const g = Math.round(from.g + (to.g - from.g) * ratio);
  const b = Math.round(from.b + (to.b - from.b) * ratio);

  return rgbToHex(r, g, b);
};

export const getColorForRank = (
  rank: number,
  totalPlayers: number,
  colorFrom: string,
  colorTo: string
): string => {
  const ratio = (rank - 1) / (totalPlayers - 1 || 1);
  return interpolateColor(colorFrom, colorTo, ratio);
};

export const calculatePoints = (
  rank: number,
  totalPlayers: number,
  pointFrom: number,
  pointTo: number,
  pointMode: 'mode1' | 'mode2'
): number => {
  if (pointMode === 'mode1') {
    // Mode 1: Linear decrease by 1 point per rank
    return Math.max(pointFrom, pointTo - (rank - 1));
  } else {
    // Mode 2: Point gap = total points / players
    const pointGap = Math.round((pointTo - pointFrom) / totalPlayers);
    return Math.max(pointFrom, pointTo - (rank - 1) * pointGap);
  }
};

export const calculateRank = (
  scores: Array<{ playerId: string; score: number }>,
  ascending: boolean = false
): Array<{ playerId: string; rank: number }> => {
  // Sort by score
  const sorted = [...scores].sort((a, b) => {
    return ascending ? a.score - b.score : b.score - a.score;
  });

  const rankMap = new Map<string, number>();
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].score !== sorted[i - 1].score) {
      currentRank = i + 1;
    }
    rankMap.set(sorted[i].playerId, currentRank);
  }

  return Array.from(rankMap.entries()).map(([playerId, rank]) => ({
    playerId,
    rank,
  }));
};
