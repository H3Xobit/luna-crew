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

// The game as a small state machine with an event emitter. It knows nothing
// about the page: data comes in through options, screens listen with on().
//
// Phases: event -> repair -> allocate -> result -> (review -> quiz -> quizDone) -> end
//
// const game = createGame({ seed, stormData, cards, nasaChoice });
// game.on("phase", (state) => render(state));
// game.start();

import { config as defaultConfig, mergeConfig } from "./config.js";
import { createState, cloneState, emptyAllocation } from "./state.js";
import { createRng, subSeed } from "./rng.js";
import { availablePoints, resolveRound, lowestBar } from "./rules.js";
import { roundPosition, scheduleFor, scheduledType, pickStorm, buildEvent, totalRounds } from "./events.js";
import { evaluate as evaluateNasa } from "./nasaChoice.js";
import { createQuiz } from "./quiz.js";

function defaultWait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createGame(options = {}) {
  const config = mergeConfig(defaultConfig, options.config);
  const seed = Number.isFinite(options.seed) ? options.seed >>> 0 : 1;
  const demo = Boolean(options.demo);
  const wait = options.wait || defaultWait;
  const stormData = options.stormData || { events: [], label: { kind: "training", date: null } };
  const stormMode = options.stormMode || "weighted";
  const nasaContent = options.nasaChoice || { lines: [] };
  const schedule = scheduleFor(config, demo);
  const stormRng = createRng(subSeed(seed, "storm"));
  const quiz = createQuiz(options.cards, createRng(subSeed(seed, "quiz")), options.quizRecords || {});
  const handlers = new Map();

  let state = createState(seed, config);
  let queue = [];
  let storm = null;

  function emit(name, payload) {
    for (const handler of handlers.get(name) || []) handler(payload);
  }

  function setPhase(phase) {
    state.phase = phase;
    emit("phase", cloneState(state));
  }

  function fail(error) {
    emit("error", { error });
    return { ok: false, error };
  }

  function nextInQueue() {
    if (queue.length === 0) {
      state.event = null;
      setPhase("allocate");
      return;
    }
    state.event = queue.shift();
    setPhase(state.event.type === "repair" ? "repair" : "event");
  }

  function openRound(round) {
    const position = roundPosition(round, config);
    state.round = round;
    state.lunarDay = position.lunarDay;
    state.roundInDay = position.roundInDay;
    state.isNight = position.isNight;
    state.roundBonus = state.bonusPoints;
    state.bonusPoints = 0;
    state.roundPenalty = state.nextPenalty;
    state.nextPenalty = 0;
    state.reservedPoints = 0;
    state.askedEarth = false;
    state.eventChoice = null;
    state.roundEvent = null;
    state.lastResult = null;
    state.review = null;
    state.quizCard = null;
    state.quizResult = null;

    queue = [];
    if (state.repairQueued) queue.push(buildEvent("repair", config));
    const type = scheduledType(schedule, position.lunarDay, position.roundInDay);
    if (type === "storm") {
      if (!storm) storm = pickStorm(stormRng, stormData, config, stormMode);
      state.storm = storm;
      state.roundEvent = buildEvent("storm", config, storm);
      queue.push(state.roundEvent);
    } else if (type) {
      state.roundEvent = buildEvent(type, config);
      queue.push(state.roundEvent);
    }
    emit("round", cloneState(state));
    nextInQueue();
  }

  function finish() {
    setPhase("end");
    emit("end", game.summary());
  }

  function afterQuiz() {
    if (state.status !== "playing") {
      finish();
      return;
    }
    openRound(state.round + 1);
  }

  const game = {
    config,
    seed,
    demo,
    get state() {
      return cloneState(state);
    },
    on(name, handler) {
      const list = handlers.get(name) || [];
      list.push(handler);
      handlers.set(name, list);
      return () => {
        handlers.set(name, (handlers.get(name) || []).filter((item) => item !== handler));
      };
    },
    available() {
      return availablePoints(state, config);
    },
    start() {
      if (state.round !== 0) return fail("phase");
      openRound(1);
      return { ok: true };
    },
    setLights(on) {
      if (state.phase === "end") return fail("phase");
      state.lightsOn = Boolean(on);
      emit("lights", state.lightsOn);
      return { ok: true };
    },
    chooseEvent(optionId) {
      if (state.phase !== "event" || !state.event) return fail("phase");
      const option = (state.event.options || []).find((item) => item.id === optionId);
      if (!option) return fail("choice");
      if (option.cost > availablePoints(state, config)) return fail("points");
      state.reservedPoints += option.cost;
      state.eventChoice = optionId;
      nextInQueue();
      return { ok: true };
    },
    completeRepair(success) {
      if (state.phase !== "repair") return fail("phase");
      let fixed = false;
      if (success && config.repair.cost <= availablePoints(state, config)) {
        state.reservedPoints += config.repair.cost;
        state.panelsDamaged = false;
        state.repairQueued = false;
        fixed = true;
        state.stats.repairs = (state.stats.repairs || 0) + 1;
      }
      emit("repair", { fixed });
      nextInQueue();
      return { ok: true, fixed };
    },
    // Costs one work point. The answer names the bar that needs help most.
    async askEarth() {
      if (state.phase !== "allocate") return fail("phase");
      if (state.askedEarth) return fail("once");
      if (availablePoints(state, config) < config.askEarth.cost) return fail("points");
      state.reservedPoints += config.askEarth.cost;
      state.askedEarth = true;
      state.stats.askedEarth += 1;
      emit("phase", cloneState(state));
      await wait(config.askEarth.delayMs);
      return { ok: true, bar: lowestBar(state) };
    },
    submit(allocation) {
      if (state.phase !== "allocate") return fail("phase");
      const plan = state.eventChoice === "shelter" ? emptyAllocation() : allocation;
      const outcome = resolveRound(state, plan, config);
      if (!outcome.ok) return fail(outcome.error);
      state = outcome.state;
      emit("resolved", outcome.result);
      setPhase("result");
      return { ok: true, result: outcome.result };
    },
    // Moves on from a screen that has no choice on it.
    next() {
      if (state.phase === "result") {
        if (state.status === "paused") {
          finish();
          return { ok: true };
        }
        if (state.round % config.roundsPerDay === 0) {
          const lines = evaluateNasa(state.log, state.lunarDay, nasaContent, config);
          state.review = { lunarDay: state.lunarDay, lines };
          state.stats.nasaShown += lines.length;
          state.stats.nasaMatched += lines.filter((line) => line.match === true).length;
          setPhase("review");
          return { ok: true };
        }
        openRound(state.round + 1);
        return { ok: true };
      }
      if (state.phase === "review") {
        const card = quiz.draw();
        if (!card) {
          afterQuiz();
          return { ok: true };
        }
        state.quizCard = card;
        state.quizResult = null;
        setPhase("quiz");
        return { ok: true };
      }
      if (state.phase === "quizDone") {
        afterQuiz();
        return { ok: true };
      }
      return fail("phase");
    },
    answerQuiz(optionIndex) {
      if (state.phase !== "quiz") return fail("phase");
      const result = quiz.answer(optionIndex);
      if (!result) return fail("phase");
      state.stats.quizAsked += 1;
      if (result.correct) {
        state.stats.quizCorrect += 1;
        // The bonus only matters when another round follows.
        if (state.status === "playing") state.bonusPoints += config.quiz.bonusPoints;
      }
      state.quizResult = result;
      setPhase("quizDone");
      return { ok: true, ...result };
    },
    quizRecords() {
      return quiz.snapshot();
    },
    summary() {
      const roundsDone = state.log.length;
      const pausedRound = state.status === "paused" ? 1 : 0;
      return {
        status: state.status,
        reason: state.endReason,
        seed,
        demo,
        missionPoints: state.missionPoints,
        roundsPlayed: roundsDone,
        totalRounds: totalRounds(config),
        daysSurvived: Math.floor((roundsDone - pausedRound) / config.roundsPerDay),
        nasaMatched: state.stats.nasaMatched,
        nasaShown: state.stats.nasaShown,
        quizCorrect: state.stats.quizCorrect,
        quizAsked: state.stats.quizAsked,
        sampleRecovered: state.sampleRecovered,
        storm: state.storm ? { ...state.storm } : null,
        bars: { power: state.power, life: state.life, shield: state.shield },
        harvest: state.harvest || null,
        repairs: state.stats.repairs || 0,
        log: state.log.map((row) => ({
          isNight: row.isNight,
          power: row.after.power,
          life: row.after.life,
          shield: row.after.shield,
          eventType: row.eventType,
          eventChoice: row.eventChoice,
          lightsOn: row.lightsOn
        }))
      };
    }
  };

  return game;
}
