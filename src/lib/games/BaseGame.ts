/**
 * Base Game Class
 * All games should extend this class to ensure consistency
 */

import { GameBaseSettings, GameResult, PointMode } from './types';

export abstract class BaseGame {
  protected gameId: string;
  protected settings: GameBaseSettings;
  protected results: GameResult[] = [];

  constructor(gameId: string, settings: GameBaseSettings) {
    this.gameId = gameId;
    this.settings = settings;
  }

  /**
   * Calculate points based on point mode
   * Mode 1: -1 per rank (1st = max, 2nd = max-1, etc)
   * Mode 2: Proportional (distributed across range)
   */
  protected calculatePoints(rank: number, totalPlayers: number): number {
    const { pointMode, pointFrom, pointTo } = this.settings;
    const maxPoints = Math.max(pointFrom, pointTo);
    const minPoints = Math.min(pointFrom, pointTo);

    if (pointMode === PointMode.MODE_1) {
      // Mode 1: -1 per rank
      const points = maxPoints - (rank - 1);
      return Math.max(points, minPoints);
    } else if (pointMode === PointMode.MODE_2) {
      // Mode 2: Proportional distribution
      const ranksBelow = totalPlayers - rank;
      const totalRange = maxPoints - minPoints;
      const proportionalPoints = minPoints + (ranksBelow / (totalPlayers - 1)) * totalRange;
      return Math.round(proportionalPoints);
    }

    return minPoints;
  }

  /**
   * Get current game results
   */
  getResults(): GameResult[] {
    return this.results.sort((a, b) => a.rank - b.rank);
  }

  /**
   * Abstract methods that each game must implement
   */
  abstract startGame(): Promise<void>;
  abstract endGame(): Promise<GameResult[]>;
  abstract updateGameState(data: any): Promise<void>;
}
