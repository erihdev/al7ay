import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Simple notification sound using Web Audio API
function createNotificationSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playSound = () => {
    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Create oscillator for a pleasant notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Pleasant bell-like sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // C#6
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2); // A5
    
    // Envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.15);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Play second tone
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1100, audioContext.currentTime);
      
      gain2.gain.setValueAtTime(0, audioContext.currentTime);
      gain2.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + 0.05);
      gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);
      
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.4);
    }, 200);
  };

  return { playSound, audioContext };
}

export function useOrderNotifications(enabled: boolean = true) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const soundRef = useRef<ReturnType<typeof createNotificationSound> | null>(null);

  const playNotificationSound = useCallback(() => {
    if (!soundRef.current) {
      soundRef.current = createNotificationSound();
    }
    soundRef.current.playSound();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to new orders
    channelRef.current = supabase
      .channel('admin-new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as any;
          
          // Play notification sound
          playNotificationSound();
          
          // Show toast
          toast.success(
            `طلب جديد من ${newOrder.customer_name}`,
            {
              description: `${newOrder.order_type === 'delivery' ? 'توصيل' : 'استلام'} - ${Number(newOrder.total_amount).toFixed(0)} ر.س`,
              duration: 10000,
            }
          );
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [enabled, playNotificationSound]);

  return { playNotificationSound };
}
