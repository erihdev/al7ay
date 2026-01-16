import { useState, useEffect, useCallback } from 'react';

// Use a type assertion approach to avoid conflicts with global declarations
interface AimtellSDK {
  track?: (event: string, data: string[]) => void;
  trackEvent?: (event: string, data: any) => void;
  getSubscriberId?: () => string | null;
  isSubscribed?: () => boolean;
  getPermissionState?: () => string;
  getTags?: () => string[];
}

function getAimtellSDK(): AimtellSDK | undefined {
  return (window as any)._at as AimtellSDK | undefined;
}

interface AimtellStatus {
  isSDKLoaded: boolean;
  isSubscribed: boolean;
  permissionState: 'granted' | 'denied' | 'default' | 'unknown';
  subscriberId: string | null;
  registeredTags: string[];
  hasProviderTag: boolean;
}

export function useAimtellStatus(providerId: string | undefined) {
  const [status, setStatus] = useState<AimtellStatus>({
    isSDKLoaded: false,
    isSubscribed: false,
    permissionState: 'unknown',
    subscriberId: null,
    registeredTags: [],
    hasProviderTag: false,
  });

  const checkStatus = useCallback(() => {
    const sdk = getAimtellSDK();
    
    // Check if SDK is loaded
    const sdkLoaded = typeof sdk?.track === 'function';
    
    // Check browser notification permission
    let permissionState: AimtellStatus['permissionState'] = 'unknown';
    if ('Notification' in window) {
      permissionState = Notification.permission as AimtellStatus['permissionState'];
    }

    // Try to get subscriber info from SDK
    let subscriberId: string | null = null;
    let isSubscribed = false;
    let registeredTags: string[] = [];

    if (sdkLoaded && sdk) {
      try {
        if (typeof sdk.getSubscriberId === 'function') {
          subscriberId = sdk.getSubscriberId();
        }
        if (typeof sdk.isSubscribed === 'function') {
          isSubscribed = sdk.isSubscribed();
        }
        if (typeof sdk.getTags === 'function') {
          registeredTags = sdk.getTags() || [];
        }
      } catch (e) {
        console.log('Error checking Aimtell status:', e);
      }
    }

    // Check if push subscription exists via service worker
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          if (subscription) {
            isSubscribed = true;
          }
        });
      });
    }

    // For Aimtell, subscription is indicated by permission being granted
    // and SDK being loaded
    if (permissionState === 'granted' && sdkLoaded) {
      isSubscribed = true;
    }

    const hasProviderTag = providerId ? registeredTags.includes(`provider:${providerId}`) : false;

    setStatus({
      isSDKLoaded: sdkLoaded,
      isSubscribed,
      permissionState,
      subscriberId,
      registeredTags,
      hasProviderTag,
    });
  }, [providerId]);

  useEffect(() => {
    // Check immediately
    checkStatus();

    // Recheck after SDK might have loaded
    const timer1 = setTimeout(checkStatus, 1000);
    const timer2 = setTimeout(checkStatus, 3000);
    const timer3 = setTimeout(checkStatus, 5000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [checkStatus]);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      checkStatus();
      return permission === 'granted';
    }
    return false;
  }, [checkStatus]);

  return { ...status, checkStatus, requestPermission };
}
