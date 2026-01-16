import { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, RefreshCw, Settings, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type PermissionState = 'granted' | 'denied' | 'default' | 'loading' | 'unsupported';

interface ProviderNotificationPermissionProps {
  providerId?: string;
}

export function ProviderNotificationPermission({ providerId }: ProviderNotificationPermissionProps) {
  const [permissionState, setPermissionState] = useState<PermissionState>('loading');
  const [showInstructions, setShowInstructions] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
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

  const registerAimtellAttributes = (): boolean => {
    if (typeof window._at?.track !== 'function') {
      console.log('Aimtell SDK not ready yet');
      return false;
    }

    if (!providerId) {
      console.log('No providerId to register');
      return false;
    }

    try {
      // Register attribute for segmentation
      window._at.track('attribute', { provider_id: providerId });
      
      // CRITICAL: Register alias with exact format used in send-notification
      const aliasValue = `provider_id==${providerId}`;
      window._at.track('alias', aliasValue);
      
      console.log('✅ Provider registered for background notifications:', aliasValue);
      hasRegistered.current = true;
      setIsRegistered(true);
      return true;
    } catch (error) {
      console.error('Error registering Aimtell:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    setPermissionState('loading');
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission as PermissionState);
      
      if (permission === 'granted') {
        // Register with Aimtell for push notifications with retries
        let registered = false;
        for (let attempt = 0; attempt < 10; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          registered = registerAimtellAttributes();
          if (registered) break;
        }
        
        if (registered) {
          toast.success('🔔 تم تفعيل الإشعارات بنجاح!', {
            description: 'ستتلقى إشعارات فورية عند وصول طلب جديد',
          });
        } else {
          toast.warning('⚠️ تم السماح بالإشعارات لكن التسجيل فشل', {
            description: 'حاول إعادة تحميل الصفحة',
          });
        }
      } else if (permission === 'denied') {
        toast.error('❌ تم رفض الإشعارات', {
          description: 'لن تتلقى إشعارات الطلبات الجديدة',
        });
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

  // CRITICAL: Always try to register when permission is granted - EVERY TIME the page loads
  // Don't skip if hasRegistered.current is true from a previous session
  useEffect(() => {
    if (permissionState !== 'granted' || !providerId) return;

    // Reset registration state on every page load
    hasRegistered.current = false;
    setIsRegistered(false);

    const registerWithRetries = async () => {
      console.log('🔄 Starting Aimtell registration for provider:', providerId);
      
      // Try multiple times as SDK might not be ready immediately
      for (let attempt = 0; attempt < 15; attempt++) {
        if (hasRegistered.current) {
          console.log('✅ Registration confirmed, stopping retries');
          break;
        }
        
        const success = registerAimtellAttributes();
        if (success) {
          console.log(`✅ Auto-registered on attempt ${attempt + 1}`);
          toast.success('✅ تم تسجيل الإشعارات بنجاح', {
            description: 'ستتلقى إشعارات عند وصول طلب جديد',
            duration: 3000,
          });
          break;
        }
        
        console.log(`Attempt ${attempt + 1} failed, waiting before retry...`);
        // Wait before next attempt - shorter intervals at first
        await new Promise(resolve => setTimeout(resolve, attempt < 5 ? 1000 : 2000));
      }
    };

    // Start registration after a short delay to let Aimtell SDK load
    const timer = setTimeout(registerWithRetries, 1500);
    return () => clearTimeout(timer);
  }, [permissionState, providerId]);

  // Periodic retries to ensure registration
  useEffect(() => {
    if (permissionState !== 'granted' || !providerId) return;

    const retryIntervals = [5000, 10000, 20000, 30000];
    const timers = retryIntervals.map((delay, i) => 
      setTimeout(() => {
        if (!hasRegistered.current) {
          console.log(`🔄 Periodic retry attempt ${i + 1}...`);
          const success = registerAimtellAttributes();
          if (success) {
            toast.success('✅ تم تسجيل الإشعارات', { duration: 2000 });
          }
        }
      }, delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [permissionState, providerId]);

  if (permissionState === 'unsupported') {
    return null;
  }

  // Show success state briefly when permission is granted
  if (permissionState === 'granted') {
    // Still try to register if not yet done
    if (!isRegistered && providerId) {
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
    return null;
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

          {/* Retry Button */}
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

          {/* Toggle Instructions */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-primary font-arabic py-1.5 hover:underline"
          >
            <Settings className="h-3.5 w-3.5" />
            كيفية تفعيل الإشعارات
            {showInstructions ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Instructions */}
          {showInstructions && (
            <div className="mt-2 p-2 bg-background/50 rounded-lg text-right">
              <p className="font-bold text-xs font-arabic mb-1.5 text-foreground">
                📱 على الجوال:
              </p>
              <ol className="text-[10px] text-muted-foreground font-arabic space-y-0.5 list-decimal list-inside mb-2">
                <li>اضغط على أيقونة "aA" أو 🔒 بجانب العنوان</li>
                <li>اختر "إعدادات الموقع"</li>
                <li>فعّل "الإشعارات"</li>
              </ol>
              <p className="font-bold text-xs font-arabic mb-1.5 text-foreground">
                💻 على الكمبيوتر:
              </p>
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

          <p className="text-[10px] text-muted-foreground font-arabic text-center mt-2">
            💡 الإشعارات مطلوبة لتنبيهك فوراً عند وصول طلب جديد
          </p>
        </CardContent>
      </Card>
    );
  }

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
