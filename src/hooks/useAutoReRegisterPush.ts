import { useEffect, useCallback, useRef, useState } from 'react';
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

/**
 * This hook automatically checks and re-registers push notifications
 * if the subscription is invalid or missing.
 * Uses direct Supabase auth instead of useAuth to avoid context issues.
 */
export function useAutoReRegisterPush() {
  const [userId, setUserId] = useState<string | null>(null);
  const hasChecked = useRef(false);

  // Get user ID directly from Supabase session
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          setUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session for push:', error);
      }
    };
    getUser();
  }, []);

  const registerWebPush = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    try {
      console.log('🔄 Auto re-registering Web Push for user:', userId);
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('❌ Push not supported');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Always unsubscribe and create fresh subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('🔄 Unsubscribing old subscription...');
        await subscription.unsubscribe();
      }

      // Delete any existing subscriptions for this user
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);

      // Create new subscription
      console.log('🔄 Creating new push subscription...');
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();
      
      // Save to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
      }, {
        onConflict: 'user_id,endpoint',
      });

      if (error) {
        console.error('❌ Error saving subscription:', error);
        return false;
      }

      console.log('✅ Auto re-registration complete');
      return true;
    } catch (error) {
      console.error('❌ Auto re-registration failed:', error);
      return false;
    }
  }, [userId]);

  const checkAndReRegister = useCallback(async () => {
    if (!userId || hasChecked.current) return;
    hasChecked.current = true;

    // Only proceed if notifications are granted
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      // Check if user has valid subscription in database
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint')
        .eq('user_id', userId);

      // If no subscriptions exist, register
      if (!subscriptions || subscriptions.length === 0) {
        console.log('📭 No subscriptions found, auto-registering...');
        await registerWebPush();
        return;
      }

      // Check if browser subscription matches database
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const browserSub = await registration.pushManager.getSubscription();
        
        if (!browserSub) {
          console.log('📭 No browser subscription, auto-registering...');
          await registerWebPush();
          return;
        }

        // Check if browser endpoint matches any DB subscription
        const browserEndpoint = browserSub.endpoint;
        const hasMatch = subscriptions.some(s => s.endpoint === browserEndpoint);
        
        if (!hasMatch) {
          console.log('⚠️ Browser subscription mismatch, auto-registering...');
          await registerWebPush();
        }
      }
    } catch (error) {
      console.error('Error checking subscriptions:', error);
    }
  }, [userId, registerWebPush]);

  useEffect(() => {
    // Delay check to ensure page is fully loaded
    const timer = setTimeout(checkAndReRegister, 2000);
    return () => clearTimeout(timer);
  }, [checkAndReRegister]);

  return { registerWebPush };
}
