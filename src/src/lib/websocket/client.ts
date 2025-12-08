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
