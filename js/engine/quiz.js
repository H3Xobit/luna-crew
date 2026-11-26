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

// Mission Cards quiz. One question after each lunar day. A missed card goes
// back to box 1 and returns at the next quiz. A correct card moves up a box
// and waits longer (Leitner style).

const MAX_BOX = 3;

function hasText(value) {
  if (typeof value === "string") return value.trim().length > 0;
  return Boolean(value && typeof value === "object" && typeof value.en === "string" && value.en.trim());
}

// Only cards with a checked source may be shown.
export function isUsableCard(card) {
  if (!card || typeof card !== "object") return false;
  if (card.status !== "verified") return false;
  if (typeof card.id !== "string" || !card.id) return false;
  if (!hasText(card.q)) return false;
  if (!Array.isArray(card.options) || card.options.length !== 3 || !card.options.every(hasText)) return false;
  if (!Number.isInteger(card.answer) || card.answer < 0 || card.answer > 2) return false;
  const source = card.source;
  if (!source || typeof source !== "object") return false;
  if (typeof source.url !== "string" || !/^https:\/\//.test(source.url)) return false;
  if (typeof source.name !== "string" || !source.name.trim()) return false;
  if (source.name === "TODO_SOURCE" || source.url === "TODO_SOURCE") return false;
  return true;
}

export function usableCards(cards) {
  return (Array.isArray(cards) ? cards : []).filter(isUsableCard);
}

export function createQuiz(cards, rng, saved = {}) {
  const deck = rng.shuffle(usableCards(cards));
  const records = new Map();
  for (const [id, record] of Object.entries(saved || {})) {
    if (!deck.some((card) => card.id === id)) continue;
    const box = Math.max(1, Math.min(MAX_BOX, Number(record?.box) || 1));
    records.set(id, { box, dueTurn: box === 1 ? 0 : 2 ** (box - 1) });
  }
  let turn = 0;
  let pending = null;

  function nextCard() {
    const due = deck.filter((card) => {
      const record = records.get(card.id);
      return record && record.dueTurn <= turn;
    });
    const missed = due.filter((card) => records.get(card.id).box === 1);
    if (missed.length > 0) return missed[0];
    const unseen = deck.filter((card) => !records.has(card.id));
    if (unseen.length > 0) return unseen[0];
    if (due.length > 0) return due[0];
    return null;
  }

  return {
    size: deck.length,
    // Returns the card to show, with its three options in shuffled order.
    draw() {
      if (pending) return pending.view;
      const card = nextCard();
      if (!card) return null;
      const order = rng.shuffle([0, 1, 2]);
      const view = {
        id: card.id,
        q: card.q,
        options: order.map((index) => card.options[index]),
        explain: card.explain ?? null,
        source: card.source,
        repeat: records.has(card.id)
      };
      pending = { card, view, correctIndex: order.indexOf(card.answer) };
      return view;
    },
    answer(optionIndex) {
      if (!pending) return null;
      const correct = optionIndex === pending.correctIndex;
      const previous = records.get(pending.card.id);
      const box = correct ? Math.min(MAX_BOX, (previous ? previous.box : 1) + 1) : 1;
      // Box 1 comes back at the next quiz, box 2 after two, box 3 after four.
      const wait = correct ? 2 ** (box - 1) : 1;
      records.set(pending.card.id, { box, dueTurn: turn + wait });
      const result = { correct, correctIndex: pending.correctIndex, id: pending.card.id };
      pending = null;
      turn += 1;
      return result;
    },
    skip() {
      if (!pending) return;
      pending = null;
      turn += 1;
    },
    boxOf(id) {
      const record = records.get(id);
      return record ? record.box : 0;
    },
    snapshot() {
      const out = {};
      for (const [id, record] of records) out[id] = { box: record.box };
      return out;
    }
  };
}
