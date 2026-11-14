// Pure round rules. Nothing here touches the page, the clock or the network.

import { JOBS, cloneState, snapshotBars } from "./state.js";
import { totalRounds } from "./events.js";

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function availablePoints(state, config) {
  const total = config.baseWorkPoints + state.roundBonus - state.roundPenalty - state.reservedPoints;
  return Math.max(0, total);
}

export function validateAllocation(allocation, available) {
  if (!allocation || typeof allocation !== "object") return "invalid";
  let sum = 0;
  for (const job of JOBS) {
    const value = allocation[job];
    if (!Number.isInteger(value) || value < 0) return "invalid";
    sum += value;
  }
  if (sum > available) return "over";
  return null;
}

export function powerRate(state, config) {
  return state.isNight ? config.jobs.power.night : config.jobs.power.day;
}

export function applyJobs(state, allocation, config) {
  if (state.eventChoice === "shelter") {
    return { power: 0, life: 0, shield: 0, missionPoints: 0 };
  }
  let powerGain = allocation.power * powerRate(state, config);
  if (state.panelsDamaged) powerGain = Math.floor(powerGain / 2);
  const powerCost = Math.ceil(allocation.life / config.jobs.life.powerCostPer);
  return {
    power: powerGain - powerCost,
    life: allocation.life * config.jobs.life.gain,
    shield: allocation.shield * config.jobs.shield.gain,
    missionPoints: allocation.science * config.jobs.science.gain
  };
}

export function applyGreenhouse(state, config) {
  const effect = state.lightsOn ? config.greenhouse.on : config.greenhouse.off;
  return { power: effect.power, life: effect.life };
}

export function applyDrains(state, config) {
  const nightExtra = state.isNight ? config.drains.powerNightExtra : 0;
  return {
    power: -(config.drains.power + nightExtra),
    life: -config.drains.life,
    shield: -config.drains.shield
  };
}

// shieldNow is the shield after jobs, so dirt piled this round still counts.
export function applyEventOutcome(state, shieldNow, config) {
  const delta = { power: 0, life: 0, shield: 0, missionPoints: 0 };
  const flags = {};
  const choice = state.eventChoice;
  const event = state.roundEvent;

  if (choice === "rescueNow") {
    flags.sampleRecovered = true;
    delta.missionPoints += config.rescue.points;
  }
  if (choice === "waitForSun") {
    flags.sampleRecovered = false;
    flags.nextPenalty = config.rescue.waitPenalty;
  }
  if (choice === "study") {
    delta.missionPoints += config.discovery.points;
    delta.life -= config.discovery.lifeCost;
  }
  if (event && event.type === "storm" && (choice === "shelter" || choice === "keepWorking")) {
    const severity = event.severity;
    if (choice === "keepWorking") {
      const line = severity * config.storm.shieldLinePerSeverity;
      if (shieldNow >= line) {
        delta.life -= config.storm.shieldedLifeLoss;
        flags.shieldHeld = true;
      } else {
        delta.life -= severity * config.storm.unshieldedLifePerSeverity;
        delta.shield -= severity * config.storm.unshieldedShieldPerSeverity;
        flags.shieldHeld = false;
      }
    }
    if (choice === "keepWorking" || severity >= config.storm.panelDamageAtSeverity) {
      flags.panelsDamaged = true;
    }
  }
  return { delta, flags };
}

export function checkEnd(state, config) {
  if (state.power <= 0) return { status: "paused", reason: "power" };
  if (state.life <= 0) return { status: "paused", reason: "life" };
  if (state.shield <= 0) return { status: "paused", reason: "shield" };
  if (state.round >= totalRounds(config)) return { status: "complete", reason: null };
  return null;
}

// Order: validate -> jobs -> greenhouse -> drains -> event outcome -> clamp
// -> log the decision -> check the end.
export function resolveRound(state, allocation, config) {
  const available = availablePoints(state, config);
  const error = validateAllocation(allocation, available);
  if (error) return { ok: false, error };

  const next = cloneState(state);
  const before = snapshotBars(next);
  const sheltered = next.eventChoice === "shelter";
  const used = {
    power: sheltered ? 0 : allocation.power,
    life: sheltered ? 0 : allocation.life,
    shield: sheltered ? 0 : allocation.shield,
    science: sheltered ? 0 : allocation.science
  };
  const spent = JOBS.reduce((sum, job) => sum + used[job], 0);
  const unused = available - spent;

  const jobs = applyJobs(next, used, config);
  next.power += jobs.power;
  next.life += jobs.life;
  next.shield += jobs.shield;
  next.missionPoints += jobs.missionPoints;

  const greenhouse = applyGreenhouse(next, config);
  next.power += greenhouse.power;
  next.life += greenhouse.life;

  const drains = applyDrains(next, config);
  next.power += drains.power;
  next.life += drains.life;
  next.shield += drains.shield;

  const outcome = applyEventOutcome(next, next.shield, config);
  next.power += outcome.delta.power;
  next.life += outcome.delta.life;
  next.shield += outcome.delta.shield;
  next.missionPoints += outcome.delta.missionPoints;
  if ("sampleRecovered" in outcome.flags) next.sampleRecovered = outcome.flags.sampleRecovered;
  if (outcome.flags.nextPenalty) next.nextPenalty += outcome.flags.nextPenalty;
  if (outcome.flags.panelsDamaged) {
    next.panelsDamaged = true;
    next.repairQueued = true;
  }

  next.power = clamp(next.power, config.bars.min, config.bars.max);
  next.life = clamp(next.life, config.bars.min, config.bars.max);
  next.shield = clamp(next.shield, config.bars.min, config.bars.max);
  next.missionPoints = Math.max(0, Math.round(next.missionPoints));

  const after = snapshotBars(next);
  next.log.push({
    round: next.round,
    lunarDay: next.lunarDay,
    roundInDay: next.roundInDay,
    isNight: next.isNight,
    allocation: used,
    unused,
    lightsOn: next.lightsOn,
    eventType: next.roundEvent ? next.roundEvent.type : null,
    eventChoice: next.eventChoice,
    severity: next.roundEvent && next.roundEvent.type === "storm" ? next.roundEvent.severity : null,
    before,
    after
  });

  const ending = checkEnd(next, config);
  if (ending) {
    next.status = ending.status;
    next.endReason = ending.reason;
  }

  const result = {
    round: next.round,
    sheltered,
    unused,
    jobs,
    greenhouse,
    drains,
    event: outcome.delta,
    flags: outcome.flags,
    before,
    after,
    change: {
      power: after.power - before.power,
      life: after.life - before.life,
      shield: after.shield - before.shield,
      missionPoints: after.missionPoints - before.missionPoints
    },
    topJob: sheltered ? "shelter" : topJob(used)
  };
  next.lastResult = result;
  return { ok: true, state: next, result };
}

// The job that got the most points this round. Pip drives there.
export function topJob(allocation) {
  let best = null;
  for (const job of JOBS) {
    if (allocation[job] > 0 && (best === null || allocation[job] > allocation[best])) best = job;
  }
  return best;
}

export function lowestBar(state) {
  const order = ["life", "power", "shield"];
  let lowest = order[0];
  for (const bar of order) {
    if (state[bar] < state[lowest]) lowest = bar;
  }
  return lowest;
}
