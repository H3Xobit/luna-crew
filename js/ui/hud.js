// Top of the game screen: which lunar day and round it is, day or night,
// Mission Points and the three bars with their numbers.

import { h, clear } from "./dom.js";
import { icon } from "./icons.js";

const BARS = ["power", "life", "shield"];
export const LOW_BAR = 25;

export function createHud(root, { i18n, config }) {
  const dayText = h("span", { class: "hud-day-text" });
  const phaseChip = h("span", { class: "hud-phase" });
  const dots = h("ol", { class: "round-dots" });
  const points = h("span", { class: "hud-points-value", text: "0" });
  const pointsBox = h("div", { class: "hud-points", id: "hud-points" }, [
    h("span", { html: icon("star") }),
    points,
    h("span", { class: "hud-points-label" })
  ]);

  const bars = {};
  const barList = h("div", { class: "bars", id: "hud-bars" });
  for (const name of BARS) {
    const fill = h("div", { class: "bar-fill" });
    const ghost = h("div", { class: "bar-ghost" });
    const line = h("div", { class: "bar-line", hidden: true });
    const value = h("span", { class: "bar-value", text: "0" });
    const next = h("span", { class: "bar-next" });
    const delta = h("span", { class: "bar-delta", "aria-hidden": "true" });
    const low = h("span", { class: "bar-low" });
    const label = h("span", { class: "bar-label" });
    const track = h("div", { class: "bar-track", role: "meter", "aria-valuemin": config.bars.min, "aria-valuemax": config.bars.max }, [
      ghost,
      fill,
      line
    ]);
    const row = h("div", { class: `bar bar-${name}`, dataset: { bar: name } }, [
      h("span", { class: "bar-icon", html: icon(name) }),
      h("div", { class: "bar-main" }, [h("div", { class: "bar-head" }, [label, low, delta]), track]),
      h("div", { class: "bar-numbers" }, [value, next])
    ]);
    bars[name] = { row, fill, ghost, line, value, next, delta, low, label, track };
    barList.append(row);
  }

  clear(root).append(
    h("div", { class: "hud-top" }, [h("div", { class: "hud-day" }, [dayText, phaseChip]), dots, pointsBox]),
    barList
  );

  let last = null;

  function renderDots(state) {
    clear(dots);
    for (let i = 1; i <= config.roundsPerDay; i += 1) {
      const night = config.nightRounds.includes(i);
      const done = i < state.roundInDay;
      const current = i === state.roundInDay;
      dots.append(
        h("li", {
          class: `round-dot${night ? " is-night" : ""}${done ? " is-done" : ""}${current ? " is-current" : ""}`,
          html: icon(night ? "moon" : "sun"),
          "aria-label": `${i18n.t(night ? "hud.night" : "hud.day")} ${i}${current ? ` (${i18n.t("hud.now")})` : ""}`
        })
      );
    }
  }

  const api = {
    render(state) {
      last = state;
      dayText.textContent = i18n.t("hud.lunarDay", { n: state.lunarDay, total: config.lunarDays });
      phaseChip.innerHTML = `${icon(state.isNight ? "moon" : "sun")}<span>${i18n.t(state.isNight ? "hud.night" : "hud.day")}</span>`;
      phaseChip.classList.toggle("is-night", state.isNight);
      renderDots(state);
      points.textContent = String(state.missionPoints);
      pointsBox.querySelector(".hud-points-label").textContent = i18n.t("hud.missionPoints");
      for (const name of BARS) {
        const bar = bars[name];
        const value = Math.round(state[name]);
        bar.label.textContent = i18n.t(`bar.${name}`);
        bar.value.textContent = String(value);
        bar.fill.style.width = `${value}%`;
        bar.track.setAttribute("aria-valuenow", String(value));
        bar.track.setAttribute("aria-label", i18n.t(`bar.${name}`));
        const isLow = value <= LOW_BAR;
        bar.row.classList.toggle("is-low", isLow);
        bar.low.textContent = isLow ? i18n.t("hud.low") : "";
      }
    },
    // Shows where each bar is heading before the player presses GO.
    forecast(prediction) {
      for (const name of BARS) {
        const bar = bars[name];
        if (!prediction || !last) {
          bar.next.textContent = "";
          bar.ghost.style.width = "0%";
          bar.row.classList.remove("will-drop", "will-rise", "will-empty");
          continue;
        }
        const now = Math.round(last[name]);
        const then = Math.round(prediction[name]);
        bar.next.textContent = `\u2192 ${then}`;
        bar.next.setAttribute("aria-label", i18n.t("hud.forecast", { n: then }));
        bar.ghost.style.width = `${Math.max(now, then)}%`;
        bar.row.classList.toggle("will-drop", then < now);
        bar.row.classList.toggle("will-rise", then > now);
        bar.row.classList.toggle("will-empty", then <= 0);
      }
    },
    // The storm line on the shield bar: how much shield this storm needs.
    shieldLine(value) {
      const line = bars.shield.line;
      if (!Number.isFinite(value)) {
        line.hidden = true;
        return;
      }
      line.hidden = false;
      line.style.left = `${Math.min(100, value)}%`;
      line.title = i18n.t("hud.stormLine", { n: value });
    },
    showChange(change) {
      for (const name of BARS) {
        const amount = change?.[name] ?? 0;
        const node = bars[name].delta;
        node.classList.remove("is-up", "is-down", "is-shown");
        if (amount === 0) {
          node.textContent = "";
          continue;
        }
        node.textContent = amount > 0 ? `+${amount}` : String(amount);
        void node.offsetWidth;
        node.classList.add(amount > 0 ? "is-up" : "is-down", "is-shown");
      }
    },
    clearChange() {
      for (const name of BARS) {
        bars[name].delta.textContent = "";
        bars[name].delta.classList.remove("is-up", "is-down", "is-shown");
      }
    }
  };
  return api;
}
