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
   * Calculate weight range (start weight - end weight = weight lost)
   * Positive value = weight lost (player got lighter)
   * Negative value = weight gained (player got heavier)
   * Zero = no change
   */
  private calculateWeightRange(): void {
    this.entries.forEach((entry) => {
      if (entry.startWeight !== null && entry.endWeight !== null) {
        entry.weightRange = entry.endWeight - entry.startWeight;
      }
    });
  }

  /**
   * Rank players based on game mode (most/least weight lost)
   * Then calculate points based on Point Mode
   * Players with zero weight range get the lowest points
   */
  private rankPlayers(): void {
    const entries = Array.from(this.entries.values()).filter((e) => e.weightRange !== null);

    if (entries.length === 0) return;

    // Separate valid entries from zero-range entries
    const validEntries = entries.filter((e) => e.weightRange !== 0 && e.weightRange !== null);
    const zeroRangeEntries = entries.filter((e) => e.weightRange === 0);

    // Sort valid entries based on game mode
    if (this.settings.gameMode === 'most') {
      // Most weight lost: sort by weight range descending (most first)
      validEntries.sort((a, b) => (b.weightRange || 0) - (a.weightRange || 0));
    } else {
      // Least weight lost: sort by weight range ascending (least first)
      validEntries.sort((a, b) => (a.weightRange || 0) - (b.weightRange || 0));
    }

    let rank = 1;

    // Assign ranks and points to valid entries
    validEntries.forEach((entry) => {
      entry.rank = rank;
      entry.pointsEarned = this.calculatePoints(rank, validEntries.length);
      rank++;
    });

    // Assign zero-range entries to lowest rank with minimum points
    const minPoints = Math.min(this.settings.pointFrom, this.settings.pointTo);
    zeroRangeEntries.forEach((entry) => {
      entry.rank = validEntries.length + 1; // After all valid entries
      entry.pointsEarned = minPoints; // Lowest points
    });

    // Handle players with no data (no start or end weight)
    const noDataEntries = Array.from(this.entries.values()).filter((e) => e.weightRange === null);
    noDataEntries.forEach((entry) => {
      entry.rank = validEntries.length + zeroRangeEntries.length + 1; // Last rank
      entry.pointsEarned = minPoints; // Lowest points
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
   * End game and calculate final results
   * 1. Calculate weight range (start - end) for each player
   * 2. Rank players by weight range based on game mode
   * 3. Calculate points based on rank and point mode
   * 4. Players with zero weight range get lowest points
   * 5. Build results for display on admin and presenter screens
   */
  async endGame(): Promise<GameResult[]> {
    // Step 1: Calculate weight changes
    this.calculateWeightRange();

    // Step 2-4: Rank and calculate points
    this.rankPlayers();

    // Step 5: Build final results sorted by rank
    this.results = Array.from(this.entries.values())
      .sort((a, b) => (a.rank || 999) - (b.rank || 999))
      .map((entry) => ({
        playerId: entry.playerId,
        playerName: entry.playerName,
        pointsEarned: entry.pointsEarned,
        rank: entry.rank || 999,
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
