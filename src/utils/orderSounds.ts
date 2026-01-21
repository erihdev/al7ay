// Custom notification sounds for each order status using Web Audio API
import { getAudioContext as getSharedAudioContext } from '@/utils/audioContext';

// Sound tone types
export type SoundTone = 'classic' | 'modern' | 'gentle' | 'retro';

export const soundToneLabels: Record<SoundTone, string> = {
  classic: 'كلاسيكي',
  modern: 'عصري',
  gentle: 'هادئ',
  retro: 'ريترو',
};

// Volume control - get from localStorage (0-100, default 70)
export const getNotificationVolume = (): number => {
  const saved = localStorage.getItem('notification-volume');
  return saved ? parseInt(saved, 10) : 70;
};

export const setNotificationVolume = (volume: number) => {
  localStorage.setItem('notification-volume', String(Math.round(volume)));
};

// Tone control - global and per-status
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'completed' | 'cancelled';

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'طلب جديد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  out_for_delivery: 'قيد التوصيل',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const getNotificationTone = (): SoundTone => {
  const saved = localStorage.getItem('notification-tone');
  return (saved as SoundTone) || 'classic';
};

export const setNotificationTone = (tone: SoundTone) => {
  localStorage.setItem('notification-tone', tone);
};

// Per-status tone settings
export const getStatusTone = (status: OrderStatus): SoundTone => {
  const saved = localStorage.getItem(`notification-tone-${status}`);
  return (saved as SoundTone) || getNotificationTone();
};

export const setStatusTone = (status: OrderStatus, tone: SoundTone) => {
  localStorage.setItem(`notification-tone-${status}`, tone);
};

export const getPerStatusTonesEnabled = (): boolean => {
  const saved = localStorage.getItem('per-status-tones-enabled');
  return saved === 'true';
};

export const setPerStatusTonesEnabled = (enabled: boolean) => {
  localStorage.setItem('per-status-tones-enabled', String(enabled));
};

const getVolumeMultiplier = (): number => {
  return getNotificationVolume() / 100;
};

// Use centralized audio context
function getAudioContext(): AudioContext {
  return getSharedAudioContext();
}

// Helper to play a note
function playNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  baseGain: number = 0.3,
  type: OscillatorType = 'sine'
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const gain = baseGain * getVolumeMultiplier();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
  gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.1);
}

// ==================== CLASSIC TONE ====================
function playClassicPending() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 523.25, now, 0.2, 0.25); // C5
  playNote(ctx, 659.25, now + 0.15, 0.25, 0.25); // E5
}

function playClassicPreparing() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 392.00, now, 0.12, 0.2); // G4
  playNote(ctx, 440.00, now + 0.1, 0.12, 0.2); // A4
  playNote(ctx, 493.88, now + 0.2, 0.12, 0.2); // B4
  playNote(ctx, 523.25, now + 0.3, 0.2, 0.25); // C5
}

function playClassicReady() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 523.25, now, 0.15, 0.3); // C5
  playNote(ctx, 659.25, now + 0.12, 0.15, 0.3); // E5
  playNote(ctx, 783.99, now + 0.24, 0.15, 0.3); // G5
  playNote(ctx, 1046.50, now + 0.36, 0.4, 0.35); // C6
}

function playClassicDelivery() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const notes = [349.23, 392.00, 440.00, 493.88, 523.25, 587.33];
  notes.forEach((freq, i) => {
    playNote(ctx, freq, now + i * 0.08, 0.12, 0.22);
  });
  playNote(ctx, 698.46, now + 0.55, 0.25, 0.3);
}

function playClassicCompleted() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 523.25, now, 0.1, 0.25);
  playNote(ctx, 659.25, now + 0.08, 0.1, 0.25);
  playNote(ctx, 783.99, now + 0.16, 0.1, 0.25);
  playNote(ctx, 1046.50, now + 0.24, 0.15, 0.3);
  setTimeout(() => {
    const sparkleCtx = getAudioContext();
    const sparkleNow = sparkleCtx.currentTime;
    playNote(sparkleCtx, 1318.51, sparkleNow, 0.08, 0.15);
    playNote(sparkleCtx, 1567.98, sparkleNow + 0.06, 0.12, 0.15);
  }, 350);
}

function playClassicCancelled() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 493.88, now, 0.2, 0.2);
  playNote(ctx, 392.00, now + 0.15, 0.25, 0.18);
  playNote(ctx, 329.63, now + 0.35, 0.35, 0.15);
}

// ==================== MODERN TONE ====================
function playModernPending() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 880, now, 0.15, 0.2, 'triangle');
  playNote(ctx, 1100, now + 0.1, 0.2, 0.25, 'triangle');
}

