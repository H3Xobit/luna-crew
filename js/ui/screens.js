// Title, crew setup, the Real NASA Data screen, the page for teachers and
// parents, and settings.

import { h, clear, sourceLink } from "./dom.js";
import { icon } from "./icons.js";
import { portrait, playerBadge } from "./characters.js";
import { dataChip } from "./modals.js";
import { jobWeights } from "../engine/rules.js";
import { dailySeed, isUnlocked, rankFor, totalStars } from "./progress.js";

export function starIcons(count, label) {
  const marks = [1, 2, 3].map((n) =>
    h("span", { class: `star-icon${n <= count ? " is-on" : ""}`, html: icon("star"), "aria-hidden": "true" })
  );
  return h("p", { class: "star-row", "aria-label": label }, marks);
}
import { LANGUAGES } from "./i18n.js";

const LANGUAGE_NAMES = { en: "English", ja: "\u65e5\u672c\u8a9e" };

export function languageSwitch(i18n, onLang) {
  return h(
    "div",
    { class: "lang-switch", role: "group", "aria-label": i18n.t("settings.language") },
    LANGUAGES.map((code) =>
      h("button", {
        type: "button",
        class: `btn btn-seg${i18n.lang === code ? " is-active" : ""}`,
        "aria-pressed": i18n.lang === code ? "true" : "false",
        lang: code,
        text: LANGUAGE_NAMES[code],
        onclick: () => onLang(code)
      })
    )
  );
}

function flareBanner(i18n, stormInfo) {
  const banner = stormInfo?.banner;
  if (!banner) {
    return h("div", { class: "nasa-banner" }, [
      dataChip(i18n, { kind: "training", date: null }),
      h("p", { text: i18n.t("title.bannerNone") })
    ]);
  }
  const date = String(banner.flare.date).slice(0, 10);
  const key = banner.label.kind === "updated" ? "title.bannerWeek" : "title.bannerSaved";
  return h("div", { class: "nasa-banner" }, [
    dataChip(i18n, banner.label),
    h("p", {}, [i18n.t(key, { cls: banner.flare.classType, date }), " ", sourceLink(banner.flare.link, i18n.t("title.bannerLink"))])
  ]);
}

export function renderTitle(root, { i18n, content, stormInfo, demo, nameOf, onStart, onData, onTeachers, onSettings, onCredits, onLang }) {
  const config = content.config;
  clear(root).append(
    h("div", { class: "title-card" }, [
      h("div", { class: "title-top" }, [languageSwitch(i18n, onLang)]),
      h("div", { class: "title-crew" }, [
        h("span", { class: "crew-face", html: portrait("sprout", "happy", { title: nameOf("sprout") }) }),
        h("span", { class: "crew-face is-big", html: portrait("nova", "happy", { title: nameOf("nova") }) }),
        h("span", { class: "crew-face", html: portrait("pip", "excited", { title: nameOf("pip") }) })
      ]),
      h("h1", { class: "title-name", text: i18n.pick(config.title) }),
      h("p", { class: "title-tagline", text: i18n.pick(config.tagline) }),
      demo ? h("p", { class: "demo-badge", text: i18n.t("title.demo") }) : null,
      h("div", { class: "title-actions" }, [
        h("button", { type: "button", class: "btn btn-primary btn-big", id: "start-button", text: i18n.t("title.start"), onclick: onStart }),
        h("button", { type: "button", class: "btn btn-choice", id: "data-button", text: i18n.t("title.data"), onclick: onData }),
        h("button", { type: "button", class: "btn btn-choice", id: "teachers-button", text: i18n.t("title.teachers"), onclick: onTeachers }),
        h("button", { type: "button", class: "btn btn-quiet", id: "settings-button", onclick: onSettings }, [h("span", { html: icon("gear") }), i18n.t("title.settings")]),
        h("button", { type: "button", class: "btn btn-quiet", id: "credits-button", text: i18n.t("title.credits"), onclick: onCredits })
      ]),
      flareBanner(i18n, stormInfo),
      h("p", { class: "title-foot small" }, [i18n.t("title.foot")])
    ])
  );
}

