// ── Kozyr Sound System ────────────────────────────────────────────────────────
// Procedural audio via Web Audio API (no files needed)
// Russian voice announcements via Web Speech API

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch {
    return null;
  }
}

function beep(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.22,
  delay = 0
): void {
  try {
    const c = getCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    const t = c.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.01);
  } catch { /* silently fail */ }
}

// ── Sound effects ─────────────────────────────────────────────────────────────
export const sfx = {
  card: () => {
    beep(900, 0.06, 'square', 0.09);
    beep(650, 0.07, 'sine', 0.08, 0.04);
  },
  deal: () => {
    beep(480, 0.09, 'sine', 0.16);
    beep(700, 0.07, 'sine', 0.12, 0.07);
  },
  take: () => {
    beep(340, 0.15, 'sawtooth', 0.12);
    beep(260, 0.2, 'sawtooth', 0.1, 0.1);
  },
  pass: () => {
    beep(620, 0.08, 'sine', 0.14);
    beep(480, 0.1, 'sine', 0.1, 0.09);
  },
  transfer: () => {
    beep(560, 0.07, 'sine', 0.18);
    beep(780, 0.07, 'sine', 0.18, 0.075);
    beep(1020, 0.12, 'sine', 0.15, 0.155);
  },
  win: () => {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => beep(f, 0.16, 'sine', 0.28, i * 0.13));
    // Sparkle high notes
    setTimeout(() => {
      beep(1568, 0.1, 'sine', 0.15);
      beep(2093, 0.12, 'sine', 0.12, 0.08);
    }, 580);
  },
  lose: () => {
    beep(440, 0.18, 'sine', 0.2);
    beep(370, 0.2, 'sine', 0.18, 0.18);
    beep(294, 0.35, 'sine', 0.2, 0.38);
  },
  bonus: () => {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      beep(f, 0.1, 'sine', 0.28, i * 0.09)
    );
  },
  coinClink: () => {
    beep(1200, 0.04, 'triangle', 0.22);
    beep(1600, 0.03, 'triangle', 0.15, 0.05);
  },
};

// ── Russian voice announcements via Web Speech API ────────────────────────────
let voiceEnabled = true;
let selectedVoice: SpeechSynthesisVoice | null = null;

// Pick best Russian voice available on device
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
  } catch { /* silently fail */ }
}

export const voice = {
  yourAttack:  () => speak('Атака!', true, 1.1),
  defend:      () => speak('Защита!', true, 1.1),
  botTurn:     () => speak('Ход соперника', false, 0.95),
  bito:        () => speak('Бито!', false, 1.1),
  take:        () => speak('Взять карты', true, 1.0),
  transfer:    () => speak('Перевод!', true, 1.15),
  win:         () => speak('Победа! Вы выиграли!', true, 1.0),
  lose:        () => speak('Поражение...', true, 0.85),
  bonus:       () => speak('Бонус получен! Пятьдесят монет!', true, 1.0),
  lowBalance:  () => speak('Баланс низкий. Забери ежедневный бонус.', false, 0.95),
};

export function toggleVoice(on: boolean) {
  voiceEnabled = on;
  if (!on) window.speechSynthesis?.cancel();
}

export function isVoiceEnabled() { return voiceEnabled; }
