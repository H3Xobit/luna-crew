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

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createI18n } from "../js/ui/i18n.js";
import { hintText } from "../js/ui/jobs.js";
import { config } from "../js/engine/config.js";
import { jobWeights } from "../js/engine/rules.js";

const en = JSON.parse(await readFile(new URL("../data/i18n/en.json", import.meta.url), "utf8"));
const i18n = createI18n({ en }, "en");

test("job hints match the engine weights", () => {
  const day = { isNight: false, panelsDamaged: false, life: 70 };
  const night = { isNight: true, panelsDamaged: false, life: 70 };
  const damaged = { isNight: false, panelsDamaged: true, life: 70 };
  const dayWeights = jobWeights(day, config);
  const nightWeights = jobWeights(night, config);
  const broken = jobWeights(damaged, config);

  assert.equal(hintText(i18n, "power", day, config), `+${dayWeights.power.perPoint} Power per point (day)`);
  assert.match(hintText(i18n, "power", night, config), new RegExp(`\\+${nightWeights.power.perPoint} Power per point \\(night\\)`));
  assert.match(hintText(i18n, "power", damaged, config), /half/);
  assert.equal(broken.power.perPoint, Math.floor(config.jobs.power.day / 2));

  const life = hintText(i18n, "life", day, config);
  assert.match(life, /every 2 points use 1 Power/);
  assert.equal(dayWeights.life.powerCost(2), 1);
  assert.equal(dayWeights.life.powerCost(1), 1);
  assert.doesNotMatch(life, /uses 2 Power/);

  assert.match(hintText(i18n, "shield", day, config), new RegExp(String(dayWeights.shield.perPoint)));
  assert.match(hintText(i18n, "science", day, config), new RegExp(String(dayWeights.science.perPoint)));
});
