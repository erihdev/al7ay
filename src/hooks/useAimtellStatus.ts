import { useState, useEffect, useCallback } from 'react';

interface AimtellStatus {
  isSDKLoaded: boolean;
  isSubscribed: boolean;
  permissionState: 'granted' | 'denied' | 'default' | 'unknown';
  isReady: boolean;
}

export function useAimtellStatus(providerId: string | undefined) {
  const [status, setStatus] = useState<AimtellStatus>({
    isSDKLoaded: false,
    isSubscribed: false,
    permissionState: 'unknown',
    isReady: false,
  });

  const checkStatus = useCallback(() => {
    // Check if Aimtell SDK is loaded by looking for the track function
    const sdk = (window as any)._at;
    const sdkLoaded = !!(sdk && typeof sdk.track === 'function');
    
    // Check browser notification permission
    let permissionState: AimtellStatus['permissionState'] = 'unknown';
    if ('Notification' in window) {
      permissionState = Notification.permission as AimtellStatus['permissionState'];
    }

    // For Aimtell, if SDK is loaded AND permission is granted, user IS subscribed
    // This is because Aimtell automatically registers the subscriber when permission is granted
    const isSubscribed = sdkLoaded && permissionState === 'granted';
    
    // Ready means we've checked and have a definitive answer
    const isReady = permissionState !== 'unknown';

    setStatus({
      isSDKLoaded: sdkLoaded,
      isSubscribed,
      permissionState,
      isReady,
    });
  }, []);

  useEffect(() => {
    // Check immediately
    checkStatus();

    // Recheck multiple times as SDK loads asynchronously
    const timers = [
      setTimeout(checkStatus, 500),
      setTimeout(checkStatus, 1500),
      setTimeout(checkStatus, 3000),
      setTimeout(checkStatus, 5000),
    ];

    // Also listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then(permission => {
        permission.onchange = checkStatus;
      }).catch(() => {
        // Some browsers don't support this
      });
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [checkStatus]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      // After permission granted, Aimtell SDK auto-registers
      setTimeout(checkStatus, 500);
      return permission === 'granted';
    }
    return false;
  }, [checkStatus]);

  return { ...status, checkStatus, requestPermission };
}
