// The planner's panel: share work points between four jobs, switch the
// greenhouse lights, ask Earth for advice, then press GO.

import { h, clear } from "./dom.js";
import { icon } from "./icons.js";

const JOBS = ["power", "life", "shield", "science"];

export function emptyPlan() {
  return { power: 0, life: 0, shield: 0, science: 0 };
}

export function planTotal(plan) {
  return JOBS.reduce((sum, job) => sum + (plan[job] || 0), 0);
}

export function createJobsPanel(root, { i18n, audio, config, onChange, onLights, onAsk, onGo }) {
  let plan = emptyPlan();
  let available = config.baseWorkPoints;
  let state = null;
  let locked = false;

  const pointsValue = h("strong", { class: "points-value" });
  const pointsLabel = h("span", { class: "points-label" });
  const pips = h("div", { class: "points-pips", "aria-hidden": "true" });
  const pointsNote = h("p", { class: "points-note" });
  const header = h("div", { class: "jobs-points", id: "jobs-points" }, [
    h("div", { class: "points-line", role: "status", "aria-live": "polite" }, [pointsLabel, pointsValue]),
    pips,
    pointsNote
  ]);

  const rows = {};
  const list = h("div", { class: "jobs-list", id: "jobs-list" });
  for (const job of JOBS) {
    const name = h("span", { class: "job-name" });
    const what = h("span", { class: "job-what" });
    const hint = h("span", { class: "job-hint" });
    const value = h("output", { class: "job-value", text: "0" });
    const minus = h("button", { type: "button", class: "step step-minus", text: "\u2212", onclick: () => change(job, -1) });
    const plus = h("button", { type: "button", class: "step step-plus", text: "+", onclick: () => change(job, 1) });
    const row = h("div", { class: `job job-${job}`, id: `job-${job}`, dataset: { job } }, [
      h("span", { class: "job-icon", html: icon(job) }),
      h("div", { class: "job-text" }, [name, what, hint]),
      h("div", { class: "job-stepper", role: "group" }, [minus, value, plus])
    ]);
    rows[job] = { row, name, what, hint, value, minus, plus };
    list.append(row);
  }

  const lightsState = h("strong", { class: "lights-state" });
  const lightsHint = h("span", { class: "lights-hint" });
  const lightsLabel = h("span", { class: "lights-label" });
  const lights = h(
    "button",
    {
      type: "button",
      class: "lights-toggle",
      id: "lights-toggle",
      role: "switch",
      onclick: () => {
        if (locked || !state) return;
        const next = !state.lightsOn;
        audio.play(next ? "lightsOn" : "lightsOff");
        onLights(next);
      }
    },
    [
      h("span", { class: "lights-icon", html: icon("lamp") }),
      h("span", { class: "lights-text" }, [h("span", { class: "lights-title" }, [lightsLabel, " ", lightsState]), lightsHint]),
      h("span", { class: "switch-knob", "aria-hidden": "true" })
    ]
  );

  const askLabel = h("span");
  const ask = h(
    "button",
    {
      type: "button",
      class: "btn btn-quiet ask-earth",
      id: "ask-earth",
      onclick: () => {
        if (locked) return;
        onAsk();
      }
    },
    [h("span", { html: icon("radio") }), askLabel]
  );

  const goLabel = h("span");
  const go = h(
    "button",
    {
      type: "button",
      class: "btn btn-go",
      id: "go-button",
      onclick: () => {
        if (locked) return;
        onGo({ ...plan });
      }
    },
    [goLabel]
  );

  const shelterNote = h("p", { class: "shelter-note", hidden: true });

  clear(root).append(header, shelterNote, list, lights, h("div", { class: "jobs-actions" }, [ask, go]));

  function left() {
    return available - planTotal(plan);
  }

  function change(job, amount) {
    if (locked || !state) return;
    const next = plan[job] + amount;
    if (next < 0 || (amount > 0 && left() <= 0)) {
      audio.play("blocked");
      return;
    }
    plan[job] = next;
    audio.play(amount > 0 ? "add" : "remove");
    paint();
    onChange({ ...plan });
  }

  function hintFor(job) {
    const jobs = config.jobs;
    if (job === "power") {
      const rate = state.isNight ? jobs.power.night : jobs.power.day;
      const text = i18n.t(state.isNight ? "job.power.hintNight" : "job.power.hintDay", { n: rate });
      return state.panelsDamaged ? `${text} ${i18n.t("job.power.damaged")}` : text;
    }
    if (job === "life") return i18n.t("job.life.hint", { n: jobs.life.gain, per: jobs.life.powerCostPer });
    if (job === "shield") return i18n.t("job.shield.hint", { n: jobs.shield.gain });
    return i18n.t("job.science.hint", { n: jobs.science.gain });
  }

  function paint() {
    if (!state) return;
    const sheltered = state.eventChoice === "shelter";
    const remaining = left();
    pointsLabel.textContent = i18n.t("jobs.pointsLeft");
    pointsValue.textContent = `${remaining} / ${available}`;
    clear(pips);
    for (let i = 0; i < available; i += 1) pips.append(h("span", { class: `pip${i < remaining ? " is-left" : ""}` }));

    const notes = [];
    if (state.roundBonus > 0) notes.push(i18n.t("jobs.noteBonus", { n: state.roundBonus }));
    if (state.roundPenalty > 0) notes.push(i18n.t("jobs.notePenalty", { n: state.roundPenalty }));
    if (state.reservedPoints > 0) notes.push(i18n.t("jobs.noteReserved", { n: state.reservedPoints }));
    pointsNote.textContent = notes.join(" ");
    pointsNote.hidden = notes.length === 0;

    shelterNote.hidden = !sheltered;
    shelterNote.textContent = sheltered ? i18n.t("jobs.shelterNote") : "";

    for (const job of JOBS) {
      const row = rows[job];
      row.name.textContent = i18n.t(`job.${job}.name`);
      row.what.textContent = i18n.t(`job.${job}.what`);
      row.hint.textContent = hintFor(job);
      row.value.textContent = String(plan[job]);
      row.minus.disabled = locked || sheltered || plan[job] <= 0;
      row.plus.disabled = locked || sheltered || remaining <= 0;
      row.minus.setAttribute("aria-label", i18n.t("jobs.less", { job: i18n.t(`job.${job}.name`) }));
      row.plus.setAttribute("aria-label", i18n.t("jobs.more", { job: i18n.t(`job.${job}.name`) }));
      row.row.classList.toggle("has-points", plan[job] > 0);
      row.row.classList.toggle("is-off", sheltered);
    }

    const on = state.lightsOn;
    const effect = on ? config.greenhouse.on : config.greenhouse.off;
    lightsLabel.textContent = i18n.t("lights.label");
    lightsState.textContent = i18n.t(on ? "lights.on" : "lights.off");
    lightsHint.textContent = on
      ? i18n.t("lights.hintOn", { life: effect.life, power: Math.abs(effect.power) })
      : i18n.t("lights.hintOff", { life: Math.abs(effect.life) });
    lights.setAttribute("aria-checked", on ? "true" : "false");
    lights.classList.toggle("is-on", on);
    lights.disabled = locked;

    askLabel.textContent = state.askedEarth
      ? i18n.t("ask.used")
      : i18n.t("ask.button", { n: config.askEarth.cost });
    ask.disabled = locked || sheltered || state.askedEarth || remaining < config.askEarth.cost;

    goLabel.textContent = i18n.t("jobs.go");
    go.disabled = locked;
    go.classList.toggle("is-ready", remaining === 0 || sheltered);
  }

  return {
    // Opens a new round or refreshes after the points changed.
    render(nextState, nextAvailable, { reset = false } = {}) {
      state = nextState;
      available = nextAvailable;
      if (reset) plan = emptyPlan();
      // If points were spent elsewhere (Ask Earth), trim the plan to fit.
      while (planTotal(plan) > available) {
        const job = [...JOBS].reverse().find((name) => plan[name] > 0);
        if (!job) break;
        plan[job] -= 1;
      }
      paint();
      onChange({ ...plan });
    },
    plan() {
      return { ...plan };
    },
    lock(value) {
      locked = Boolean(value);
      root.classList.toggle("is-locked", locked);
      paint();
    },
    get locked() {
      return locked;
    }
  };
}
