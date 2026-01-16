import { useAimtellStatus } from '@/hooks/useAimtellStatus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, BellOff, BellRing, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface NotificationStatusIndicatorProps {
  providerId: string | undefined;
}

export function NotificationStatusIndicator({ providerId }: NotificationStatusIndicatorProps) {
  const { isSDKLoaded, isSubscribed, permissionState, isReady, checkStatus, requestPermission } = useAimtellStatus(providerId);
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success('تم تفعيل الإشعارات بنجاح!');
      } else {
        toast.error('لم يتم السماح بالإشعارات');
      }
    } finally {
      setRequesting(false);
    }
  };

  // Determine overall status
  const getOverallStatus = () => {
    if (!isReady) {
      return { status: 'loading' as const, color: 'bg-yellow-500', icon: Loader2 };
    }
    if (permissionState === 'denied') {
      return { status: 'denied' as const, color: 'bg-destructive', icon: XCircle };
    }
    if (permissionState === 'default') {
      return { status: 'pending' as const, color: 'bg-yellow-500', icon: AlertCircle };
    }
    if (isSubscribed) {
      return { status: 'active' as const, color: 'bg-green-500', icon: CheckCircle };
    }
    return { status: 'inactive' as const, color: 'bg-muted', icon: BellOff };
  };

  const { status, color } = getOverallStatus();

  const statusMessages: Record<typeof status, string> = {
    loading: 'جاري التحميل...',
    denied: 'الإشعارات مرفوضة',
    pending: 'بانتظار التفعيل',
    active: 'الإشعارات مفعّلة ✓',
    inactive: 'الإشعارات غير مفعّلة',
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          {status === 'active' ? (
            <BellRing className="h-4 w-4 text-green-500" />
          ) : status === 'denied' ? (
            <BellOff className="h-4 w-4 text-destructive" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          <span className="hidden sm:inline font-arabic">الإشعارات</span>
          <span className={`absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full ${color}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold font-arabic">حالة الإشعارات</h4>
            <Badge 
              variant={status === 'active' ? 'default' : 'secondary'} 
              className={`font-arabic ${status === 'active' ? 'bg-green-500' : ''}`}
            >
              {statusMessages[status]}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-arabic">SDK Aimtell</span>
              <span className="flex items-center gap-1">
                {isSDKLoaded ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">جاهز</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">جاري التحميل</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-arabic">صلاحية المتصفح</span>
              <span className="flex items-center gap-1">
                {permissionState === 'granted' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">مسموح</span>
                  </>
                ) : permissionState === 'denied' ? (
                  <>
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs text-destructive">مرفوض</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-yellow-600">غير محدد</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-arabic">الاشتراك</span>
              <span className="flex items-center gap-1">
                {isSubscribed ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">مشترك</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">غير مشترك</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {status === 'active' && (
            <div className="p-3 bg-green-500/10 rounded-lg text-sm font-arabic text-center">
              <p className="text-green-700 dark:text-green-400">
                ✅ ستتلقى إشعارات الطلبات الجديدة حتى عند إغلاق المتصفح
              </p>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="p-3 bg-destructive/10 rounded-lg text-sm font-arabic">
              <p className="text-destructive font-semibold mb-2">
                ⚠️ تم رفض الإشعارات
              </p>
              <p className="text-muted-foreground text-xs">
                لتفعيلها: اضغط على أيقونة القفل 🔒 بجانب عنوان الموقع → الإشعارات → سماح → أعد تحميل الصفحة
              </p>
            </div>
          )}

          {permissionState === 'default' && (
            <Button 
              onClick={handleRequestPermission} 
              disabled={requesting}
              className="w-full font-arabic bg-primary"
            >
              {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Bell className="h-4 w-4 ml-2" />
              )}
              تفعيل الإشعارات
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkStatus}
            className="w-full text-xs font-arabic"
          >
            🔄 تحديث الحالة
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
