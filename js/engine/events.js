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

function eventToStorm(event, config) {
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
    label: event.label || { kind: "saved", date: null }
  };
}

function bucket(events, config, level) {
  return events.filter((event) => severityOf(event, config) === level);
}

// mode: weighted (50% level 2, 35% level 3, 15% level 4), level2, latest, strongest.
export function pickStorm(rng, stormData, config, mode = "weighted") {
  const all = Array.isArray(stormData?.events) ? stormData.events : [];
  let events = all;
  if (mode === "latest") {
    const fresh = Array.isArray(stormData?.latestEvents) ? stormData.latestEvents : [];
    events = fresh.length > 0 ? fresh : all;
  }
  if (mode === "strongest" && stormData?.strongest) return eventToStorm(stormData.strongest, config);
  if (events.length === 0) return trainingStorm(config);
  if (mode === "level2") {
    const mild = bucket(events, config, 2);
    const pool = mild.length > 0 ? mild : events;
    return eventToStorm(pool[rng.int(pool.length)], config);
  }
  if (mode === "uniform") return eventToStorm(events[rng.int(events.length)], config);
  const roll = rng.int(100);
  const want = roll < 50 ? 2 : roll < 85 ? 3 : 4;
  const order = [want, 2, 3, 4, 1].filter((level, index, list) => list.indexOf(level) === index);
  for (const level of order) {
    const found = bucket(events, config, level);
    if (found.length > 0) return eventToStorm(found[rng.int(found.length)], config);
  }
  return eventToStorm(events[rng.int(events.length)], config);
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
