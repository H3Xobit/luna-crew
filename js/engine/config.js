// Every balancing number lives here. These are game units for a classroom
// game. They are not real mission quantities.

export const config = {
  bars: { min: 0, max: 100 },
  start: { power: 60, life: 70, shield: 30, missionPoints: 0 },
  lunarDays: 3,
  roundsPerDay: 4,
  nightRounds: [3, 4],
  baseWorkPoints: 10,
  jobs: {
    power: { day: 5, night: 1 },
    life: { gain: 4, powerCostPer: 2 },
    shield: { gain: 4 },
    science: { gain: 10 }
  },
  greenhouse: {
    on: { life: 3, power: -4 },
    off: { life: -3, power: 0 }
  },
  drains: { life: 8, power: 6, powerNightExtra: 5, shield: 0 },
  askEarth: { cost: 1, delayMs: 1300 },
  rescue: { cost: 3, points: 20, waitPenalty: 2 },
  discovery: { cost: 3, points: 60, lifeCost: 10 },
  repair: { hotspots: 3, timeLimitMs: 10000, cost: 1 },
  storm: {
    classSeverity: { C: 1, M: 2, X: 3 },
    particleEventSeverity: 2,
    linkedParticleBonus: 1,
    minSeverity: 1,
    maxSeverity: 4,
    trainingSeverity: 2,
    shieldLinePerSeverity: 20,
    shieldedLifeLoss: 5,
    unshieldedLifePerSeverity: 10,
    unshieldedShieldPerSeverity: 5,
    panelDamageAtSeverity: 3
  },
  nasa: { nightLowPower: 30, lifeLowPower: 25, lowShield: 40, maxLines: 2 },
  quiz: { bonusPoints: 1 },
  harvest: false,
  harvestLife: 10,
  events: [
    { lunarDay: 1, roundInDay: 1, type: "rescue" },
    { lunarDay: 2, roundInDay: 2, type: "storm" },
    { lunarDay: 3, roundInDay: 1, type: "discovery" }
  ],
  // ?demo=1 brings the storm forward so it fits in a short presentation.
  demoEvents: [
    { lunarDay: 1, roundInDay: 1, type: "rescue" },
    { lunarDay: 1, roundInDay: 2, type: "storm" },
    { lunarDay: 3, roundInDay: 1, type: "discovery" }
  ]
};

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

// Lets data/content/config.json override single numbers without editing code.
export function mergeConfig(base, overrides) {
  if (!isPlainObject(overrides)) return structuredClone(base);
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(overrides)) {
    if (!(key in result)) continue;
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = mergeConfig(result[key], value);
    } else if (Array.isArray(value) && Array.isArray(result[key])) {
      result[key] = structuredClone(value);
    } else if (typeof value === typeof result[key] && !isPlainObject(value) && !Array.isArray(value)) {
      result[key] = structuredClone(value);
    }
  }
  return result;
}
