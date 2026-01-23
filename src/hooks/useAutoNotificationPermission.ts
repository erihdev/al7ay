import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// VAPID public key for Web Push notifications
const VAPID_PUBLIC_KEY = 'BLcfxrzMmUMPGMAMOKnw-0nJZ8oe3YkXUjPUW6uvmyFre4K8pNhzjkYZNC0cZIAhXFT4brgG_p7dZuSOPu7vm7U';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface UseAutoNotificationPermissionOptions {
  providerId?: string;
  customerId?: string;
  userId?: string;
}

export function useAutoNotificationPermission(options: UseAutoNotificationPermissionOptions = {}) {
  const hasRequested = useRef(false);
  const hasRegisteredAttributes = useRef(false);
  const hasRegisteredWebPush = useRef(false);

  // Register Web Push for background notifications (iOS/Safari)
  const registerWebPush = useCallback(async (): Promise<boolean> => {
    if (hasRegisteredWebPush.current) return true;
    if (!options.userId) {
      console.log('❌ No userId for web push registration');
      return false;
    }

    try {
      console.log('🔄 Auto-registering Web Push for user:', options.userId);
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Service Worker or Push Manager not supported');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      // Check if subscription exists in database
      if (subscription) {
        const { data: existingSubs } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', options.userId)
          .eq('endpoint', subscription.endpoint);
        
        if (existingSubs && existingSubs.length > 0) {
          console.log('✅ Valid subscription already exists');
          hasRegisteredWebPush.current = true;
          return true;
        }
        
        // Subscription exists in browser but not in DB, unsubscribe and create new
        console.log('🔄 Refreshing subscription...');
        await subscription.unsubscribe();
      }

      // Delete any old subscriptions for this user
      await supabase.from('push_subscriptions').delete().eq('user_id', options.userId);

      // Create new subscription
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      console.log('✅ New push subscription created');

      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: options.userId,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
      }, {
        onConflict: 'user_id,endpoint',
      });

      if (error) {
        console.error('❌ Error saving push subscription:', error);
        return false;
      }

      console.log('✅ Web Push subscription saved for user:', options.userId);
      hasRegisteredWebPush.current = true;
      return true;
    } catch (error) {
      console.error('❌ Error registering web push:', error);
      return false;
    }
  }, [options.userId]);

  // Register Aimtell attributes AND alias for targeted notifications
  // IMPORTANT: Use {user: ID} format to match backend targeting "user==ID"
  const registerAimtellAttributes = useCallback(() => {
    if (hasRegisteredAttributes.current) return false;
    
    if (typeof window._at?.track !== 'function') {
      return false;
    }

    const attributes: Record<string, string> = {};
    let aliasId: string | undefined;
    
    if (options.providerId) {
      attributes.provider_id = options.providerId;
      aliasId = options.providerId;
    }
    
    if (options.customerId) {
      attributes.customer_id = options.customerId;
      aliasId = options.customerId;
    }

    if (Object.keys(attributes).length === 0 || !aliasId) {
      return false;
    }

    try {
      // Register attributes for segmentation
      window._at.track('attribute', attributes);
      
      // CRITICAL: Use {user: ID} format as per Aimtell documentation
      // Backend will target with "user==ID" format
      window._at.track('alias', { user: aliasId });
      
      console.log('✅ Aimtell registered with alias { user:', aliasId, '}');
      hasRegisteredAttributes.current = true;
      return true;
    } catch (error) {
      console.error('❌ Error registering Aimtell:', error);
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
            // Register Web Push for background notifications
            const webPushSuccess = await registerWebPush();
            console.log('Web Push registration:', webPushSuccess ? '✅' : '❌');
            
            // Wait for Aimtell SDK to be ready and register attributes
            let aimtellRegistered = false;
            for (let attempt = 0; attempt < 5; attempt++) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              aimtellRegistered = registerAimtellAttributes();
              if (aimtellRegistered) break;
            }
            console.log('Aimtell registration:', aimtellRegistered ? '✅' : '❌');

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
          // Already granted, register both services
          const webPushSuccess = await registerWebPush();
          console.log('Web Push (already granted):', webPushSuccess ? '✅' : '❌');
          
          for (let attempt = 0; attempt < 5; attempt++) {
            const registered = registerAimtellAttributes();
            if (registered) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        console.error('Error in notification setup:', error);
      }
    };

    // Wait a bit before asking for permission
    const timer = setTimeout(requestPermissionAndRegister, 1500);

    return () => clearTimeout(timer);
  }, [registerAimtellAttributes, registerWebPush]);

  // Also try to register when SDK loads (retry mechanism)
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
    registerWebPush,
  };
}
