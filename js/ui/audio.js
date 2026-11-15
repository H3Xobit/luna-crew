// Every sound and the music are made with WebAudio. There are no audio files.
// A note with type "noise" is filtered hiss, used for engines, dust and doors.
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
  ],
  // Cutscene sound effects.
  engine: [
    { f: 190, to: 110, d: 6.4, type: "noise", filter: "lowpass", v: 0.3, a: 0.5, hold: 0.8 },
    { f: 58, to: 46, d: 6.4, type: "sawtooth", v: 0.04, a: 0.5, hold: 0.8 }
  ],
  engineShort: [
    { f: 170, to: 80, d: 2.4, type: "noise", filter: "lowpass", v: 0.3, a: 0.1, hold: 1.4 },
    { f: 54, to: 40, d: 2.4, type: "sawtooth", v: 0.04, a: 0.1, hold: 1.4 }
  ],
  thud: [
    { f: 120, to: 38, d: 0.4, type: "sine", v: 0.32 },
    { f: 320, to: 120, d: 0.28, type: "noise", filter: "lowpass", v: 0.3 }
  ],
  whoosh: [{ f: 350, to: 1300, d: 1.5, type: "noise", filter: "bandpass", v: 0.3, a: 0.45, hold: 0.7 }],
  hiss: [
    { f: 3200, to: 2200, d: 1.0, type: "noise", filter: "bandpass", v: 0.13, a: 0.04 },
    { f: 240, d: 0.06, type: "square", v: 0.05, at: 0.95 }
  ],
  ramp: [
    { f: 130, to: 210, d: 1.1, type: "sawtooth", v: 0.035, a: 0.08 },
    { f: 190, to: 90, d: 0.12, type: "sine", v: 0.2, at: 1.1 }
  ],
  roll: [
    { f: 520, to: 380, d: 1.6, type: "noise", filter: "lowpass", v: 0.16, a: 0.25, hold: 0.5 },
    { f: 64, to: 72, d: 1.6, type: "square", v: 0.012, a: 0.25 }
  ],
  sparkle: [
    { f: 1568, d: 0.26, type: "sine", v: 0.05 },
    { f: 2093, d: 0.26, type: "sine", v: 0.05, at: 0.08 },
    { f: 2637, d: 0.26, type: "sine", v: 0.045, at: 0.16 },
    { f: 3136, d: 0.4, type: "sine", v: 0.04, at: 0.24 }
  ],
  flare: [
    { f: 180, to: 2600, d: 1.6, type: "noise", filter: "bandpass", v: 0.26, a: 0.9 },
    { f: 70, to: 420, d: 1.6, type: "sawtooth", v: 0.045, a: 0.9 }
  ],
  scan: [
    { f: 900, to: 1500, d: 0.3, type: "sine", v: 0.05 },
    { f: 900, to: 1500, d: 0.3, type: "sine", v: 0.05, at: 0.55 },
    { f: 900, to: 1500, d: 0.3, type: "sine", v: 0.05, at: 1.1 }
  ],
  grow: [
    { f: 392, d: 0.24, type: "triangle", v: 0.08 },
    { f: 494, d: 0.24, type: "triangle", v: 0.08, at: 0.2 },
    { f: 587, d: 0.24, type: "triangle", v: 0.08, at: 0.4 },
    { f: 784, d: 0.4, type: "triangle", v: 0.08, at: 0.6 }
  ],
  pop: [{ f: 600, to: 1250, d: 0.1, type: "sine", v: 0.12 }],
  patter: [0, 0.13, 0.31, 0.44, 0.68, 0.85, 1.1, 1.32].map((at, i) => ({ f: 1800 + (i % 3) * 500, d: 0.05, type: "noise", filter: "bandpass", v: 0.09, at }))
};

// Pip talks in little robot chirps. Each call makes a new, slightly different
// phrase, so Pip never says the same thing twice.
const PIP_MOODS = {
  pipHappy: { count: 6, low: 900, high: 2400, step: 0.085, lift: 1.35 },
  pipSad: { count: 4, low: 420, high: 900, step: 0.16, lift: 0.7 },
  pipThink: { count: 3, low: 700, high: 1500, step: 0.2, lift: 1.5 },
  pipSleepy: { count: 2, low: 380, high: 620, step: 0.42, lift: 0.6 }
};

function pipPhrase(mood) {
  const notes = [];
  const kinds = ["sine", "square", "triangle"];
  let at = 0;
  for (let i = 0; i < mood.count; i += 1) {
    const last = i === mood.count - 1;
    const f = mood.low + Math.random() * (mood.high - mood.low);
    const bend = last ? mood.lift : Math.random() < 0.5 ? 1.3 : 0.78;
    const d = mood.step * (0.6 + Math.random() * 0.5) * (last ? 1.6 : 1);
    const type = kinds[Math.floor(Math.random() * kinds.length)];
    notes.push({ f, to: f * bend, d, type, v: type === "square" ? 0.035 : 0.07, at });
    at += mood.step * (0.8 + Math.random() * 0.4);
  }
  return notes;
}

// Calm space music: four slow chords and a few soft bell notes.
const CHORDS = [
  [130.81, 164.81, 196.0, 246.94],
  [110.0, 130.81, 164.81, 196.0],
  [87.31, 130.81, 174.61, 220.0],
  [98.0, 146.83, 196.0, 246.94]
];
const BELLS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
const BAR = 6;

export const SOUND_NAMES = [...Object.keys(SOUNDS), ...Object.keys(PIP_MOODS)];

