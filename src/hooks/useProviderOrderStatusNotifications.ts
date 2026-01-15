import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
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

// Melody notification sound using Web Audio API
function createMelodySound() {
  let audioContext: AudioContext | null = null;
  
  const playSound = (isPositive: boolean = true) => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      if (isPositive) {
        // Happy ascending melody for positive updates
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const oscillator = audioContext!.createOscillator();
          const gainNode = audioContext!.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext!.destination);
          
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, audioContext!.currentTime + i * 0.12);
          
          gainNode.gain.setValueAtTime(0, audioContext!.currentTime + i * 0.12);
          gainNode.gain.linearRampToValueAtTime(0.25, audioContext!.currentTime + i * 0.12 + 0.03);
          gainNode.gain.linearRampToValueAtTime(0, audioContext!.currentTime + i * 0.12 + 0.2);
          
          oscillator.start(audioContext!.currentTime + i * 0.12);
          oscillator.stop(audioContext!.currentTime + i * 0.12 + 0.25);
        });
      } else {
        // Descending melody for cancelled
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  return { playSound };
}

export function useProviderOrderStatusNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const regularChannelRef = useRef<RealtimeChannel | null>(null);
  const soundRef = useRef<ReturnType<typeof createMelodySound> | null>(null);
  
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('provider-order-sound-notifications');
    return saved !== 'false';
  });

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('provider-order-sound-notifications', String(enabled));
  }, []);

  const playNotificationSound = useCallback((isPositive: boolean = true) => {
    if (!soundEnabled) return;
    
    if (!soundRef.current) {
      soundRef.current = createMelodySound();
    }
    soundRef.current.playSound(isPositive);
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

              // Play appropriate sound
              const isPositive = newStatus !== 'cancelled';
              playNotificationSound(isPositive);
              
              // Show toast notification
              toast.success(statusInfo.message, {
                description: `${statusInfo.emoji} من ${providerName} - رقم الطلب: #${(payload.new?.id as string)?.slice(0, 8)}`,
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
              const isPositive = newStatus !== 'cancelled';
              playNotificationSound(isPositive);
              
              toast.success(statusInfo.message, {
                description: `${statusInfo.emoji} رقم الطلب: #${(payload.new?.id as string)?.slice(0, 8)}`,
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
