// A small timeline player. Shots are data. Skip and Escape end the whole
// cutscene. Reduced motion shows one still frame per shot, with subtitles.

import { h } from "./dom.js";
import { portrait } from "./characters.js";

const LAYERS = {
  stars: `<g class="cs-stars">${Array.from({ length: 28 }, (_, i) => {
    const x = (i * 97) % 800;
    const y = (i * 53) % 220;
    return `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 1.6 : 1}" fill="#d7e6ff"/>`;
  }).join("")}</g>`,
  earth: `<g class="cs-earth"><circle cx="400" cy="230" r="150" fill="#2f6dff"/><ellipse cx="400" cy="230" rx="150" ry="46" fill="none" stroke="#b7f0ff" stroke-width="10" opacity="0.55"/><path d="M280 180 q40 -30 90 0 q30 20 70 -10 q40 10 80 40 q-20 40 -70 50 q-80 10 -140 -20 z" fill="#3dcb7a" opacity="0.9"/></g>`,
  moon: `<g class="cs-moon"><circle cx="400" cy="260" r="170" fill="#c5c9d4"/><circle cx="330" cy="210" r="28" fill="#a7adba"/><circle cx="470" cy="250" r="18" fill="#a7adba"/><circle cx="390" cy="320" r="22" fill="#9aa1b0"/></g>`,
  ridge: `<path d="M0 300 L180 210 L320 280 L520 160 L800 250 L800 450 L0 450 Z" fill="#6e7484"/>`,
  sun: `<g class="cs-sun"><circle cx="640" cy="90" r="36" fill="#ffe08a"/><circle cx="640" cy="90" r="70" fill="#ffe08a" opacity="0.25"/></g>`,
  base: `<g class="cs-base"><rect x="300" y="250" width="200" height="90" rx="16" fill="#d7deee" stroke="#1b1630" stroke-width="3"/><rect class="cs-window" x="330" y="270" width="36" height="28" rx="4" fill="#9ad7ff"/><rect class="cs-window" x="430" y="270" width="36" height="28" rx="4" fill="#9ad7ff"/><path d="M250 340 H550" stroke="#8d93a3" stroke-width="8"/></g>`,
  lights: `<g class="cs-lights"><rect x="332" y="272" width="32" height="24" fill="#ffe08a" opacity="0.85"/><rect x="432" y="272" width="32" height="24" fill="#ffe08a" opacity="0.85"/></g>`,
  lander: `<g class="cs-lander"><path d="M360 200 h80 l18 70 h-116 z" fill="#e8eefc" stroke="#1b1630" stroke-width="3"/><path d="M350 270 h100" stroke="#1b1630" stroke-width="4"/></g>`,
  dust: `<g class="cs-dust" opacity="0.7"><ellipse cx="400" cy="300" rx="90" ry="16" fill="#c5c9d4"/><circle cx="330" cy="286" r="6" fill="#d7dbe4"/><circle cx="470" cy="284" r="5" fill="#d7dbe4"/></g>`,
  ramp: `<path d="M470 300 L560 360" stroke="#d7deee" stroke-width="10" stroke-linecap="round"/>`,
  frost: `<g class="cs-frost">${Array.from({ length: 10 }, (_, i) => `<circle cx="${80 + i * 28}" cy="${40 + (i % 4) * 22}" r="2" fill="#e7f6ff"/>`).join("")}</g>`,
  cart: `<g class="cs-cart"><rect x="180" y="300" width="70" height="28" rx="6" fill="#ffd166" stroke="#1b1630" stroke-width="2"/><circle cx="196" cy="332" r="6" fill="#1b1630"/><circle cx="234" cy="332" r="6" fill="#1b1630"/></g>`,
  flare: `<g class="cs-flare"><circle cx="120" cy="70" r="28" fill="#fff"/><circle cx="120" cy="70" r="60" fill="#ffb45a" opacity="0.45"/></g>`,
  streaks: `<g class="cs-streaks">${Array.from({ length: 8 }, (_, i) => `<path d="M${40 + i * 90} ${20 + (i % 3) * 30} l40 70" stroke="#ffe08a" stroke-width="2" opacity="0.7"/>`).join("")}</g>`,
  shelter: `<g class="cs-shelter"><path d="M340 210 h140 v90 h-140 z" fill="#1b1630" opacity="0.35"/><rect x="360" y="230" width="100" height="60" rx="8" fill="#ffe08a"/></g>`,
  sparks: `<g class="cs-sparks"><path d="M560 240 l14 10 -8 2 10 12" stroke="#ffd166" stroke-width="3" fill="none"/><path d="M600 220 l10 16" stroke="#fff" stroke-width="2"/></g>`,
  crystal: `<g class="cs-crystal"><path d="M400 250 l22 36 -22 14 -22 -14 z" fill="#b7f0ff" stroke="#1b1630" stroke-width="2"/></g>`,
  plants: `<g class="cs-plants"><rect x="300" y="250" width="200" height="80" fill="#2a1440"/><path d="M360 320 q-16 -40 0 -60 q16 20 0 60" fill="#8be28f"/><path d="M430 320 q-16 -50 0 -74 q16 24 0 74" fill="#5ee08a"/></g>`,
  badge: `<g class="cs-badge"><circle cx="400" cy="180" r="46" fill="#ffd166" stroke="#1b1630" stroke-width="4"/><path d="M400 150 l8 18 20 2 -15 13 5 19 -18 -10 -18 10 5 -19 -15 -13 20 -2 z" fill="#fff"/></g>`,
  ship: `<g class="cs-ship"><path d="M370 160 h60 l16 80 h-92 z" fill="#e8eefc" stroke="#1b1630" stroke-width="3"/><path d="M360 250 h80" stroke="#8d93a3" stroke-width="6"/></g>`,
  title: ""
};

function layerMarkup(name) {
  return LAYERS[name] || "";
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function cutsceneLength(scene) {
  const shots = Array.isArray(scene?.shots) ? scene.shots : [];
  return shots.reduce((sum, shot) => sum + (Number(shot.duration) || 0), 0);
}

export function playCutscene(host, { id, script, i18n, audio, reduced, nameOf }) {
  const scene = script?.[id];
  if (!scene || !Array.isArray(scene.shots) || scene.shots.length === 0) return Promise.resolve("missing");

  return new Promise((resolve) => {
    let index = 0;
    let started = performance.now();
    let paused = false;
    let pausedAt = 0;
    let frame = 0;
    let done = false;
    const stage = h("div", { class: "cutscene-stage" });
    const camera = h("div", { class: "cutscene-camera" });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 800 450");
    svg.setAttribute("class", "cutscene-svg");
    camera.append(svg);
    const who = h("strong", { class: "cutscene-who" });
    const line = h("p", { class: "cutscene-line" });
    const face = h("span", { class: "cutscene-face" });
    const skip = h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("cut.skip"), onclick: () => finish("skip") });
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
    const overlay = h("div", { class: "cutscene", role: "dialog", "aria-modal": "true", "aria-label": i18n.t("cut.label") }, [
      stage,
      h("div", { class: "cutscene-sub" }, [face, h("div", {}, [who, line])]),
      h("div", { class: "cutscene-actions" }, [pause, skip])
    ]);
    stage.append(camera);

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish("skip");
      }
    }

    function finish(reason) {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      audio?.stopHum?.();
      resolve(reason || "done");
    }

    function draw(shot, t) {
      const from = shot.camera || {};
      const to = shot.tween || {};
      const x = lerp(from.x || 0, to.x != null ? to.x : from.x || 0, t);
      const y = lerp(from.y || 0, to.y != null ? to.y : from.y || 0, t);
      const scale = lerp(from.scale || 1, to.scale != null ? to.scale : from.scale || 1, t);
      camera.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      svg.innerHTML = (shot.layers || []).map(layerMarkup).join("");
      const speaker = shot.who ? nameOf(shot.who) : "";
      who.textContent = speaker ? `${speaker}: ` : "";
      line.textContent = shot.line ? i18n.t(shot.line) : "";
      face.innerHTML = shot.who ? portrait(shot.who, shot.expr || "neutral", { title: speaker }) : "";
    }

    function tick(now) {
      if (done) return;
      if (!paused) {
        const shot = scene.shots[index];
        const duration = Math.max(400, shot.duration || 2000);
        const elapsed = now - started;
        const t = reduced ? 1 : Math.min(1, elapsed / duration);
        draw(shot, t);
        if (elapsed >= duration) {
          index += 1;
          started = now;
          if (index >= scene.shots.length) {
            finish("done");
            return;
          }
          if (scene.shots[index].sound) audio?.play(scene.shots[index].sound);
        }
      }
      frame = requestAnimationFrame(tick);
    }

    document.addEventListener("keydown", onKey);
    host.append(overlay);
    skip.focus();
    audio?.startHum?.();
    if (scene.shots[0].sound) audio?.play(scene.shots[0].sound);
    draw(scene.shots[0], reduced ? 1 : 0);
    frame = requestAnimationFrame(tick);
  });
}
