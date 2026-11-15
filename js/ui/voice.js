// Read-aloud voice. It uses the speech voices already on the device (the Web
// Speech API), so there are no audio files and nothing is sent away.
//
// Nova and Dr. Sprout get natural, female, American or British voices, picked
// by name from a ranked list, and a different voice each when the device has
// two. Pip never speaks words: Pip only beeps (see pipSay in audio.js).

const TAGS = { en: "en-US", ja: "ja-JP" };

// Western English accents only, best first.
const EN_REGIONS = ["en-us", "en-gb", "en-au", "en-ca", "en-ie", "en-nz"];

// Female voices, best first. Edge's "Online (Natural)" voices and Apple's
// premium voices sound the most human, so any natural voice outranks the list.
const EN_FEMALE = [
  "aria", "jenny", "michelle", "emma", "ava", "sonia", "libby", "natasha", "clara",
  "google us english", "google uk english female", "samantha", "allison", "susan",
  "zoe", "nicky", "serena", "kate", "karen", "moira", "tessa", "victoria", "fiona",
  "hazel", "zira", "catherine", "heather", "female"
];
const JA_FEMALE = ["nanami", "aoi", "mayu", "shiori", "google 日本語", "kyoko", "o-ren", "haruka", "ayumi", "sayaka", "female"];
// Child-like voices are left out on purpose.
const SKIP = ["ana", "maisie", "child", "kid"];
const MALE = [
  "male", "david", "mark", "guy", "ryan", "daniel", "alex", "fred", "christopher", "eric",
  "roger", "steffan", "thomas", "brian", "andrew", "william", "george", "james", "richard",
  "ravi", "ichiro", "keita", "otoya", "hattori", "naoki", "daichi", "rishi", "aaron", "arthur", "gordon", "lee", "oliver"
];

// Each character's sound. Pitch above 1 sounds younger and brighter.
const STYLE = {
  nova: { pitch: 1.12, rate: 1.0 },
  sprout: { pitch: 1.32, rate: 1.04 },
  earth: { pitch: 1.0, rate: 0.95 }
};

const norm = (text) => String(text || "").toLowerCase().replace("_", "-");

function score(voice, lang) {
  const name = norm(voice.name);
  const tag = norm(voice.lang);
  if (lang === "ja") {
    if (!tag.startsWith("ja")) return -1;
  } else {
    if (!tag.startsWith("en")) return -1;
    // Indian, African, Asian and other English accents are left out.
    if (tag.length > 2 && !EN_REGIONS.some((r) => tag.startsWith(r))) return -1;
  }
  if ([...MALE, ...SKIP].some((m) => new RegExp(`\\b${m}\\b`).test(name))) return -1;
  const list = lang === "ja" ? JA_FEMALE : EN_FEMALE;
  const at = list.findIndex((f) => name.includes(f));
  let points = at === -1 ? 10 : 200 - at * 4;
  if (/natural|neural|premium|enhanced/.test(name)) points += 500;
  if (lang !== "ja" && tag.startsWith("en-us")) points += 20;
  if (lang !== "ja" && tag.startsWith("en-gb")) points += 12;
  return points;
}

// Pure: the best voices for a language, best first. Exported for the tests.
export function rankVoices(voices, lang = "en") {
  return [...(voices || [])]
    .map((voice) => ({ voice, points: score(voice, lang) }))
    .filter((item) => item.points >= 0)
    .sort((a, b) => b.points - a.points)
    .map((item) => item.voice);
}

// Pure: which voice each character uses. Nova takes the best voice, Sprout the
// next one when there is a second good voice, so the two sound different.
export function castVoices(voices, lang = "en") {
  const ranked = rankVoices(voices, lang);
  return { nova: ranked[0] || null, sprout: ranked[1] || ranked[0] || null, earth: ranked[0] || null };
}

export function createVoice({ enabled = true } = {}) {
  const synth = globalThis.speechSynthesis || null;
  const Utterance = globalThis.SpeechSynthesisUtterance || null;
  let on = Boolean(enabled);
  let cast = {};

  function load() {
    try {
      const voices = synth?.getVoices?.() || [];
      cast = { en: castVoices(voices, "en"), ja: castVoices(voices, "ja"), count: voices.length };
    } catch {
      cast = {};
    }
  }
  load();
  try {
    synth?.addEventListener?.("voiceschanged", load);
  } catch {
    /* older browsers */
  }

  function stop() {
    try {
      synth?.cancel();
    } catch {
      /* nothing to stop */
    }
  }

  return {
    get enabled() {
      return on;
    },
    get available() {
      return Boolean(synth && Utterance);
    },
    // Which voice each character got, for the settings hint and for checking.
    describe(lang = "en") {
      if (!cast.count) load();
      const pick = cast[lang] || {};
      return { nova: pick.nova?.name || null, sprout: pick.sprout?.name || null };
    },
    setEnabled(value) {
      on = Boolean(value);
      if (!on) stop();
    },
    // Returns true when the line is being spoken. Pip is never spoken.
    speak(text, { lang = "en", who = "nova" } = {}) {
      if (!on || !synth || !Utterance || !text || who === "pip") return false;
      try {
        if (!cast.count) load();
        const voices = cast[lang] || {};
        const voice = voices[who] || voices.nova || null;
        // The device has voices but none that fit: stay quiet rather than use a wrong accent.
        if (cast.count && !voice) return false;
        stop();
        const line = new Utterance(String(text));
        const style = STYLE[who] || STYLE.nova;
        line.lang = voice?.lang || TAGS[lang] || lang;
        if (voice) line.voice = voice;
        // Natural voices already sound right; only nudge their pitch a little.
        const natural = /natural|neural|premium|enhanced/i.test(voice?.name || "");
        line.pitch = natural ? 1 + (style.pitch - 1) * 0.6 : style.pitch;
        line.rate = style.rate;
        line.volume = 1;
        synth.speak(line);
        return true;
      } catch {
        return false;
      }
    },
    stop
  };
}
