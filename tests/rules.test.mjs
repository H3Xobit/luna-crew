import test from "node:test";
import assert from "node:assert/strict";
import {
  config,
  createState,
  availablePoints,
  validateAllocation,
  applyJobs,
  applyGreenhouse,
  applyDrains,
  resolveRound,
  forecastRound,
  powerRate,
  topJob,
  lowestBar
} from "../js/engine/index.js";

test("available points subtract reserved, bonus and penalty", () => {
  const state = createState(1, config);
  state.roundBonus = 2;
  state.roundPenalty = 1;
  state.reservedPoints = 3;
  assert.equal(availablePoints(state, config), config.baseWorkPoints + 2 - 1 - 3);
});

test("validateAllocation rejects overspend and fractions", () => {
  assert.equal(validateAllocation({ power: 11, life: 0, shield: 0, science: 0 }, 10), "over");
  assert.equal(validateAllocation({ power: 1.5, life: 0, shield: 0, science: 0 }, 10), "invalid");
  assert.equal(validateAllocation({ power: 4, life: 3, shield: 2, science: 1 }, 10), null);
});

test("power rate is lower at night", () => {
  const day = createState(1, config);
  day.isNight = false;
  const night = createState(1, config);
  night.isNight = true;
  assert.equal(powerRate(day, config), config.jobs.power.day);
  assert.equal(powerRate(night, config), config.jobs.power.night);
  assert.ok(powerRate(day, config) > powerRate(night, config));
});

test("night drain includes powerNightExtra", () => {
  const day = createState(1, config);
  day.isNight = false;
  const night = createState(1, config);
  night.isNight = true;
  const dayDrain = applyDrains(day, config);
  const nightDrain = applyDrains(night, config);
  assert.equal(dayDrain.power, -config.drains.power);
  assert.equal(nightDrain.power, -(config.drains.power + config.drains.powerNightExtra));
});

test("life support spends power while science earns mission points", () => {
  const state = createState(1, config);
  const jobs = applyJobs(state, { power: 0, life: 2, shield: 0, science: 3 }, config);
  assert.equal(jobs.life, 2 * config.jobs.life.gain);
  assert.equal(jobs.power, -Math.ceil(2 / config.jobs.life.powerCostPer));
  assert.equal(jobs.missionPoints, 3 * config.jobs.science.gain);
});

test("greenhouse on grows life and uses power", () => {
  const on = createState(1, config);
  on.lightsOn = true;
  const off = createState(1, config);
  off.lightsOn = false;
  assert.deepEqual(applyGreenhouse(on, config), config.greenhouse.on);
  assert.deepEqual(applyGreenhouse(off, config), config.greenhouse.off);
});

test("forecastRound matches resolveRound bars before events", () => {
  const state = createState(1, config);
  state.isNight = false;
  state.lightsOn = true;
  const plan = { power: 3, life: 2, shield: 1, science: 4 };
  const forecast = forecastRound(state, plan, config);
  const resolved = resolveRound(state, plan, config);
  assert.equal(resolved.ok, true);
  assert.equal(forecast.power, resolved.result.after.power);
  assert.equal(forecast.life, resolved.result.after.life);
  assert.equal(forecast.shield, resolved.result.after.shield);
});

test("topJob and lowestBar helpers", () => {
  assert.equal(topJob({ power: 1, life: 4, shield: 2, science: 0 }), "life");
  assert.equal(topJob({ power: 0, life: 0, shield: 0, science: 0 }), null);
  const state = createState(1, config);
  state.power = 10;
  state.life = 40;
  state.shield = 20;
  assert.equal(lowestBar(state), "power");
});

test("damaged panels halve power gain", () => {
  const state = createState(1, config);
  state.panelsDamaged = true;
  state.isNight = false;
  const jobs = applyJobs(state, { power: 4, life: 0, shield: 0, science: 0 }, config);
  assert.equal(jobs.power, Math.floor((4 * config.jobs.power.day) / 2));
});
