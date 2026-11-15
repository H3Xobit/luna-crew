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

// ------------------------------------------------------------------- Pip
// Pip never says words. Pip talks like a little astromech droid: whistles
// that slide up and down, fast warbling trills and quick bursts of blips.
// Every phrase is made fresh, so Pip never says the same thing twice.
// A note with "vib" wobbles its pitch "vib" times a second by "depth" Hz.

const PIP_MOODS = {
  pipHappy: { mood: "happy" },
  pipExcited: { mood: "excited" },
  pipSad: { mood: "sad" },
  pipThink: { mood: "think" },
  pipSleepy: { mood: "sleepy" }
};

const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

// The pieces a droid phrase is built from. Each returns notes starting at 0.
const PARTS = {
  // a clean whistle that slides
  whistle(up, high = 1) {
    const f = rand(1100, 2000) * high;
    const d = rand(0.09, 0.2);
    return [
      { f, to: f * (up ? rand(1.4, 1.9) : rand(0.5, 0.7)), d, type: "sine", v: 0.085, a: 0.008 },
      { f: f * 2, to: f * 2 * (up ? 1.6 : 0.6), d, type: "sine", v: 0.012, a: 0.008 }
    ];
  },
  // the famous warble: a fast wobble on a sliding tone
  trill(up) {
    const f = rand(1400, 2300);
    const d = rand(0.16, 0.34);
    return [{ f, to: f * (up ? 1.25 : 0.75), d, type: "sine", v: 0.08, a: 0.01, vib: rand(22, 34), depth: rand(260, 420) }];
  },
  // quick blips, like typing on a tiny keyboard
  burst(n = 5) {
    const notes = [];
    let at = 0;
    for (let i = 0; i < n; i += 1) {
      const f = rand(1500, 3200);
      notes.push({ f, to: f * rand(0.9, 1.15), d: rand(0.035, 0.06), type: pickOne(["sine", "square"]), v: 0.05, a: 0.008, at });
      at += rand(0.045, 0.07);
    }
    return notes;
  },
  // a low "boop" with a little buzz
  boop() {
    const f = rand(480, 700);
    return [
      { f, to: f * rand(0.8, 1.2), d: rand(0.08, 0.14), type: "square", v: 0.03, a: 0.006 },
      { f, to: f * 0.9, d: 0.12, type: "sine", v: 0.05, a: 0.006 }
    ];
  },
  // a sad slide down with a slow wobble
  droop() {
    const f = rand(1300, 1700);
    return [{ f, to: f * 0.35, d: rand(0.45, 0.65), type: "sine", v: 0.075, a: 0.02, vib: 7, depth: 60 }];
  },
  // a question: low, then a whistle that rises at the end
  ask() {
    const f = rand(700, 900);
    return [
      { f, to: f * 1.05, d: 0.11, type: "sine", v: 0.06, a: 0.008 },
      { f: f * 1.3, to: f * 2.6, d: 0.24, type: "sine", v: 0.08, a: 0.01, at: 0.16 }
    ];
  },
  // a sleepy, slow, low hum
  yawn() {
    const f = rand(520, 680);
    return [{ f, to: f * 0.55, d: rand(0.6, 0.8), type: "sine", v: 0.06, a: 0.08, vib: 4, depth: 25 }];
  }
};

const RECIPES = {
  happy: [["whistle", true], ["burst"], ["trill", true], ["whistle", false], ["boop"], ["whistle", true]],
  excited: [["burst", 7], ["trill", true], ["whistle", true, 1.25], ["burst", 4], ["trill", true]],
  sad: [["droop"], ["boop"], ["droop"]],
  think: [["boop"], ["burst", 3], ["ask"]],
  sleepy: [["yawn"], ["boop"], ["yawn"]]
};

// size is roughly how many syllables Pip "says" (a longer line, a longer phrase).
function droidPhrase(mood = "happy", size = 3) {
  const recipe = RECIPES[mood] || RECIPES.happy;
  const count = Math.max(2, Math.min(mood === "sad" || mood === "sleepy" ? 3 : 6, Math.round(size)));
  const notes = [];
  let at = 0;
  for (let i = 0; i < count; i += 1) {
    const [part, ...args] = i === count - 1 && (mood === "happy" || mood === "excited") ? ["whistle", true, 1.2] : pickOne(recipe);
    const piece = PARTS[part](...args);
    let end = 0;
    for (const note of piece) {
      notes.push({ ...note, at: at + (note.at || 0) });
      end = Math.max(end, (note.at || 0) + note.d);
    }
    at += end + rand(0.03, 0.09);
  }
  return notes;
}

// The mood that goes with a face expression.
export function pipMood(expr) {
  if (expr === "excited") return "excited";
  if (expr === "worried") return "sad";
  if (expr === "thinking") return "think";
  if (expr === "sleepy") return "sleepy";
  return "happy";
}

// ------------------------------------------------------------------ music
// Light, bouncy music: a plucky bass, a marimba playing the chords and a
// little xylophone tune over the top, with a soft shaker. C major, 104 BPM.

const BEAT = 60 / 104;
const STEP = BEAT / 2;
const BAR = BEAT * 4;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

// C, G, A minor, F: bass note and the three chord notes.
const CHORDS = [
  { bass: 36, notes: [60, 64, 67] },
  { bass: 43, notes: [59, 62, 67] },
  { bass: 45, notes: [60, 64, 69] },
  { bass: 41, notes: [60, 65, 69] }
];

