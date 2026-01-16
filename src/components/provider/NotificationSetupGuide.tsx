import { useState } from 'react';
import { Bell, BellOff, BellRing, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Smartphone, Monitor, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAimtellStatus } from '@/hooks/useAimtellStatus';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSetupGuideProps {
  providerId: string | undefined;
}

export function NotificationSetupGuide({ providerId }: NotificationSetupGuideProps) {
  const { isSDKLoaded, isSubscribed, permissionState, requestPermission, checkStatus } = useAimtellStatus(providerId);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success('تم تفعيل الإشعارات بنجاح!');
      } else {
        toast.error('لم يتم السماح بالإشعارات');
        setShowInstructions(true);
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('حدث خطأ أثناء طلب الإذن');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (!providerId) return;
    
    setIsTestLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'new_order',
          orderId: `test-${Date.now()}`,
          providerId: providerId,
          customerName: 'اختبار الإشعارات',
          totalAmount: 50,
          orderType: 'pickup'
        }
      });

      if (error) throw error;
      toast.success('تم إرسال إشعار تجريبي - تحقق من وصوله!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('فشل إرسال الإشعار التجريبي');
    } finally {
      setIsTestLoading(false);
    }
  };

  // Determine status
  const isFullyEnabled = isSDKLoaded && permissionState === 'granted';
  const isDenied = permissionState === 'denied';
  const isPending = permissionState === 'default';

  return (
    <Card className={`border-2 ${isFullyEnabled ? 'border-green-500/30 bg-green-500/5' : isDenied ? 'border-destructive/30 bg-destructive/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isFullyEnabled ? (
              <div className="p-2 rounded-full bg-green-500/20">
                <BellRing className="h-5 w-5 text-green-600" />
              </div>
            ) : isDenied ? (
              <div className="p-2 rounded-full bg-destructive/20">
                <BellOff className="h-5 w-5 text-destructive" />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
            )}
            <div>
              <CardTitle className="text-base font-arabic">
                {isFullyEnabled ? 'الإشعارات مفعّلة ✅' : isDenied ? 'الإشعارات محظورة ❌' : 'الإشعارات غير مفعّلة ⚠️'}
              </CardTitle>
              <CardDescription className="font-arabic text-xs mt-0.5">
                {isFullyEnabled 
                  ? 'ستتلقى إشعاراً فورياً عند وصول طلب جديد'
                  : isDenied
                  ? 'لن تتلقى إشعارات الطلبات الجديدة'
                  : 'فعّل الإشعارات لتتلقى تنبيهات الطلبات الجديدة'}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={checkStatus}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${isSDKLoaded ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}`}>
            {isSDKLoaded ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            <span>نظام الإشعارات</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${permissionState === 'granted' ? 'bg-green-500/10 text-green-600' : permissionState === 'denied' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-500/10 text-yellow-600'}`}>
            {permissionState === 'granted' ? <CheckCircle2 className="h-3 w-3" /> : permissionState === 'denied' ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            <span>إذن المتصفح</span>
          </div>
        </div>

        {/* Action buttons */}
        {!isFullyEnabled && (
          <div className="flex flex-col gap-2">
            {isPending && (
              <Button 
                onClick={handleEnableNotifications} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <Bell className="h-4 w-4 ml-2" />
                )}
                تفعيل الإشعارات
              </Button>
            )}
            
            {isDenied && (
              <Alert variant="destructive" className="border-destructive/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-arabic">الإشعارات محظورة في المتصفح</AlertTitle>
                <AlertDescription className="font-arabic text-xs">
                  لتفعيل الإشعارات، يجب تغيير إعدادات المتصفح يدوياً
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Instructions */}
        <Collapsible open={showInstructions || isDenied} onOpenChange={setShowInstructions}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
              <span>كيفية تفعيل الإشعارات</span>
              {showInstructions || isDenied ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {/* Desktop instructions */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Monitor className="h-4 w-4" />
                <span>على الكمبيوتر</span>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside mr-6">
                <li>اضغط على أيقونة القفل 🔒 بجانب عنوان الموقع</li>
                <li>ابحث عن "الإشعارات" أو "Notifications"</li>
                <li>غيّر الإعداد إلى "سماح" أو "Allow"</li>
                <li>أعد تحميل الصفحة</li>
              </ol>
            </div>

            {/* Mobile instructions */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Smartphone className="h-4 w-4" />
                <span>على الجوال</span>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside mr-6">
                <li>افتح إعدادات المتصفح (Chrome/Safari)</li>
                <li>ابحث عن "إعدادات الموقع" أو "Site Settings"</li>
                <li>ابحث عن الموقع al7ay.lovable.app</li>
                <li>فعّل الإشعارات</li>
              </ol>
            </div>

            {/* iOS specific note */}
            <Alert className="border-blue-500/30 bg-blue-500/5">
              <Smartphone className="h-4 w-4 text-blue-500" />
              <AlertTitle className="font-arabic text-sm">ملاحظة لمستخدمي iPhone</AlertTitle>
              <AlertDescription className="font-arabic text-xs">
                لتفعيل الإشعارات على iPhone، يجب أولاً إضافة التطبيق للشاشة الرئيسية عبر زر المشاركة ثم "إضافة للشاشة الرئيسية"
              </AlertDescription>
            </Alert>
          </CollapsibleContent>
        </Collapsible>

        {/* Test notification button */}
        {isFullyEnabled && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestNotification}
            disabled={isTestLoading}
            className="w-full"
          >
            {isTestLoading ? (
              <RefreshCw className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <BellRing className="h-4 w-4 ml-2" />
            )}
            إرسال إشعار تجريبي
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
