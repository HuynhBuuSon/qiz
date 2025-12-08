import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameRoom, Player, Game } from '@/types';

interface GameState {
  // Current session
  userRole: 'admin' | 'player' | 'presenter' | null;
  roomId: string | null;
  playerId: string | null;
  adminId: string | null;
  
  // Room data
  currentRoom: GameRoom | null;
  players: Player[];
  games: Game[];
  
  // UI state
  mainColor: string;
  colorFrom: string;
  colorTo: string;
  
  // Actions
  setUserRole: (role: 'admin' | 'player' | 'presenter' | null) => void;
  setRoomId: (roomId: string) => void;
  setPlayerId: (playerId: string) => void;
  setAdminId: (adminId: string) => void;
  setCurrentRoom: (room: GameRoom) => void;
  setPlayers: (players: Player[]) => void;
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setGames: (games: Game[]) => void;
  addGame: (game: Game) => void;
  updateGame: (game: Game) => void;
  removeGame: (gameId: string) => void;
  setColors: (mainColor: string, colorFrom: string, colorTo: string) => void;
  reset: () => void;
}

const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      userRole: null,
      roomId: null,
      playerId: null,
      adminId: null,
      currentRoom: null,
      players: [],
      games: [],
      mainColor: '#3b82f6',
      colorFrom: '#3b82f6',
      colorTo: '#1e40af',

      setUserRole: (role) => set({ userRole: role }),
      setRoomId: (roomId) => set({ roomId }),
      setPlayerId: (playerId) => set({ playerId }),
      setAdminId: (adminId) => set({ adminId }),
      setCurrentRoom: (room) => set({ currentRoom: room }),
      
      setPlayers: (players) => set({ players }),
      addPlayer: (player) => set((state) => ({
        players: [...state.players, player],
      })),
      updatePlayer: (player) => set((state) => ({
        players: state.players.map((p) => (p.id === player.id ? player : p)),
      })),
      removePlayer: (playerId) => set((state) => ({
        players: state.players.filter((p) => p.id !== playerId),
      })),

      setGames: (games) => set({ games }),
      addGame: (game) => set((state) => ({
        games: [...state.games, game],
      })),
      updateGame: (game) => set((state) => ({
        games: state.games.map((g) => (g.id === game.id ? game : g)),
      })),
      removeGame: (gameId) => set((state) => ({
        games: state.games.filter((g) => g.id !== gameId),
      })),

      setColors: (mainColor, colorFrom, colorTo) => set({
        mainColor,
        colorFrom,
        colorTo,
      }),

      reset: () => set({
        userRole: null,
        roomId: null,
        playerId: null,
        adminId: null,
        currentRoom: null,
        players: [],
        games: [],
      }),
    }),
    {
      name: 'game-store',
      partialize: (state) => ({
        userRole: state.userRole,
        roomId: state.roomId,
        playerId: state.playerId,
        adminId: state.adminId,
        mainColor: state.mainColor,
        colorFrom: state.colorFrom,
        colorTo: state.colorTo,
      }),
    }
  )
);

export default useGameStore;
