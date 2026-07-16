let sharedCtx = null;
let masterGain = null;
let bgmGain = null;
let sfxGain = null;
let audioEnabled = true;

function ensureContext() {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = sharedCtx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(sharedCtx.destination);

    bgmGain = sharedCtx.createGain();
    bgmGain.gain.value = 0.42;
    bgmGain.connect(masterGain);

    sfxGain = sharedCtx.createGain();
    sfxGain.gain.value = 0.38;
    sfxGain.connect(masterGain);
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume();
  }
  return sharedCtx;
}

const NOTE_FREQ = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
};

const MELODY = [
  ['E5', 0.25], ['G5', 0.25], ['A5', 0.5],
  ['G5', 0.25], ['E5', 0.25], ['D5', 0.5],
  ['E5', 0.25], ['G5', 0.25], ['B5', 0.5],
  ['A5', 0.25], ['G5', 0.25], ['E5', 0.5],
  ['D5', 0.25], ['E5', 0.25], ['G5', 0.5],
  ['E5', 0.25], ['D5', 0.25], ['C5', 0.5],
];

const BASS = [
  ['A3', 0.5], ['A3', 0.5],
  ['G3', 0.5], ['G3', 0.5],
  ['C4', 0.5], ['C4', 0.5],
  ['A3', 0.5], ['A3', 0.5],
  ['D3', 0.5], ['D3', 0.5],
  ['G3', 0.5], ['G3', 0.5],
  ['C4', 0.5], ['C4', 0.5],
  ['A3', 0.5], ['A3', 0.5],
];

export class BackgroundMusic {
  constructor() {
    this.playing = false;
    this._timer = null;
    this._melodyIndex = 0;
    this._bassIndex = 0;
    this._melodyTime = 0;
    this._bassTime = 0;
  }

  get enabled() {
    return audioEnabled;
  }

  _playNote(freq, duration, type, volume) {
    if (!audioEnabled) return;

    const ctx = ensureContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.9);

    osc.connect(gain);
    gain.connect(bgmGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  _tick() {
    if (!this.playing || !audioEnabled) return;

    const melody = MELODY[this._melodyIndex];
    const bass = BASS[this._bassIndex];

    if (this._melodyTime <= 0) {
      const [note, dur] = melody;
      this._playNote(NOTE_FREQ[note], dur, 'square', 0.09);
      this._melodyTime = dur;
      this._melodyIndex = (this._melodyIndex + 1) % MELODY.length;
    }

    if (this._bassTime <= 0) {
      const [note, dur] = bass;
      this._playNote(NOTE_FREQ[note], dur, 'triangle', 0.18);
      this._bassTime = dur;
      this._bassIndex = (this._bassIndex + 1) % BASS.length;
    }

    const step = 0.05;
    this._melodyTime -= step;
    this._bassTime -= step;
  }

  play() {
    ensureContext();
    if (this.playing) return;

    this.playing = true;
    this._timer = setInterval(() => this._tick(), 50);
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this._timer);
    this._timer = null;
    if (sharedCtx?.state === 'running') {
      sharedCtx.suspend();
    }
  }

  resume() {
    if (this.playing) return;
    ensureContext();
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume();
    }
    this.play();
  }

  stop() {
    this.playing = false;
    clearInterval(this._timer);
    this._timer = null;
    this._melodyIndex = 0;
    this._bassIndex = 0;
    this._melodyTime = 0;
    this._bassTime = 0;
    if (sharedCtx?.state === 'running') {
      sharedCtx.suspend();
    }
  }

  toggle() {
    audioEnabled = !audioEnabled;
    if (!audioEnabled) {
      this.stop();
    }
    return audioEnabled;
  }
}

export class SoundEffects {
  constructor() {
    this._lastHitTime = 0;
  }

  playBulletHit() {
    if (!audioEnabled) return;

    const now = Date.now();
    if (now - this._lastHitTime < 40) return;
    this._lastHitTime = now;

    const ctx = ensureContext();
    const t = ctx.currentTime;
    const duration = 0.07;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(920, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + duration);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(sfxGain);

    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  playExplosion() {
    if (!audioEnabled) return;

    const ctx = ensureContext();
    const t = ctx.currentTime;
    const duration = 0.38;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) ** 1.4;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + duration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(sfxGain);
    noise.start(t);
    noise.stop(t + duration);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + duration);
    oscGain.gain.setValueAtTime(0.95, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(oscGain);
    oscGain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + duration);
  }
}
