import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellRing, RefreshCw, Settings, ChevronDown, ChevronUp, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// VAPID public key for Web Push notifications
const VAPID_PUBLIC_KEY = 'BBSkQQTuHO2QUmjfNrrLFt0HHKf3MZem5LCnRcFgDV3v722xd3MR4E6Kg5O_wPyDfIVydp0JFhyJRYGAIkgVcXU';

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

type PermissionState = 'granted' | 'denied' | 'default' | 'loading' | 'unsupported';

interface ProviderNotificationPermissionProps {
  providerId?: string;
}

export function ProviderNotificationPermission({ providerId }: ProviderNotificationPermissionProps) {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<PermissionState>('loading');
  const [showInstructions, setShowInstructions] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const hasRegistered = useRef(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = () => {
    if (!('Notification' in window)) {
      setPermissionState('unsupported');
      return;
    }
    setPermissionState(Notification.permission as PermissionState);
  };

  // Register for Web Push (works on all platforms including iOS PWA)
  const registerWebPush = useCallback(async (): Promise<boolean> => {
    if (!user) {
      console.log('❌ No user for web push registration');
      return false;
    }

    try {
      console.log('🔄 Starting Web Push registration for user:', user.id);
      
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.log('❌ Service Worker not supported');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');

      // Check if push is supported
      if (!('PushManager' in window)) {
        console.log('❌ Push Manager not supported');
        return false;
      }

      // Get existing subscription or create new one
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('🔄 Creating new push subscription...');
        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
        console.log('✅ New push subscription created');
      } else {
        console.log('✅ Existing push subscription found');
      }

      const subscriptionJson = subscription.toJSON();
      console.log('📦 Subscription endpoint:', subscriptionJson.endpoint?.substring(0, 50) + '...');

      // Save subscription to database
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
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

      console.log('✅ Web Push subscription saved successfully for user:', user.id);
      return true;
    } catch (error) {
      console.error('❌ Error registering web push:', error);
      return false;
    }
  }, [user]);

  // Also register with Aimtell for Android/Desktop
  const registerAimtell = async (): Promise<boolean> => {
    if (typeof window._at !== 'object' || !window._at?.track) {
      console.log('⚠️ Aimtell SDK not available');
      return false;
    }

    if (!providerId) {
      return false;
    }

    try {
      window._at.track('attribute', { provider_id: providerId });
      window._at.track('alias', `provider_id==${providerId}`);
      console.log('✅ Aimtell registered for provider:', providerId);
      return true;
    } catch (error) {
      console.error('❌ Error registering Aimtell:', error);
      return false;
    }
  };

  // Main registration function
  const registerNotifications = async (): Promise<boolean> => {
    console.log('🔄 Starting notification registration...');
    
    // Always try Web Push first (works everywhere including iOS PWA)
    const webPushSuccess = await registerWebPush();
    
    // Also try Aimtell for Android/Desktop fallback
    const aimtellSuccess = await registerAimtell();
    
    const success = webPushSuccess || aimtellSuccess;
    
    if (success) {
      hasRegistered.current = true;
      setIsRegistered(true);
      console.log('✅ Notification registration complete:', { webPushSuccess, aimtellSuccess });
    }
    
    return success;
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSendingTest(true);
    
    try {
      console.log('📤 Sending test notification to user:', user.id);
      
      const response = await supabase.functions.invoke('send-webpush', {
        body: {
          userId: user.id,
          title: '🔔 إشعار تجريبي',
          body: 'تم تفعيل الإشعارات بنجاح! ستتلقى إشعاراً فورياً عند وصول طلب جديد.',
          url: '/provider-dashboard?tab=orders',
        },
      });

      console.log('📬 Test notification response:', response);

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast.success('✅ تم إرسال الإشعار التجريبي!', {
          description: `تم الإرسال إلى ${response.data.sentCount} جهاز`,
        });
      } else {
        toast.warning('⚠️ لم يتم إرسال الإشعار', {
          description: response.data?.message || 'لا توجد اشتراكات مسجلة',
        });
      }
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      toast.error('❌ فشل إرسال الإشعار التجريبي');
    } finally {
      setIsSendingTest(false);
    }
  };

  const requestNotificationPermission = async () => {
    setPermissionState('loading');
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);
      
      if (permission === 'granted') {
        const registered = await registerNotifications();
        
        if (registered) {
          toast.success('🔔 تم تفعيل الإشعارات بنجاح!', {
            description: 'اضغط "إرسال إشعار تجريبي" للتأكد',
          });
        } else {
          toast.warning('⚠️ تم السماح بالإشعارات لكن التسجيل فشل', {
            description: 'حاول إعادة تحميل الصفحة',
          });
        }
      } else if (permission === 'denied') {
        toast.error('❌ تم رفض الإشعارات');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setPermissionState('denied');
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await requestNotificationPermission();
    } finally {
      setIsRetrying(false);
    }
  };

  // Auto-register when permission is granted
  useEffect(() => {
    if (permissionState !== 'granted' || hasRegistered.current) return;

    const autoRegister = async () => {
      console.log('🔄 Auto-registering notifications...');
      await registerNotifications();
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(autoRegister, 1000);
    return () => clearTimeout(timer);
  }, [permissionState, registerWebPush]);

  if (permissionState === 'unsupported') {
    return null;
  }

  // Success state - show test button
  if (permissionState === 'granted' && isRegistered) {
    return (
      <Card className="bg-green-500/10 border-green-500/20 mb-4">
        <CardContent className="p-3 text-center">
          <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1.5" />
          <h3 className="font-bold font-arabic text-sm text-foreground mb-0.5">
            ✅ الإشعارات جاهزة
          </h3>
          <p className="text-xs text-muted-foreground font-arabic mb-2">
            ستتلقى تنبيهاً فورياً عند وصول طلب جديد
          </p>
          <Button
            onClick={sendTestNotification}
            disabled={isSendingTest}
            variant="outline"
            size="sm"
            className="font-arabic h-7 text-xs"
          >
            {isSendingTest ? (
              <RefreshCw className="h-3 w-3 ml-1.5 animate-spin" />
            ) : (
              <Send className="h-3 w-3 ml-1.5" />
            )}
            إرسال إشعار تجريبي
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Still registering state
  if (permissionState === 'granted' && !isRegistered) {
    return (
      <Card className="bg-amber-500/10 border-amber-500/20 mb-4">
        <CardContent className="p-3 text-center">
          <RefreshCw className="h-6 w-6 text-amber-500 mx-auto mb-1.5 animate-spin" />
          <h3 className="font-bold font-arabic text-sm text-foreground mb-0.5">
            جاري تسجيل الإشعارات...
          </h3>
          <p className="text-xs text-muted-foreground font-arabic">
            يتم تسجيلك لاستقبال إشعارات الطلبات الجديدة
          </p>
        </CardContent>
      </Card>
    );
  }

  if (permissionState === 'denied') {
    return (
      <Card className="bg-destructive/10 border-destructive/20 mb-4">
        <CardContent className="p-3">
          <div className="text-center">
            <Bell className="h-6 w-6 text-destructive mx-auto mb-1.5" />
            <h3 className="font-bold font-arabic text-sm text-foreground mb-0.5">
              تم رفض الإشعارات
            </h3>
            <p className="text-xs text-muted-foreground font-arabic mb-2">
              لتلقي إشعارات الطلبات الجديدة، يرجى السماح بالإشعارات
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-2">
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="font-arabic h-8 text-xs"
            >
              {isRetrying ? (
                <RefreshCw className="h-3.5 w-3.5 ml-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 ml-1.5" />
              )}
              حاول مرة أخرى
            </Button>
          </div>

          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-primary font-arabic py-1.5 hover:underline"
          >
            <Settings className="h-3.5 w-3.5" />
            كيفية تفعيل الإشعارات
            {showInstructions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showInstructions && (
            <div className="mt-2 p-2 bg-background/50 rounded-lg text-right">
              <p className="font-bold text-xs font-arabic mb-1.5 text-foreground">📱 على الآيفون:</p>
              <ol className="text-[10px] text-muted-foreground font-arabic space-y-0.5 list-decimal list-inside mb-2">
                <li>أضف التطبيق للشاشة الرئيسية أولاً</li>
                <li>افتح التطبيق من الشاشة الرئيسية</li>
                <li>اضغط "السماح" عند ظهور نافذة الإشعارات</li>
              </ol>
              <p className="font-bold text-xs font-arabic mb-1.5 text-foreground">📱 على الأندرويد:</p>
              <ol className="text-[10px] text-muted-foreground font-arabic space-y-0.5 list-decimal list-inside mb-2">
                <li>اضغط على أيقونة 🔒 بجانب العنوان</li>
                <li>اختر "الإشعارات" → "سماح"</li>
              </ol>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                size="sm"
                className="w-full mt-2 font-arabic h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 ml-1.5" />
                إعادة تحميل
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default state - ask for permission
  return (
    <Card className="bg-primary/5 border-primary/20 mb-4">
      <CardContent className="p-3 text-center">
        <BellRing className="h-6 w-6 text-primary mx-auto mb-1.5" />
        <h3 className="font-bold font-arabic text-sm text-foreground mb-0.5">
          تفعيل الإشعارات
        </h3>
        <p className="text-xs text-muted-foreground font-arabic mb-2">
          نحتاج إذنك لإرسال إشعارات عند وصول طلب جديد
        </p>
        <Button
          onClick={requestNotificationPermission}
          disabled={permissionState === 'loading'}
          className="font-arabic h-8 text-xs"
          size="sm"
        >
          {permissionState === 'loading' ? (
            <>جاري التحميل...</>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5 ml-1.5" />
              السماح بالإشعارات
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
