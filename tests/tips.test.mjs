import test from "node:test";
import assert from "node:assert/strict";
import { roundTipId } from "../js/engine/rules.js";

test("round tips follow night, mission and the last round, not the round number", () => {
  assert.equal(roundTipId({ round: 1, isNight: true, totalRounds: 4 }, "long-night"), "longNight");
  assert.equal(roundTipId({ round: 1, isNight: false, totalRounds: 4 }, "first-light"), "firstDay");
  assert.equal(roundTipId({ round: 3, isNight: true, totalRounds: 4 }, "full-mission"), "night");
  assert.equal(roundTipId({ round: 4, isNight: true, totalRounds: 4 }, "full-mission"), "last");
  assert.notEqual(roundTipId({ round: 1, isNight: true, totalRounds: 4 }, "long-night"), "firstDay");
});
