import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { API_URL } from '@/lib/config';

/**
 * Hook to handle data recovery from localStorage on page refresh
 * Also redirects users if they shouldn't be on a page based on their role
 */
export function useDataRecovery(requiredRole?: 'admin' | 'player' | 'presenter') {
  const router = useRouter();
  const [isStoreReady, setIsStoreReady] = useState(false);
  const userRole = useGameStore((state) => state.userRole);
  const roomId = useGameStore((state) => state.roomId);
  const currentRoom = useGameStore((state) => state.currentRoom);

  // Wait for Zustand store to be rehydrated from localStorage
  useEffect(() => {
    // Use a small delay to ensure Zustand has rehydrated from localStorage
    const timer = setTimeout(() => {
      setIsStoreReady(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isStoreReady) return;

    // If we have a currentRoom but no role yet, don't redirect immediately
    // This handles the case where we just came from a create/join page
    if (currentRoom?.id && !userRole) {
      // Don't redirect - user might still be hydrating
      return;
    }

    // Check if user has the required role
    if (requiredRole && userRole !== requiredRole) {
      // Allow initial page load, but redirect if no session exists
      if (!userRole) {
        router.push('/');
      }
    }

    // Check if user should have a room but doesn't
    if (requiredRole && !roomId && !currentRoom?.id) {
      // User is on a protected page without a room
      if (requiredRole === 'admin') {
        router.push('/admin/create');
      } else if (requiredRole === 'player') {
        router.push('/player/join');
      } else if (requiredRole === 'presenter') {
        router.push('/presenter/join');
      }
    }
  }, [requiredRole, userRole, roomId, currentRoom, router, isStoreReady]);

  return {
    userRole,
    roomId,
    currentRoom,
    isReady: isStoreReady && (!requiredRole || (userRole === requiredRole && (roomId || currentRoom?.id))),
  };
}

/**
 * Hook to initialize and refresh room data on component mount
 * Useful for pages that need to sync with server on load
 */
export function useRoomDataSync(shouldAutoRefresh: boolean = true) {
  const roomId = useGameStore((state) => state.roomId);
  const currentRoom = useGameStore((state) => state.currentRoom);
  const setCurrentRoom = useGameStore((state) => state.setCurrentRoom);
  const [isStoreReady, setIsStoreReady] = useState(false);

  // Wait for store to be ready
  useEffect(() => {
    setIsStoreReady(true);
  }, []);

  const fetchAndUpdateRoom = useCallback(async () => {
    try {
      const id = roomId || currentRoom?.id;
      if (!id) return;

      const response = await fetch(`${API_URL}/api/rooms/${id}`);
      if (response.ok) {
        const data = await response.json();
        // Import dynamically to avoid circular dependency
        const { toCamelCase } = await import('@/lib/utils/helpers');
        const converted = toCamelCase(data);
        setCurrentRoom(converted);
      }
    } catch (err) {
      console.error('Failed to sync room data:', err);
    }
  }, [roomId, currentRoom?.id, setCurrentRoom]);

  // Initial fetch
  useEffect(() => {
    if (!isStoreReady || (!roomId && !currentRoom?.id)) return;
    fetchAndUpdateRoom();
  }, [roomId, currentRoom?.id, fetchAndUpdateRoom, isStoreReady]);

  // Real-time updates using WebSocket with fallback to polling
  useRealTimeUpdates({
    roomId: roomId || currentRoom?.id,
    eventName: 'room:update',
    fetchCallback: fetchAndUpdateRoom,
    pollingInterval: 5000,
    enabled: Boolean(shouldAutoRefresh && isStoreReady && (roomId || currentRoom?.id)),
  });
}
