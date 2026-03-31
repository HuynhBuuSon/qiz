import { useEffect, useRef, useCallback } from 'react';
import { wsHub } from '@/lib/websocket/client';

interface UseRealTimeUpdatesOptions {
  roomId?: string | null;
  eventName: string;
  fetchCallback: () => Promise<void>;
  pollingInterval?: number; // Fallback polling interval in ms (default: 3000)
  enabled?: boolean;
}

/**
 * Hook for real-time updates using WebSocket with fallback to polling
 * Automatically manages connection lifecycle and cleanup
 */
export function useRealTimeUpdates({
  roomId,
  eventName,
  fetchCallback,
  pollingInterval = 3000,
  enabled = true,
}: UseRealTimeUpdatesOptions) {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);
  const lastFetchRef = useRef<number>(0);
  const minIntervalRef = useRef<number>(500); // Prevent rapid re-fetches within 500ms

  // Debounced fetch - prevents multiple calls within a short time
  const debouncedFetch = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < minIntervalRef.current) {
      return;
    }
    lastFetchRef.current = now;
    try {
      await fetchCallback();
    } catch (error) {
      console.error(`[${eventName}] Fetch error:`, error);
    }
  }, [eventName, fetchCallback]);

  // Polling fallback - defined before useEffect so it can be used
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling
    
    pollingRef.current = setInterval(async () => {
      await debouncedFetch();
    }, pollingInterval);
  }, [eventName, pollingInterval, debouncedFetch]);

  // Initialize socket on mount
  useEffect(() => {
    if (!enabled || !roomId) return;

    wsHub.connect(roomId);

    const onConnect = () => {
      isConnectedRef.current = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    const onDisconnect = () => {
      isConnectedRef.current = false;
      startPolling();
    };

    const onEvent = () => { debouncedFetch(); };

    wsHub.on(roomId, 'connect', onConnect);
    wsHub.on(roomId, 'disconnect', onDisconnect);
    wsHub.on(roomId, eventName, onEvent);

    // If not yet connected, start polling immediately as fallback
    if (!wsHub.isConnected(roomId)) {
      startPolling();
    }

    return () => {
      wsHub.off(roomId, 'connect', onConnect);
      wsHub.off(roomId, 'disconnect', onDisconnect);
      wsHub.off(roomId, eventName, onEvent);

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [enabled, eventName, roomId, fetchCallback, startPolling, debouncedFetch]);

  // Manual trigger for immediate update
  const triggerUpdate = useCallback(async () => {
    await debouncedFetch();
  }, [debouncedFetch]);

  return {
    triggerUpdate,
    isConnected: isConnectedRef.current,
  };
}
