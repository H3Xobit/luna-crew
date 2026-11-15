// Every sound is made with WebAudio oscillators. There are no audio files.
// The context is created on the first tap, as browsers require.

const SOUNDS = {
  tap: [{ f: 520, d: 0.06, type: "triangle", v: 0.12 }],
  add: [{ f: 660, d: 0.07, type: "triangle", v: 0.14 }],
  remove: [{ f: 420, d: 0.07, type: "triangle", v: 0.12 }],
  blocked: [{ f: 180, d: 0.12, type: "square", v: 0.07 }],
  talk: [{ f: 880, d: 0.03, type: "sine", v: 0.05 }],
  go: [
    { f: 392, d: 0.09, type: "triangle", v: 0.16 },
    { f: 523, d: 0.09, type: "triangle", v: 0.16, at: 0.09 },
    { f: 659, d: 0.16, type: "triangle", v: 0.16, at: 0.18 }
  ],
  good: [
    { f: 659, d: 0.1, type: "sine", v: 0.16 },
    { f: 880, d: 0.18, type: "sine", v: 0.16, at: 0.1 }
  ],
  oops: [
    { f: 330, d: 0.14, type: "sine", v: 0.14 },
    { f: 262, d: 0.22, type: "sine", v: 0.14, at: 0.14 }
  ],
  alarm: [
    { f: 440, d: 0.18, type: "sawtooth", v: 0.08 },
    { f: 330, d: 0.18, type: "sawtooth", v: 0.08, at: 0.22 },
    { f: 440, d: 0.18, type: "sawtooth", v: 0.08, at: 0.44 },
    { f: 330, d: 0.18, type: "sawtooth", v: 0.08, at: 0.66 }
  ],
  zap: [{ f: 1200, to: 300, d: 0.14, type: "square", v: 0.08 }],
  radio: [
    { f: 1400, d: 0.05, type: "sine", v: 0.07 },
    { f: 1400, d: 0.05, type: "sine", v: 0.07, at: 0.12 }
  ],
  lightsOn: [{ f: 500, to: 900, d: 0.14, type: "sine", v: 0.1 }],
  lightsOff: [{ f: 900, to: 400, d: 0.14, type: "sine", v: 0.1 }],
  night: [{ f: 300, to: 160, d: 0.5, type: "sine", v: 0.1 }],
  day: [{ f: 260, to: 520, d: 0.5, type: "sine", v: 0.1 }],
  win: [
    { f: 523, d: 0.12, type: "triangle", v: 0.16 },
    { f: 659, d: 0.12, type: "triangle", v: 0.16, at: 0.12 },
    { f: 784, d: 0.12, type: "triangle", v: 0.16, at: 0.24 },
    { f: 1047, d: 0.36, type: "triangle", v: 0.16, at: 0.36 }
  ],
  home: [
    { f: 392, d: 0.2, type: "sine", v: 0.12 },
    { f: 330, d: 0.2, type: "sine", v: 0.12, at: 0.2 },
    { f: 392, d: 0.34, type: "sine", v: 0.12, at: 0.4 }
  ],
  chirp: [
    { f: 880, d: 0.04, type: "sine", v: 0.04 },
    { f: 990, d: 0.05, type: "sine", v: 0.03, at: 0.16 }
  ],
  sting: [
    { f: 523, d: 0.1, type: "triangle", v: 0.1 },
    { f: 784, d: 0.16, type: "triangle", v: 0.1, at: 0.1 }
  ]
};

export const SOUND_NAMES = Object.keys(SOUNDS);

export function createAudio({ enabled = true, AudioContextClass } = {}) {
  const Ctor = AudioContextClass || globalThis.AudioContext || globalThis.webkitAudioContext;
  let context = null;
  let on = Boolean(enabled);
  let hum = null;

  function ensure() {
    if (!Ctor) return null;
    if (!context) context = new Ctor();
    if (context.state === "suspended") context.resume().catch(() => {});
    return context;
  }

  function tone(ctx, note) {
    const start = ctx.currentTime + (note.at || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.type;
    osc.frequency.setValueAtTime(note.f, start);
    if (note.to) osc.frequency.exponentialRampToValueAtTime(note.to, start + note.d);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.v, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.d);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + note.d + 0.03);
  }

  return {
    get enabled() {
      return on;
    },
    setEnabled(value) {
      on = Boolean(value);
    },
    // Call from a tap handler so the browser allows sound.
    unlock() {
      if (on) ensure();
    },
    startHum() {
      if (!on || hum) return;
      try {
        const ctx = ensure();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 82;
        gain.gain.value = 0.012;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        hum = { osc, gain };
      } catch {
        hum = null;
      }
    },
    stopHum() {
      if (!hum) return;
      try { hum.osc.stop(); } catch { /* already stopped */ }
      hum = null;
    },
    play(name) {
      if (!on || !SOUNDS[name]) return false;
      try {
        const ctx = ensure();
        if (!ctx) return false;
        for (const note of SOUNDS[name]) tone(ctx, note);
        return true;
      } catch {
        return false;
      }
    }
  };
}
