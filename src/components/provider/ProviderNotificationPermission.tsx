import { useState, useEffect } from 'react';
import { Bell, BellRing, RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
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

  const registerAimtellAttributes = () => {
    if (typeof window._at?.track !== 'function') {
      console.log('Aimtell SDK not ready');
      return false;
    }

    try {
      if (providerId) {
        window._at.track('attribute', { provider_id: providerId });
        window._at.track('alias', `provider_id==${providerId}`);
        console.log('✅ Provider registered for notifications:', providerId);
      }
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
        // Register with Aimtell for push notifications
        let registered = false;
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          registered = registerAimtellAttributes();
          if (registered) break;
        }
        
        toast.success('🔔 تم تفعيل الإشعارات بنجاح!', {
          description: 'ستتلقى إشعارات فورية عند وصول طلب جديد',
        });
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

  // Auto-register if already granted
  useEffect(() => {
    if (permissionState === 'granted' && providerId) {
      const timer = setTimeout(() => {
        registerAimtellAttributes();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [permissionState, providerId]);

  if (permissionState === 'granted' || permissionState === 'unsupported') {
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
