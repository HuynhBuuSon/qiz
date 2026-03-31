import { useEffect, useRef, useCallback } from 'react';
import { initSocket, getSocket } from '@/lib/websocket/client';

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
  const socketRef = useRef<any>(null);
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
    if (!enabled) return;

    try {
      socketRef.current = initSocket();
      
      socketRef.current.on('connect', () => {
        isConnectedRef.current = true;
        
        // Stop polling when connected to WebSocket
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      });

      socketRef.current.on('disconnect', () => {
        isConnectedRef.current = false;
        
        // Start polling when disconnected from WebSocket
        startPolling();
      });

      // Subscribe to room-specific events
      if (roomId) {
        socketRef.current.emit('join-room', { roomId });
        socketRef.current.on(`room:${roomId}:${eventName}`, () => {
          debouncedFetch();
        });
      }

      // Subscribe to global events
      socketRef.current.on(eventName, () => {
        debouncedFetch();
      });
      
      // If socket not connected yet, start polling immediately
      if (!isConnectedRef.current) {
        startPolling();
      }
    } catch (error) {
      console.error(`[${eventName}] Failed to initialize socket, using polling:`, error);
      startPolling();
    }

    return () => {
      // Cleanup on unmount
      if (socketRef.current) {
        if (roomId) {
          socketRef.current.off(`room:${roomId}:${eventName}`);
        }
        socketRef.current.off(eventName);
      }
      
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
