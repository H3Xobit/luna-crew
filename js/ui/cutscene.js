// Cutscene player. Each shot names a scene from cutsceneArt.js. The scene is
// built once, then moved every frame. Skip and Escape end the whole cutscene.
// Reduced motion shows one still picture per shot, with subtitles.

import { h } from "./dom.js";
import { portrait } from "./characters.js";
import { buildStage } from "./cutsceneArt.js";

const FADE_MS = 380;
const TAP_GUARD_MS = 450;

const STYLE = `
.cutscene-stage { background: #02030a; }
.cutscene-camera { width: min(100%, calc((100vh - 200px) * 16 / 9)); min-width: min(100%, 320px); aspect-ratio: 16 / 9; transform: none; }
.cutscene-camera .cx-stage { width: 100%; height: 100%; border-radius: 14px; }
.cutscene.is-still .cx-tw { animation: none; }
`;

export function cutsceneLength(scene) {
  const shots = Array.isArray(scene?.shots) ? scene.shots : [];
  return shots.reduce((sum, shot) => sum + (Number(shot.duration) || 0), 0);
}

export function shotHold(shot, text) {
  const letters = [...String(text || "")].length;
  return Math.max(Number(shot?.duration) || 2000, Math.min(7000, letters * 45));
}

function addStyle() {
  if (document.getElementById("cx-style")) return;
  const style = document.createElement("style");
  style.id = "cx-style";
  style.textContent = STYLE;
  document.head.append(style);
}

export function playCutscene(host, { id, script, i18n, audio, voice, reduced, nameOf }) {
  const scene = script?.[id];
  if (!scene || !Array.isArray(scene.shots) || scene.shots.length === 0) return Promise.resolve("missing");

  return new Promise((resolve) => {
    addStyle();
    let index = 0;
    let picture = null;
    let cues = [];
    const previousFocus = document.activeElement;
    let started = performance.now();
    let paused = false;
    let pausedAt = 0;
    let frame = 0;
    let done = false;

    const stage = h("div", { class: "cutscene-stage" });
    const camera = h("div", { class: "cutscene-camera" });
    const who = h("strong", { class: "cutscene-who" });
    const line = h("p", { class: "cutscene-line" });
    const face = h("span", { class: "cutscene-face" });
    const skip = h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("cut.skip"), onclick: () => finish("skip") });
    const next = h("button", { type: "button", class: "btn btn-primary", text: i18n.t("ui.next"), onclick: () => goNext(true) });
    const pause = h("button", {
      type: "button",
      class: "btn btn-quiet",
      text: i18n.t("cut.pause"),
      onclick: () => {
        paused = !paused;
        pause.textContent = i18n.t(paused ? "cut.play" : "cut.pause");
        if (paused) {
          pausedAt = performance.now();
          audio?.hush?.();
          voice?.stop();
        } else {
          started += performance.now() - pausedAt;
        }
      }
    });
    const overlay = h("div", { class: reduced ? "cutscene is-still" : "cutscene", role: "dialog", "aria-modal": "true", "aria-label": i18n.t("cut.label") }, [
      stage,
      h("div", { class: "cutscene-sub", "aria-live": "polite" }, [face, h("div", {}, [who, line])]),
      h("div", { class: "cutscene-actions" }, [pause, next, skip])
    ]);
    stage.append(camera);
    stage.addEventListener("click", () => goNext(true));

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish("skip");
        return;
      }
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowRight") {
        if (event.target === pause || event.target === skip) return;
        event.preventDefault();
        goNext(true);
      }
    }

    function finish(reason) {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      audio?.stopHum?.();
      audio?.hush?.();
      voice?.stop();
      if (previousFocus && typeof previousFocus.focus === "function" && document.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true });
      }
      resolve(reason || "done");
    }

    function mount(shot) {
      picture = buildStage(shot.art);
      picture.el.style.opacity = reduced ? "1" : "0";
      camera.replaceChildren(picture.el);
      const speaker = shot.who ? nameOf(shot.who) : "";
      who.textContent = speaker ? `${speaker}: ` : "";
      line.textContent = shot.line ? i18n.t(shot.line) : "";
      face.innerHTML = shot.who ? portrait(shot.who, shot.expr || "neutral", { title: speaker }) : "";
    }

    function show(shot) {
      started = performance.now();
      mount(shot);
      if (reduced) {
        const still = Number.isFinite(shot.still) ? shot.still : 0.8;
        picture.draw(still, still * (shotHold(shot, line.textContent) / 1000));
      } else {
        picture.draw(0, 0);
      }
      audio?.hush?.();
      if (shot.sound) audio?.play(shot.sound);
      cues = reduced ? [] : [...(shot.cues || [])].sort((a, b) => a[0] - b[0]);
      if (shot.who === "pip") {
        if (!reduced) setTimeout(() => !done && audio?.pipSay?.(line.textContent, shot.expr), 250);
      } else {
        voice?.speak(line.textContent, { lang: i18n.lang, who: shot.who || "nova" });
      }
    }

    function goNext(fromUser) {
      if (done) return;
      if (fromUser && paused) return;
      if (fromUser && performance.now() - started < TAP_GUARD_MS) return;
      index += 1;
      if (index >= scene.shots.length) {
        finish("done");
        return;
      }
      show(scene.shots[index]);
    }

    function tick(now) {
      if (done) return;
      if (!paused && !reduced) {
        const shot = scene.shots[index];
        const duration = shotHold(shot, line.textContent);
        const elapsed = Math.max(0, now - started);
        picture.draw(elapsed / duration, elapsed / 1000);
        // Sound effects placed at a moment in the shot, as [when 0..1, name].
        while (cues.length && elapsed / duration >= cues[0][0]) audio?.play(cues.shift()[1]);
        // Fade in from black, fade back to black: one clean cut between shots.
        const fade = Math.min(1, elapsed / FADE_MS, Math.max(0, (duration - elapsed) / FADE_MS));
        const shown = fade.toFixed(2);
        if (picture.el.style.opacity !== shown) picture.el.style.opacity = shown;
        if (elapsed >= duration) goNext(false);
      }
      frame = requestAnimationFrame(tick);
    }

    document.addEventListener("keydown", onKey);
    host.append(overlay);
    next.focus();
    audio?.startHum?.();
    show(scene.shots[0]);
    frame = requestAnimationFrame(tick);
  });
}
