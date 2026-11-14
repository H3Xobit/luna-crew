import test from "node:test";
import assert from "node:assert/strict";
import { createQuiz, isUsableCard, usableCards, createRng } from "../js/engine/index.js";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

const good = {
  id: "card_test",
  status: "verified",
  q: { en: "Which bar is Power?", ja: "電気はどれ？" },
  options: [
    { en: "Power", ja: "電気" },
    { en: "Shield", ja: "シールド" },
    { en: "Science", ja: "かがく" }
  ],
  answer: 0,
  source: { name: "Test", agency: "NASA", url: "https://www.nasa.gov/" }
};

test("isUsableCard requires verified https source", () => {
  assert.equal(isUsableCard(good), true);
  assert.equal(isUsableCard({ ...good, status: "draft" }), false);
  assert.equal(isUsableCard({ ...good, source: { ...good.source, name: "TODO_SOURCE" } }), false);
  assert.equal(isUsableCard({ ...good, source: { ...good.source, url: "http://insecure.test" } }), false);
});

test("missed cards return later; correct answers advance", () => {
  const quiz = createQuiz([good], createRng(7));
  const first = quiz.draw();
  assert.ok(first);
  const rightText = good.options[good.answer];
  const wrong = first.options.findIndex((option) => option !== rightText);
  const miss = quiz.answer(wrong);
  assert.equal(miss.correct, false);

  const again = quiz.draw();
  assert.ok(again);
  assert.equal(again.id, good.id);
  assert.equal(again.repeat, true);

  const right = again.options.findIndex((option) => option === rightText);
  const hit = quiz.answer(right);
  assert.equal(hit.correct, true);
  assert.equal(quiz.boxOf(good.id), 2);
});

test("content cards file only exposes verified cards to the deck", async () => {
  const file = JSON.parse(await readFile(new URL("data/content/cards.json", root), "utf8"));
  const usable = usableCards(file.cards);
  assert.ok(usable.length >= 3);
  for (const card of usable) assert.equal(isUsableCard(card), true);
});
