// Luna Crew
// Copyright 2026 Rishi Jambagi
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     https://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
// Pip never says words. Pip talks like a small astromech droid: fast
// "bibbidi" chatter, whistles that swoop up and down with a slightly metallic
// edge, quick warbles, and a falling scream when Pip is scared. Every phrase
// is made fresh, so Pip never says the same thing twice.
//
// Extra note options used here:
//   curve: pitch shape over the note, as multipliers of f (smoothly joined)
//   fm: [ratio, index] adds a second wave that gives the metal "droid" edge
//   vib, depth: fast pitch wobble, vib times a second, depth Hz wide

const PIP_MOODS = {
  pipHappy: { mood: "happy" },
  pipExcited: { mood: "excited" },
  pipSad: { mood: "sad" },
  pipThink: { mood: "think" },
  pipSleepy: { mood: "sleepy" }
};

const rand = (a, b) => a + Math.random() * (b - a);
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];
const V = 0.085;

// The pieces a droid phrase is built from. Each returns notes starting at 0.
const PARTS = {
  // fast burbling chatter: tiny notes hopping between two pitches
  chatter(n = 8) {
    const notes = [];
    const low = rand(1300, 1900);
    const high = low * rand(1.35, 1.7);
    let at = 0;
    for (let i = 0; i < n; i += 1) {
      const f = (i % 2 ? high : low) * rand(0.94, 1.08);
      const d = rand(0.028, 0.045);
      notes.push({ f, curve: [1, rand(0.9, 1.15)], d, type: "sine", v: V * 0.85, a: 0.005, fm: [1.5, 0.12], at });
      at += d * rand(0.85, 1.05);
    }
    return notes;
  },
  // a swooping whistle: up, down, or up-then-down
  whoop(shape = "up") {
    const f = rand(1100, 2000);
    const d = rand(0.12, 0.24);
    const curve =
      shape === "up" ? [1, 1.15, 1.7, 2.1] : shape === "down" ? [1.9, 1.6, 1.05, 0.8] : shape === "hump" ? [1, 1.9, 1.7, 0.9] : [1.6, 0.85, 1.0, 1.9];
    return [{ f, curve, d, type: "sine", v: V, a: 0.008, fm: [1.0, 0.18] }];
  },
  // the famous warble: a very fast wobble on a sliding tone
  trill(up = true) {
    const f = rand(1500, 2300);
    const d = rand(0.18, 0.32);
    return [{ f, curve: up ? [1, 1.1, 1.35] : [1.3, 1.1, 0.85], d, type: "sine", v: V * 0.9, a: 0.01, vib: rand(32, 46), depth: rand(320, 560) }];
  },
  // two clear beeps, like "bee-boo"
  beeps() {
    const f = rand(1800, 2600);
    const g = f * pickOne([0.66, 0.75, 1.33, 1.5]);
    return [
      { f, curve: [1, 1.02], d: 0.075, type: "sine", v: V, a: 0.006, fm: [2.0, 0.1] },
      { f: g, curve: [1, 0.97], d: 0.09, type: "sine", v: V, a: 0.006, fm: [2.0, 0.1], at: 0.1 }
    ];
  },
  // a question: a low beep, then a whistle that shoots up at the end
  ask() {
    const f = rand(900, 1200);
    return [
      { f, curve: [1, 0.96], d: 0.08, type: "sine", v: V * 0.8, a: 0.006 },
      { f: f * 1.2, curve: [1, 1.05, 1.5, 2.6], d: 0.26, type: "sine", v: V, a: 0.01, fm: [1.0, 0.15], at: 0.13 }
    ];
  },
  // the scared scream: high, wobbling, falling fast
  scream() {
    const f = rand(2600, 3200);
    return [{ f, curve: [1, 0.95, 0.6, 0.25], d: rand(0.5, 0.7), type: "sine", v: V * 0.8, a: 0.015, vib: 18, depth: 160, fm: [1.0, 0.2] }];
  },
  // a grumpy buzz
  blat() {
    const f = rand(180, 240);
    return [{ f, curve: [1, 0.9], d: rand(0.16, 0.24), type: "sine", v: V * 0.7, a: 0.01, fm: [1.41, 3.2] }];
  },
  // a slow, sleepy, falling hum
  yawn() {
    const f = rand(700, 900);
    return [{ f, curve: [1, 1.15, 0.8, 0.5], d: rand(0.7, 0.9), type: "sine", v: V * 0.6, a: 0.08, vib: 5, depth: 30 }];
  }
};

const RECIPES = {
  happy: [["chatter", 8], ["whoop", "up"], ["beeps"], ["trill", true], ["whoop", "hump"], ["chatter", 6]],
  excited: [["chatter", 12], ["trill", true], ["whoop", "up"], ["chatter", 9], ["whoop", "hump"]],
  sad: [["scream"], ["blat"], ["whoop", "down"]],
  think: [["beeps"], ["chatter", 5], ["ask"]],
  sleepy: [["yawn"], ["beeps"], ["yawn"]]
};

// What each mood ends on, so the phrase "lands" like a sentence.
const ENDINGS = { happy: ["whoop", "up"], excited: ["trill", true], sad: ["whoop", "down"], think: ["ask"], sleepy: ["yawn"] };

// size is roughly how many "words" Pip says (a longer line, a longer phrase).
function droidPhrase(mood = "happy", size = 3) {
  const recipe = RECIPES[mood] || RECIPES.happy;
  const most = mood === "sad" || mood === "sleepy" ? 3 : 5;
  const count = Math.max(2, Math.min(most, Math.round(size)));
  const notes = [];
  let at = 0;
  let last = "";
  for (let i = 0; i < count; i += 1) {
    let choice = i === count - 1 ? ENDINGS[mood] || ENDINGS.happy : pickOne(recipe);
    if (choice[0] === last && i !== count - 1) choice = pickOne(recipe);
    last = choice[0];
    const [part, ...args] = choice;
    let end = 0;
    for (const note of PARTS[part](...args)) {
      notes.push({ ...note, at: at + (note.at || 0) });
      end = Math.max(end, (note.at || 0) + note.d);
    }
    // droids talk in quick bursts with tiny gaps
    at += end + rand(0.02, 0.07);
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

// A smooth pitch line through the curve points, for setValueCurveAtTime.
function pitchCurve(f, points) {
  const steps = 48;
  const out = new Float32Array(steps);
  for (let i = 0; i < steps; i += 1) {
    const x = (i / (steps - 1)) * (points.length - 1);
    const k = Math.min(points.length - 2, Math.floor(x));
    const t = x - k;
    const ease = t * t * (3 - 2 * t);
    out[i] = Math.max(40, f * (points[k] + (points[k + 1] - points[k]) * ease));
  }
  return out;
}

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
      if (note.curve) {
        source.frequency.setValueCurveAtTime(pitchCurve(note.f, note.curve), start, note.d);
      } else {
        source.frequency.setValueAtTime(note.f, start);
        if (note.to) source.frequency.exponentialRampToValueAtTime(note.to, start + note.d);
      }
      if (note.fm) {
        const [ratio, index] = note.fm;
        const mod = ctx.createOscillator();
        const amount = ctx.createGain();
        if (note.curve) mod.frequency.setValueCurveAtTime(pitchCurve(note.f * ratio, note.curve), start, note.d);
        else mod.frequency.value = note.f * ratio;
        amount.gain.value = note.f * index;
        mod.connect(amount).connect(source.frequency);
        mod.start(start);
        mod.stop(start + note.d + 0.05);
      }
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
      const size = 2 + Math.min(3, String(text || "").length / 25);
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
