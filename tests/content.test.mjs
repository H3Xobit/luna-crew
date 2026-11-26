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

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { isVerifiedFact, verifiedFacts, factIndex, resolveLine } from "../js/data/content.js";
import { createI18n, fillVars, detectLanguage } from "../js/ui/i18n.js";
import { shieldLayerCount } from "../js/ui/scene.js";

const root = new URL("../", import.meta.url);

async function load(path) {
  return JSON.parse(await readFile(new URL(path, root), "utf8"));
}

test("every verified fact has a real https source", async () => {
  const facts = await load("data/content/facts.json");
  const verified = verifiedFacts(facts);
  assert.ok(verified.length >= 8);
  for (const fact of verified) {
    assert.equal(isVerifiedFact(fact), true);
    assert.match(fact.source.url, /^https:\/\//);
  }
});

test("resolveLine skips unverified fact ids", async () => {
  const facts = await load("data/content/facts.json");
  const index = factIndex(facts);
  const ok = resolveLine({ who: "pip", text: { en: "hi", ja: "やあ" } }, index);
  assert.equal(ok.who, "pip");
  const withFact = resolveLine({ who: "sprout", lead: { en: "Lead.", ja: "前置き。" }, fact: verifiedFacts(facts)[0].id }, index);
  assert.ok(withFact.fact);
  assert.equal(resolveLine({ who: "pip", fact: "missing_fact_id" }, index), null);
});

test("i18n dictionaries cover the same keys and fill vars", async () => {
  const en = await load("data/i18n/en.json");
  const ja = await load("data/i18n/ja.json");
  const enKeys = Object.keys(en).sort();
  const jaKeys = Object.keys(ja).sort();
  assert.deepEqual(jaKeys, enKeys);
  assert.ok(enKeys.includes("label.training"));
  assert.ok(enKeys.includes("teach.learn1"));
  assert.equal(fillVars("Day {n}", { n: 3 }), "Day 3");
  const i18n = createI18n({ en, ja }, "ja");
  assert.equal(i18n.t("ui.next"), ja["ui.next"]);
  i18n.setLang("en");
  assert.equal(i18n.t("ui.next"), en["ui.next"]);
  assert.equal(detectLanguage("?lang=ja", "en", "en-US"), "ja");
  assert.equal(detectLanguage("", "ja", "en-US"), "ja");
  assert.equal(detectLanguage("", null, "ja-JP"), "ja");
});

test("config and story carry bilingual title and tutorial", async () => {
  const config = await load("data/content/config.json");
  const story = await load("data/content/story.json");
  assert.ok(config.title.en && config.title.ja);
  assert.ok(Array.isArray(story.intro) && story.intro.length >= 4);
  assert.ok(Array.isArray(story.tutorial) && story.tutorial.length >= 5);
  assert.equal(config.helmetColors.length, 6);
});

test("shieldLayerCount maps bar values to dirt layers", () => {
  assert.equal(shieldLayerCount(0), 0);
  assert.equal(shieldLayerCount(1), 1);
  assert.equal(shieldLayerCount(25), 1);
  assert.equal(shieldLayerCount(26), 2);
  assert.equal(shieldLayerCount(100), 4);
});
