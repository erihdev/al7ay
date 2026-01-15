import { useState, useEffect, useCallback } from 'react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

export function useLocalNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, permission]);

  const showNotification = useCallback(async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      console.log('Notifications not supported');
      return false;
    }

    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        dir: 'rtl',
        lang: 'ar',
      });

      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [isSupported, permission, requestPermission]);

  // Order status notification
  const notifyOrderStatus = useCallback((orderId: string, status: string) => {
    const statusMessages: Record<string, string> = {
      pending: 'تم استلام طلبك وجاري مراجعته',
      preparing: 'جاري تحضير طلبك الآن 👨‍🍳',
      ready: 'طلبك جاهز للاستلام! 🎉',
      out_for_delivery: 'طلبك في الطريق إليك 🚗',
      completed: 'تم توصيل طلبك بنجاح ✅',
      cancelled: 'تم إلغاء طلبك ❌',
    };

    return showNotification({
      title: 'تحديث الطلب',
      body: statusMessages[status] || 'تم تحديث حالة طلبك',
      tag: `order-${orderId}`,
      data: { url: '/orders', orderId },
    });
  }, [showNotification]);

  // Special offer notification
  const notifySpecialOffer = useCallback((title: string, discount: number) => {
    return showNotification({
      title: '🎁 عرض خاص!',
      body: `${title} - خصم ${discount}%`,
      tag: 'special-offer',
      data: { url: '/app' },
    });
  }, [showNotification]);

  // Scheduled order reminder
  const notifyScheduledOrder = useCallback((scheduledTime: string) => {
    return showNotification({
      title: '⏰ تذكير بالطلب المجدول',
      body: `لديك طلب مجدول في ${scheduledTime}`,
      tag: 'scheduled-reminder',
      data: { url: '/orders' },
      requireInteraction: true,
    });
  }, [showNotification]);

  // Cart reminder notification
  const notifyCartReminder = useCallback((itemCount: number) => {
    return showNotification({
      title: '🛒 لا تنس سلة التسوق!',
      body: `لديك ${itemCount} منتج في السلة في انتظارك`,
      tag: 'cart-reminder',
      data: { url: '/cart' },
    });
  }, [showNotification]);

  // Loyalty points notification
  const notifyLoyaltyPoints = useCallback((points: number, tier?: string) => {
    const message = tier 
      ? `مبروك! لقد وصلت للمستوى ${tier} 🏆`
      : `حصلت على ${points} نقطة جديدة!`;
    
    return showNotification({
      title: '⭐ نقاط الولاء',
      body: message,
      tag: 'loyalty-points',
      data: { url: '/profile' },
    });
  }, [showNotification]);

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
    notifyOrderStatus,
    notifySpecialOffer,
    notifyScheduledOrder,
    notifyCartReminder,
    notifyLoyaltyPoints,
  };
}