export function renderSetup(root, { i18n, content, player, onBack, onBegin }) {
  const colors = content.config.helmetColors;
  let helmet = colors.includes(player.helmet) ? player.helmet : colors[0];
  const badge = h("div", { class: "setup-badge", html: playerBadge(helmet) });
  const nameInput = h("input", {
    type: "text",
    id: "player-name",
    class: "text-input",
    maxlength: "12",
    autocomplete: "off",
    value: player.name || "",
    placeholder: i18n.pick(content.config.defaultPlayerName)
  });
  const swatches = h("div", { class: "helmet-colors", role: "radiogroup", "aria-label": i18n.t("setup.helmet") });

  function paintSwatches() {
    clear(swatches);
    colors.forEach((color, index) => {
      const button = h("button", {
        type: "button",
        class: `helmet-swatch${color === helmet ? " is-picked" : ""}`,
        role: "radio",
        "aria-checked": color === helmet ? "true" : "false",
        "aria-label": i18n.t(`helmet.${index}`),
        title: i18n.t(`helmet.${index}`),
        onclick: () => {
          helmet = color;
          badge.innerHTML = playerBadge(helmet);
          paintSwatches();
        }
      }, [color === helmet ? h("span", { html: icon("check") }) : null]);
      button.style.setProperty("--swatch", color);
      swatches.append(button);
    });
  }
  paintSwatches();

  const form = h(
    "form",
    {
      class: "setup-card",
      onsubmit: (event) => {
        event.preventDefault();
        const name = nameInput.value.trim().slice(0, 12) || i18n.pick(content.config.defaultPlayerName);
        onBegin({ name, helmet });
      }
    },
    [
      h("h1", { text: i18n.t("setup.title") }),
      h("p", { text: i18n.t("setup.lead") }),
      badge,
      h("label", { class: "field-label", for: "player-name", text: i18n.t("setup.name") }),
      nameInput,
      h("p", { class: "small", text: i18n.t("setup.nameNote") }),
      h("p", { class: "field-label", text: i18n.t("setup.helmet") }),
      swatches,
      h("div", { class: "setup-actions" }, [
        h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("ui.back"), onclick: onBack }),
        h("button", { type: "submit", class: "btn btn-primary btn-big", id: "begin-button", text: i18n.t("setup.begin") })
      ])
    ]
  );
  clear(root).append(form);
  nameInput.focus({ preventScroll: true });
}

function statusBadge(i18n, status) {
  return h("span", { class: `status-badge status-${status}`, text: i18n.t(`data.status.${status}`) });
}

export function openDataScreen(modals, { i18n, sources }) {
  const datasets = sources.filter((item) => item.kind === "dataset");
  const pages = sources.filter((item) => item.kind === "page");
  const body = [
    h("p", { text: i18n.t("data.lead") }),
    h("h3", { text: i18n.t("data.datasets") }),
    ...datasets.map((item) =>
      h("article", { class: "source-card" }, [
        h("header", {}, [h("h4", { text: item.name }), statusBadge(i18n, item.status)]),
        h("p", { class: "source-agency", text: item.agency }),
        item.label ? dataChip(i18n, item.label) : null,
        h("p", { text: i18n.t(item.useKey) }),
        item.detailKey ? h("p", { class: "source-detail", text: i18n.t(item.detailKey, item.detailVars) }) : null,
        item.status === "failed" ? h("p", { class: "source-detail", text: i18n.t("data.failed") }) : null,
        sourceLink(item.url, i18n.t("data.open"))
      ])
    ),
    h("h3", { text: i18n.t("data.pages") }),
    h("p", { class: "small", text: i18n.t("data.pagesLead") }),
    ...pages.map((item) =>
      h("article", { class: "source-card" }, [
        h("header", {}, [h("h4", { text: item.name }), item.partner ? h("span", { class: "status-badge status-partner", text: i18n.t("data.partner") }) : null]),
        h("p", { class: "source-agency", text: `${item.agency} \u00b7 ${i18n.t("data.checked", { date: item.accessed })}` }),
        h("ul", { class: "source-facts" }, item.facts.map((text) => h("li", { text: i18n.pick(text) }))),
        sourceLink(item.url, i18n.t("data.open"))
      ])
    ),
    h("h3", { text: i18n.t("data.honest") }),
    h("ul", { class: "plain-list" }, ["data.honest1", "data.honest2", "data.honest3", "data.honest4"].map((key) => h("li", { text: i18n.t(key) })))
  ];
  return modals.open({ title: i18n.t("data.title"), tone: "data", wide: true, dismissible: true, body, actions: [{ id: "close", label: i18n.t("ui.close"), kind: "primary" }] });
}

