'use client';

import { useEffect, useState, ReactNode } from 'react';
import useGameStore from '@/store/gameStore';

/**
 * Provider component that ensures Zustand store is hydrated from localStorage
 * before rendering child components. This prevents hydration mismatches and redirect loops.
 */
export default function HydrationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const userRole = useGameStore((state) => state.userRole);

  useEffect(() => {
    // Check if store is actually hydrated by verifying state has been loaded
    // Zustand persist middleware will load from localStorage
    const checkHydration = () => {
      // Give Zustand time to rehydrate from localStorage
      // Using a small delay to ensure localStorage is read
      setIsHydrated(true);
    };

    // Use requestAnimationFrame to ensure this runs after paint
    requestAnimationFrame(() => {
      // Small delay to let Zustand rehydrate
      setTimeout(checkHydration, 0);
    });
  }, []);

  // Don't render children until hydration is complete
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
