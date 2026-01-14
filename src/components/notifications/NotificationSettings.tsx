import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const { user } = useAuth();
  const {
    permission,
    isSubscribed,
    isSupported,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!user) {
    return null;
  }

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="h-5 w-5" />
            <p className="text-sm font-arabic">
              الإشعارات غير مدعومة في هذا المتصفح
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success('تم إلغاء الاشتراك في الإشعارات');
      } else {
        toast.error('حدث خطأ أثناء إلغاء الاشتراك');
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success('تم تفعيل الإشعارات بنجاح!');
      } else if (permission === 'denied') {
        toast.error('تم رفض صلاحية الإشعارات. يرجى تفعيلها من إعدادات المتصفح');
      } else {
        toast.error('حدث خطأ أثناء تفعيل الإشعارات');
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <Bell className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold font-arabic">إشعارات الطلبات</p>
              <p className="text-sm text-muted-foreground font-arabic">
                {isSubscribed
                  ? 'ستصلك إشعارات عند تحديث حالة طلبك'
                  : 'فعّل الإشعارات لتتبع طلباتك'}
              </p>
            </div>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>

        {permission === 'denied' && (
          <p className="text-xs text-destructive mt-2 font-arabic">
            تم رفض صلاحية الإشعارات. يرجى تفعيلها من إعدادات المتصفح
          </p>
        )}
      </CardContent>
    </Card>
  );
}