function weightsTable(i18n, facts, config) {
  const day = jobWeights({ isNight: false, life: 70, panelsDamaged: false }, config);
  const rows = [
    ["power", i18n.t("teach.w.power", day.power), i18n.t("teach.w.powerChanges"), "lunar_day_length"],
    ["life", i18n.t("teach.w.life", day.life), i18n.t("teach.w.lifeChanges"), "eclss_what"],
    ["shield", i18n.t("teach.w.shield", { gain: day.shield.perPoint, line: day.shield.linePerLevel }), i18n.t("teach.w.shieldChanges", { gain: day.shield.perPoint }), "regolith_shield"],
    ["science", i18n.t("teach.w.science", day.science), i18n.t("teach.w.scienceChanges"), "regolith_plants"]
  ];
  return h("div", { class: "weights-wrap" }, [
    h("h3", { text: i18n.t("teach.weightsTitle") }),
    h("p", { text: i18n.t("teach.weightsLead") }),
    h("table", { class: "weights-table" }, [
      h("thead", {}, [
        h("tr", {}, ["teach.colJob", "teach.colWeight", "teach.colChanges", "teach.colWhy"].map((key) => h("th", { text: i18n.t(key) })))
      ]),
      h("tbody", {}, rows.map(([job, weight, changes, factId]) => {
        const fact = facts?.get?.(factId);
        const why = fact && fact.status === "verified"
          ? sourceLink(fact.source.url, i18n.pick(fact.text))
          : h("span", { text: i18n.t(`why.reason.${job}`) });
        return h("tr", {}, [
          h("th", { text: i18n.t(`job.${job}.name`) }),
          h("td", { text: weight }),
          h("td", { text: changes }),
          h("td", {}, [why])
        ]);
      }))
    ])
  ]);
}

export function openTeachers(modals, { i18n, facts, config, missions = [] }) {
  const toolkit = facts.get("csa_toolkit");
  const section = (titleKey, keys) => [h("h3", { text: i18n.t(titleKey) }), h("ul", { class: "plain-list" }, keys.map((key) => h("li", { text: i18n.t(key, { rounds: config.lunarDays * config.roundsPerDay, days: config.lunarDays }) })))];
  const body = [
    h("p", { text: i18n.t("teach.lead") }),
    weightsTable(i18n, facts, config),
    ...section("teach.learnTitle", ["teach.learn1", "teach.learn2", "teach.learn3", "teach.learn4"]),
    ...section("teach.useTitle", ["teach.use1", "teach.use2", "teach.use3", "teach.use4"]),
    ...section("teach.realTitle", ["teach.real1", "teach.real2", "teach.real3"]),
    ...section("teach.talkTitle", ["teach.talk1", "teach.talk2", "teach.talk3"]),
    toolkit
      ? h("div", { class: "fact-block" }, [
          h("span", { class: "fact-tag", text: i18n.t("teach.more") }),
          h("p", { text: i18n.pick(toolkit.text) }),
          sourceLink(toolkit.source.url, `${toolkit.source.agency}: ${toolkit.source.name}`)
        ])
      : null,
    ...section("teach.accessTitle", ["teach.access1", "teach.access2", "teach.access3"]),
    h("h3", { text: i18n.t("teach.classTitle") }),
    h("p", { text: i18n.t("teach.classLead") }),
    h("ol", { class: "plain-list" }, missions.map((mission) => h("li", { text: `${i18n.pick(mission.title)}: ${i18n.pick(mission.discuss)}` })))
  ];
  return modals.open({ title: i18n.t("teach.title"), tone: "data", wide: true, dismissible: true, body, actions: [{ id: "close", label: i18n.t("ui.close"), kind: "primary" }] });
}

