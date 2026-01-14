import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

const statusMessages: Record<string, { message: string; emoji: string }> = {
  pending: { message: 'تم استلام طلبك', emoji: '📦' },
  preparing: { message: 'جاري تحضير طلبك', emoji: '☕' },
  ready: { message: 'طلبك جاهز للاستلام!', emoji: '✅' },
  out_for_delivery: { message: 'طلبك في الطريق إليك', emoji: '🚗' },
  completed: { message: 'تم إكمال طلبك', emoji: '🎉' },
  cancelled: { message: 'تم إلغاء طلبك', emoji: '❌' },
};

// Simple notification sound using Web Audio API
function createNotificationSound() {
  let audioContext: AudioContext | null = null;
  
  const playSound = () => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create pleasant chime sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.6);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.6);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  return { playSound };
}

export function useOrderStatusNotifications() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const soundRef = useRef<ReturnType<typeof createNotificationSound> | null>(null);
  
  // Load sound preference from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('order-sound-notifications');
    return saved !== 'false'; // Default to true
  });

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('order-sound-notifications', String(enabled));
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    if (!soundRef.current) {
      soundRef.current = createNotificationSound();
    }
    soundRef.current.playSound();
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
              // Play sound
              playNotificationSound();
              
              // Show toast notification
              toast(statusInfo.message, {
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
    };
  }, [user, playNotificationSound]);

  return { soundEnabled, toggleSound, playNotificationSound };
}
