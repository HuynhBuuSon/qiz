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
  protected winnerOrder: string[] = []; // Track order of winners
  protected selectedPlayerIds: Set<string> = new Set(); // Already selected players (if !isRepeat)
  protected playerNames: Map<string, string> = new Map();

  constructor(gameId: string, settings: RandomGameSettings) {
    super(gameId, settings);
    this.settings = settings;
  }

  /**
   * Initialize random game with players
   */
  initializeGame(playerIds: string[], playerNames: Map<string, string>): void {
    this.playerNames = playerNames;
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
   * Pick a random player from available players
   */
  pickRandomPlayer(availablePlayerIds: string[]): string | null {
    if (availablePlayerIds.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availablePlayerIds.length);
    return availablePlayerIds[randomIndex];
  }

  /**
   * Spin wheel - Step 2 (Select random player)
   */
  spinWheel(availablePlayerIds: string[]): string | null {
    const selectedPlayerId = this.pickRandomPlayer(availablePlayerIds);

    if (selectedPlayerId && !this.settings.isRepeat) {
      this.selectedPlayerIds.add(selectedPlayerId);
    }

    return selectedPlayerId;
  }

  /**
   * Apply admin action to selected player - Step 3
   */
  applyAdminAction(playerId: string, action: 'reward' | 'punish' | 'nothing'): void {
    const playerName = this.playerNames.get(playerId) || playerId;
    let pointsAwarded = 0;

    switch (action) {
      case 'reward':
        pointsAwarded = this.settings.pointAward;
        break;
      case 'punish':
        pointsAwarded = -this.settings.pointAward;
        break;
      case 'nothing':
        pointsAwarded = 0;
        break;
    }

    const winner: RandomWinner = {
      playerId,
      playerName,
      adminAction: action,
      pointsAwarded,
    };

    this.winners.set(playerId, winner);
    this.winnerOrder.push(playerId);
    this.results.push({
      playerId,
      playerName,
      pointsEarned: pointsAwarded,
      rank: this.winnerOrder.length,
    });
  }

  /**
   * Start game (Step 1)
   */
  async startGame(): Promise<void> {
    console.log(`Random Game ${this.gameId} started - Step 1 (Ready for spin)`);
  }

  /**
   * End game
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
   * Update game state during gameplay
   */
  async updateGameState(data: any): Promise<void> {
    const { action, playerId } = data;

    if (action === 'spin') {
      // Spinning is handled by spinWheel
    } else if (action === 'admin_action') {
      this.applyAdminAction(playerId, data.adminAction);
    }
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
   * Get spinner data for display
   */
  getSpinnerData(allPlayerIds: string[]) {
    const availablePlayers = this.getAvailablePlayers(allPlayerIds);
    return {
      players: availablePlayers.map((id) => ({
        id,
        name: this.playerNames.get(id) || id,
      })),
      isRepeat: this.settings.isRepeat,
      usedCount: this.selectedPlayerIds.size,
      totalPlayers: allPlayerIds.length,
    };
  }
}
