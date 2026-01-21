/**
 * Centralized Audio Context Manager
 * Single instance for all audio functionality across the app
 */

let audioContext: AudioContext | null = null;

/**
 * Get or create a singleton AudioContext instance
 * Automatically resumes suspended contexts (required for browser autoplay policies)
 */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  return audioContext;
}

/**
 * Clean up audio context (call on app unmount if needed)
 */
export function closeAudioContext(): Promise<void> | undefined {
  if (audioContext) {
    const ctx = audioContext;
    audioContext = null;
    return ctx.close();
  }
}

/**
 * Play a simple note using the shared audio context
 */
export function playNote(
  frequency: number,
  startTime: number,
  duration: number,
  gain: number = 0.3,
  type: OscillatorType = 'sine'
): void {
  const ctx = getAudioContext();
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

/**
 * Play a click sound for UI feedback
 */
export function playClickSound(): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.03);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch {
    // Silent fail for audio issues
  }
}

/**
 * Play proximity alert sounds for delivery tracking
 */
export function playProximitySound(type: 'nearby' | 'close' | 'arrived'): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'arrived':
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1047, now + 0.1);
        oscillator.frequency.setValueAtTime(1319, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
      case 'close':
        oscillator.frequency.setValueAtTime(659, now);
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.setValueAtTime(0.01, now + 0.1);
        gainNode.gain.setValueAtTime(0.25, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
      case 'nearby':
      default:
        oscillator.frequency.setValueAtTime(523, now);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }
  } catch {
    // Silent fail for audio issues
  }
}
