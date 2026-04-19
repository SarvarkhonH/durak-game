// ── Kozyr — Professional Sound System ────────────────────────────────────────
// Realistic card sounds + generative casino ambient music + Russian TTS
// 100% procedural — no audio files required

// ── AudioContext singleton ────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
}

// ── Noise buffer factory ──────────────────────────────────────────────────────
function makeNoise(c: AudioContext, dur: number, decay = 0.06): AudioBuffer {
  const len = Math.ceil(c.sampleRate * dur);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * decay));
    }
  }
  return buf;
}

// ── Realistic card slice / snap sound ────────────────────────────────────────
// Three layers: high "snap", mid "swoosh", low "thud"
function cardSlice(): void {
  const c = getCtx(); if (!c) return;
  const now = c.currentTime;

  // Layer 1: High crisp snap (noise → bandpass at 3-5 kHz)
  const snapBuf = makeNoise(c, 0.07, 0.018);
  const snap = c.createBufferSource();
  snap.buffer = snapBuf;
  const snapBP = c.createBiquadFilter();
  snapBP.type = 'bandpass';
  snapBP.frequency.value = 3400 + Math.random() * 1200; // slight variation each card
  snapBP.Q.value = 1.4;
  const snapHS = c.createBiquadFilter();
  snapHS.type = 'highshelf';
  snapHS.frequency.value = 5000;
  snapHS.gain.value = 8;
  const snapGain = c.createGain();
  snapGain.gain.setValueAtTime(0.55, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  snap.connect(snapBP); snapBP.connect(snapHS); snapHS.connect(snapGain); snapGain.connect(c.destination);
  snap.start(now); snap.stop(now + 0.08);

  // Layer 2: Mid swoosh (noise → bandpass at 800-1500 Hz) — the slide of the card
  const swooshBuf = makeNoise(c, 0.11, 0.04);
  const swoosh = c.createBufferSource();
  swoosh.buffer = swooshBuf;
  const swooshBP = c.createBiquadFilter();
  swooshBP.type = 'bandpass';
  swooshBP.frequency.value = 900 + Math.random() * 400;
  swooshBP.Q.value = 0.7;
  const swooshGain = c.createGain();
  swooshGain.gain.setValueAtTime(0, now);
  swooshGain.gain.linearRampToValueAtTime(0.18, now + 0.008);
  swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  swoosh.connect(swooshBP); swooshBP.connect(swooshGain); swooshGain.connect(c.destination);
  swoosh.start(now); swoosh.stop(now + 0.12);

  // Layer 3: Soft thud (very short sub, card landing on felt)
  const thudOsc = c.createOscillator();
  const thudGain = c.createGain();
  thudOsc.type = 'sine';
  thudOsc.frequency.setValueAtTime(120, now);
  thudOsc.frequency.exponentialRampToValueAtTime(60, now + 0.04);
  thudGain.gain.setValueAtTime(0.12, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
  thudOsc.connect(thudGain); thudGain.connect(c.destination);
  thudOsc.start(now); thudOsc.stop(now + 0.05);
}

// ── Realistic deal sound (cascade of card slices) ────────────────────────────
function dealCards(): void {
  const count = 3 + Math.floor(Math.random() * 3); // 3-5 cards
  for (let i = 0; i < count; i++) {
    setTimeout(() => cardSlice(), i * 90 + Math.random() * 20);
  }
}

// ── Simple beep (for win/lose/bonus melodies) ─────────────────────────────────
function beep(freq: number, dur: number, type: OscillatorType, vol: number, delayS = 0): void {
  try {
    const c = getCtx(); if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = c.currentTime + delayS;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.01);
  } catch {}
}

// ── SFX palette ───────────────────────────────────────────────────────────────
export const sfx = {
  card:     cardSlice,
  deal:     dealCards,

  take: () => {
    // Card shuffle noise — like picking up a stack
    const c = getCtx(); if (!c) return;
    const buf = makeNoise(c, 0.22, 0.08);
    const src = c.createBufferSource(); src.buffer = buf;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.22);
    src.connect(lp); lp.connect(g); g.connect(c.destination);
    src.start(); src.stop(c.currentTime + 0.23);
  },

  pass: () => {
    // Satisfying "bito" — soft table tap
    beep(200, 0.06, 'sine', 0.18);
    beep(160, 0.1, 'sine', 0.12, 0.04);
    const c = getCtx(); if (!c) return;
    const buf = makeNoise(c, 0.08, 0.025);
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 0.9;
    const g = c.createGain(); g.gain.setValueAtTime(0.1, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    src.connect(bp); bp.connect(g); g.connect(c.destination);
    src.start(); src.stop(c.currentTime + 0.09);
  },

  transfer: () => {
    // Swoosh-up sound — card flies back
    const c = getCtx(); if (!c) return;
    const now = c.currentTime;
    [0, 0.07, 0.14].forEach((d, i) => {
      const buf = makeNoise(c, 0.09, 0.035);
      const src = c.createBufferSource(); src.buffer = buf;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(800 + i * 600, now + d);
      bp.frequency.linearRampToValueAtTime(2000 + i * 800, now + d + 0.09);
      bp.Q.value = 1.0;
      const g = c.createGain();
      g.gain.setValueAtTime(0.22, now + d);
      g.gain.exponentialRampToValueAtTime(0.001, now + d + 0.09);
      src.connect(bp); bp.connect(g); g.connect(c.destination);
      src.start(now + d); src.stop(now + d + 0.1);
    });
  },

  win: () => {
    // Triumphant arpeggio + sparkle
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((f, i) => beep(f, 0.22, 'sine', 0.3, i * 0.12));
    setTimeout(() => {
      beep(1318.5, 0.15, 'sine', 0.18);
      beep(1760, 0.18, 'sine', 0.14, 0.1);
      beep(2093, 0.2,  'sine', 0.12, 0.22);
    }, 550);
    // Coin shower sound
    setTimeout(() => {
      for (let i = 0; i < 6; i++) {
        const c = getCtx(); if (!c) break;
        const freq = 1200 + Math.random() * 800;
        beep(freq, 0.04, 'triangle', 0.2, i * 0.07);
      }
    }, 800);
  },

  lose: () => {
    beep(392, 0.2, 'sine', 0.22);
    beep(349.23, 0.22, 'sine', 0.2, 0.2);
    beep(293.66, 0.35, 'sine', 0.22, 0.42);
    beep(246.94, 0.5,  'sine', 0.18, 0.7);
  },

  bonus: () => {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      beep(f, 0.12, 'sine', 0.3, i * 0.08)
    );
    // Coin clinks
    for (let i = 0; i < 5; i++) beep(1400 + Math.random() * 600, 0.04, 'triangle', 0.22, 0.5 + i * 0.06);
  },
};

