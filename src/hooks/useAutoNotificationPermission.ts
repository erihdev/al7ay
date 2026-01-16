import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useAutoNotificationPermission() {
  const hasRequested = useRef(false);

  useEffect(() => {
    // Only run once per session
    if (hasRequested.current) return;
    
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return;
    }

    // If already granted or denied, don't ask again
    if (Notification.permission !== 'default') {
      return;
    }

    // Auto-request permission after a short delay
    const timer = setTimeout(async () => {
      hasRequested.current = true;
      
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          toast.success('تم تفعيل الإشعارات تلقائياً ✓', {
            description: 'ستتلقى إشعارات الطلبات الجديدة'
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
      }
    }, 1500); // Wait 1.5 seconds before asking

    return () => clearTimeout(timer);
  }, []);

  return Notification.permission;
}