export function createAudio({ enabled = true, music = true, AudioContextClass } = {}) {
  const Ctor = AudioContextClass || globalThis.AudioContext || globalThis.webkitAudioContext;
  let context = null;
  let on = Boolean(enabled);
  let musicOn = Boolean(music);
  let hum = null;
  let sfx = null;
  let noise = null;
  let song = null;

  function ensure() {
    if (!Ctor) return null;
    if (!context) context = new Ctor();
    if (context.state === "suspended") context.resume().catch(() => {});
    return context;
  }

  // All sound effects go through one volume knob, so they can be hushed at once.
  function bus(ctx) {
    if (!sfx) {
      sfx = ctx.createGain();
      sfx.gain.value = 1;
      sfx.connect(ctx.destination);
    }
    return sfx;
  }

  function noiseBuffer(ctx) {
    if (!noise) {
      noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    }
    return noise;
  }

  function tone(ctx, note, out) {
    const start = ctx.currentTime + (note.at || 0);
    const attack = Math.min(note.a || 0.012, note.d * 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.v, start + attack);
    // "hold" keeps a long sound (an engine) steady, then lets it fade at the end.
    if (note.hold) gain.gain.setValueAtTime(note.v, start + Math.max(attack, note.d - note.hold));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.d);
    let source;
    if (note.type === "noise") {
      source = ctx.createBufferSource();
      source.buffer = noiseBuffer(ctx);
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = note.filter || "lowpass";
      filter.Q.value = note.filter === "bandpass" ? 1.2 : 0.7;
      filter.frequency.setValueAtTime(note.f, start);
      if (note.to) filter.frequency.exponentialRampToValueAtTime(note.to, start + note.d);
      source.connect(filter).connect(gain);
    } else {
      source = ctx.createOscillator();
      source.type = note.type;
      source.frequency.setValueAtTime(note.f, start);
      if (note.to) source.frequency.exponentialRampToValueAtTime(note.to, start + note.d);
      source.connect(gain);
    }
    gain.connect(out);
    source.start(start);
    source.stop(start + note.d + 0.05);
  }

  function scheduleBar(ctx, at, index) {
    const out = song.out;
    for (const f of CHORDS[index % CHORDS.length]) {
      for (const [mult, type, level] of [[1, "sine", 0.03], [2.003, "triangle", 0.008]]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = f * mult;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.linearRampToValueAtTime(level, at + 2.2);
        gain.gain.setValueAtTime(level, at + BAR - 1);
        gain.gain.linearRampToValueAtTime(0.0001, at + BAR + 2.4);
        osc.connect(gain).connect(out);
        osc.start(at);
        osc.stop(at + BAR + 2.5);
      }
    }
    const bells = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bells; i += 1) {
      const when = at + 0.4 + Math.random() * (BAR - 1.2);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = BELLS[Math.floor(Math.random() * BELLS.length)];
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(0.03, when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 2.2);
      osc.connect(gain);
      gain.connect(out);
      gain.connect(song.echo);
      osc.start(when);
      osc.stop(when + 2.3);
    }
  }

  function startMusic() {
    if (!on || !musicOn || song) return;
    try {
      const ctx = ensure();
      if (!ctx) return;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, ctx.currentTime);
      out.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2);
      out.connect(ctx.destination);
      const echo = ctx.createDelay(1);
      const feedback = ctx.createGain();
      echo.delayTime.value = 0.42;
      feedback.gain.value = 0.32;
      echo.connect(feedback).connect(echo);
      echo.connect(out);
      song = { out, echo, next: ctx.currentTime + 0.1, bar: 0, timer: null };
      const pump = () => {
        if (!song) return;
        while (song.next < ctx.currentTime + 1.5) {
          scheduleBar(ctx, song.next, song.bar);
          song.next += BAR;
          song.bar += 1;
        }
      };
      pump();
      song.timer = setInterval(pump, 500);
    } catch {
      song = null;
    }
  }

  function stopMusic() {
    if (!song) return;
    const old = song;
    song = null;
    clearInterval(old.timer);
    try {
      const now = context.currentTime;
      old.out.gain.cancelScheduledValues(now);
      old.out.gain.setValueAtTime(old.out.gain.value, now);
      old.out.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      setTimeout(() => old.out.disconnect(), 600);
    } catch {
      /* already gone */
    }
  }

  // Fade out every sound effect that is still ringing (a skipped engine, say).
  function hush() {
    if (!sfx || !context) return;
    const old = sfx;
    sfx = null;
    try {
      const now = context.currentTime;
      old.gain.setValueAtTime(old.gain.value, now);
      old.gain.linearRampToValueAtTime(0.0001, now + 0.12);
      setTimeout(() => old.disconnect(), 300);
    } catch {
      /* already gone */
    }
  }

  return {
    get enabled() {
      return on;
    },
    get musicPlaying() {
      return Boolean(song);
    },
    setEnabled(value) {
      on = Boolean(value);
      if (!on) {
        stopMusic();
        hush();
      } else if (context) {
        startMusic();
      }
    },
    setMusic(value) {
      musicOn = Boolean(value);
      if (!musicOn) stopMusic();
      else if (context) startMusic();
    },
    // Call from a tap handler so the browser allows sound.
    unlock() {
      if (!on) return;
      ensure();
      startMusic();
    },
    startMusic,
    stopMusic,
    hush,
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
      if (!on) return false;
      const notes = SOUNDS[name] || (PIP_MOODS[name] ? pipPhrase(PIP_MOODS[name]) : null);
      if (!notes) return false;
      try {
        const ctx = ensure();
        if (!ctx) return false;
        const out = bus(ctx);
        for (const note of notes) tone(ctx, note, out);
        return true;
      } catch {
        return false;
      }
    }
  };
}