// Resolves with "close" or "changed". The caller reopens it after a change
// so every label is drawn again in the new language or size.
export function openSettings(modals, { i18n, settings, onChange }) {
  const toggle = (key, labelKey, hintKey) =>
    h(
      "button",
      {
        type: "button",
        class: `setting-toggle${settings[key] ? " is-on" : ""}`,
        role: "switch",
        "aria-checked": settings[key] ? "true" : "false",
        onclick: () => {
          onChange({ [key]: !settings[key] });
          modals.close("changed");
        }
      },
      [
        h("span", { class: "setting-text" }, [h("strong", { text: i18n.t(labelKey) }), h("span", { class: "small", text: i18n.t(hintKey) })]),
        h("span", { class: "setting-state", text: i18n.t(settings[key] ? "ui.on" : "ui.off") }),
        h("span", { class: "switch-knob", "aria-hidden": "true" })
      ]
    );
  const sizes = ["normal", "large", "huge"];
  const body = [
    h("p", { class: "field-label", text: i18n.t("settings.language") }),
    languageSwitch(i18n, (code) => {
      onChange({ lang: code });
      modals.close("changed");
    }),
    toggle("sound", "settings.sound", "settings.soundHint"),
    toggle("reduceMotion", "settings.motion", "settings.motionHint"),
    toggle("highContrast", "settings.contrast", "settings.contrastHint"),
    h("p", { class: "field-label", text: i18n.t("settings.text") }),
    h(
      "div",
      { class: "lang-switch", role: "group", "aria-label": i18n.t("settings.text") },
      sizes.map((size) =>
        h("button", {
          type: "button",
          class: `btn btn-seg${settings.textSize === size ? " is-active" : ""}`,
          "aria-pressed": settings.textSize === size ? "true" : "false",
          text: i18n.t(`settings.text.${size}`),
          onclick: () => {
            onChange({ textSize: size });
            modals.close("changed");
          }
        })
      )
    )
  ];
  return modals.open({ title: i18n.t("title.settings"), tone: "plain", dismissible: true, body, actions: [{ id: "close", label: i18n.t("ui.close"), kind: "primary" }] });
}

const CUTSCENE_KEYS = {
  opening: "cut.opening.1",
  arrival: "cut.arrival.1",
  nightfall: "cut.night.1",
  rescue: "cut.rescue.1",
  stormShelter: "cut.storm.1",
  stormWork: "cut.storm.1",
  discovery: "cut.find.1",
  greenhouse: "cut.green.1",
  rank: "cut.rank.1",
  endingComplete: "cut.end.1",
  endingPaused: "cut.home.1"
};

