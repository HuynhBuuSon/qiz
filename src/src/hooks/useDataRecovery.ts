import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';
import { useRealTimeUpdates } from './useRealTimeUpdates';

/**
 * Hook to handle data recovery from localStorage on page refresh
 * Also redirects users if they shouldn't be on a page based on their role
 */
export function useDataRecovery(requiredRole?: 'admin' | 'player' | 'presenter') {
  const router = useRouter();
  const userRole = useGameStore((state) => state.userRole);
  const roomId = useGameStore((state) => state.roomId);
  const currentRoom = useGameStore((state) => state.currentRoom);

  useEffect(() => {
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
  }, [requiredRole, userRole, roomId, currentRoom, router]);

  return {
    userRole,
    roomId,
    currentRoom,
    isReady: !requiredRole || (userRole === requiredRole && (roomId || currentRoom?.id)),
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

  const fetchAndUpdateRoom = useCallback(async () => {
    try {
      const id = roomId || currentRoom?.id;
      if (!id) return;

      const response = await fetch(`/api/rooms/${id}`);
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
    if (!roomId && !currentRoom?.id) return;
    fetchAndUpdateRoom();
  }, [roomId, currentRoom?.id, fetchAndUpdateRoom]);

  // Real-time updates using WebSocket with fallback to polling
  useRealTimeUpdates({
    roomId: roomId || currentRoom?.id,
    eventName: 'room:update',
    fetchCallback: fetchAndUpdateRoom,
    pollingInterval: 5000,
    enabled: Boolean(shouldAutoRefresh && (roomId || currentRoom?.id)),
  });
}
