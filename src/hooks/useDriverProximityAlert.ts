import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { playProximitySound as playSound } from '@/utils/audioContext';

interface UseDriverProximityAlertOptions {
  isNearby: boolean;
  distanceMeters: number;
  enabled?: boolean;
  onNearby?: () => void;
}

// Proximity thresholds in meters
const PROXIMITY_THRESHOLDS = {
  VERY_CLOSE: 100,
  CLOSE: 300,
  NEARBY: 500,
};

export function useDriverProximityAlert({
  isNearby,
  distanceMeters,
  enabled = true,
  onNearby
}: UseDriverProximityAlertOptions) {
  const hasAlertedNearbyRef = useRef(false);
  const hasAlertedCloseRef = useRef(false);
  const hasAlertedVeryCloseRef = useRef(false);
  const soundEnabledRef = useRef(true);

  // Play notification sound using centralized audio utility
  const playProximitySound = useCallback((type: 'nearby' | 'close' | 'arrived') => {
    if (!soundEnabledRef.current) return;
    playSound(type);
  }, []);

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

  return {
    toggleSound,
    isSoundEnabled: soundEnabledRef.current,
  };
}
