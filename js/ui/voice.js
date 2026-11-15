// Read-aloud voice. It uses the speech voice that is already on the device
// (the Web Speech API), so there are no audio files and nothing is sent away.
// If the device has no voice for the language, it simply stays quiet.

const TAGS = { en: "en-US", ja: "ja-JP" };
const STYLE = {
  nova: { pitch: 1.05, rate: 0.95 },
  sprout: { pitch: 1.25, rate: 0.95 },
  pip: { pitch: 1.8, rate: 1.08 }
};

export function createVoice({ enabled = true } = {}) {
  const synth = globalThis.speechSynthesis || null;
  const Utterance = globalThis.SpeechSynthesisUtterance || null;
  let on = Boolean(enabled);
  // Ask for the voice list early. Some browsers only fill it after the first ask.
  try {
    synth?.getVoices?.();
  } catch {
    /* no voices */
  }

  function pick(lang) {
    const voices = synth.getVoices ? synth.getVoices() : [];
    if (voices.length === 0) return { ok: true, voice: null };
    const match = voices.filter((v) => String(v.lang || "").toLowerCase().replace("_", "-").startsWith(lang));
    if (match.length === 0) return { ok: false, voice: null };
    return { ok: true, voice: match.find((v) => v.localService) || match[0] };
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
    setEnabled(value) {
      on = Boolean(value);
      if (!on) stop();
    },
    // Returns true when the line is being spoken.
    speak(text, { lang = "en", who = "nova" } = {}) {
      if (!on || !synth || !Utterance || !text) return false;
      try {
        const { ok, voice } = pick(lang);
        if (!ok) return false;
        stop();
        const line = new Utterance(String(text));
        const style = STYLE[who] || STYLE.nova;
        line.lang = TAGS[lang] || lang;
        if (voice) line.voice = voice;
        line.pitch = style.pitch;
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