function playModernPreparing() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 600, now, 0.1, 0.2, 'triangle');
  playNote(ctx, 750, now + 0.08, 0.1, 0.2, 'triangle');
  playNote(ctx, 900, now + 0.16, 0.1, 0.2, 'triangle');
  playNote(ctx, 1050, now + 0.24, 0.15, 0.25, 'triangle');
}

function playModernReady() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 800, now, 0.1, 0.3, 'triangle');
  playNote(ctx, 1000, now + 0.08, 0.1, 0.3, 'triangle');
  playNote(ctx, 1200, now + 0.16, 0.1, 0.3, 'triangle');
  playNote(ctx, 1600, now + 0.24, 0.3, 0.35, 'triangle');
}

function playModernDelivery() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  [500, 600, 700, 800, 1000].forEach((freq, i) => {
    playNote(ctx, freq, now + i * 0.06, 0.1, 0.22, 'triangle');
  });
}

function playModernCompleted() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 1000, now, 0.08, 0.25, 'triangle');
  playNote(ctx, 1200, now + 0.06, 0.08, 0.25, 'triangle');
  playNote(ctx, 1400, now + 0.12, 0.08, 0.25, 'triangle');
  playNote(ctx, 1800, now + 0.18, 0.2, 0.3, 'triangle');
}

function playModernCancelled() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 600, now, 0.15, 0.2, 'triangle');
  playNote(ctx, 450, now + 0.12, 0.2, 0.18, 'triangle');
  playNote(ctx, 300, now + 0.28, 0.25, 0.15, 'triangle');
}

// ==================== GENTLE TONE ====================
function playGentlePending() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 440, now, 0.4, 0.15, 'sine');
  playNote(ctx, 550, now + 0.3, 0.4, 0.15, 'sine');
}

function playGentlePreparing() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 350, now, 0.25, 0.12, 'sine');
  playNote(ctx, 400, now + 0.2, 0.25, 0.12, 'sine');
  playNote(ctx, 450, now + 0.4, 0.3, 0.15, 'sine');
}

function playGentleReady() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 400, now, 0.3, 0.18, 'sine');
  playNote(ctx, 500, now + 0.25, 0.3, 0.18, 'sine');
  playNote(ctx, 600, now + 0.5, 0.4, 0.2, 'sine');
}

function playGentleDelivery() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  [300, 350, 400, 450, 500].forEach((freq, i) => {
    playNote(ctx, freq, now + i * 0.15, 0.2, 0.12, 'sine');
  });
}

function playGentleCompleted() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 450, now, 0.25, 0.15, 'sine');
  playNote(ctx, 550, now + 0.2, 0.25, 0.15, 'sine');
  playNote(ctx, 650, now + 0.4, 0.35, 0.18, 'sine');
}

function playGentleCancelled() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 400, now, 0.35, 0.12, 'sine');
  playNote(ctx, 320, now + 0.3, 0.4, 0.1, 'sine');
}

// ==================== RETRO TONE ====================
function playRetroPending() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 523, now, 0.15, 0.25, 'square');
  playNote(ctx, 659, now + 0.12, 0.15, 0.25, 'square');
}

function playRetroPreparing() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 262, now, 0.1, 0.2, 'square');
  playNote(ctx, 330, now + 0.08, 0.1, 0.2, 'square');
  playNote(ctx, 392, now + 0.16, 0.1, 0.2, 'square');
  playNote(ctx, 523, now + 0.24, 0.15, 0.22, 'square');
}

function playRetroReady() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 523, now, 0.1, 0.25, 'square');
  playNote(ctx, 659, now + 0.08, 0.1, 0.25, 'square');
  playNote(ctx, 784, now + 0.16, 0.1, 0.25, 'square');
  playNote(ctx, 1047, now + 0.24, 0.2, 0.28, 'square');
}

function playRetroDelivery() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  [262, 294, 330, 392, 440, 523].forEach((freq, i) => {
    playNote(ctx, freq, now + i * 0.06, 0.08, 0.2, 'square');
  });
}

function playRetroCompleted() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 523, now, 0.08, 0.22, 'square');
  playNote(ctx, 659, now + 0.06, 0.08, 0.22, 'square');
  playNote(ctx, 784, now + 0.12, 0.08, 0.22, 'square');
  playNote(ctx, 1047, now + 0.18, 0.15, 0.25, 'square');
  setTimeout(() => {
    const ctx2 = getAudioContext();
    const now2 = ctx2.currentTime;
    playNote(ctx2, 1319, now2, 0.06, 0.15, 'square');
    playNote(ctx2, 1568, now2 + 0.05, 0.08, 0.15, 'square');
  }, 280);
}

