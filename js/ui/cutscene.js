// Cutscene player. Each shot names a scene from cutsceneArt.js. The scene is
// built once, then moved every frame. Skip and Escape end the whole cutscene.
// Reduced motion shows one still picture per shot, with subtitles.

import { h } from "./dom.js";
import { portrait } from "./characters.js";
import { SCENES, STAGE, artMarkup } from "./cutsceneArt.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const FADE_MS = 260;
const TAP_GUARD_MS = 450;

const STYLE = `
.cutscene-stage { background: #02030a; }
.cutscene-camera { width: min(100%, calc((100vh - 200px) * 16 / 9)); min-width: min(100%, 320px); aspect-ratio: 16 / 9; transform: none; }
.cutscene-svg { width: 100%; height: 100%; display: block; background: #02030a; border-radius: 14px; }
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

export function playCutscene(host, { id, script, i18n, audio, reduced, nameOf }) {
  const scene = script?.[id];
  if (!scene || !Array.isArray(scene.shots) || scene.shots.length === 0) return Promise.resolve("missing");

  return new Promise((resolve) => {
    addStyle();
    let index = 0;
    let art = null;
    let parts = new Map();
    const previousFocus = document.activeElement;
    let started = performance.now();
    let paused = false;
    let pausedAt = 0;
    let frame = 0;
    let done = false;

    const stage = h("div", { class: "cutscene-stage" });
    const camera = h("div", { class: "cutscene-camera" });
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${STAGE.width} ${STAGE.height}`);
    svg.setAttribute("class", "cutscene-svg");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("aria-hidden", "true");
    camera.append(svg);
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
        if (paused) pausedAt = performance.now();
        else started += performance.now() - pausedAt;
      }
    });
    const overlay = h("div", { class: reduced ? "cutscene is-still" : "cutscene", role: "dialog", "aria-modal": "true", "aria-label": i18n.t("cut.label") }, [
      stage,
      h("div", { class: "cutscene-sub", "aria-live": "polite" }, [face, h("div", {}, [who, line])]),
      h("div", { class: "cutscene-actions" }, [pause, next, skip])
    ]);
    stage.append(camera);
    stage.addEventListener("click", () => goNext(true));

    const q = (name) => parts.get(name) || null;

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
      if (previousFocus && typeof previousFocus.focus === "function" && document.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true });
      }
      resolve(reason || "done");
    }

    function mount(shot) {
      art = SCENES[shot.art] || null;
      parts = new Map();
      try {
        svg.innerHTML = artMarkup(shot.art);
        for (const node of svg.querySelectorAll("[data-a]")) parts.set(node.getAttribute("data-a"), node);
      } catch (error) {
        art = null;
        svg.innerHTML = "";
        console.error("cutscene art failed", shot.art, error);
      }
      const speaker = shot.who ? nameOf(shot.who) : "";
      who.textContent = speaker ? `${speaker}: ` : "";
      line.textContent = shot.line ? i18n.t(shot.line) : "";
      face.innerHTML = shot.who ? portrait(shot.who, shot.expr || "neutral", { title: speaker }) : "";
    }

    function draw(p, seconds) {
      if (!art) return;
      try {
        art.frame(q, p, seconds);
      } catch (error) {
        console.error("cutscene frame failed", error);
        art = null;
      }
    }

    function show(shot) {
      started = performance.now();
      mount(shot);
      if (reduced) {
        const still = Number.isFinite(shot.still) ? shot.still : 0.8;
        draw(still, still * (shotHold(shot, line.textContent) / 1000));
        svg.style.opacity = "1";
      } else {
        draw(0, 0);
        svg.style.opacity = "0";
      }
      if (shot.sound) audio?.play(shot.sound);
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
        draw(Math.min(1, elapsed / duration), elapsed / 1000);
        svg.style.opacity = String(Math.min(1, elapsed / FADE_MS, Math.max(0.35, (duration - elapsed) / FADE_MS + 0.35)));
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
