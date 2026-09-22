import { BingoBall } from '../types';

let audioCtx: AudioContext | null = null;
let isMuted = false;
let isVoiceEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bingo_muted', muted ? '1' : '0');
  }
}

export function isSoundMuted(): boolean {
  if (typeof window !== 'undefined' && localStorage.getItem('bingo_muted') === '1') {
    isMuted = true;
  }
  return isMuted;
}

export function setVoiceEnabled(enabled: boolean) {
  isVoiceEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('bingo_voice', enabled ? '1' : '0');
  }
}

export function isVoiceCallingEnabled(): boolean {
  if (typeof window !== 'undefined' && localStorage.getItem('bingo_voice') === '0') {
    isVoiceEnabled = false;
  }
  return isVoiceEnabled;
}

/**
 * Play a tactile stamp click when daubing a number on the card
 */
export function playDaubSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    // AudioContext might be blocked until user gesture
  }
}

/**
 * Play ball drop chime
 */
export function playBallDropSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {
    // ignore
  }
}

/**
 * Error / invalid click sound
 */
export function playBuzzerSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore
  }
}

/**
 * Triumphant Fanfare for BINGO Winner
 */
export function playBingoFanfare() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.4 },  // C6
    ];

    let time = ctx.currentTime;
    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, time);

      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + n.d);
      time += n.d * 0.9;
    });
  } catch {
    // ignore
  }
}

/**
 * Speak the ball number (e.g., "B 12") via browser SpeechSynthesis
 */
export function speakBall(ball: BingoBall) {
  if (isMuted || !isVoiceEnabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel(); // cancel previous speech
    const utterance = new SpeechSynthesisUtterance(`${ball.letter}, ${ball.number}`);
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  } catch {
    // speech synthesis not allowed or supported
  }
}