// ── Casino Ambient Music ──────────────────────────────────────────────────────
// Generative jazz-lounge chord loop — soft, warm, casino atmosphere
class CasinoAmbience {
  private masterOut: GainNode;
  private delayNode: DelayNode;
  private delayFb: GainNode;
  private wetGain: GainNode;
  private playing = false;
  private nextTimer: ReturnType<typeof setTimeout> | null = null;
  private chordStep = 0;

  // Jazz ii-V-I-vi progression in A minor / C major
  private readonly PROG: number[][] = [
    // Am7:  A2  C3   E3   G3   A3   E4
    [110, 130.81, 164.81, 196, 220, 329.63],
    // Dm7:  D3  F3   A3   C4
    [146.83, 174.61, 220, 261.63, 293.66, 349.23],
    // G7:   G2  B2   D3   F3   G3
    [98, 123.47, 146.83, 174.61, 196, 246.94],
    // CMaj7: C3 E3   G3   B3   C4
    [130.81, 164.81, 196, 246.94, 261.63, 329.63],
    // FMaj7: F2 A2   C3   E3   F3
    [87.31, 110, 130.81, 164.81, 174.61, 261.63],
    // E7:   E2  G#2  B2   D3   E3
    [82.41, 103.83, 123.47, 146.83, 164.81, 246.94],
  ];

  constructor(private c: AudioContext) {
    this.masterOut = c.createGain();
    this.masterOut.gain.value = 0;

    // Simple tape-delay reverb: out → delay → wet → destination
    this.delayNode = c.createDelay(1.0);
    this.delayNode.delayTime.value = 0.38;
    this.delayFb = c.createGain();
    this.delayFb.gain.value = 0.28;
    this.wetGain = c.createGain();
    this.wetGain.gain.value = 0.22;

    this.masterOut.connect(c.destination);
    this.masterOut.connect(this.delayNode);
    this.delayNode.connect(this.delayFb);
    this.delayFb.connect(this.delayNode); // feedback loop
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(c.destination);
  }

