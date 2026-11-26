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

// Pop-up cards: story choices, the solar storm alert, the round result and
// the planner review. One modal is open at a time.

import { h, clear, sourceLink } from "./dom.js";
import { icon } from "./icons.js";
import { labelKey } from "../data/storms.js";

const FOCUSABLE = 'button:not([disabled]), a[href], input, select, summary, [tabindex]:not([tabindex="-1"])';

export function createModals(root, { i18n, audio }) {
  let current = null;

  function close(result) {
    if (!current) return;
    const { resolve, previous, onKey } = current;
    current = null;
    document.removeEventListener("keydown", onKey, true);
    clear(root);
    root.hidden = true;
    document.body.classList.remove("modal-open");
    if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    resolve(result);
  }

  // actions: [{ id, label, kind, disabled, note }]. Resolves with the action id.
  function open({ title, tone = "plain", chip = null, body = [], actions = [], dismissible = false, wide = false, stack = false }) {
    if (current) close("replaced");
    return new Promise((resolve) => {
      const titleId = `modal-title-${Date.now()}`;
      const buttons = actions.map((action) =>
        h(
          "button",
          {
            type: "button",
            class: `btn ${action.kind === "primary" ? "btn-primary" : action.kind === "quiet" ? "btn-quiet" : "btn-choice"}`,
            disabled: action.disabled,
            dataset: { action: action.id },
            onclick: () => {
              audio.play("tap");
              close(action.id);
            }
          },
          [h("span", { class: "btn-title", text: action.label }), action.note ? h("span", { class: "btn-note", text: action.note }) : null]
        )
      );
      const card = h("div", { class: `modal-card tone-${tone}${wide ? " is-wide" : ""}`, role: "dialog", "aria-modal": "true", "aria-labelledby": titleId }, [
        h("header", { class: "modal-head" }, [
          chip,
          h("h2", { id: titleId, class: "modal-title", text: title }),
          dismissible
            ? h("button", { type: "button", class: "modal-close", "aria-label": i18n.t("ui.close"), text: "\u00d7", onclick: () => close("close") })
            : null
        ]),
        h("div", { class: "modal-body" }, body),
        buttons.length > 0 ? h("footer", { class: `modal-actions${stack ? " is-stack" : ""}` }, buttons) : null
      ]);
      const onKey = (event) => {
        if (event.key === "Escape" && dismissible) {
          event.preventDefault();
          close("close");
          return;
        }
        if (event.key !== "Tab") return;
        const items = [...card.querySelectorAll(FOCUSABLE)];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (!card.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        }
      };
      current = { resolve, previous: document.activeElement, onKey };
      clear(root).append(h("div", { class: "modal-backdrop", onclick: () => dismissible && close("close") }), card);
      root.hidden = false;
      document.body.classList.add("modal-open");
      document.addEventListener("keydown", onKey, true);
      const target = card.querySelector(".modal-actions .btn:not([disabled])") || card.querySelector(FOCUSABLE);
      if (target) target.focus({ preventScroll: true });
      card.scrollTop = 0;
    });
  }

  return { open, close, get isOpen() { return Boolean(current); } };
}

// The honest data label. Every place that shows NASA data uses this chip.
export function dataChip(i18n, label) {
  const { key, vars } = labelKey(label);
  const kind = key.split(".")[1];
  return h("span", { class: `data-chip data-${kind}` }, [h("span", { class: "data-dot", "aria-hidden": "true" }), i18n.t(key, vars)]);
}

function factBlock(i18n, fact) {
  if (!fact) return null;
  return h("div", { class: "fact-block" }, [
    h("span", { class: "fact-tag", text: i18n.t("fact.real") }),
    h("p", { text: i18n.pick(fact.text) }),
    sourceLink(fact.source.url, `${fact.source.agency}: ${fact.source.name}`)
  ]);
}

function costLine(i18n, parts) {
  return h("ul", { class: "effect-list" }, parts.filter(Boolean).map((text) => h("li", { text })));
}

