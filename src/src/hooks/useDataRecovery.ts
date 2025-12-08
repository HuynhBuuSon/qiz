import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useGameStore from '@/store/gameStore';

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
  const toCamelCase = async (obj: any) => {
    // Dynamic import to avoid circular dependency
    const { toCamelCase: convert } = await import('@/lib/utils/helpers');
    return convert(obj);
  };

  useEffect(() => {
    if (!roomId && !currentRoom?.id) {
      return;
    }

    const fetchAndUpdateRoom = async () => {
      try {
        const id = roomId || currentRoom?.id;
        const response = await fetch(`/api/rooms/${id}`);
        if (response.ok) {
          const data = await response.json();
          const converted = await toCamelCase(data);
          setCurrentRoom(converted);
        }
      } catch (err) {
        console.error('Failed to sync room data:', err);
      }
    };

    // Fetch on mount to ensure fresh data
    fetchAndUpdateRoom();

    if (shouldAutoRefresh) {
      // Set up periodic refresh
      const interval = setInterval(fetchAndUpdateRoom, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [roomId, currentRoom?.id, setCurrentRoom, shouldAutoRefresh, toCamelCase]);
}
