import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (url: string = window.location.origin) => {
  if (socket) return socket;

  socket = io(url, {
    path: '/api/socket.io',
    addTrailingSlash: false,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event handlers
export const onRoomUpdate = (callback: (data: any) => void) => {
  getSocket()?.on('room:update', callback);
};

export const onPlayersUpdate = (callback: (data: any) => void) => {
  getSocket()?.on('players:update', callback);
};

export const onGameUpdate = (callback: (data: any) => void) => {
  getSocket()?.on('game:update', callback);
};

export const onPlayerJoined = (callback: (data: any) => void) => {
  getSocket()?.on('player:joined', callback);
};

export const onPlayerLeft = (callback: (data: any) => void) => {
  getSocket()?.on('player:left', callback);
};

export const onGameStarted = (callback: (data: any) => void) => {
  getSocket()?.on('game:started', callback);
};

export const onGameEnded = (callback: (data: any) => void) => {
  getSocket()?.on('game:ended', callback);
};

export const onPointsUpdated = (callback: (data: any) => void) => {
  getSocket()?.on('points:updated', callback);
};

export const onRandomGameSpinning = (callback: (data: any) => void) => {
  getSocket()?.on('random:game:spinning', callback);
};

export const onRandomGameSpinComplete = (callback: (data: any) => void) => {
  getSocket()?.on('random:game:spin:complete', callback);
};

export const onRandomGamePlayerSelected = (callback: (data: any) => void) => {
  getSocket()?.on('random:game:player:selected', callback);
};

export const onRandomGameActionTaken = (callback: (data: any) => void) => {
  getSocket()?.on('random:game:action:taken', callback);
};

export const onRandomGameWinnerSelected = (callback: (data: any) => void) => {
  getSocket()?.on('random:game:winner:selected', callback);
};

// Emit functions
export const emitJoinRoom = (roomId: string, playerData: any) => {
  getSocket()?.emit('room:join', { roomId, playerData });
};

export const emitLeaveRoom = (roomId: string) => {
  getSocket()?.emit('room:leave', { roomId });
};

export const emitGameUpdate = (roomId: string, gameData: any) => {
  getSocket()?.emit('game:update', { roomId, gameData });
};

export const emitPlayersUpdate = (roomId: string, players: any) => {
  getSocket()?.emit('players:update', { roomId, players });
};

/**
 * Emit admin-only spin request
 * Only admins can trigger spins
 */
export const emitRandomGameSpin = (roomId: string, gameId: string, adminId: string) => {
  getSocket()?.emit('random:game:spin', { roomId, gameId, adminId });
};

/**
 * Emit admin action (reward/punish/nothing)
 * Only admins can take actions
 */
export const emitRandomGameAction = (
  roomId: string,
  gameId: string,
  playerId: string,
  action: 'reward' | 'punish' | 'nothing',
  adminId: string
) => {
  getSocket()?.emit('random:game:action', {
    roomId,
    gameId,
    playerId,
    action,
    adminId,
  });
};

/**
 * Emit end game request
 * Only admins can end the game
 */
export const emitRandomGameEnd = (roomId: string, gameId: string, adminId: string) => {
  getSocket()?.emit('random:game:end', { roomId, gameId, adminId });
};

/**
 * Emit winner selected event for blinking animation
 * Triggers 5-second blinking on presenter and winning player
 */
export const emitRandomGameWinnerSelected = (
  roomId: string,
  gameId: string,
  playerId: string,
  playerName: string
) => {
  getSocket()?.emit('random:game:winner:selected', {
    roomId,
    gameId,
    playerId,
    playerName,
    timestamp: Date.now(),
  });
};

