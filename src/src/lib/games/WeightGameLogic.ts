/**
 * Weight Game Logic
 * Game where players report start and end weight
 * Ranking based on weight change (most/least lost)
 */

import { BaseGame } from './BaseGame';
import { WeightGameSettings, WeightEntry, GameResult } from './types';

export class WeightGameLogic extends BaseGame {
  protected settings: WeightGameSettings;
  protected entries: Map<string, WeightEntry> = new Map();
  protected step1Submitted: Set<string> = new Set(); // Players who submitted start weight
  protected step2Submitted: Set<string> = new Set(); // Players who submitted end weight
  protected currentStep: number = 1; // 1 or 2

  constructor(gameId: string, settings: WeightGameSettings) {
    super(gameId, settings);
    this.settings = settings;
  }

  /**
   * Initialize weight entries for all players
   */
  initializeEntries(playerIds: string[], playerNames: Map<string, string>): void {
    playerIds.forEach((playerId) => {
      this.entries.set(playerId, {
        playerId,
        playerName: playerNames.get(playerId) || playerId,
        startWeight: null,
        endWeight: null,
        weightRange: null,
        pointsEarned: 0,
        rank: null,
      });
    });
  }

  /**
   * Update player's start weight (Step 1)
   * Players can only submit once, admin can override
   */
  updateStartWeight(playerId: string, weight: number, isAdmin: boolean = false): boolean {
    const entry = this.entries.get(playerId);
    if (!entry) return false;

    // Players can only submit once, admin can always update
    if (!isAdmin && this.step1Submitted.has(playerId) && entry.startWeight !== null) {
      return false; // Player already submitted, cannot edit
    }

    entry.startWeight = weight;
    if (!isAdmin) {
      this.step1Submitted.add(playerId); // Mark as submitted
    }

    return true;
  }

  /**
   * Update player's end weight (Step 2)
   * Players can only submit once, admin can override
   */
  updateEndWeight(playerId: string, weight: number, isAdmin: boolean = false): boolean {
    const entry = this.entries.get(playerId);
    if (!entry) return false;

    // Players can only submit once, admin can always update
    if (!isAdmin && this.step2Submitted.has(playerId) && entry.endWeight !== null) {
      return false; // Player already submitted, cannot edit
    }

    entry.endWeight = weight;
    if (!isAdmin) {
      this.step2Submitted.add(playerId); // Mark as submitted
    }

    return true;
  }

  /**
   * Check if player has submitted start weight
   */
  hasPlayerSubmittedStartWeight(playerId: string): boolean {
    return this.step1Submitted.has(playerId);
  }

  /**
   * Check if player has submitted end weight
   */
  hasPlayerSubmittedEndWeight(playerId: string): boolean {
    return this.step2Submitted.has(playerId);
  }

  /**
   * Get current step
   */
  getCurrentStep(): number {
    return this.currentStep;
  }

  /**
   * Move to next step
   */
  moveToNextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep += 1;
    }
  }

  /**
   * Get entry for player (for display)
   */
  getPlayerEntry(playerId: string): WeightEntry | null {
    return this.entries.get(playerId) || null;
  }

  /**
   * Get all entries (for admin display)
   */
  getAllEntries(): WeightEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Calculate weight range (start - end)
   */
  private calculateWeightRange(): void {
    this.entries.forEach((entry) => {
      if (entry.startWeight !== null && entry.endWeight !== null) {
        entry.weightRange = entry.startWeight - entry.endWeight;
      }
    });
  }

  /**
   * Rank players based on game mode (most/least weight lost)
   */
  private rankPlayers(): void {
    const entries = Array.from(this.entries.values()).filter((e) => e.weightRange !== null);

    if (entries.length === 0) return;

    // Sort based on game mode
    if (this.settings.gameMode === 'most') {
      // Sort descending (most weight lost first)
      entries.sort((a, b) => (b.weightRange || 0) - (a.weightRange || 0));
    } else {
      // Sort ascending (least weight lost first, i.e., smallest number)
      entries.sort((a, b) => (a.weightRange || 0) - (b.weightRange || 0));
    }

    // Handle zero weight range (all get lowest points)
    const zeroRangeEntries = entries.filter((e) => e.weightRange === 0);
    const validEntries = entries.filter((e) => e.weightRange !== 0 && e.weightRange !== null);

    let rank = 1;

    // Assign ranks to valid entries
    validEntries.forEach((entry) => {
      entry.rank = rank;
      entry.pointsEarned = this.calculatePoints(rank, this.entries.size);
      rank++;
    });

    // Assign lowest points to zero range entries
    zeroRangeEntries.forEach((entry) => {
      entry.rank = this.entries.size; // Last rank
      entry.pointsEarned = Math.min(this.settings.pointFrom, this.settings.pointTo);
    });
  }

  /**
   * Start game (Step 1)
   */
  async startGame(): Promise<void> {
    // Initialize entries when game starts
    console.log(`Weight Game ${this.gameId} started - Step 1 (Start Weight collection)`);
  }

  /**
   * End game and calculate results
   */
  async endGame(): Promise<GameResult[]> {
    this.calculateWeightRange();
    this.rankPlayers();

    this.results = Array.from(this.entries.values()).map((entry) => ({
      playerId: entry.playerId,
      playerName: entry.playerName,
      pointsEarned: entry.pointsEarned,
      rank: entry.rank || this.entries.size,
    }));

    return this.getResults();
  }

  /**
   * Update game state during gameplay
   */
  async updateGameState(data: any): Promise<void> {
    const { playerId, step, weight } = data;

    if (step === 1) {
      this.updateStartWeight(playerId, weight);
    } else if (step === 2) {
      this.updateEndWeight(playerId, weight);
    }
  }

  /**
   * Get current game state
   */
  getGameState() {
    return {
      gameId: this.gameId,
      settings: this.settings,
      entries: Array.from(this.entries.values()),
      results: this.results,
    };
  }
}
