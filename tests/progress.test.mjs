import test from "node:test";
import assert from "node:assert/strict";
import { awardMission, dailySeed, isUnlocked, rankFor, starsFor } from "../js/ui/progress.js";

const missions = [
  { id: "a", unlock: "start", star3: "finish", facts: ["f1"] },
  { id: "b", unlock: "after", after: "a", star3: "shelter", facts: ["f2"] }
];

test("missions unlock in order and stars match the learning goal", () => {
  const progress = { stars: {}, badges: [], journal: [], bestRank: "cadet" };
  assert.equal(isUnlocked(missions[0], missions, progress), true);
  assert.equal(isUnlocked(missions[1], missions, progress), false);
  const done = {
    status: "complete",
    bars: { power: 40, life: 40, shield: 40 },
    sampleRecovered: false,
    missionPoints: 10,
    repairs: 0,
    log: [{ isNight: false, power: 40, eventChoice: "shelter", lightsOn: true }]
  };
  assert.equal(starsFor(missions[0], done).count, 3);
  const paused = { ...done, status: "paused" };
  assert.equal(starsFor(missions[0], paused).count, 0);
  const awarded = awardMission(progress, missions[0], done, ["f1"]);
  assert.equal(awarded.progress.stars.a, 3);
  assert.equal(awarded.progress.journal.includes("f1"), true);
  assert.equal(isUnlocked(missions[1], missions, awarded.progress), true);
  assert.equal(rankFor(3).id, "junior");
  assert.equal(rankFor(0).id, "cadet");
});

test("daily seed stays the same for one UTC day", () => {
  const day = new Date("2026-11-15T00:30:00Z");
  assert.equal(dailySeed(day), dailySeed(new Date("2026-11-15T20:00:00Z")));
  assert.notEqual(dailySeed(day), dailySeed(new Date("2026-11-16T00:30:00Z")));
});