// The tune, 8 steps per bar, as notes above C5 (null is a rest). Two
// four-bar tunes take turns so it does not get boring.
const TUNES = [
  [
    [4, null, 7, null, 12, 11, 12, null],
    [11, null, 7, null, 2, null, 7, null],
    [9, null, 12, null, 16, 14, 12, null],
    [9, null, 5, 7, 9, null, null, null]
  ],
  [
    [12, null, 11, 9, 7, null, 4, null],
    [2, 4, 7, null, 11, null, 7, null],
    [9, 7, 4, null, 9, null, 12, null],
    [5, null, 9, null, 7, null, null, null]
  ]
];

// Rhythm of the marimba: which steps of the bar play a chord note.
const MARIMBA = [0, 2, 3, 5, 6];

export const SOUND_NAMES = [...Object.keys(SOUNDS), ...Object.keys(PIP_MOODS)];

export function createAudio({ enabled = true, music = true, AudioContextClass, lookahead = 1.2 } = {}) {
  const Ctor = AudioContextClass || globalThis.AudioContext || globalThis.webkitAudioContext;
  let context = null;
  let on = Boolean(enabled);
  let musicOn = Boolean(music);
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

  function tone(ctx, note, out, base = ctx.currentTime) {
    const start = base + (note.at || 0);
    const attack = Math.min(note.a || 0.012, note.d * 0.8);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.v, start + attack);
    // "hold" keeps a long sound (an engine) steady, then lets it fade at the end.
    if (note.hold) gain.gain.setValueAtTime(note.v, start + Math.max(attack, note.d - note.hold));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.d);
    let source;
    let wobble = null;
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
      if (note.vib) {
        wobble = ctx.createOscillator();
        const depth = ctx.createGain();
        wobble.frequency.value = note.vib;
        depth.gain.value = note.depth || 50;
        wobble.connect(depth).connect(source.frequency);
        wobble.start(start);
        wobble.stop(start + note.d + 0.05);
      }
      source.connect(gain);
    }
    gain.connect(out);
    source.start(start);
    source.stop(start + note.d + 0.05);
  }

  // One plucked note: quick attack, quick fade. Used by the music.
  function pluck(ctx, out, at, freq, type, level, length) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + length + 0.02);
  }

  function shaker(ctx, out, at, level) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    src.connect(filter).connect(gain).connect(out);
    src.start(at, Math.random());
    src.stop(at + 0.07);
  }

  function scheduleBar(ctx, at, index) {
    const out = song.out;
    const chord = CHORDS[index % 4];
    const tune = TUNES[Math.floor(index / 4) % 2][index % 4];
    // The tune rests every fourth round, so it does not play forever.
    const sing = Math.floor(index / 8) % 4 !== 3;
    // bass: on the beat, with a hop up to the fifth
    const bass = [[0, chord.bass], [2, chord.bass + 7], [4, chord.bass], [6, chord.bass + 12]];
    for (const [step, m] of bass) pluck(ctx, out, at + step * STEP, mtof(m), "triangle", 0.09, 0.28);
    // marimba: chord notes in a bouncy rhythm
    MARIMBA.forEach((step, i) => {
      const f = mtof(chord.notes[i % 3]);
      pluck(ctx, out, at + step * STEP, f, "sine", 0.05, 0.32);
      pluck(ctx, out, at + step * STEP, f * 4, "sine", 0.008, 0.08);
    });
    // xylophone tune, an octave up, with a soft echo
    if (sing) {
      tune.forEach((n, step) => {
        if (n === null) return;
        const when = at + step * STEP;
        const f = mtof(72 + n);
        pluck(ctx, out, when, f, "triangle", 0.05, 0.35);
        pluck(ctx, song.echo, when, f, "sine", 0.025, 0.3);
      });
    }
    // shaker on the off-beats
    for (let step = 1; step < 8; step += 2) shaker(ctx, out, at + step * STEP, 0.02);
  }

  function startMusic() {
    if (!on || !musicOn || song) return;
    try {
      const ctx = ensure();
      if (!ctx) return;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, ctx.currentTime);
      out.gain.linearRampToValueAtTime(0.75, ctx.currentTime + 1.5);
      out.connect(ctx.destination);
      const echo = ctx.createDelay(1);
      const feedback = ctx.createGain();
      echo.delayTime.value = STEP * 3;
      feedback.gain.value = 0.25;
      echo.connect(feedback).connect(echo);
      echo.connect(out);
      song = { out, echo, next: ctx.currentTime + 0.1, bar: 0, timer: null };
      const pump = () => {
        if (!song) return;
        while (song.next < ctx.currentTime + lookahead) {
          scheduleBar(ctx, song.next, song.bar);
          song.next += BAR;
          song.bar += 1;
        }
      };
      pump();
      song.timer = setInterval(pump, 300);
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

  function playNotes(notes) {
    if (!on || !notes) return false;
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
    // Kept for older callers. The low drone during cutscenes was removed.
    startHum() {},
    stopHum() {},
    // Pip "says" a line in droid beeps. Longer lines get longer phrases.
    pipSay(text, expr) {
      const size = 2 + Math.min(4, String(text || "").length / 22);
      return playNotes(droidPhrase(pipMood(expr), size));
    },
    play(name) {
      if (SOUNDS[name]) return playNotes(SOUNDS[name]);
      if (PIP_MOODS[name]) return playNotes(droidPhrase(PIP_MOODS[name].mood, 3));
      return false;
    },
    // For the preview tool and tests: the notes of one droid phrase.
    droidNotes: droidPhrase,
    playNotes
  };
}
