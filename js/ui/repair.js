// Panel repair: tap the glowing spots before the time runs out.
// Missing it is fine. The crew tries again next round.

import { h } from "./dom.js";

const SLOTS = [
  [16, 26], [50, 20], [82, 30], [24, 68], [56, 72], [84, 66]
];

export function pickSlots(count, random = Math.random) {
  const pool = SLOTS.map((slot) => slot.slice());
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.max(1, Math.min(count, pool.length)));
}

function panelArt() {
  let cells = "";
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      cells += `<rect x="${12 + col * 46}" y="${12 + row * 46}" width="42" height="42" rx="4" fill="#2f5fd6" stroke="#0e1a44" stroke-width="2"/>`;
    }
  }
  return (
    `<svg viewBox="0 0 300 162" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="300" height="162" rx="10" fill="#141a33"/>${cells}` +
    `<path d="M40 20 l34 40 -18 16 44 50" fill="none" stroke="#05060f" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M214 14 l-22 44 26 12 -30 62" fill="none" stroke="#05060f" stroke-width="4" stroke-linejoin="round"/>` +
    `</svg>`
  );
}

// A finished panel is a success even if the clock has already run out.
export function repairSuccess(fixed, total) {
  return fixed >= total && total > 0;
}

export function runRepair(modals, { i18n, audio, hotspots, timeLimitMs, random = Math.random }) {
  const slots = pickSlots(hotspots, random);
  let fixed = 0;
  let over = false;
  let timeout = null;
  let ticker = null;

  const count = h("strong", { class: "repair-count", text: i18n.t("repair.count", { n: 0, total: slots.length }) });
  const seconds = h("span", { class: "repair-seconds", text: i18n.t("repair.seconds", { n: Math.ceil(timeLimitMs / 1000) }) });
  const timerFill = h("div", { class: "repair-timer-fill" });
  timerFill.style.animationDuration = `${timeLimitMs}ms`;
  const field = h("div", { class: "repair-field" }, [h("div", { class: "repair-art", html: panelArt() })]);

  function finish(success) {
    if (over) return;
    over = true;
    clearTimeout(timeout);
    clearInterval(ticker);
    modals.close(success);
  }

  slots.forEach(([x, y], index) => {
    const spot = h("button", {
      type: "button",
      class: "repair-spot",
      "aria-label": i18n.t("repair.spot", { n: index + 1 }),
      onclick: () => {
        if (over || spot.disabled) return;
        spot.disabled = true;
        spot.classList.add("is-fixed");
        fixed += 1;
        audio.play("zap");
        count.textContent = i18n.t("repair.count", { n: fixed, total: slots.length });
        if (repairSuccess(fixed, slots.length)) {
          clearTimeout(timeout);
          clearInterval(ticker);
          setTimeout(() => finish(true), 260);
        }
      }
    });
    spot.style.left = `${x}%`;
    spot.style.top = `${y}%`;
    field.append(spot);
  });

  const started = Date.now();
  timeout = setTimeout(() => finish(false), timeLimitMs);
  ticker = setInterval(() => {
    const left = Math.max(0, Math.ceil((timeLimitMs - (Date.now() - started)) / 1000));
    seconds.textContent = i18n.t("repair.seconds", { n: left });
  }, 250);

  return modals
    .open({
      title: i18n.t("repair.title"),
      tone: "repair",
      body: [
        h("p", { text: i18n.t("repair.how", { total: slots.length }) }),
        h("div", { class: "repair-status", role: "status", "aria-live": "polite" }, [count, seconds]),
        h("div", { class: "repair-timer", "aria-hidden": "true" }, [timerFill]),
        field
      ],
      actions: []
    })
    .then((result) => {
      over = true;
      clearTimeout(timeout);
      clearInterval(ticker);
      return result === true;
    });
}
