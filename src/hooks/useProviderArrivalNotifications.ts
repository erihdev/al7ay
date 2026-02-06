import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getAudioContext } from '@/utils/audioContext';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Play arrival notification sound using centralized audio context
function playArrivalNotificationSound() {
  try {
    const audioContext = getAudioContext();
    const frequencies = [880, 660, 880, 1100]; // A5, E5, A5, C#6
    
    frequencies.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.15);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + i * 0.15);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + i * 0.15 + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + i * 0.15 + 0.25);
      
      oscillator.start(audioContext.currentTime + i * 0.15);
      oscillator.stop(audioContext.currentTime + i * 0.15 + 0.3);
    });
  } catch {
    // Silent fail for audio issues
  }
}

interface ArrivalNotification {
  orderId: string;
  customerName?: string;
  timestamp: Date;
}

export function useProviderArrivalNotifications(providerId: string | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [arrivals, setArrivals] = useState<ArrivalNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('provider-arrival-sound');
    return saved !== 'false';
  });

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('provider-arrival-sound', String(enabled));
  }, []);

  const playArrivalSound = useCallback(() => {
    if (!soundEnabled) return;
    playArrivalNotificationSound();
  }, [soundEnabled]);

  const showArrivalNotification = useCallback((orderId: string, customerName?: string, orderNumber?: number | null) => {
    playArrivalSound();
    
    const orderShortId = orderNumber || orderId.slice(-4).toUpperCase();
    
    toast.success('🙋 عميل وصل!', {
      description: `العميل وصل لاستلام الطلب #${orderShortId}`,
      duration: 15000,
      action: {
        label: 'عرض الطلبات',
        onClick: () => window.location.href = '/provider-dashboard?tab=orders'
      }
    });

    // Request browser notification permission and show notification
    // Check if Notification API is available (not all browsers/environments support it)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          new Notification('🙋 عميل وصل!', {
            body: `العميل وصل لاستلام الطلب #${orderShortId}`,
            icon: '/icons/icon-192.png',
            tag: `arrival-${orderId}`,
            requireInteraction: true
          });
        }
      } catch {
        // Silent fail - some environments block Notification API
      }
    }

    setArrivals(prev => [...prev, { orderId, customerName, timestamp: new Date() }]);
  }, [playArrivalSound]);

  const clearArrival = useCallback((orderId: string) => {
    setArrivals(prev => prev.filter(a => a.orderId !== orderId));
  }, []);

  useEffect(() => {
    if (!providerId) return;

    channelRef.current = supabase
      .channel(`provider-arrivals-${providerId}`)
      .on('broadcast', { event: 'customer_arrived' }, (payload) => {
        showArrivalNotification(payload.payload.orderId, payload.payload.customerName);
      })
      .subscribe();

    // Request notification permission - with safety checks
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } catch {
        // Silent fail - some environments don't support Notification API
      }
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [providerId, showArrivalNotification]);

  return {
    arrivals,
    soundEnabled,
    toggleSound,
    clearArrival,
    showArrivalNotification,
    playArrivalSound
  };
}
