import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playStatusSound } from '@/utils/orderSounds';
import type { RealtimeChannel } from '@supabase/supabase-js';

const statusMessages: Record<string, { message: string; emoji: string }> = {
  pending: { message: 'تم استلام طلبك', emoji: '📦' },
  preparing: { message: 'جاري تحضير طلبك', emoji: '☕' },
  ready: { message: 'طلبك جاهز للاستلام!', emoji: '✅' },
  out_for_delivery: { message: 'طلبك في الطريق إليك', emoji: '🚗' },
  completed: { message: 'تم إكمال طلبك', emoji: '🎉' },
  cancelled: { message: 'تم إلغاء طلبك', emoji: '❌' },
};

export function useOrderStatusNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Load sound preference from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('order-sound-notifications');
    return saved !== 'false'; // Default to true
  });

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('order-sound-notifications', String(enabled));
  }, []);

  const playNotificationSound = useCallback((status: string) => {
    if (!soundEnabled) return;
    playStatusSound(status);
  }, [soundEnabled]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to order updates for this user
    channelRef.current = supabase
      .channel(`customer-order-updates-${user.id}`)
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
          
          // Only notify if status actually changed
          if (newStatus && newStatus !== oldStatus) {
            const statusInfo = statusMessages[newStatus];
            
            if (statusInfo) {
              // Play status-specific sound
              playNotificationSound(newStatus);
              
              // Show toast notification
              toast(statusInfo.message, {
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
    };
  }, [user, playNotificationSound]);

  return { soundEnabled, toggleSound, playNotificationSound };
}
