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

// Mission Cards: one question after each lunar day, then the answer with
// its NASA source. A missed card comes back at the next quiz.

import { h, sourceLink } from "./dom.js";
import { icon } from "./icons.js";

export async function askQuiz(modals, { i18n, card, hasNextRound = true }) {
  const answer = await modals.open({
    title: i18n.t("quiz.title"),
    tone: "quiz",
    stack: true,
    body: [
      card.repeat ? h("p", { class: "quiz-repeat", text: i18n.t("quiz.again") }) : null,
      h("p", { class: "quiz-question", text: i18n.pick(card.q) }),
      h("p", { class: "small", text: i18n.t(hasNextRound ? "quiz.bonusHint" : "quiz.finalHint") })
    ],
    actions: card.options.map((option, index) => ({ id: String(index), label: i18n.pick(option) }))
  });
  const index = Number.parseInt(answer, 10);
  return Number.isInteger(index) ? index : 0;
}

export function showQuizAnswer(modals, { i18n, card, result, bonus, hasNextRound }) {
  const right = i18n.pick(card.options[result.correctIndex]);
  return modals.open({
    title: i18n.t(result.correct ? "quiz.correct" : "quiz.notYet"),
    tone: result.correct ? "good" : "quiz",
    body: [
      h("p", { class: `quiz-answer ${result.correct ? "is-right" : "is-missed"}` }, [
        h("span", { html: icon(result.correct ? "check" : "book") }),
        h("span", {}, [h("strong", { text: `${i18n.t("quiz.answerIs")} ` }), right])
      ]),
      card.explain ? h("p", { text: i18n.pick(card.explain) }) : null,
      h("div", { class: "fact-block" }, [
        h("span", { class: "fact-tag", text: i18n.t("fact.real") }),
        sourceLink(card.source.url, `${card.source.agency}: ${card.source.name}`)
      ]),
      result.correct && hasNextRound ? h("p", { class: "quiz-bonus", text: i18n.t("quiz.bonus", { n: bonus }) }) : null,
      result.correct && !hasNextRound ? h("p", { class: "quiz-bonus", text: i18n.t("quiz.journal") }) : null,
      !result.correct ? h("p", { class: "small", text: i18n.t("quiz.comesBack") }) : null
    ],
    actions: [{ id: "next", label: i18n.t("ui.next"), kind: "primary" }]
  });
}
