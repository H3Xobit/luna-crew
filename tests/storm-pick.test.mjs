import test from "node:test";
import assert from "node:assert/strict";
import { config } from "../js/engine/config.js";
import { pickStorm } from "../js/engine/events.js";

function rngOf(rolls) {
  let index = 0;
  return {
    int() {
      const value = rolls[index] ?? 0;
      index += 1;
      return value;
    }
  };
}

function event(id, classType, extra = {}) {
  return {
    id,
    type: extra.type || "FLR",
    date: "2024-05-14T16:51Z",
    classType,
    link: "https://example.test/storm",
    hasLinkedSEP: Boolean(extra.hasLinkedSEP),
    label: extra.label || { kind: "saved", date: "2024-05-14" }
  };
}

const pool = [
  event("m", "M1.0", { label: { kind: "updated", date: "2026-11-14 03:00 UTC" } }),
  event("x", "X1.0"),
  event("xsep", "X1.0", { hasLinkedSEP: true })
];

test("storm pick follows mission mode and keeps the event label", () => {
  const level2 = pickStorm(rngOf([0]), { events: pool }, config, "level2");
  assert.equal(level2.severity, 2);
  assert.equal(level2.id, "m");

  const latest = pickStorm(rngOf([0]), { events: pool, latestEvents: [pool[0]] }, config, "latest");
  assert.equal(latest.label.kind, "updated");

  const strong = pickStorm(rngOf([]), { events: pool, strongest: pool[2] }, config, "strongest");
  assert.equal(strong.id, "xsep");
  assert.equal(strong.severity, 4);
  assert.equal(strong.label.kind, "saved");

  const mild = pickStorm(rngOf([0, 0]), { events: pool }, config, "weighted");
  assert.equal(mild.severity, 2);
  const hard = pickStorm(rngOf([90, 0]), { events: pool }, config, "weighted");
  assert.equal(hard.severity, 4);
});
