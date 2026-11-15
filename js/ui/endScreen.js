// The last screen. A paused mission is never a punishment: the crew is safe,
// one tip is offered and the player can try again.

import { h, clear } from "./dom.js";
import { icon } from "./icons.js";
import { portrait, playerBadge } from "./characters.js";
import { dataChip, stormSummary } from "./modals.js";
import { starIcons } from "./screens.js";

const STAR_KEYS = {
  complete: "star.complete",
  bars: "star.bars",
  finish: "star.finish",
  shelter: "star.shelter",
  sample: "star.sample",
  nightPower: "star.nightPower",
  lights: "star.lights",
  points: "star.points",
  repair: "star.repair"
};

export function renderEnd(root, { i18n, summary, story, config, player, nameOf, mission, onAgain, onSameSeed, onNext, onData, onHome }) {
  const complete = summary.status === "complete";
  const vars = { player: nameOf("player"), days: summary.daysLabel || "" };
  const tipLine = !complete && summary.reason ? story.paused[summary.reason] : null;
  const outro = mission?.outro
    ? [{ who: "nova", text: mission.outro }]
    : null;
  const lead = complete ? outro || story.complete : [story.paused.intro];

  const stats = [
    [i18n.t("end.missionPoints"), String(summary.missionPoints)],
    [i18n.t("end.rounds"), `${summary.roundsPlayed} / ${summary.totalRounds}`],
    [i18n.t("end.days"), `${summary.daysSurvived} / ${config.lunarDays}`],
    [i18n.t("end.quiz"), `${summary.quizCorrect} / ${summary.quizAsked}`],
    [i18n.t("end.planner"), `${summary.nasaMatched} / ${summary.nasaShown}`]
  ];
  if (summary.sampleRecovered !== null) {
    stats.push([i18n.t("end.sample"), i18n.t(summary.sampleRecovered ? "end.sampleYes" : "end.sampleNo")]);
  }

  const bars = ["power", "life", "shield"].map((name) =>
    h("li", { class: `end-bar bar-${name}` }, [h("span", { class: "bar-icon", html: icon(name) }), `${i18n.t(`bar.${name}`)} ${Math.round(summary.bars[name])}`])
  );

  clear(root).append(
    h("div", { class: `end-card ${complete ? "is-complete" : "is-paused"}` }, [
      h("div", { class: "end-crew" }, [
        h("span", { html: portrait("nova", complete ? "happy" : "neutral", { title: nameOf("nova") }) }),
        h("span", { html: portrait("sprout", complete ? "excited" : "happy", { title: nameOf("sprout") }) }),
        h("span", { html: portrait("pip", complete ? "excited" : "thinking", { title: nameOf("pip") }) }),
        h("span", { html: playerBadge(player.helmet, { title: nameOf("player") }) })
      ]),
      h("h1", { class: "end-title", text: i18n.t(complete ? "end.completeTitle" : "end.pausedTitle") }),
      ...lead.map((line) => h("p", { class: "end-line" }, [h("strong", { text: `${nameOf(line.who)}: ` }), i18n.pick(line.text, vars)])),
      tipLine ? h("p", { class: "end-tip" }, [h("strong", { text: `${nameOf(tipLine.who)}: ` }), i18n.pick(tipLine.text, vars)]) : null,
      complete ? h("p", { class: "end-closing", text: i18n.pick(story.closing) }) : null,
      h("dl", { class: "end-stats" }, stats.flatMap(([label, value]) => [h("dt", { text: label }), h("dd", { text: value })])),
      h("ul", { class: "end-bars" }, bars),
      summary.storm
        ? h("p", { class: "end-storm" }, [dataChip(i18n, summary.storm.label), " ", i18n.t("end.storm", { what: stormSummary(i18n, summary.storm) })])
        : null,
      Number.isFinite(summary.starCount)
        ? h("div", { class: "end-stars" }, [
            starIcons(summary.starCount, i18n.t("map.starCount", { n: summary.starCount })),
            ...(summary.starReasons || []).map((reason) => h("p", { class: "small", text: i18n.t(STAR_KEYS[reason] || "star.complete") }))
          ])
        : null,
      h("p", { class: "small", text: i18n.t("end.code", { seed: summary.seed }) }),
      h("div", { class: "end-actions" }, [
        onNext ? h("button", { type: "button", class: "btn btn-primary", id: "next-mission", text: i18n.t("end.next"), onclick: onNext }) : null,
        h("button", { type: "button", class: "btn btn-choice", id: "play-again", text: i18n.t(complete ? "end.again" : "end.tryAgain"), onclick: onAgain }),
        h("button", { type: "button", class: "btn btn-choice", text: i18n.t("end.replay"), onclick: onSameSeed }),
        h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("title.data"), onclick: onData }),
        h("button", { type: "button", class: "btn btn-quiet", text: i18n.t("ui.home"), onclick: onHome })
      ])
    ])
  );
}