  private note(freq: number, start: number, dur: number, vol: number, detuneC = 0): void {
    const osc = this.c.createOscillator();
    const g = this.c.createGain();
    osc.type = 'triangle'; // warm timbre
    osc.frequency.value = freq;
    osc.detune.value = detuneC;
    const atk = 1.1, rel = 1.4;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + atk);
    g.gain.setValueAtTime(vol, start + dur - rel);
    g.gain.linearRampToValueAtTime(0, start + dur);
    osc.connect(g); g.connect(this.masterOut);
    osc.start(start); osc.stop(start + dur + 0.1);
  }

  private bell(freq: number, start: number): void {
    // Soft bell-like attack using sine + quick decay
    const osc = this.c.createOscillator();
    const g = this.c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.05, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 3.2);
    osc.connect(g); g.connect(this.masterOut);
    osc.start(start); osc.stop(start + 3.3);
  }

  private chord(): void {
    if (!this.playing) return;
    const now = this.c.currentTime;
    const chordDur = 6.0;
    const freqs = this.PROG[this.chordStep % this.PROG.length];

    // Bass root (half freq, very soft)
    this.note(freqs[0] / 2, now, chordDur, 0.05);

    // Chord pad — three detuned voices per note for lush ensemble
    freqs.forEach((f, i) => {
      const delay = i * 0.1; // gentle arpeggio
      this.note(f, now + delay, chordDur - delay, 0.038, -4);
      this.note(f, now + delay, chordDur - delay, 0.038,  0);
      this.note(f, now + delay, chordDur - delay, 0.032,  4);
    });

    // Random bell note in upper register
    if (Math.random() < 0.7) {
      const bellFreq = freqs[Math.floor(Math.random() * freqs.length)] * 2;
      const bellDelay = 1.5 + Math.random() * 2.5;
      this.bell(bellFreq, now + bellDelay);
      // Sometimes a second bell
      if (Math.random() < 0.4) {
        const bf2 = freqs[Math.floor(Math.random() * freqs.length)] * 4;
        this.bell(bf2, now + bellDelay + 0.8 + Math.random() * 1.2);
      }
    }

    this.chordStep++;
    // Schedule next chord with 0.8s overlap for smooth transition
    this.nextTimer = setTimeout(() => this.chord(), (chordDur - 0.8) * 1000);
  }

  start(): void {
    if (this.playing) return;
    this.playing = true;
    // Fade master in over 2.5 seconds
    const now = this.c.currentTime;
    this.masterOut.gain.cancelScheduledValues(now);
    this.masterOut.gain.setValueAtTime(this.masterOut.gain.value, now);
    this.masterOut.gain.linearRampToValueAtTime(1.0, now + 2.5);
    this.chord();
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.nextTimer) clearTimeout(this.nextTimer);
    // Fade out over 2 seconds
    const now = this.c.currentTime;
    this.masterOut.gain.cancelScheduledValues(now);
    this.masterOut.gain.setValueAtTime(this.masterOut.gain.value, now);
    this.masterOut.gain.linearRampToValueAtTime(0, now + 2.0);
  }

  setVolume(v: number): void {
    const now = this.c.currentTime;
    this.masterOut.gain.setValueAtTime(this.masterOut.gain.value, now);
    this.masterOut.gain.linearRampToValueAtTime(v, now + 0.3);
  }
}

let ambienceInstance: CasinoAmbience | null = null;

export function startAmbience(): void {
  const c = getCtx(); if (!c) return;
  if (!ambienceInstance) ambienceInstance = new CasinoAmbience(c);
  ambienceInstance.start();
}

export function stopAmbience(): void {
  ambienceInstance?.stop();
}

// ── Russian TTS Voice ─────────────────────────────────────────────────────────
let voiceEnabled = true;
let selectedVoice: SpeechSynthesisVoice | null = null;

function loadRuVoice() {
  if (!('speechSynthesis' in window)) return;
  const tryLoad = () => {
    const voices = window.speechSynthesis.getVoices();
    const ru = voices.find(v => v.lang.startsWith('ru') && v.localService) ??
               voices.find(v => v.lang.startsWith('ru'));
    if (ru) selectedVoice = ru;
  };
  tryLoad();
  window.speechSynthesis.onvoiceschanged = tryLoad;
}
loadRuVoice();

function speak(text: string, interrupt = false, rate = 1.0): void {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  try {
    if (interrupt) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    u.rate = rate;
    u.pitch = 1.05;
    u.volume = 1.0;
    if (selectedVoice) u.voice = selectedVoice;
    window.speechSynthesis.speak(u);
  } catch {}
}

// ── Russian card name pronunciation ─────────────────────────────────────────
const RANK_RU: Record<string, string> = {
  '6': 'шестёрка', '7': 'семёрка', '8': 'восьмёрка', '9': 'девятка',
  '10': 'десятка', 'J': 'валет', 'Q': 'дама', 'K': 'король', 'A': 'туз',
};
const SUIT_RU: Record<string, string> = {
  spades: 'пик', hearts: 'червей', diamonds: 'бубей', clubs: 'трефей',
};

export function speakCard(card: { rank: string; suit: string }): void {
  speak(`${RANK_RU[card.rank] ?? card.rank} ${SUIT_RU[card.suit] ?? ''}`, false, 1.1);
}

export const voice = {
  yourAttack: () => speak('Атака!', true, 1.1),
  defend:     () => speak('Защита!', true, 1.1),
  bito:       () => speak('Бито!', false, 1.1),
  take:       () => speak('Взять карты', true, 1.0),
  transfer:   () => speak('Перевод!', true, 1.15),
  win:        () => speak('Победа!', true, 1.0),
  lose:       () => speak('Поражение...', true, 0.85),
  bonus:      () => speak('Бонус получен!', true, 1.0),
};

export function toggleVoice(on: boolean): void {
  voiceEnabled = on;
  if (!on) window.speechSynthesis?.cancel();
}

export function isVoiceEnabled(): boolean { return voiceEnabled; }
