// Luna Crew
// Copyright 2026 Team Maja Madi
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

// Visual novel style talk box: a portrait, a name and one line at a time.
// Lines that carry a real science fact show a source chip with a link.

import { h, clear, sourceLink, reducedMotion } from "./dom.js";
import { portrait } from "./characters.js";

const TARGETS = {
  bars: "#hud-bars",
  points: "#jobs-points",
  jobs: "#jobs-list",
  "job-life": "#job-life",
  lights: "#lights-toggle",
  ask: "#ask-earth",
  go: "#go-button"
};

const TYPE_MS = 22;

export function createDialogue(root, { i18n, audio, nameOf }) {
  const face = h("div", { class: "dialogue-portrait" });
  const name = h("div", { class: "dialogue-name" });
  const typed = h("p", { class: "dialogue-text", "aria-hidden": "true" });
  const spoken = h("p", { class: "visually-hidden", "aria-live": "polite" });
  const factBox = h("div", { class: "dialogue-fact", hidden: true });
  const nextLabel = h("span");
  const next = h("button", { type: "button", class: "btn btn-next dialogue-next" }, [nextLabel]);
  const skip = h("button", { type: "button", class: "btn btn-quiet dialogue-skip", hidden: true });
  const box = h("div", { class: "dialogue-box", role: "group" }, [
    face,
    h("div", { class: "dialogue-body" }, [name, typed, spoken, factBox]),
    h("div", { class: "dialogue-actions" }, [skip, next])
  ]);
  const backdrop = h("div", { class: "dialogue-backdrop" });
  clear(root).append(backdrop, box);
  root.hidden = true;

  let timer = null;
  let finishTyping = null;
  let spotlight = null;
  let speaking = false;

  function setSpotlight(target) {
    if (spotlight) spotlight.classList.remove("spotlight");
    spotlight = null;
    const selector = TARGETS[target];
    if (!selector) return;
    const node = document.querySelector(selector);
    if (!node) return;
    node.classList.add("spotlight");
    spotlight = node;
    node.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
  }

  function type(text) {
    clearInterval(timer);
    return new Promise((resolve) => {
      if (reducedMotion()) {
        typed.textContent = text;
        finishTyping = null;
        resolve();
        return;
      }
      const chars = Array.from(text);
      let shown = 0;
      typed.textContent = "";
      finishTyping = () => {
        clearInterval(timer);
        typed.textContent = text;
        finishTyping = null;
        resolve();
      };
      timer = setInterval(() => {
        shown += 1;
        typed.textContent = chars.slice(0, shown).join("");
        if (shown % 3 === 1 && !speaking) audio.play("talk");
        if (shown >= chars.length) finishTyping();
      }, TYPE_MS);
    });
  }

  function showLine(line, vars) {
    const who = line.who || "pip";
    const speaker = nameOf(who);
    face.innerHTML = portrait(who, line.expr, { title: speaker });
    box.dataset.who = who;
    name.textContent = speaker;
    const lead = line.lead ? `${i18n.pick(line.lead, vars)} ` : "";
    const text = `${lead}${i18n.pick(line.text, vars)}`;
    spoken.textContent = `${speaker}: ${text}`;
    clear(factBox);
    if (line.fact) {
      factBox.hidden = false;
      factBox.append(
        h("span", { class: "fact-tag", text: i18n.t("fact.real") }),
        sourceLink(line.fact.source.url, `${line.fact.source.agency}: ${line.fact.source.name}`)
      );
    } else if (line.chip) {
      factBox.hidden = false;
      factBox.append(line.chip);
    } else {
      factBox.hidden = true;
    }
    setSpotlight(line.target);
    // Nobody reads aloud. Pip "talks" in droid beeps; the words stay on screen.
    speaking = who === "pip" ? Boolean(audio.pipSay?.(text, line.expr)) : false;
    return type(text);
  }

  // Shows the lines one by one. Resolves with "done" after the last line, or
  // "skipped" when the player pressed Skip.
  function say(lines, { vars = {}, skippable = false } = {}) {
    const list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean);
    if (list.length === 0) return Promise.resolve("done");
    return new Promise((resolve) => {
      let index = 0;
      root.hidden = false;
      document.body.classList.add("dialogue-open");
      nextLabel.textContent = i18n.t("ui.next");
      skip.hidden = !skippable || list.length < 2;
      skip.textContent = i18n.t("ui.skip");

      function close(how) {
        clearInterval(timer);
        finishTyping = null;
        speaking = false;
        setSpotlight(null);
        root.hidden = true;
        document.body.classList.remove("dialogue-open");
        next.removeEventListener("click", advance);
        backdrop.removeEventListener("click", advance);
        skip.removeEventListener("click", skipAll);
        resolve(how === "skipped" ? "skipped" : "done");
      }

      function skipAll() {
        close("skipped");
      }

      function advance() {
        if (finishTyping) {
          finishTyping();
          return;
        }
        audio.play("tap");
        index += 1;
        if (index >= list.length) {
          close("done");
          return;
        }
        nextLabel.textContent = i18n.t(index === list.length - 1 ? "ui.ok" : "ui.next");
        showLine(list[index], vars);
      }

      next.addEventListener("click", advance);
      backdrop.addEventListener("click", advance);
      skip.addEventListener("click", skipAll);
      if (list.length === 1) nextLabel.textContent = i18n.t("ui.ok");
      showLine(list[0], vars);
      next.focus({ preventScroll: true });
    });
  }

  return { say, element: root };
}
