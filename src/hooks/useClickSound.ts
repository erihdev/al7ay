import { useCallback } from 'react';
import { playClickSound as playClick } from '@/utils/audioContext';

/**
 * Hook for playing UI click sounds
 * Uses centralized audio context for better performance
 */
export const useClickSound = () => {
  const playClickSound = useCallback(() => {
    playClick();
  }, []);

  return { playClickSound };
};

export default useClickSound;
