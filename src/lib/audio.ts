'use client';

// Web Audio API-based sound system
// All sounds generated programmatically - no external audio files

let audioContext: AudioContext | null = null;
let isMuted = false;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem('cuttlequest_muted', muted ? '1' : '0');
  }
}

export function getMuted(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cuttlequest_muted');
    if (stored !== null) {
      isMuted = stored === '1';
    }
  }
  return isMuted;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  if (isMuted) return;
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNotes(notes: [number, number][], type: OscillatorType = 'square', volume = 0.15) {
  if (isMuted) return;
  const ctx = getContext();
  let time = ctx.currentTime;
  notes.forEach(([freq, dur]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
    time += dur * 0.85;
  });
}

// === SFX ===

export function sfxTap() {
  playTone(800, 0.06, 'square', 0.08);
}

export function sfxCorrect() {
  playNotes([[523, 0.1], [659, 0.1], [784, 0.15]], 'square', 0.12);
}

export function sfxWrong() {
  playNotes([[300, 0.15], [220, 0.2]], 'sawtooth', 0.1);
}

export function sfxFactCard() {
  playNotes([[440, 0.1], [554, 0.1], [659, 0.15]], 'triangle', 0.1);
}

export function sfxStarChime(starNumber: number) {
  const baseFreq = 440 + (starNumber - 1) * 80;
  playTone(baseFreq, 0.3, 'triangle', 0.15);
}

export function sfxStarFlourish() {
  playNotes([
    [784, 0.1], [880, 0.1], [988, 0.1], [1047, 0.2], [1319, 0.3],
  ], 'square', 0.15);
}

export function sfxDropReveal() {
  playNotes([[523, 0.15], [659, 0.2]], 'triangle', 0.12);
}

export function sfxLegendaryFanfare() {
  playNotes([
    [523, 0.15], [659, 0.15], [784, 0.15], [1047, 0.25], [1319, 0.4],
  ], 'square', 0.2);
}

export function sfxStageUp() {
  playNotes([
    [262, 0.1], [330, 0.1], [392, 0.1], [523, 0.15],
    [659, 0.15], [784, 0.2], [1047, 0.3],
  ], 'square', 0.15);
}

export function sfxInkRelease() {
  if (isMuted) return;
  const ctx = getContext();
  const bufferSize = ctx.sampleRate * 0.2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function sfxTentacleStrike() {
  playNotes([[1200, 0.03], [800, 0.05], [400, 0.08]], 'sawtooth', 0.12);
}

export function sfxPredatorAlert() {
  playNotes([[220, 0.2], [330, 0.2], [220, 0.2]], 'sawtooth', 0.15);
}

export function sfxDetectionWarning() {
  playNotes([[440, 0.1], [440, 0.1]], 'square', 0.12);
}

export function sfxCamouflageActivate() {
  playNotes([[330, 0.15], [440, 0.1], [554, 0.15]], 'triangle', 0.08);
}

export function sfxCodexUnlock() {
  playNotes([[392, 0.15], [523, 0.15], [659, 0.2]], 'triangle', 0.1);
}

// === Music (simple looping chiptune patterns) ===

let currentMusic: { oscillators: OscillatorNode[]; gains: GainNode[] } | null = null;

export function stopMusic() {
  if (currentMusic) {
    currentMusic.oscillators.forEach(o => { try { o.stop(); } catch {} });
    currentMusic = null;
  }
}

function createMusicLoop(
  patterns: { freq: number; type: OscillatorType; volume: number }[],
  bpm: number
): void {
  if (isMuted) return;
  stopMusic();
  const ctx = getContext();
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];

  patterns.forEach(({ freq, type, volume }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    // Simple tremolo for rhythm feel
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(bpm / 60, ctx.currentTime);
    lfoGain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    oscillators.push(osc, lfo);
    gains.push(gain, lfoGain);
  });

  currentMusic = { oscillators, gains };
}

export function playStageMusic(stage: string) {
  switch (stage) {
    case 'egg':
      createMusicLoop([
        { freq: 130.81, type: 'triangle', volume: 0.04 },
        { freq: 196, type: 'sine', volume: 0.03 },
      ], 60);
      break;
    case 'hatchling':
      createMusicLoop([
        { freq: 261.63, type: 'triangle', volume: 0.04 },
        { freq: 329.63, type: 'square', volume: 0.02 },
      ], 90);
      break;
    case 'juvenile':
      createMusicLoop([
        { freq: 196, type: 'square', volume: 0.04 },
        { freq: 293.66, type: 'triangle', volume: 0.03 },
      ], 110);
      break;
    case 'adult':
      createMusicLoop([
        { freq: 164.81, type: 'square', volume: 0.04 },
        { freq: 246.94, type: 'sawtooth', volume: 0.02 },
        { freq: 329.63, type: 'triangle', volume: 0.03 },
      ], 120);
      break;
  }
}