function playRetroCancelled() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  playNote(ctx, 392, now, 0.12, 0.2, 'square');
  playNote(ctx, 294, now + 0.1, 0.15, 0.18, 'square');
  playNote(ctx, 220, now + 0.22, 0.2, 0.15, 'square');
}

// ==================== TONE MAPPINGS ====================
const toneSounds: Record<SoundTone, Record<string, () => void>> = {
  classic: {
    pending: playClassicPending,
    preparing: playClassicPreparing,
    ready: playClassicReady,
    out_for_delivery: playClassicDelivery,
    completed: playClassicCompleted,
    cancelled: playClassicCancelled,
  },
  modern: {
    pending: playModernPending,
    preparing: playModernPreparing,
    ready: playModernReady,
    out_for_delivery: playModernDelivery,
    completed: playModernCompleted,
    cancelled: playModernCancelled,
  },
  gentle: {
    pending: playGentlePending,
    preparing: playGentlePreparing,
    ready: playGentleReady,
    out_for_delivery: playGentleDelivery,
    completed: playGentleCompleted,
    cancelled: playGentleCancelled,
  },
  retro: {
    pending: playRetroPending,
    preparing: playRetroPreparing,
    ready: playRetroReady,
    out_for_delivery: playRetroDelivery,
    completed: playRetroCompleted,
    cancelled: playRetroCancelled,
  },
};

// Get tone for a specific status (uses per-status if enabled, otherwise global)
function getToneForStatus(status: OrderStatus): SoundTone {
  if (getPerStatusTonesEnabled()) {
    return getStatusTone(status);
  }
  return getNotificationTone();
}

// Public exports that use current tone (global or per-status)
export function playPendingSound() {
  const tone = getToneForStatus('pending');
  toneSounds[tone].pending();
}

export function playPreparingSound() {
  const tone = getToneForStatus('preparing');
  toneSounds[tone].preparing();
}

export function playReadySound() {
  const tone = getToneForStatus('ready');
  toneSounds[tone].ready();
}

export function playOutForDeliverySound() {
  const tone = getToneForStatus('out_for_delivery');
  toneSounds[tone].out_for_delivery();
}

export function playCompletedSound() {
  const tone = getToneForStatus('completed');
  toneSounds[tone].completed();
}

export function playCancelledSound() {
  const tone = getToneForStatus('cancelled');
  toneSounds[tone].cancelled();
}

// Play demo sound for a specific status with specific tone
export function playStatusDemoSound(status: OrderStatus, tone: SoundTone) {
  try {
    toneSounds[tone][status]();
  } catch (error) {
    console.error('Error playing status demo sound:', error);
  }
}

// 🔔 New Order Alert for Providers
export function playNewOrderSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const tone = getNotificationTone();
  const type: OscillatorType = tone === 'retro' ? 'square' : tone === 'modern' ? 'triangle' : 'sine';
  
  playNote(ctx, 880.00, now, 0.1, 0.3, type);
  playNote(ctx, 1046.50, now + 0.08, 0.1, 0.3, type);
  playNote(ctx, 880.00, now + 0.16, 0.1, 0.3, type);
  playNote(ctx, 1174.66, now + 0.24, 0.2, 0.35, type);
  
  setTimeout(() => {
    const ctx2 = getAudioContext();
    const now2 = ctx2.currentTime;
    playNote(ctx2, 880.00, now2, 0.08, 0.25, type);
    playNote(ctx2, 1046.50, now2 + 0.06, 0.08, 0.25, type);
    playNote(ctx2, 1318.51, now2 + 0.12, 0.15, 0.3, type);
  }, 400);
}

// 👋 Customer Arrived
export function playCustomerArrivedSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const tone = getNotificationTone();
  const type: OscillatorType = tone === 'retro' ? 'square' : tone === 'modern' ? 'triangle' : 'sine';
  
  playNote(ctx, 659.25, now, 0.25, 0.3, type);
  playNote(ctx, 523.25, now + 0.25, 0.35, 0.28, type);
}

// Map status to sound function
export const statusSounds: Record<string, () => void> = {
  pending: playPendingSound,
  preparing: playPreparingSound,
  ready: playReadySound,
  out_for_delivery: playOutForDeliverySound,
  completed: playCompletedSound,
  cancelled: playCancelledSound,
};

// Play sound for a specific status
export function playStatusSound(status: string) {
  const soundFn = statusSounds[status];
  if (soundFn) {
    try {
      soundFn();
    } catch (error) {
      console.error('Error playing status sound:', error);
    }
  }
}

// Play demo sound for a specific tone
export function playDemoSound(tone: SoundTone) {
  try {
    toneSounds[tone].ready();
  } catch (error) {
    console.error('Error playing demo sound:', error);
  }
}
