import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playStatusSound, playNewOrderSound, playCustomerArrivedSound } from '@/utils/orderSounds';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface StatusInfo {
  message: string;
  emoji: string;
}

const statusMessages: Record<string, StatusInfo> = {
  pending: { message: 'تم استلام طلبك', emoji: '📦' },
  preparing: { message: 'جاري تحضير طلبك الآن', emoji: '☕' },
  ready: { message: 'طلبك جاهز للاستلام!', emoji: '✅' },
  out_for_delivery: { message: 'طلبك في الطريق إليك', emoji: '🚗' },
  completed: { message: 'تم تسليم طلبك بنجاح', emoji: '🎉' },
  cancelled: { message: 'تم إلغاء طلبك', emoji: '❌' },
};

export function useProviderOrderStatusNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const regularChannelRef = useRef<RealtimeChannel | null>(null);
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('provider-order-sound-notifications');
    return saved !== 'false';
  });

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('provider-order-sound-notifications', String(enabled));
  }, []);

  const playNotificationSound = useCallback((status: string) => {
    if (!soundEnabled) return;
    playStatusSound(status);
  }, [soundEnabled]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to provider order updates for this customer
    channelRef.current = supabase
      .channel(`customer-provider-order-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'provider_orders',
          filter: `customer_id=eq.${user.id}`,
        },
        async (payload) => {
          const newStatus = payload.new?.status as string;
          const oldStatus = payload.old?.status as string;
          const providerId = payload.new?.provider_id as string;
          
          if (newStatus && newStatus !== oldStatus) {
            const statusInfo = statusMessages[newStatus];
            
            if (statusInfo) {
              // Fetch provider name
              let providerName = 'المتجر';
              if (providerId) {
                const { data: provider } = await supabase
                  .from('service_providers')
                  .select('business_name')
                  .eq('id', providerId)
                  .single();
                if (provider) {
                  providerName = provider.business_name;
                }
              }

              // Play status-specific sound
              playNotificationSound(newStatus);
              
              // Show toast notification
              toast.success(statusInfo.message, {
                description: `${statusInfo.emoji} من ${providerName} - رقم الطلب: #${(payload.new as any)?.order_number || (payload.new?.id as string)?.slice(0, 8)}`,
                duration: 10000,
              });

              // Try to show browser notification if supported
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`${providerName} - ${statusInfo.message}`, {
                  body: `${statusInfo.emoji} طلبك من ${providerName}`,
                  icon: '/favicon.png',
                  tag: `order-${payload.new?.id}`,
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Also subscribe to regular orders table updates
    regularChannelRef.current = supabase
      .channel(`customer-orders-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new?.status as string;
          const oldStatus = payload.old?.status as string;
          
          if (newStatus && newStatus !== oldStatus) {
            const statusInfo = statusMessages[newStatus];
            
            if (statusInfo) {
              playNotificationSound(newStatus);
              
              toast.success(statusInfo.message, {
                description: `${statusInfo.emoji} رقم الطلب: #${(payload.new as any)?.order_number || (payload.new?.id as string)?.slice(0, 8)}`,
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
      regularChannelRef.current?.unsubscribe();
    };
  }, [user, playNotificationSound]);

  return { soundEnabled, toggleSound, playNotificationSound };
}
