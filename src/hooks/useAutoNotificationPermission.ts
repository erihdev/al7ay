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
    if (hasRegisteredAttributes.current) return;
    
    if (typeof window._at?.track !== 'function') {
      console.log('Aimtell SDK not ready for attribute registration');
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
      
      // CRITICAL: Also set alias for each attribute for direct targeting
      // Aimtell uses alias format: "attribute_name==value" for push API targeting
      for (const [key, value] of Object.entries(attributes)) {
        const aliasValue = `${key}==${value}`;
        window._at.track('alias', aliasValue);
        console.log('✅ Aimtell alias registered:', aliasValue);
      }
      
      hasRegisteredAttributes.current = true;
      console.log('✅ Aimtell attributes and aliases registered successfully:', attributes);
      return true;
    } catch (error) {
      console.error('Error registering Aimtell attributes:', error);
      return false;
    }
  }, [options.providerId, options.customerId]);

  useEffect(() => {
    // Only run once per session
    if (hasRequested.current) return;
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
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
          let registered = false;
          for (let attempt = 0; attempt < 5; attempt++) {
            registered = registerAimtellAttributes();
            if (registered) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          if (registered) {
            console.log('✅ Notification system ready - attributes registered');
          }
        }
      } catch (error) {
        console.error('Error in notification setup:', error);
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
