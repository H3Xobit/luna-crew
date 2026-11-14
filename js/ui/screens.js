// Title, crew setup, the Real NASA Data screen, the page for teachers and
// parents, and settings.

import { h, clear, sourceLink } from "./dom.js";
import { icon } from "./icons.js";
import { portrait, playerBadge } from "./characters.js";
import { dataChip } from "./modals.js";
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

export function renderTitle(root, { i18n, content, stormInfo, demo, nameOf, onStart, onData, onTeachers, onSettings, onLang }) {
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
        h("button", { type: "button", class: "btn btn-quiet", id: "settings-button", onclick: onSettings }, [h("span", { html: icon("gear") }), i18n.t("title.settings")])
      ]),
      flareBanner(i18n, stormInfo),
      h("p", { class: "title-foot small", text: i18n.t("title.foot") })
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
  const practice = h("input", { type: "checkbox", id: "practice-toggle", checked: player.practice !== false });
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
        onBegin({ name, helmet, practice: practice.checked });
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
      h("label", { class: "check-row", for: "practice-toggle" }, [practice, h("span", { text: i18n.t("setup.practice") })]),
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

export function openTeachers(modals, { i18n, facts, config }) {
  const toolkit = facts.get("csa_toolkit");
  const section = (titleKey, keys) => [h("h3", { text: i18n.t(titleKey) }), h("ul", { class: "plain-list" }, keys.map((key) => h("li", { text: i18n.t(key, { rounds: config.lunarDays * config.roundsPerDay, days: config.lunarDays }) })))];
  const body = [
    h("p", { text: i18n.t("teach.lead") }),
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
    ...section("teach.accessTitle", ["teach.access1", "teach.access2", "teach.access3"])
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
