import test from "node:test";
import assert from "node:assert/strict";
import { repairSuccess } from "../js/ui/repair.js";

test("a finished repair still counts if the timer has expired", () => {
  assert.equal(repairSuccess(3, 3), true);
  assert.equal(repairSuccess(2, 3), false);
  assert.equal(repairSuccess(0, 0), false);
});
