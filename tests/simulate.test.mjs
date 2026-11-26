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
import { loadData, playOne, runStrategy, checkTargets, TARGETS, STRATEGIES } from "../scripts/simulate.mjs";

test("balanced strategy usually completes; allScience usually does not", async () => {
  const data = await loadData();
  assert.ok(data.stormData);
  const balanced = runStrategy("balanced", 40, data);
  const science = runStrategy("allScience", 40, data);
  assert.ok(balanced.winRate >= 0.6, `balanced winRate ${balanced.winRate}`);
  assert.ok(science.winRate <= 0.2, `allScience winRate ${science.winRate}`);
});

test("playOne returns a summary with seed and bars", async () => {
  const data = await loadData();
  const summary = playOne(42, "balanced", data);
  assert.equal(summary.seed, 42);
  assert.ok(["complete", "paused"].includes(summary.status));
  assert.ok(Number.isFinite(summary.bars.power));
});

test("checkTargets flags out-of-range rows", () => {
  const misses = checkTargets([
    { name: "balanced", winRate: 0.5 },
    { name: "allScience", winRate: 0.5 },
    { name: "randomPlay", winRate: 0.3 }
  ]);
  assert.ok(misses.some((line) => line.includes("balanced")));
  assert.ok(misses.some((line) => line.includes("allScience")));
  assert.ok(TARGETS.balanced.min <= 1);
  assert.deepEqual(STRATEGIES.includes("neverShelter"), true);
});
