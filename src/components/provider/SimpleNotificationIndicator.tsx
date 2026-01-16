import { Bell, BellOff, BellRing } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SimpleNotificationIndicatorProps {
  className?: string;
}

export function SimpleNotificationIndicator({ className }: SimpleNotificationIndicatorProps) {
  // Simple check - just browser permission
  const permission = 'Notification' in window ? Notification.permission : 'denied';

  if (permission === 'granted') {
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
