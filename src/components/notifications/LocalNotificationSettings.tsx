import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, ShoppingCart, Gift, Clock, Star, CheckCircle2 } from 'lucide-react';
import { useLocalNotifications } from '@/hooks/useLocalNotifications';
import { toast } from 'sonner';

export function LocalNotificationSettings() {
  const { 
    permission, 
    isSupported, 
    requestPermission,
    notifyOrderStatus,
    notifySpecialOffer,
    notifyCartReminder,
    notifyLoyaltyPoints
  } = useLocalNotifications();
  
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Notification preferences (stored in localStorage)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('notification_preferences');
    return saved ? JSON.parse(saved) : {
      orderUpdates: true,
      specialOffers: true,
      cartReminders: true,
      loyaltyPoints: true,
    };
  });

  const savePreferences = (newPrefs: typeof preferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('notification_preferences', JSON.stringify(newPrefs));
  };

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    const granted = await requestPermission();
    setIsRequesting(false);
    
    if (granted) {
      toast.success('تم تفعيل الإشعارات بنجاح!');
    } else {
      toast.error('لم يتم السماح بالإشعارات. يمكنك تغيير ذلك من إعدادات المتصفح.');
    }
  };

  const handleTestNotification = async (type: string) => {
    switch (type) {
      case 'order':
        await notifyOrderStatus('test-123', 'ready');
        break;
      case 'offer':
        await notifySpecialOffer('قهوة لاتيه مثلجة', 25);
        break;
      case 'cart':
        await notifyCartReminder(3);
        break;
      case 'loyalty':
        await notifyLoyaltyPoints(50);
        break;
    }
    toast.success('تم إرسال إشعار تجريبي!');
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BellOff className="h-5 w-5" />
            <p>الإشعارات غير مدعومة في هذا المتصفح</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              الإشعارات المحلية
            </CardTitle>
            <CardDescription className="mt-1">
              تلقي إشعارات عن طلباتك والعروض الخاصة
            </CardDescription>
          </div>
          {permission === 'granted' && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 ml-1" />
              مفعّل
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {permission !== 'granted' ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
              <BellRing className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">فعّل الإشعارات</p>
                <p className="text-sm text-muted-foreground">
                  احصل على تنبيهات فورية عن حالة طلباتك والعروض الخاصة
                </p>
              </div>
            </div>
            <Button 
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              className="w-full font-arabic"
            >
              {isRequesting ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}
            </Button>
            {permission === 'denied' && (
              <p className="text-sm text-destructive text-center">
                تم رفض الإشعارات. يمكنك تغيير ذلك من إعدادات المتصفح.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Order Updates */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Bell className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <Label htmlFor="orderUpdates" className="font-medium">تحديثات الطلبات</Label>
                  <p className="text-xs text-muted-foreground">إشعار عند تغير حالة طلبك</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleTestNotification('order')}
                  className="text-xs"
                >
                  تجربة
                </Button>
                <Switch
                  id="orderUpdates"
                  checked={preferences.orderUpdates}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, orderUpdates: checked })
                  }
                />
              </div>
            </div>

            {/* Special Offers */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <Gift className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <Label htmlFor="specialOffers" className="font-medium">العروض الخاصة</Label>
                  <p className="text-xs text-muted-foreground">إشعار عند توفر عروض جديدة</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleTestNotification('offer')}
                  className="text-xs"
                >
                  تجربة
                </Button>
                <Switch
                  id="specialOffers"
                  checked={preferences.specialOffers}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, specialOffers: checked })
                  }
                />
              </div>
            </div>

            {/* Cart Reminders */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <Label htmlFor="cartReminders" className="font-medium">تذكير السلة</Label>
                  <p className="text-xs text-muted-foreground">تذكير بالمنتجات في السلة</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleTestNotification('cart')}
                  className="text-xs"
                >
                  تجربة
                </Button>
                <Switch
                  id="cartReminders"
                  checked={preferences.cartReminders}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, cartReminders: checked })
                  }
                />
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <Label htmlFor="loyaltyPoints" className="font-medium">نقاط الولاء</Label>
                  <p className="text-xs text-muted-foreground">إشعار عند كسب نقاط جديدة</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleTestNotification('loyalty')}
                  className="text-xs"
                >
                  تجربة
                </Button>
                <Switch
                  id="loyaltyPoints"
                  checked={preferences.loyaltyPoints}
                  onCheckedChange={(checked) => 
                    savePreferences({ ...preferences, loyaltyPoints: checked })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
