import { useEffect, useRef, useCallback } from 'react';
import { initSocket, getSocket } from '@/lib/websocket/client';

interface UseRealTimeUpdatesOptions {
  roomId?: string | null;
  eventName: string;
  fetchCallback: () => Promise<void>;
  pollingInterval?: number; // Fallback polling interval in ms (default: 2000)
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
  pollingInterval = 2000,
  enabled = true,
}: UseRealTimeUpdatesOptions) {
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);
  const isConnectedRef = useRef(false);

  // Initialize socket on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      socketRef.current = initSocket();
      
      socketRef.current.on('connect', () => {
        isConnectedRef.current = true;
        console.log(`[${eventName}] WebSocket connected`);
        
        // Stop polling when connected to WebSocket
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      });

      socketRef.current.on('disconnect', () => {
        isConnectedRef.current = false;
        console.log(`[${eventName}] WebSocket disconnected, falling back to polling`);
        
        // Start polling when disconnected from WebSocket
        startPolling();
      });

      // Subscribe to room-specific events
      if (roomId) {
        socketRef.current.emit('join-room', { roomId });
        socketRef.current.on(`room:${roomId}:${eventName}`, fetchCallback);
      }

      // Subscribe to global events
      socketRef.current.on(eventName, fetchCallback);
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
  }, [enabled, eventName, roomId, fetchCallback]);

  // Polling fallback
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // Already polling
    
    console.log(`[${eventName}] Starting polling every ${pollingInterval}ms`);
    pollingRef.current = setInterval(async () => {
      try {
        await fetchCallback();
      } catch (error) {
        console.error(`[${eventName}] Polling error:`, error);
      }
    }, pollingInterval);
  }, [eventName, pollingInterval, fetchCallback]);

  // Manual trigger for immediate update
  const triggerUpdate = useCallback(async () => {
    await fetchCallback();
  }, [fetchCallback]);

  return {
    triggerUpdate,
    isConnected: isConnectedRef.current,
  };
}
