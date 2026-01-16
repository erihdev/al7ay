// Custom notification sounds for each order status using Web Audio API

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Helper to play a note
function playNote(
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  gain: number = 0.3,
  type: OscillatorType = 'sine'
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
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

// 📦 Pending - Gentle confirmation chime (two soft notes)
export function playPendingSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Soft double chime - "ding ding"
  playNote(ctx, 523.25, now, 0.2, 0.25); // C5
  playNote(ctx, 659.25, now + 0.15, 0.25, 0.25); // E5
}

// ☕ Preparing - Busy kitchen sounds (rhythmic notes)
export function playPreparingSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Upbeat rhythm - excitement building
  playNote(ctx, 392.00, now, 0.12, 0.2); // G4
  playNote(ctx, 440.00, now + 0.1, 0.12, 0.2); // A4
  playNote(ctx, 493.88, now + 0.2, 0.12, 0.2); // B4
  playNote(ctx, 523.25, now + 0.3, 0.2, 0.25); // C5
}

// ✅ Ready - Triumphant fanfare (celebration melody)
export function playReadySound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Victory fanfare - your order is ready!
  playNote(ctx, 523.25, now, 0.15, 0.3); // C5
  playNote(ctx, 659.25, now + 0.12, 0.15, 0.3); // E5
  playNote(ctx, 783.99, now + 0.24, 0.15, 0.3); // G5
  playNote(ctx, 1046.50, now + 0.36, 0.4, 0.35); // C6 - held longer
}

// 🚗 Out for Delivery - Exciting journey sound (ascending with energy)
export function playOutForDeliverySound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Fast ascending - on the way!
  const notes = [349.23, 392.00, 440.00, 493.88, 523.25, 587.33]; // F4 to D5
  notes.forEach((freq, i) => {
    playNote(ctx, freq, now + i * 0.08, 0.12, 0.22);
  });
  // Final emphasis
  playNote(ctx, 698.46, now + 0.55, 0.25, 0.3); // F5
}

// 🎉 Completed - Celebration melody (happy jingle)
export function playCompletedSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Happy completion melody
  playNote(ctx, 523.25, now, 0.1, 0.25); // C5
  playNote(ctx, 659.25, now + 0.08, 0.1, 0.25); // E5
  playNote(ctx, 783.99, now + 0.16, 0.1, 0.25); // G5
  playNote(ctx, 1046.50, now + 0.24, 0.15, 0.3); // C6
  
  // Sparkle effect
  setTimeout(() => {
    const sparkleCtx = getAudioContext();
    const sparkleNow = sparkleCtx.currentTime;
    playNote(sparkleCtx, 1318.51, sparkleNow, 0.08, 0.15); // E6
    playNote(sparkleCtx, 1567.98, sparkleNow + 0.06, 0.12, 0.15); // G6
  }, 350);
}

// ❌ Cancelled - Sad descending sound
export function playCancelledSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Descending sad tones
  playNote(ctx, 493.88, now, 0.2, 0.2); // B4
  playNote(ctx, 392.00, now + 0.15, 0.25, 0.18); // G4
  playNote(ctx, 329.63, now + 0.35, 0.35, 0.15); // E4
}

// 🔔 New Order Alert for Providers - Attention-grabbing
export function playNewOrderSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Urgent but pleasant alert
  playNote(ctx, 880.00, now, 0.1, 0.3); // A5
  playNote(ctx, 1046.50, now + 0.08, 0.1, 0.3); // C6
  playNote(ctx, 880.00, now + 0.16, 0.1, 0.3); // A5
  playNote(ctx, 1174.66, now + 0.24, 0.2, 0.35); // D6
  
  // Second phrase
  setTimeout(() => {
    const ctx2 = getAudioContext();
    const now2 = ctx2.currentTime;
    playNote(ctx2, 880.00, now2, 0.08, 0.25); // A5
    playNote(ctx2, 1046.50, now2 + 0.06, 0.08, 0.25); // C6
    playNote(ctx2, 1318.51, now2 + 0.12, 0.15, 0.3); // E6
  }, 400);
}

// 👋 Customer Arrived - Gentle doorbell
export function playCustomerArrivedSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Classic doorbell ding-dong
  playNote(ctx, 659.25, now, 0.25, 0.3); // E5
  playNote(ctx, 523.25, now + 0.25, 0.35, 0.28); // C5
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
