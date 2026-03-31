import { WS_URL } from '@/lib/config';

type EventCallback = (data: any) => void;

// Per-room WebSocket hub with auto-reconnect and event routing
class WSHub {
  private sockets = new Map<string, WebSocket>();
  private listeners = new Map<string, Map<string, Set<EventCallback>>>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private shouldReconnect = new Map<string, boolean>();

  connect(roomId: string): void {
    if (this.sockets.get(roomId)?.readyState === WebSocket.OPEN) return;

    this.shouldReconnect.set(roomId, true);
    const url = `${WS_URL}/ws?room_id=${encodeURIComponent(roomId)}`;
    const ws = new WebSocket(url);
    this.sockets.set(roomId, ws);

    ws.onopen = () => {
      const timer = this.reconnectTimers.get(roomId);
      if (timer) { clearTimeout(timer); this.reconnectTimers.delete(roomId); }
      this._emit(roomId, 'connect', null);
    };

    ws.onclose = () => {
      this.sockets.delete(roomId);
      this._emit(roomId, 'disconnect', null);
      if (this.shouldReconnect.get(roomId)) {
        const timer = setTimeout(() => this.connect(roomId), 2000);
        this.reconnectTimers.set(roomId, timer);
      }
    };

    ws.onerror = () => {
      this._emit(roomId, 'error', null);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg && typeof msg.type === 'string') {
          this._emit(roomId, msg.type, msg.payload ?? null);
        }
      } catch { /* ignore malformed messages */ }
    };
  }

  disconnect(roomId: string): void {
    this.shouldReconnect.set(roomId, false);
    const timer = this.reconnectTimers.get(roomId);
    if (timer) { clearTimeout(timer); this.reconnectTimers.delete(roomId); }
    const ws = this.sockets.get(roomId);
    if (ws) { ws.close(); this.sockets.delete(roomId); }
    this.listeners.delete(roomId);
  }

  on(roomId: string, event: string, cb: EventCallback): void {
    if (!this.listeners.has(roomId)) this.listeners.set(roomId, new Map());
    const room = this.listeners.get(roomId)!;
    if (!room.has(event)) room.set(event, new Set());
    room.get(event)!.add(cb);
  }

  off(roomId: string, event: string, cb: EventCallback): void {
    this.listeners.get(roomId)?.get(event)?.delete(cb);
  }

  send(roomId: string, type: string, payload: any): void {
    const ws = this.sockets.get(roomId);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  isConnected(roomId: string): boolean {
    return this.sockets.get(roomId)?.readyState === WebSocket.OPEN;
  }

  private _emit(roomId: string, event: string, data: any): void {
    this.listeners.get(roomId)?.get(event)?.forEach(cb => {
      try { cb(data); } catch { /* ignore listener errors */ }
    });
  }
}

export const wsHub = new WSHub();

// ---------------------------------------------------------------------------
// Backward-compatible singleton helpers (use activeRoomId set by initSocket)
// ---------------------------------------------------------------------------

let activeRoomId: string | null = null;

export const initSocket = (roomId: string): void => {
  activeRoomId = roomId;
  wsHub.connect(roomId);
};

export const disconnectSocket = (): void => {
  if (activeRoomId) wsHub.disconnect(activeRoomId);
  activeRoomId = null;
};

export const isConnected = (): boolean =>
  activeRoomId ? wsHub.isConnected(activeRoomId) : false;

// Event subscriptions — all scoped to the active room
export const onRoomUpdate = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'room:update', cb);
export const onPlayersUpdate = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'players:update', cb);
export const onGameUpdate = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'game:update', cb);
export const onPlayerJoined = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'player:joined', cb);
export const onPlayerLeft = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'player:left', cb);
export const onGameStarted = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'game:started', cb);
export const onGameEnded = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'game:ended', cb);
export const onPointsUpdated = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'points:updated', cb);
export const onRandomGameSpinning = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'randomGame:spinning', cb);
export const onRandomGameSpinComplete = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'randomGame:spinComplete', cb);
export const onRandomGamePlayerSelected = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'randomGame:playerSelected', cb);
export const onRandomGameActionTaken = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'randomGame:actionTaken', cb);
export const onRandomGameWinnerSelected = (cb: EventCallback) => activeRoomId && wsHub.on(activeRoomId, 'randomGame:winnerSelected', cb);

// Emit helpers — relay messages through the server to all clients in the room
export const emitJoinRoom = (roomId: string, playerData: any) =>
  wsHub.send(roomId, 'room:join', { roomId, playerData });

export const emitLeaveRoom = (roomId: string) =>
  wsHub.send(roomId, 'room:leave', { roomId });

export const emitGameUpdate = (roomId: string, gameData: any) =>
  wsHub.send(roomId, 'game:update', { roomId, gameData });

export const emitPlayersUpdate = (roomId: string, players: any) =>
  wsHub.send(roomId, 'players:update', { roomId, players });

export const emitRandomGameSpin = (roomId: string, gameId: string, adminId: string) =>
  wsHub.send(roomId, 'randomGame:spinning', { roomId, gameId, adminId });

export const emitRandomGameAction = (
  roomId: string,
  gameId: string,
  playerId: string,
  action: 'reward' | 'punish' | 'nothing',
  adminId: string,
) => wsHub.send(roomId, 'randomGame:actionTaken', { roomId, gameId, playerId, action, adminId });

export const emitRandomGameEnd = (roomId: string, gameId: string, adminId: string) =>
  wsHub.send(roomId, 'game:ended', { roomId, gameId, adminId });

export const emitRandomGameWinnerSelected = (
  roomId: string,
  gameId: string,
  playerId: string,
  playerName: string,
) => wsHub.send(roomId, 'randomGame:winnerSelected', { roomId, gameId, playerId, playerName, timestamp: Date.now() });
