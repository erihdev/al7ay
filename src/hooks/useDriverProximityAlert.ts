import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseDriverProximityAlertOptions {
  isNearby: boolean;
  distanceMeters: number;
  enabled?: boolean;
  onNearby?: () => void;
}

// Proximity thresholds in meters
const PROXIMITY_THRESHOLDS = {
  VERY_CLOSE: 100,    // 100m - "السائق وصل تقريباً"
  CLOSE: 300,         // 300m - "السائق على بعد دقائق"
  NEARBY: 500,        // 500m - "السائق اقترب من موقعك"
};

export function useDriverProximityAlert({
  isNearby,
  distanceMeters,
  enabled = true,
  onNearby
}: UseDriverProximityAlertOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const hasAlertedNearbyRef = useRef(false);
  const hasAlertedCloseRef = useRef(false);
  const hasAlertedVeryCloseRef = useRef(false);
  const soundEnabledRef = useRef(true);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play notification sound
  const playProximitySound = useCallback((type: 'nearby' | 'close' | 'arrived') => {
    if (!soundEnabledRef.current) return;

    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different proximity levels
      switch (type) {
        case 'arrived':
          // Celebratory sound - higher pitch, longer
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
          oscillator.frequency.setValueAtTime(1047, audioContext.currentTime + 0.1); // C6
          oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.2); // E6
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
          break;
        case 'close':
          // Alert sound - two beeps
          oscillator.frequency.setValueAtTime(659, audioContext.currentTime); // E5
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.01, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          break;
        case 'nearby':
        default:
          // Simple notification - single beep
          oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
      }
    } catch (error) {
      console.error('Failed to play proximity sound:', error);
    }
  }, [getAudioContext]);

  // Show notification with toast
  const showProximityNotification = useCallback((type: 'nearby' | 'close' | 'arrived', distance: number) => {
    const messages = {
      nearby: {
        title: '🚗 السائق اقترب!',
        description: `السائق على بعد ${Math.round(distance)} متر من موقعك`,
      },
      close: {
        title: '🏃 السائق على وشك الوصول!',
        description: 'السائق على بعد دقائق قليلة فقط',
      },
      arrived: {
        title: '🎉 السائق وصل!',
        description: 'السائق وصل إلى موقعك تقريباً',
      },
    };

    const message = messages[type];
    toast.success(message.title, {
      description: message.description,
      duration: 5000,
    });
  }, []);

  // Check proximity and trigger alerts
  useEffect(() => {
    if (!enabled || distanceMeters <= 0) return;

    // Very close (100m)
    if (distanceMeters <= PROXIMITY_THRESHOLDS.VERY_CLOSE && !hasAlertedVeryCloseRef.current) {
      hasAlertedVeryCloseRef.current = true;
      playProximitySound('arrived');
      showProximityNotification('arrived', distanceMeters);
      onNearby?.();
    }
    // Close (300m)
    else if (distanceMeters <= PROXIMITY_THRESHOLDS.CLOSE && !hasAlertedCloseRef.current) {
      hasAlertedCloseRef.current = true;
      playProximitySound('close');
      showProximityNotification('close', distanceMeters);
    }
    // Nearby (500m)
    else if (distanceMeters <= PROXIMITY_THRESHOLDS.NEARBY && !hasAlertedNearbyRef.current) {
      hasAlertedNearbyRef.current = true;
      playProximitySound('nearby');
      showProximityNotification('nearby', distanceMeters);
    }
  }, [enabled, distanceMeters, playProximitySound, showProximityNotification, onNearby]);

  // Reset alerts when distance increases significantly (driver went away and coming back)
  useEffect(() => {
    if (distanceMeters > PROXIMITY_THRESHOLDS.NEARBY * 1.5) {
      hasAlertedNearbyRef.current = false;
      hasAlertedCloseRef.current = false;
      hasAlertedVeryCloseRef.current = false;
    }
  }, [distanceMeters]);

  // Toggle sound
  const toggleSound = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    toggleSound,
    isSoundEnabled: soundEnabledRef.current,
  };
}
