import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Room APIs
export const createRoom = (data: any) =>
  api.post('/rooms/create', data);

export const getRoom = (roomId: string) =>
  api.get(`/rooms/${roomId}`);

export const getRoomByCode = (joinCode: string) =>
  api.get(`/rooms/code/${joinCode}`);

// Player APIs
export const joinRoom = (roomId: string, playerData: any) =>
  api.post(`/rooms/${roomId}/join`, playerData);

export const getPlayers = (roomId: string) =>
  api.get(`/rooms/${roomId}/players`);

export const updatePlayer = (roomId: string, playerId: string, data: any) =>
  api.put(`/rooms/${roomId}/players/${playerId}`, data);

export const removePlayer = (roomId: string, playerId: string) =>
  api.delete(`/rooms/${roomId}/players/${playerId}`);

// Game APIs
export const createGame = (roomId: string, gameData: any) =>
  api.post(`/rooms/${roomId}/games`, gameData);

export const getGames = (roomId: string) =>
  api.get(`/rooms/${roomId}/games`);

export const updateGame = (roomId: string, gameId: string, data: any) =>
  api.put(`/rooms/${roomId}/games/${gameId}`, data);

export const deleteGame = (roomId: string, gameId: string) =>
  api.delete(`/rooms/${roomId}/games/${gameId}`);

export const startGame = (roomId: string, gameId: string) =>
  api.post(`/rooms/${roomId}/games/${gameId}/start`, {});

export const endGame = (roomId: string, gameId: string) =>
  api.post(`/rooms/${roomId}/games/${gameId}/end`, {});

// Weight Game APIs
export const submitWeightStep1 = (roomId: string, gameId: string, data: any) =>
  api.post(`/rooms/${roomId}/games/${gameId}/weight/step1`, data);

export const submitWeightStep2 = (roomId: string, gameId: string, data: any) =>
  api.post(`/rooms/${roomId}/games/${gameId}/weight/step2`, data);

// Random Game APIs
export const startRandomSpin = (roomId: string, gameId: string) =>
  api.post(`/rooms/${roomId}/games/${gameId}/random/spin`, {});

export const submitRandomResult = (roomId: string, gameId: string, data: any) =>
  api.post(`/rooms/${roomId}/games/${gameId}/random/result`, data);

export default api;