export function rescueCard(modals, { i18n, event, available }) {
  const now = event.options.find((option) => option.id === "rescueNow");
  const wait = event.options.find((option) => option.id === "waitForSun");
  const tooFew = now.cost > available;
  return modals.open({
    title: i18n.t("rescue.title"),
    tone: "story",
    body: [
      h("p", { class: "story-note", text: i18n.t("story.madeUp") }),
      h("div", { class: "choice-grid" }, [
        h("div", { class: "choice-info" }, [
          h("h3", { text: i18n.t("rescue.now") }),
          costLine(i18n, [
            i18n.t("effect.usesPoints", { n: now.cost }),
            i18n.t("effect.missionPoints", { n: now.points }),
            i18n.t("rescue.nowSample")
          ])
        ]),
        h("div", { class: "choice-info" }, [
          h("h3", { text: i18n.t("rescue.wait") }),
          costLine(i18n, [i18n.t("effect.free"), i18n.t("effect.fewerNext", { n: wait.nextPenalty }), i18n.t("rescue.waitSample")])
        ])
      ])
    ],
    actions: [
      { id: "rescueNow", label: i18n.t("rescue.now"), disabled: tooFew, note: tooFew ? i18n.t("effect.notEnough") : null },
      { id: "waitForSun", label: i18n.t("rescue.wait") }
    ]
  });
}

export function discoveryCard(modals, { i18n, event, available }) {
  const study = event.options.find((option) => option.id === "study");
  const tooFew = study.cost > available;
  return modals.open({
    title: i18n.t("discovery.title"),
    tone: "story",
    body: [
      h("p", { class: "story-note", text: i18n.t("story.madeUp") }),
      h("div", { class: "choice-grid" }, [
        h("div", { class: "choice-info" }, [
          h("h3", { text: i18n.t("discovery.study") }),
          costLine(i18n, [
            i18n.t("effect.usesPoints", { n: study.cost }),
            i18n.t("effect.missionPoints", { n: study.points }),
            i18n.t("effect.lifeDown", { n: Math.abs(study.life) })
          ])
        ]),
        h("div", { class: "choice-info" }, [h("h3", { text: i18n.t("discovery.skip") }), costLine(i18n, [i18n.t("effect.free"), i18n.t("discovery.skipNote")])])
      ])
    ],
    actions: [
      { id: "study", label: i18n.t("discovery.study"), disabled: tooFew, note: tooFew ? i18n.t("effect.notEnough") : null },
      { id: "skip", label: i18n.t("discovery.skip") }
    ]
  });
}

export function stormSummary(i18n, storm) {
  if (!storm || !storm.real) return i18n.t("storm.training");
  const date = String(storm.date).slice(0, 10);
  if (storm.eventType === "SEP") return i18n.t("storm.sep", { date });
  return i18n.t("storm.flare", { cls: storm.classType || "?", date });
}

export function stormCard(modals, { i18n, storm, shield, config, facts, reading }) {
  const level = storm.severity;
  const line = storm.shieldLine;
  const enough = shield >= line;
  const dots = h("span", { class: "level-dots", "aria-hidden": "true" });
  for (let i = 1; i <= config.storm.maxSeverity; i += 1) dots.append(h("span", { class: `level-dot${i <= level ? " is-on" : ""}` }));
  const damages = level >= config.storm.panelDamageAtSeverity;

  const body = [
    h("p", {
      class: "storm-what",
      text: storm.real
        ? i18n.t(storm.eventType === "SEP" ? "storm.fromSep" : "storm.fromNasa", {
            n: level,
            cls: storm.classType || "?",
            date: String(storm.date || "").slice(0, 10)
          })
        : i18n.t("storm.training")
    }),
    h("p", { class: "storm-matters", text: i18n.t("storm.matters", { n: level, need: line }) }),
    storm.real && storm.hasLinkedSEP ? h("p", { class: "storm-linked", text: i18n.t("storm.linked") }) : null,
    storm.real && storm.link ? h("p", {}, [sourceLink(storm.link, i18n.t("storm.seeDonki"))]) : h("p", { class: "story-note", text: i18n.t("storm.trainingNote") }),
    h("div", { class: "storm-level" }, [
      h("strong", { text: i18n.t("storm.level", { n: level, max: config.storm.maxSeverity }) }),
      dots,
      h("p", { class: "small", text: i18n.t("storm.levelNote") })
    ]),
    h("div", { class: `shield-check ${enough ? "is-enough" : "is-short"}` }, [
      h("span", { class: "shield-check-icon", html: icon(enough ? "check" : "alert") }),
      h("p", {}, [
        h("strong", { text: i18n.t("storm.shieldNow", { n: Math.round(shield), need: line }) }),
        " ",
        i18n.t(enough ? "storm.shieldEnough" : "storm.shieldShort")
      ])
    ]),
    h("div", { class: "choice-grid" }, [
      h("div", { class: "choice-info" }, [
        h("h3", { text: i18n.t("storm.shelter") }),
        costLine(i18n, [i18n.t("storm.shelterSafe"), i18n.t("storm.shelterPause"), damages ? i18n.t("storm.shelterDamage") : null])
      ]),
      h("div", { class: "choice-info" }, [
        h("h3", { text: i18n.t("storm.keep") }),
        costLine(i18n, [i18n.t("storm.keepJobs"), i18n.t("storm.keepPanels"), i18n.t("storm.keepRisk", { need: line })])
      ])
    ]),
    factBlock(i18n, facts.get(storm.eventType === "SEP" ? "solar_particles" : "flare_classes") || facts.get("flare_what")),
    reading
      ? h("div", { class: "fact-block reading-block" }, [
          dataChip(i18n, { kind: "saved", date: reading.fetched }),
          h("p", { text: i18n.t("storm.reading", { value: reading.doseRate, unit: reading.unit, date: String(reading.date).slice(0, 10) }) }),
          sourceLink(reading.url, i18n.t("storm.readingSource"))
        ])
      : null
  ];

  return modals.open({
    title: i18n.t("storm.title"),
    tone: "storm",
    chip: dataChip(i18n, storm.label),
    wide: true,
    body,
    actions: [
      { id: "shelter", label: i18n.t("storm.shelter") },
      { id: "keepWorking", label: i18n.t("storm.keep") }
    ]
  });
}

