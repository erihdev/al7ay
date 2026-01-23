import { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, AlertTriangle, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
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

interface SimpleNotificationIndicatorProps {
  className?: string;
}

export function SimpleNotificationIndicator({ className }: SimpleNotificationIndicatorProps) {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user has valid push subscription
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setIsRegistered(false);
          return;
        }
        
        setUserId(session.user.id);

        // Check database for subscription
        const { data: subs } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', session.user.id);

        setIsRegistered(subs && subs.length > 0);
      } catch {
        setIsRegistered(false);
      }
    };

    checkRegistration();
  }, []);

  // Fix registration manually
  const handleFixRegistration = async () => {
    if (!userId) return;
    
    setIsFixing(true);
    try {
      // Request permission if needed
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission !== 'granted') {
        setIsFixing(false);
        return;
      }

      // Register Web Push
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsFixing(false);
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Unsubscribe old subscription
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }

      // Delete old subscriptions
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);

      // Create new subscription
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      });

      const subscriptionJson = subscription.toJSON();

      // Save to database
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint!,
        p256dh: subscriptionJson.keys!.p256dh,
        auth: subscriptionJson.keys!.auth,
      }, {
        onConflict: 'user_id,endpoint',
      });

      setIsRegistered(true);
    } catch (error) {
      console.error('Fix registration error:', error);
    } finally {
      setIsFixing(false);
    }
  };

  // Browser permission check
  const permission = 'Notification' in window ? Notification.permission : 'denied';

  // Permission denied
  if (permission === 'denied') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 ${className}`}>
            <BellOff className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive font-arabic hidden sm:inline">الإشعارات مرفوضة</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-arabic text-sm">
            لتفعيل الإشعارات: اضغط على أيقونة القفل 🔒 بجانب عنوان الموقع → الإشعارات → سماح
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Permission granted but not registered in database
  if (permission === 'granted' && isRegistered === false) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFixRegistration}
            disabled={isFixing}
            className={`flex items-center gap-1.5 px-2 py-1 h-auto rounded-full bg-orange-500/10 hover:bg-orange-500/20 ${className}`}
          >
            {isFixing ? (
              <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            )}
            <span className="text-xs text-orange-600 font-arabic">
              {isFixing ? 'جاري التفعيل...' : 'اضغط لتفعيل الإشعارات'}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-arabic">⚠️ الإشعارات غير مفعلة بشكل كامل - اضغط للتفعيل</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Fully registered
  if (permission === 'granted' && isRegistered === true) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 ${className}`}>
            <BellRing className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600 font-arabic hidden sm:inline">الإشعارات مفعّلة</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-arabic">✅ ستتلقى إشعارات الطلبات الجديدة</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Default - waiting for permission
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 ${className}`}>
          <Bell className="h-4 w-4 text-yellow-500" />
          <span className="text-xs text-yellow-600 font-arabic hidden sm:inline">بانتظار التفعيل</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-arabic">سيُطلب منك السماح بالإشعارات تلقائياً</p>
      </TooltipContent>
    </Tooltip>
  );
}
