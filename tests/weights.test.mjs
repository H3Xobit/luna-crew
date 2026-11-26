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
import { applyJobs, briefingId, jobWeights } from "../js/engine/rules.js";
import { config } from "../js/engine/config.js";

function state(extra) {
  return { isNight: false, panelsDamaged: false, life: 70, lightsOn: true, eventChoice: null, ...extra };
}

test("weights match the engine for day, night, damaged panels and a storm", () => {
  const cases = [
    state({}),
    state({ isNight: true }),
    state({ panelsDamaged: true }),
    state({ isNight: true, panelsDamaged: true }),
    state({ roundEvent: { type: "storm", severity: 3 } })
  ];
  for (const current of cases) {
    const weights = jobWeights(current, config);
    for (const points of [0, 1, 2, 5]) {
      const allocation = { power: points, life: points, shield: points, science: points };
      const jobs = applyJobs(current, allocation, config);
      assert.equal(jobs.power, weights.power.gain(points) - weights.life.powerCost(points));
      assert.equal(jobs.life, points * weights.life.perPoint);
      assert.equal(jobs.shield, points * weights.shield.perPoint);
      assert.equal(jobs.missionPoints, points * weights.science.perPoint);
    }
    if (current.roundEvent?.type === "storm") {
      assert.equal(weights.shield.times, current.roundEvent.severity);
      assert.equal(weights.shield.line, current.roundEvent.severity * config.storm.shieldLinePerSeverity);
    } else {
      assert.equal(weights.shield.times, 1);
      assert.equal(weights.shield.line, null);
    }
  }
  const day = jobWeights(state({}), config);
  const night = jobWeights(state({ isNight: true }), config);
  assert.equal(day.power.perPoint, config.jobs.power.day);
  assert.equal(night.power.perPoint, config.jobs.power.night);
  assert.notEqual(day.power.perPoint, day.life.perPoint);
  assert.notEqual(day.shield.perPoint, day.science.perPoint);
});

test("briefing picks the most urgent line", () => {
  assert.equal(briefingId(state({ isNight: true })), "night");
  assert.equal(briefingId(state({ life: 20 })), "life");
  assert.equal(briefingId(state({ panelsDamaged: true, life: 20, isNight: true })), "panels");
  assert.equal(briefingId(state({ roundEvent: { type: "storm", severity: 2 }, panelsDamaged: true, life: 10, isNight: true })), "storm");
  assert.equal(briefingId(state({})), "ahead");
});
