/**
 * Random Game Logic
 * Game where admin spins a wheel to pick random players
 * Admin can reward, punish, or do nothing for selected player
 */

import { BaseGame } from './BaseGame';
import { RandomGameSettings, RandomWinner, GameResult } from './types';

export class RandomGameLogic extends BaseGame {
  protected settings: RandomGameSettings;
  protected winners: Map<string, RandomWinner> = new Map();
  protected selectedPlayerIds: Set<string> = new Set(); // Already selected players (if !isRepeat)

  constructor(gameId: string, settings: RandomGameSettings) {
    super(gameId, settings);
    this.settings = settings;
  }

  /**
   * Get list of available players for spinner
   * Excludes already selected players if isRepeat = false
   */
  getAvailablePlayers(allPlayerIds: string[]): string[] {
    if (this.settings.isRepeat) {
      return allPlayerIds;
    }
    return allPlayerIds.filter((id) => !this.selectedPlayerIds.has(id));
  }

  /**
   * Spin wheel - randomly pick a player from available players
   * Returns the selected player ID or null if no players available
   */
  spinWheel(availablePlayerIds: string[]): string | null {
    if (availablePlayerIds.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availablePlayerIds.length);
    const selectedPlayerId = availablePlayerIds[randomIndex];

    // Mark as selected if not repeating
    if (selectedPlayerId && !this.settings.isRepeat) {
      this.selectedPlayerIds.add(selectedPlayerId);
    }

    return selectedPlayerId;
  }


  /**
   * Apply admin action to selected player
   * Updates player score based on action
   */
  calculatePointsAwarded(action: 'reward' | 'punish' | 'nothing'): number {
    switch (action) {
      case 'reward':
        return this.settings.pointAward;
      case 'punish':
        return -this.settings.pointAward;
      case 'nothing':
        return 0;
    }
  }

  /**
   * Check if a player has already been selected
   */
  isPlayerAlreadySelected(playerId: string): boolean {
    return this.selectedPlayerIds.has(playerId);
  }

  /**
   * Record a winner selection
   */
  recordWinner(winner: RandomWinner): void {
    this.winners.set(winner.playerId, winner);
  }

  /**
   * Get all recorded winners
   */
  getWinners(): RandomWinner[] {
    return Array.from(this.winners.values());
  }

  /**
   * End game and calculate final rankings
   */
  async endGame(): Promise<GameResult[]> {
    // Calculate final ranks based on points
    const sortedResults = this.results
      .slice()
      .sort((a, b) => b.pointsEarned - a.pointsEarned);

    // Assign ranks
    sortedResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    this.results = sortedResults;
    return this.getResults();
  }

  /**
   * Get current game state
   */
  getGameState() {
    return {
      gameId: this.gameId,
      settings: this.settings,
      winners: Array.from(this.winners.values()),
      selectedPlayerIds: Array.from(this.selectedPlayerIds),
      results: this.results,
    };
  }

  /**
   * Start game (admin only)
   */
  async startGame(): Promise<void> {
    console.log(`Random Game ${this.gameId} started`);
  }

  /**
   * Update game state during gameplay
   */
  async updateGameState(data: any): Promise<void> {
    console.log(`Random Game ${this.gameId} state updated:`, data);
  }
}


