import test from "node:test";
import assert from "node:assert/strict";
import { evaluateNasaChoice, ruleNames, config } from "../js/engine/index.js";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("ruleNames includes balanced fallback", () => {
  const names = ruleNames();
  assert.ok(names.includes("balanced"));
  assert.ok(names.includes("stormShelter"));
});

test("evaluate returns shelter match when the crew sheltered", async () => {
  const content = JSON.parse(await readFile(new URL("data/content/nasa_choice.json", root), "utf8"));
  const log = [
    {
      lunarDay: 2,
      isNight: false,
      allocation: { power: 3, life: 2, shield: 1, science: 0 },
      eventType: "storm",
      eventChoice: "shelter",
      after: { power: 50, life: 50, shield: 50, missionPoints: 0 }
    }
  ];
  const lines = evaluateNasaChoice(log, 2, content, config);
  assert.ok(lines.length >= 1);
  assert.ok(lines.length <= config.nasa.maxLines);
  assert.equal(lines[0].rule, "stormShelter");
  assert.equal(lines[0].match, true);
});

test("evaluate falls back to balanced when nothing else fits", async () => {
  const content = JSON.parse(await readFile(new URL("data/content/nasa_choice.json", root), "utf8"));
  const log = [
    {
      lunarDay: 1,
      isNight: false,
      allocation: { power: 3, life: 2, shield: 2, science: 2 },
      eventType: null,
      eventChoice: null,
      after: { power: 60, life: 60, shield: 60, missionPoints: 20 }
    }
  ];
  const lines = evaluateNasaChoice(log, 1, content, config);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].rule, "balanced");
});