const RESULT_BARS = ["power", "life", "shield"];

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

export function resultCard(modals, { i18n, result, state, config, comment }) {
  const rows = RESULT_BARS.map((name) => {
    const change = result.change[name];
    return h("tr", { class: change > 0 ? "is-up" : change < 0 ? "is-down" : "" }, [
      h("th", { scope: "row" }, [h("span", { class: `bar-icon bar-${name}`, html: icon(name) }), i18n.t(`bar.${name}`)]),
      h("td", { text: String(result.before[name]) }),
      h("td", { class: "result-change", text: signed(change) }),
      h("td", { class: "result-after", text: String(result.after[name]) })
    ]);
  });
  const why = [];
  const push = (labelKeyName, part) => {
    const bits = RESULT_BARS.filter((name) => part[name]).map((name) => `${i18n.t(`bar.${name}`)} ${signed(part[name])}`);
    if (part.missionPoints) bits.push(`${i18n.t("hud.missionPoints")} ${signed(part.missionPoints)}`);
    if (bits.length > 0) why.push(h("li", {}, [h("strong", { text: `${i18n.t(labelKeyName)}: ` }), bits.join(", ")]));
  };
  push("result.fromJobs", result.jobs);
  push(state.lightsOn ? "result.fromLightsOn" : "result.fromLightsOff", result.greenhouse);
  push(state.isNight ? "result.fromNight" : "result.fromDay", result.drains);
  push("result.fromEvent", result.event);

  const title = result.sheltered
    ? i18n.t("result.titleShelter")
    : i18n.t("result.title", { day: state.lunarDay, round: state.roundInDay });

  return modals.open({
    title,
    tone: state.status === "paused" ? "warn" : "plain",
    body: [
      comment ? h("p", { class: "result-comment", text: comment }) : null,
      h("table", { class: "result-table" }, [
        h("thead", {}, [
          h("tr", {}, [
            h("th", { scope: "col", text: "" }),
            h("th", { scope: "col", text: i18n.t("result.before") }),
            h("th", { scope: "col", text: i18n.t("result.change") }),
            h("th", { scope: "col", text: i18n.t("result.after") })
          ])
        ]),
        h("tbody", {}, rows)
      ]),
      h("p", { class: "result-points" }, [
        h("span", { html: icon("star") }),
        i18n.t("result.points", { n: result.change.missionPoints, total: result.after.missionPoints })
      ]),
      why.length > 0 ? h("details", { class: "result-why" }, [h("summary", { text: i18n.t("result.why") }), h("ul", {}, why)]) : null,
      h("p", { class: "small", text: i18n.t("result.units") })
    ],
    actions: [{ id: "next", label: i18n.t("ui.next"), kind: "primary" }]
  });
}

export function reviewCard(modals, { i18n, review }) {
  const items = review.lines.map((line) =>
    h("div", { class: "review-pair" }, [
      h("div", { class: "review-you" }, [h("h3", { text: i18n.t("review.you") }), h("p", { text: i18n.pick(line.you) })]),
      h("div", { class: "review-planners" }, [
        h("h3", { text: i18n.t("review.planners") }),
        h("p", { text: i18n.pick(line.planners) }),
        line.source?.url ? sourceLink(line.source.url, line.source.name) : null
      ])
    ])
  );
  return modals.open({
    title: i18n.t("review.title", { n: review.lunarDay }),
    tone: "review",
    wide: true,
    body: [...items, h("p", { class: "small", text: i18n.t("review.note") })],
    actions: [{ id: "next", label: i18n.t("review.toQuiz"), kind: "primary" }]
  });
}
