/**
 * Game System Type Definitions
 * Base interfaces for all game types to ensure extensibility
 */

export enum GameStatus {
  PENDING = 'pending',
  STARTED = 'started',
  ENDED = 'ended',
}

export enum PointMode {
  MODE_1 = 'mode1', // -1 per rank
  MODE_2 = 'mode2', // Proportional
}

export interface GameResult {
  playerId: string;
  playerName: string;
  pointsEarned: number;
  rank: number;
}

export interface GameBaseSettings {
  gameName: string;
  pointMode: PointMode;
  pointFrom: number;
  pointTo: number;
}

export interface WeightGameSettings extends GameBaseSettings {
  weightLimit: {
    from: number;
    to: number;
  };
  weightUnit: 'g' | 'kg';
  gameMode: 'most' | 'least'; // Most weight lost or Least weight lost
}

export interface RandomGameSettings extends GameBaseSettings {
  pointAward: number;
  isRepeat: boolean; // Can same player be selected multiple times
}

export interface WeightGameData {
  gameId: string;
  step1Started: boolean;
  step2Started: boolean;
  completed: boolean;
  entries: WeightEntry[];
}

export interface WeightEntry {
  playerId: string;
  playerName: string;
  startWeight: number | null;
  endWeight: number | null;
  weightRange: number | null;
  pointsEarned: number;
  rank: number | null;
}

export interface RandomGameData {
  gameId: string;
  step2Started: boolean;
  step3Started: boolean;
  currentSelectedPlayerId: string | null;
  winners: RandomWinner[];
}

export interface RandomWinner {
  playerId: string;
  playerName: string;
  adminAction: 'reward' | 'punish' | 'nothing';
  pointsAwarded: number;
}

export interface GameControlAction {
  type: 'start_step' | 'end_game' | 'admin_action';
  step?: number;
  action?: string;
  data?: any;
}
