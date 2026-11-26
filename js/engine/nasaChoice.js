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

// "Your choice and how real planners think". Rule based, no scoring words
// like "wrong". The lines themselves live in data/content/nasa_choice.json.

const RULES = {
  stormShelter: (rounds) =>
    rounds.some((r) => r.eventType === "storm" && r.eventChoice === "shelter"),
  stormKeepWorking: (rounds) =>
    rounds.some((r) => r.eventType === "storm" && r.eventChoice === "keepWorking"),
  discoveryStudy: (rounds) =>
    rounds.some((r) => r.eventType === "discovery" && r.eventChoice === "study"),
  discoverySkip: (rounds) =>
    rounds.some((r) => r.eventType === "discovery" && r.eventChoice === "skip"),
  nightLowPower: (rounds, config) =>
    rounds.some((r) => r.isNight && r.after.power < config.nasa.nightLowPower),
  lifeCostsPower: (rounds, config) =>
    rounds.some((r) => r.allocation.life > 0 && r.after.power < config.nasa.lifeLowPower),
  lowShield: (rounds, config) =>
    rounds.length > 0 && rounds.every((r) => r.after.shield < config.nasa.lowShield)
};

export function ruleNames() {
  return [...Object.keys(RULES), "balanced"];
}

// Returns up to config.nasa.maxLines lines for one lunar day, in the order
// they appear in the content file. "balanced" is used when nothing else fits.
export function evaluate(log, lunarDay, content, config) {
  const lines = Array.isArray(content?.lines) ? content.lines : [];
  const rounds = log.filter((entry) => entry.lunarDay === lunarDay);
  const picked = [];
  for (const line of lines) {
    const rule = RULES[line.rule];
    if (!rule) continue;
    if (rule(rounds, config)) picked.push(line);
    if (picked.length >= config.nasa.maxLines) break;
  }
  if (picked.length === 0) {
    const fallback = lines.find((line) => line.rule === "balanced");
    if (fallback) picked.push(fallback);
  }
  return picked;
}
