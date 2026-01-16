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
  const { isSDKLoaded, isSubscribed, permissionState, checkStatus, requestPermission } = useAimtellStatus(providerId);
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
    if (!isSDKLoaded) {
      return { status: 'loading', color: 'bg-yellow-500', icon: Loader2 };
    }
    if (permissionState === 'denied') {
      return { status: 'denied', color: 'bg-destructive', icon: XCircle };
    }
    if (permissionState === 'default') {
      return { status: 'pending', color: 'bg-yellow-500', icon: AlertCircle };
    }
    if (isSubscribed && permissionState === 'granted') {
      return { status: 'active', color: 'bg-green-500', icon: CheckCircle };
    }
    return { status: 'inactive', color: 'bg-muted', icon: BellOff };
  };

  const { status, color, icon: StatusIcon } = getOverallStatus();

  const statusMessages = {
    loading: 'جاري التحميل...',
    denied: 'الإشعارات مرفوضة',
    pending: 'بانتظار التفعيل',
    active: 'الإشعارات مفعّلة',
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
            <Badge variant={status === 'active' ? 'default' : 'secondary'} className="font-arabic">
              {statusMessages[status]}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-arabic">SDK Aimtell</span>
              <span className="flex items-center gap-1">
                {isSDKLoaded ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-arabic">صلاحية المتصفح</span>
              <span className="flex items-center gap-1">
                {permissionState === 'granted' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : permissionState === 'denied' ? (
                  <XCircle className="h-4 w-4 text-destructive" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="font-arabic text-xs">
                  {permissionState === 'granted' ? 'مسموح' : 
                   permissionState === 'denied' ? 'مرفوض' : 'غير محدد'}
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-arabic">الاشتراك</span>
              <span className="flex items-center gap-1">
                {isSubscribed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-arabic text-xs">
                  {isSubscribed ? 'مشترك' : 'غير مشترك'}
                </span>
              </span>
            </div>
          </div>

          {permissionState === 'denied' && (
            <div className="p-3 bg-destructive/10 rounded-lg text-sm font-arabic">
              <p className="text-destructive">
                تم رفض الإشعارات. يرجى تفعيلها من إعدادات المتصفح:
              </p>
              <ol className="list-decimal list-inside mt-2 text-muted-foreground space-y-1">
                <li>اضغط على أيقونة القفل بجانب عنوان الموقع</li>
                <li>ابحث عن "الإشعارات" أو "Notifications"</li>
                <li>غيّر الإعداد إلى "سماح"</li>
                <li>أعد تحميل الصفحة</li>
              </ol>
            </div>
          )}

          {permissionState === 'default' && (
            <Button 
              onClick={handleRequestPermission} 
              disabled={requesting}
              className="w-full font-arabic"
            >
              {requesting ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Bell className="h-4 w-4 ml-2" />
              )}
              تفعيل الإشعارات
            </Button>
          )}

          {status === 'active' && (
            <p className="text-sm text-muted-foreground font-arabic text-center">
              ✅ ستتلقى إشعارات الطلبات الجديدة حتى عند إغلاق المتصفح
            </p>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={checkStatus}
            className="w-full text-xs font-arabic"
          >
            تحديث الحالة
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
