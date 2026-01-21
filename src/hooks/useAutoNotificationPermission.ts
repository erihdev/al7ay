import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Use the global Window type from useAimtellTags.ts

interface UseAutoNotificationPermissionOptions {
  providerId?: string;
  customerId?: string;
}

export function useAutoNotificationPermission(options: UseAutoNotificationPermissionOptions = {}) {
  const hasRequested = useRef(false);
  const hasRegisteredAttributes = useRef(false);

  // Register Aimtell attributes AND alias for targeted notifications
  const registerAimtellAttributes = useCallback(() => {
    if (hasRegisteredAttributes.current) return false;
    
    if (typeof window._at?.track !== 'function') {
      return false;
    }

    const attributes: Record<string, string> = {};
    
    if (options.providerId) {
      attributes.provider_id = options.providerId;
    }
    
    if (options.customerId) {
      attributes.customer_id = options.customerId;
    }

    if (Object.keys(attributes).length === 0) {
      return false;
    }

    try {
      // Register attributes for segmentation
      window._at.track('attribute', attributes);
      
      // Register alias matching exactly what the Push API expects
      if (options.providerId) {
        window._at.track('alias', `provider_id==${options.providerId}`);
      }
      
      if (options.customerId) {
        window._at.track('alias', `customer_id==${options.customerId}`);
      }
      
      hasRegisteredAttributes.current = true;
      return true;
    } catch {
      return false;
    }
  }, [options.providerId, options.customerId]);

  useEffect(() => {
    // Only run once per session
    if (hasRequested.current) return;
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      return;
    }

    // Auto-request permission after a short delay
    const requestPermissionAndRegister = async () => {
      hasRequested.current = true;
      
      try {
        // If permission not granted yet, request it
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            // Wait for Aimtell SDK to be ready and register attributes
            let registered = false;
            for (let attempt = 0; attempt < 5; attempt++) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              registered = registerAimtellAttributes();
              if (registered) break;
            }

            toast.success('🔔 تم تفعيل الإشعارات بنجاح!', {
              description: 'ستتلقى إشعارات فورية عند وصول طلب جديد',
              duration: 5000,
            });
          } else if (permission === 'denied') {
            toast.error('❌ تم رفض الإشعارات', {
              description: 'لن تتلقى إشعارات الطلبات الجديدة. يمكنك تفعيلها من إعدادات المتصفح.',
              duration: 7000,
            });
          }
        } else if (Notification.permission === 'granted') {
          // Already granted, just register attributes
          for (let attempt = 0; attempt < 5; attempt++) {
            const registered = registerAimtellAttributes();
            if (registered) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch {
        // Silent fail for notification setup
      }
    };

    // Wait a bit before asking for permission
    const timer = setTimeout(requestPermissionAndRegister, 1500);

    return () => clearTimeout(timer);
  }, [registerAimtellAttributes]);

  // Also try to register attributes when SDK loads (retry mechanism)
  useEffect(() => {
    if (!options.providerId && !options.customerId) return;
    if (Notification.permission !== 'granted') return;

    const retryTimers = [
      setTimeout(registerAimtellAttributes, 2000),
      setTimeout(registerAimtellAttributes, 5000),
      setTimeout(registerAimtellAttributes, 10000),
    ];

    return () => retryTimers.forEach(clearTimeout);
  }, [options.providerId, options.customerId, registerAimtellAttributes]);

  return {
    permission: typeof Notification !== 'undefined' ? Notification.permission : 'default',
    registerAimtellAttributes,
  };
}
