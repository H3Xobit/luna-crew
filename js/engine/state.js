// Luna Crew
// Copyright 2026 Rishi Jambagi
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

export const JOBS = ["power", "life", "shield", "science"];
export const BARS = ["power", "life", "shield"];

export function emptyAllocation() {
  return { power: 0, life: 0, shield: 0, science: 0 };
}

export function createState(seed, config) {
  return {
    seed,
    round: 0,
    lunarDay: 1,
    roundInDay: 1,
    isNight: false,
    power: config.start.power,
    life: config.start.life,
    shield: config.start.shield,
    missionPoints: config.start.missionPoints,
    // Work point bookkeeping for the open round.
    bonusPoints: 0,
    roundBonus: 0,
    nextPenalty: 0,
    roundPenalty: 0,
    reservedPoints: 0,
    askedEarth: false,
    lightsOn: true,
    panelsDamaged: false,
    repairQueued: false,
    sampleRecovered: null,
    // event: the card waiting for an answer. roundEvent: this round's story event.
    event: null,
    roundEvent: null,
    eventChoice: null,
    phase: "idle",
    status: "playing",
    endReason: null,
    lastResult: null,
    review: null,
    quizCard: null,
    quizResult: null,
    storm: null,
    log: [],
    stats: { quizAsked: 0, quizCorrect: 0, nasaShown: 0, nasaMatched: 0, askedEarth: 0, repairs: 0 }
  };
}

export function cloneState(state) {
  return structuredClone(state);
}

export function snapshotBars(state) {
  return {
    power: state.power,
    life: state.life,
    shield: state.shield,
    missionPoints: state.missionPoints
  };
}
