import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useProviderOrderNotifications(providerId: string | undefined, enabled: boolean = true) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const playNotificationSound = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleA0AYIHPxalxGQBAlNK8l2UAAEmT06J5DQBEm9WtiycASZfUpH0RAEiY0qaGHQBKl9CjhB4ASJXPoYQeAEiU0KCEHwBJlNCghB8ASZPP');
    }
    audioRef.current.play().catch(console.error);
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
          playNotificationSound();
          toast.success('🔔 طلب جديد!', {
            description: `طلب من ${(payload.new as any).customer_name}`,
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
  }, [providerId, enabled, playNotificationSound]);

  return { playNotificationSound };
}
