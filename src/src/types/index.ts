// Game Room Types
export interface GameRoom {
  id: string;
  name: string;
  joinCode: string;
  presentationCode: string;
  mainColor: string;
  colorFrom: string;
  colorTo: string;
  maxPlayers: number;
  pointMode: 'mode1' | 'mode2';
  pointFrom: number;
  pointTo: number;
  createdAt: Date;
  createdBy: string;
  status: 'active' | 'ended';
}

// Player Types
export interface Player {
  id: string;
  name: string;
  roomId: string;
  joinedAt: Date;
  score: number;
  rank: number;
  isHidden: {
    rank: boolean;
    score: boolean;
  };
  color?: string;
  metadata?: Record<string, any>;
}

// Game Types
export interface Game {
  id: string;
  roomId: string;
  name: string;
  type: 'weight' | 'random';
  order: number;
  status: 'pending' | 'started' | 'completed';
  createdAt: Date;
  settings: GameSettings;
}

export interface GameSettings {
  pointMode?: 'mode1' | 'mode2';
  pointFrom?: number;
  pointTo?: number;
  [key: string]: any;
}

// Weight Game Types
export interface WeightGameData {
  gameId: string;
  mode: 'most' | 'least';
  weightLimit: {
    from: number;
    to: number;
  };
  weightUnit: 'g' | 'kg';
  step1: WeightStep1;
  step2?: WeightStep2;
  results?: WeightGameResult[];
}

export interface WeightStep1 {
  isStarted: boolean;
  startWeights: Map<string, number>; // playerId -> weight
  admin?: {
    startWeightInput?: number;
  };
}

export interface WeightStep2 {
  isStarted: boolean;
  endWeights: Map<string, number>; // playerId -> weight
  admin?: {
    endWeightInput?: number;
  };
}

export interface WeightGameResult {
  playerId: string;
  startWeight: number;
  endWeight: number;
  weightRange: number;
  points: number;
  newRank: number;
}

// Random Game Types
export interface RandomGameData {
  gameId: string;
  pointAward: number;
  isRepeat: boolean;
  winnerHistory: string[];
  step2: RandomStep2;
  step3?: RandomStep3;
}

export interface RandomStep2 {
  isStarted: boolean;
}

export interface RandomStep3 {
  isStarted: boolean;
  spinnerRunning: boolean;
  selectedPlayerId?: string;
  adminAction?: 'reward' | 'punish' | 'nothing';
}

// WebSocket Message Types
export interface WebSocketMessage {
  type: string;
  payload?: any;
  roomId?: string;
  timestamp: number;
}

// User Session Types
export interface UserSession {
  id: string;
  role: 'admin' | 'player' | 'presenter';
  roomId: string;
  playerId?: string;
  loginTime: Date;
}