export function renderMap(root, { i18n, missions, progress, demo = false, urlSeed = null, onPlay, onJournal, onReset, onHome, onSettings, onIntro, onReplay }) {
  const stars = totalStars(progress);
  const rank = rankFor(stars);
  const nodes = h("ol", { class: "mission-path" });
  for (const mission of missions) {
    const open = demo || isUnlocked(mission, missions, progress);
    const earned = progress.stars?.[mission.id] || 0;
    const seedNote = mission.daily ? i18n.t("map.daily", { seed: dailySeed() }) : "";
    const seedInput = mission.chooseSeed
      ? h("input", {
          type: "number",
          class: "text-input seed-input",
          min: "1",
          max: "999999",
          value: String(urlSeed || 1234),
          "aria-label": i18n.t("map.seed")
        })
      : null;
    nodes.append(
      h("li", { class: `mission-node${open ? "" : " is-locked"}` }, [
        h("div", { class: "mission-card" }, [
          h("h2", { text: i18n.pick(mission.title) }),
          h("p", { text: open ? i18n.pick(mission.goal) : i18n.t("map.locked") }),
          seedNote ? h("p", { class: "small", text: seedNote }) : null,
          starIcons(earned, i18n.t("map.starCount", { n: earned })),
          seedInput,
          h("button", {
            type: "button",
            class: "btn btn-primary",
            disabled: !open,
            text: i18n.t("map.play"),
            onclick: () => {
              const seed = seedInput ? Number(seedInput.value) : mission.daily ? dailySeed() : null;
              onPlay(mission, seed);
            }
          })
        ])
      ])
    );
  }
  const badges = ["storm", "night", "water", "green", "science", "careful", "fix"].map((id) =>
    h("li", { class: progress.badges?.includes(id) ? "is-earned" : "is-locked" }, [
      h("span", { class: "badge-mark", html: icon(progress.badges?.includes(id) ? "check" : "lock"), "aria-hidden": "true" }),
      h("strong", { text: i18n.t(`badge.${id}`) }),
      h("span", { class: "small", text: progress.badges?.includes(id) ? i18n.t("map.earned") : i18n.t("map.badgeLocked") })
    ])
  );
  const seen = progress.seen?.cutscenes || [];
  const replay = seen.length
    ? h("div", { class: "cutscene-list" }, [
        h("h2", { text: i18n.t("map.cutscenes") }),
        h(
          "div",
          { class: "title-actions" },
          seen.map((id) =>
            h("button", {
              type: "button",
              class: "btn btn-quiet",
              text: i18n.has(CUTSCENE_KEYS[id]) ? i18n.t(CUTSCENE_KEYS[id]) : id,
              onclick: () => onReplay(id)
            })
          )
        )
      ])
    : null;
  clear(root).append(
    h("div", { class: "title-card map-card" }, [
      h("h1", { text: i18n.t("map.title") }),
      h("p", { text: i18n.t("map.lead") }),
      h("p", { class: "map-rank", text: i18n.t("map.rank", { rank: i18n.t(`rank.${rank.id}`), stars }) }),
      nodes,
      h("h2", { text: i18n.t("map.badges") }),
      h("ul", { class: "badge-shelf" }, badges),
      replay,
      h("div", { class: "title-actions" }, [
        h("button", { type: "button", class: "btn btn-choice", text: i18n.t("map.watchIntro"), onclick: onIntro }),
        h("button", { type: "button", class: "btn btn-choice", text: i18n.t("map.journal"), onclick: onJournal }),
        h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("title.settings"), onclick: onSettings }),
        h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("map.reset"), onclick: onReset }),
        h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("ui.home"), onclick: onHome })
      ])
    ])
  );
}

export function openJournal(modals, { i18n, facts, progress, cards = [] }) {
  const learned = (cards || []).filter((card) => (progress.quiz?.[card.id]?.box || 0) >= 2);
  const verified = [...facts.values()].filter((fact) => fact.status === "verified");
  const pages = verified.map((fact) => {
    const open = progress.journal?.includes(fact.id);
    return h("article", { class: `journal-card${open ? "" : " is-locked"}` }, [
      h("h3", { text: open ? i18n.pick(fact.text) : i18n.t("journal.locked") }),
      open ? sourceLink(fact.source.url, fact.source.name) : h("p", { class: "small", text: i18n.t("journal.hint") })
    ]);
  });
  return modals.open({
    title: i18n.t("journal.title"),
    tone: "data",
    wide: true,
    dismissible: true,
    body: [
      ...pages,
      ...learned.map((card) =>
        h("article", { class: "journal-card" }, [
          h("h3", { text: i18n.pick(card.q) }),
          sourceLink(card.source.url, card.source.name)
        ])
      ),
      pages.length + learned.length === 0 ? h("p", { text: i18n.t("journal.empty") }) : null
    ],
    actions: [{ id: "close", label: i18n.t("ui.close"), kind: "primary" }]
  });
}
