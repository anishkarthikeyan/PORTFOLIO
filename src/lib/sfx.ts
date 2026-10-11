/**
 * Chiptune sound effects, synthesized with the Web Audio API — no audio
 * files. Sound is OFF until the visitor presses Start (or the sound toggle);
 * browsers only allow audio after a user gesture anyway.
 */

export type Sfx =
  | "start"
  | "coin"
  | "jump"
  | "bump"
  | "stomp"
  | "pipe"
  | "powerup"
  | "waka"
  | "lock"
  | "jetpack"
  | "flag"
  | "warp"
  | "talk"
  | "shoot"
  | "key"
  | "chest"
  | "boss"
  | "save";

const STORAGE_KEY = "anish.sound";
const listeners = new Set<(on: boolean) => void>();
let ctx: AudioContext | null = null;
let enabled = false;
const lastPlayed = new Map<Sfx, number>();
/** Minimum gap between repeats of the same sound (ms) so rapid events don't buzz. */
const MIN_GAP: Partial<Record<Sfx, number>> = { coin: 60, waka: 110, jump: 140, lock: 70, pipe: 250, talk: 90, shoot: 120 };

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function isSoundOn(): boolean {
  return enabled;
}

/** Turn sound on/off (call from a user gesture to unlock audio). */
export function setSound(on: boolean) {
  enabled = on;
  if (on) audio();
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* storage unavailable — keep in memory only */
  }
  listeners.forEach((l) => l(on));
}

/** Restore the visitor's previous choice (still needs a gesture before audio actually plays). */
export function restoreSound() {
  try {
    enabled = localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    enabled = false;
  }
  listeners.forEach((l) => l(enabled));
}

export function onSoundChange(l: (on: boolean) => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

interface Note {
  f: number;
  /** Optional end frequency (slide). */
  to?: number;
  d: number;
  type?: OscillatorType;
  v?: number;
}

function sequence(notes: Note[], gap = 0) {
  const ac = audio();
  if (!ac) return;
  let t = ac.currentTime + 0.005;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = n.type ?? "square";
    osc.frequency.setValueAtTime(n.f, t);
    if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t + n.d);
    const v = (n.v ?? 0.06) * 1;
    gain.gain.setValueAtTime(v, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + n.d);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + n.d + 0.02);
    t += n.d + gap;
  }
}

function noise(d: number, v = 0.05, freq = 800) {
  const ac = audio();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * d);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(v, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

let wakaFlip = false;

/** Play a sound effect if sound is enabled. */
export function play(name: Sfx) {
  if (!enabled) return;
  const now = performance.now();
  const gap = MIN_GAP[name] ?? 0;
  if (now - (lastPlayed.get(name) ?? -Infinity) < gap) return;
  lastPlayed.set(name, now);

  switch (name) {
    case "coin":
      return sequence([
        { f: 988, d: 0.05 },
        { f: 1319, d: 0.22 },
      ]);
    case "jump":
      return sequence([{ f: 280, to: 720, d: 0.14, v: 0.045 }]);
    case "bump":
      return sequence([{ f: 140, to: 90, d: 0.09, type: "triangle", v: 0.12 }]);
    case "stomp":
      noise(0.06, 0.06, 500);
      return sequence([{ f: 420, to: 110, d: 0.12, v: 0.06 }]);
    case "pipe":
      return sequence(
        [
          { f: 330, d: 0.06, v: 0.05 },
          { f: 247, d: 0.06, v: 0.05 },
          { f: 165, d: 0.08, v: 0.05 },
        ],
        0.03,
      );
    case "warp":
      return sequence([{ f: 880, to: 110, d: 0.32, type: "sawtooth", v: 0.03 }]);
    case "powerup":
      return sequence(
        [523, 659, 784, 1047, 1319].map((f) => ({ f, d: 0.06, v: 0.05 })),
        0.005,
      );
    case "waka":
      wakaFlip = !wakaFlip;
      return sequence([{ f: wakaFlip ? 260 : 480, to: wakaFlip ? 480 : 260, d: 0.08, type: "triangle", v: 0.08 }]);
    case "lock":
      return sequence([{ f: 196, d: 0.05, v: 0.05 }]);
    case "jetpack":
      noise(0.35, 0.05, 300);
      return;
    case "flag":
      return sequence(
        [784, 659, 523, 392, 523, 659, 784, 1047].map((f, i) => ({ f, d: i === 7 ? 0.35 : 0.07, v: 0.05 })),
        0.01,
      );
    case "talk":
      return sequence(
        [660, 880, 740].map((f) => ({ f, d: 0.035, v: 0.035, type: "square" as OscillatorType })),
        0.015,
      );
    case "shoot":
      return sequence([{ f: 1400, to: 300, d: 0.12, type: "sawtooth", v: 0.03 }]);
    case "key":
      return sequence(
        [988, 1175, 1568].map((f) => ({ f, d: 0.06, v: 0.05 })),
        0.01,
      );
    case "chest":
      return sequence(
        [392, 440, 494, 523, 587, 659, 698, 784].map((f, i) => ({ f, d: i === 7 ? 0.4 : 0.06, v: 0.05, type: "triangle" as OscillatorType })),
        0.01,
      );
    case "boss":
      noise(0.25, 0.07, 300);
      return sequence([{ f: 220, to: 55, d: 0.5, v: 0.06 }]);
    case "save":
      return sequence(
        [523, 659, 784].map((f) => ({ f, d: 0.09, v: 0.04, type: "triangle" as OscillatorType })),
        0.02,
      );
    case "start":
      return sequence(
        [392, 523, 659, 784, 659, 784, 1047].map((f, i) => ({ f, d: i === 6 ? 0.3 : 0.08, v: 0.05 })),
        0.01,
      );
  }
}
