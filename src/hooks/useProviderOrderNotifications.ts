import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Different notification sounds for different order types
const NOTIFICATION_SOUNDS = {
  // Delivery order - longer, more attention-grabbing tone
  delivery: 'data:audio/wav;base64,UklGRl4HAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YToHAACAgoWGh4mKi42Oj5GSlJWXmJmanJ2foKGjpKanqaqrrq+wsrO1tre5uru9vr/BwsPFxsfJysvNzs/R0tPV1tfZ2tvc3t/h4uPl5ufo6err7e7v8fLz9fb3+fr7/P3+//38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPT0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEA',
  
  // Pickup order - shorter, calmer tone  
  pickup: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleA0AYIHPxalxGQBAlNK8l2UAAEmT06J5DQBEm9WtiycASZfUpH0RAEiY0qaGHQBKl9CjhB4ASJXPoYQeAEiU0KCEHwBJlNCghB8ASZPP',
  
  // Urgent order - repeated beeps
  urgent: 'data:audio/wav;base64,UklGRqQIAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YYAIAACAgoSGiIqMjo+RkpSVl5iZmpucoJ+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8A//79/Pv6+fj39vX08/Lx8O/u7ezr6uno5+bl5OPi4eDf3t3c29rZ2NfW1dTT0tHQz87NzMvKycjHxsXEw8LBwL++vby7urm4t7a1tLOysbCvrq2sq6qpqKempaSjoqGgn56dnJuamZiXlpWUk5KRkI+OjYyLiomIh4aFhIOCgYB/fn18e3p5eHd2dXRzcnFwb25tbGtqaWhnZmVkY2JhYF9eXVxbWllYV1ZVVFNSUVBPTk1MS0pJSEdGRURDQkFAPz49PDs6OTg3NjU0MzIxMC8uLSwrKikoJyYlJCMiISAfHh0cGxoZGBcWFRQTEhEQDw4NDAsKCQgHBgUEAwIBAA=='
};

export type NotificationSoundType = 'delivery' | 'pickup' | 'urgent';

export function useProviderOrderNotifications(providerId: string | undefined, enabled: boolean = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const playNotificationSound = useCallback((type: NotificationSoundType = 'pickup') => {
    const soundUrl = NOTIFICATION_SOUNDS[type] || NOTIFICATION_SOUNDS.pickup;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    audioRef.current = new Audio(soundUrl);
    audioRef.current.volume = 1;
    
    // For urgent sounds, play multiple times
    if (type === 'urgent') {
      let playCount = 0;
      const playUrgent = () => {
        if (playCount < 3 && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
          playCount++;
          setTimeout(playUrgent, 500);
        }
      };
      playUrgent();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  const getOrderSoundType = useCallback((order: any): NotificationSoundType => {
    // Check if order is urgent (high value or has notes indicating urgency)
    if (order.total_amount > 200 || order.notes?.includes('عاجل')) {
      return 'urgent';
    }
    // Return sound based on order type
    return order.order_type === 'delivery' ? 'delivery' : 'pickup';
  }, []);

  useEffect(() => {
    if (!providerId || !enabled) return;

    // Subscribe to new orders for this provider
    channelRef.current = supabase
      .channel(`provider-orders-${providerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'provider_orders',
          filter: `provider_id=eq.${providerId}`
        },
        (payload) => {
          console.log('New order received:', payload);
          const order = payload.new as any;
          const soundType = getOrderSoundType(order);
          playNotificationSound(soundType);
          
          const orderTypeLabel = order.order_type === 'delivery' ? '🚗 توصيل' : '📦 استلام';
          toast.success(`🔔 طلب جديد - ${orderTypeLabel}`, {
            description: `طلب من ${order.customer_name} - ${order.total_amount} ر.س`,
            duration: 10000,
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [providerId, enabled, playNotificationSound, getOrderSoundType]);

  return { playNotificationSound };
}
