// Round positions, the event schedule and the storm draw.

export function totalRounds(config) {
  return config.lunarDays * config.roundsPerDay;
}

export function roundPosition(round, config) {
  const lunarDay = Math.floor((round - 1) / config.roundsPerDay) + 1;
  const roundInDay = ((round - 1) % config.roundsPerDay) + 1;
  return { lunarDay, roundInDay, isNight: config.nightRounds.includes(roundInDay) };
}

export function scheduleFor(config, demo) {
  return demo ? config.demoEvents : config.events;
}

export function scheduledType(schedule, lunarDay, roundInDay) {
  const hit = schedule.find((item) => item.lunarDay === lunarDay && item.roundInDay === roundInDay);
  return hit ? hit.type : null;
}

export function clampSeverity(value, config) {
  return Math.max(config.storm.minSeverity, Math.min(config.storm.maxSeverity, value));
}

// Game level 1 to 4. This is a gameplay level, not a NASA risk rating.
// Flare class C = 1, M = 2, X = 3, plus 1 when a particle event is linked.
export function severityOf(event, config) {
  const rules = config.storm;
  if (!event) return rules.trainingSeverity;
  if (event.type === "SEP") {
    return clampSeverity(rules.particleEventSeverity + rules.linkedParticleBonus, config);
  }
  const letter = String(event.classType || "").charAt(0).toUpperCase();
  const base = rules.classSeverity[letter] ?? rules.minSeverity;
  const bonus = event.hasLinkedSEP ? rules.linkedParticleBonus : 0;
  return clampSeverity(base + bonus, config);
}

export function trainingStorm(config) {
  return {
    type: "storm",
    real: false,
    id: null,
    eventType: "training",
    date: null,
    classType: null,
    hasLinkedSEP: false,
    link: null,
    severity: config.storm.trainingSeverity,
    label: { kind: "training", date: null }
  };
}

// stormData: { events: [...], label: { kind, date } } as built by js/data/storms.js.
export function pickStorm(rng, stormData, config) {
  const events = Array.isArray(stormData?.events) ? stormData.events : [];
  if (events.length === 0) return trainingStorm(config);
  const event = events[rng.int(events.length)];
  return {
    type: "storm",
    real: true,
    id: event.id,
    eventType: event.type,
    date: event.date,
    classType: event.classType ?? null,
    hasLinkedSEP: Boolean(event.hasLinkedSEP),
    link: event.link,
    severity: severityOf(event, config),
    label: { kind: stormData.label.kind, date: stormData.label.date }
  };
}

export function buildEvent(type, config, storm) {
  if (type === "rescue") {
    return {
      type,
      options: [
        { id: "rescueNow", cost: config.rescue.cost, points: config.rescue.points },
        { id: "waitForSun", cost: 0, nextPenalty: config.rescue.waitPenalty }
      ]
    };
  }
  if (type === "discovery") {
    return {
      type,
      options: [
        { id: "study", cost: config.discovery.cost, points: config.discovery.points, life: -config.discovery.lifeCost },
        { id: "skip", cost: 0 }
      ]
    };
  }
  if (type === "storm") {
    return {
      ...storm,
      shieldLine: storm.severity * config.storm.shieldLinePerSeverity,
      options: [
        { id: "shelter", cost: 0 },
        { id: "keepWorking", cost: 0 }
      ]
    };
  }
  if (type === "repair") {
    return {
      type,
      hotspots: config.repair.hotspots,
      timeLimitMs: config.repair.timeLimitMs,
      cost: config.repair.cost
    };
  }
  return null;
}
