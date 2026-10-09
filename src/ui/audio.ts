/**
 * Web Audio sound generator for Model Foundry.
 *
 * Rules:
 * - Web Audio tones only (no audio files).
 * - Quiet tap, slightly higher launch, soft event.
 * - Mute remembered in save, default on.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
      } catch {
        audioCtx = null;
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Quiet subtle tap tick for UI button clicks.
 */
export function playTap(enabled: boolean = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.035);
  } catch {
    // Audio output unavailable
  }
}

/**
 * Soft coin tick tone for purchases (products, team, upgrades).
 */
export function playPurchase(enabled: boolean = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.04); // E6

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.045);
  } catch {
    // Audio output unavailable
  }
}

/**
 * Bright ascending arpeggio for model launch (C5 - E5 - G5 - C6).
 */
export function playLaunch(enabled: boolean = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.06, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.15);
    });
  } catch {
    // Audio output unavailable
  }
}

/**
 * Sparkling high chime when Golden GPU appears or is tapped.
 */
export function playGoldenGpu(enabled: boolean = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; // C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + idx * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.07, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  } catch {
    // Audio output unavailable
  }
}

/**
 * Soft harmonic two-tone chord for events.
 */
export function playEvent(enabled: boolean = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, now);
    osc2.connect(gain);
    osc2.start(now);
    osc2.stop(now + 0.25);
  } catch {
    // Audio output unavailable
  }
}

/**
 * Bright higher chime when a product crosses a milestone level (x2/x3 multiplier).
 */
export function playMilestone(enabled: boolean = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.setValueAtTime(880, now + 0.08); // A5
    osc1.frequency.setValueAtTime(1318.5, now + 0.16); // E6
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.35);
  } catch {
    // Audio output unavailable
  }
}
