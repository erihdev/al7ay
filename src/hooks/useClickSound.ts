import { useCallback, useRef } from 'react';

export const useClickSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playClickSound = useCallback(() => {
    try {
      // Create audio context on demand (required by browsers)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // Create a short, soft click sound using oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure soft click sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);

      // Quick fade out for soft click effect
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (error) {
      // Silently fail if audio is not supported
      console.debug('Audio not available:', error);
    }
  }, []);

  return { playClickSound };
};

export default useClickSound;
