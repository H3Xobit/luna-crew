// Luna Crew
// Copyright 2026 Rishi Jambagi
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

// Plays many headless games per strategy to check the balance.
//
//   node scripts/simulate.mjs           200 games per strategy
//   node scripts/simulate.mjs 500       500 games per strategy
//
// Targets: balanced wins at least 70 percent, allScience at most 10 percent,
// randomPlay between 20 and 50 percent. If a target is missed, tune only the
// constants in js/engine/config.js.

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createGame, createRng, usableCards } from "../js/engine/index.js";
import { chooseStormSource, labelText } from "../js/data/storms.js";

const ROOT = new URL("../", import.meta.url);
export const STRATEGIES = ["balanced", "allScience", "noLights", "neverShelter", "randomPlay"];
export const TARGETS = {
  balanced: { min: 0.7, max: 1 },
  allScience: { min: 0, max: 0.1 },
  randomPlay: { min: 0.2, max: 0.5 }
};

async function readJson(relative) {
  try {
    return JSON.parse(await readFile(new URL(relative, ROOT), "utf8"));
  } catch {
    return null;
  }
}

function fill(budget, wants) {
  const plan = { power: 0, life: 0, shield: 0, science: 0 };
  let left = budget;
  for (const [job, count] of wants) {
    const take = Math.min(count, left);
    plan[job] += take;
    left -= take;
  }
  plan.science += left;
  return plan;
}

function randomPlan(budget, rng) {
  const jobs = ["power", "life", "shield", "science"];
  const plan = { power: 0, life: 0, shield: 0, science: 0 };
  for (let i = 0; i < budget; i += 1) plan[rng.pick(jobs)] += 1;
  return plan;
}

function planFor(game, strategy, rng) {
  const budget = game.available();
  const state = game.state;
  if (strategy === "allScience") return fill(budget, []);
  if (strategy === "randomPlay") return randomPlan(budget, rng);
  if (state.isNight) return fill(budget, [["power", 6], ["life", 2]]);
  return fill(budget, [["power", 3], ["life", 2], ["shield", 1]]);
}

function chooseFor(game, strategy, rng) {
  const event = game.state.event;
  const random = strategy === "randomPlay";
  if (event.type === "rescue") {
    return game.chooseEvent(random && rng.next() < 0.5 ? "waitForSun" : "rescueNow");
  }
  if (event.type === "storm") {
    if (random) return game.chooseEvent(rng.next() < 0.5 ? "shelter" : "keepWorking");
    return game.chooseEvent(strategy === "neverShelter" ? "keepWorking" : "shelter");
  }
  if (random) return game.chooseEvent(rng.next() < 0.5 ? "study" : "skip");
  const study = strategy === "allScience" || game.state.life >= 50;
  return game.chooseEvent(study ? "study" : "skip");
}

export function playOne(seed, strategy, data) {
  const rng = createRng(seed * 7919 + 17);
  const game = createGame({
    seed,
    stormData: data.stormData,
    cards: data.cards,
    nasaChoice: data.nasaChoice,
    wait: async () => {}
  });
  game.start();
  let guard = 0;
  while (game.state.phase !== "end" && guard < 200) {
    guard += 1;
    const phase = game.state.phase;
    if (phase === "event") {
      chooseFor(game, strategy, rng);
    } else if (phase === "repair") {
      game.completeRepair(strategy === "randomPlay" ? rng.next() < 0.5 : true);
    } else if (phase === "allocate") {
      if (strategy === "noLights") game.setLights(false);
      else if (strategy === "randomPlay") game.setLights(rng.next() < 0.5);
      else game.setLights(true);
      const result = game.submit(planFor(game, strategy, rng));
      if (!result.ok) throw new Error(`${strategy} seed ${seed}: ${result.error}`);
    } else if (phase === "quiz") {
      const card = game.state.quizCard;
      game.answerQuiz(strategy === "randomPlay" ? rng.int(card.options.length) : 0);
    } else {
      game.next();
    }
  }
  return game.summary();
}

export async function loadData() {
  const latest = await readJson("data/latest.json");
  const saved = await readJson("data/storms.json");
  const cards = await readJson("data/content/cards.json");
  const nasaChoice = await readJson("data/content/nasa_choice.json");
  return {
    stormData: chooseStormSource(latest, saved),
    cards: cards?.cards ?? [],
    nasaChoice: nasaChoice ?? { lines: [] }
  };
}

export function runStrategy(name, games, data) {
  const reasons = { power: 0, life: 0, shield: 0 };
  let wins = 0;
  let score = 0;
  for (let seed = 1; seed <= games; seed += 1) {
    const summary = playOne(seed, name, data);
    if (summary.status === "complete") wins += 1;
    else reasons[summary.reason] += 1;
    score += summary.missionPoints;
  }
  return { name, games, wins, winRate: wins / games, averageScore: score / games, reasons };
}

export function checkTargets(rows) {
  const misses = [];
  for (const row of rows) {
    const target = TARGETS[row.name];
    if (!target) continue;
    if (row.winRate < target.min || row.winRate > target.max) {
      misses.push(`${row.name} ${(row.winRate * 100).toFixed(1)}% is outside ${target.min * 100} to ${target.max * 100}%`);
    }
  }
  return misses;
}

async function main() {
  const games = Number.parseInt(process.argv[2] || "200", 10) || 200;
  const data = await loadData();
  const events = data.stormData.events || [];
  const updated = events.filter((event) => event.label?.kind === "updated").length;
  const saved = events.filter((event) => event.label?.kind === "saved").length;
  const summary = events.length === 0 ? labelText(data.stormData.label) : `${updated} updated, ${saved} saved`;
  console.log(`Storm data: ${summary} (${events.length} events)`);
  console.log(`Quiz cards: ${usableCards(data.cards).length} verified of ${data.cards.length}`);
  console.log("");
  console.log("strategy       wins      win rate  avg score  paused by (power / life / shield)");
  const rows = STRATEGIES.map((name) => runStrategy(name, games, data));
  for (const row of rows) {
    console.log(
      row.name.padEnd(13) +
        `${String(row.wins).padStart(4)}/${row.games}` +
        `${(row.winRate * 100).toFixed(1).padStart(9)}%` +
        `${row.averageScore.toFixed(1).padStart(11)}` +
        `   ${row.reasons.power} / ${row.reasons.life} / ${row.reasons.shield}`
    );
  }
  const misses = checkTargets(rows);
  console.log("");
  if (misses.length > 0) {
    for (const miss of misses) console.error(`Target missed: ${miss}`);
    console.error("Tune only the constants in js/engine/config.js.");
    process.exit(1);
  }
  console.log("All balance targets passed.");
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await main();
