// Stars, ranks, badges and the journal live only in localStorage.

const KEY = "luna-crew-progress";

export const RANKS = [
  { id: "cadet", min: 0 },
  { id: "junior", min: 3 },
  { id: "planner", min: 6 },
  { id: "senior", min: 10 },
  { id: "director", min: 14 }
];

export function emptyProgress() {
  return { stars: {}, badges: [], journal: [], bestRank: "cadet" };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    return {
      stars: parsed.stars && typeof parsed.stars === "object" ? parsed.stars : {},
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      journal: Array.isArray(parsed.journal) ? parsed.journal : [],
      bestRank: typeof parsed.bestRank === "string" ? parsed.bestRank : "cadet"
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* private mode */
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* private mode */
  }
  return emptyProgress();
}

export function totalStars(progress) {
  return Object.values(progress.stars || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

export function rankFor(stars) {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (stars >= rank.min) current = rank;
  }
  return current;
}

export function dailySeed(date = new Date()) {
  const key = date.toISOString().slice(0, 10);
  let hash = 0;
  for (const char of key) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return (hash % 900000) + 1000;
}

export function verifiedFactIds(facts) {
  const ids = [];
  if (!facts) return ids;
  for (const fact of facts.values()) {
    if (fact?.status === "verified") ids.push(fact.id);
  }
  return ids;
}

export function isUnlocked(mission, missions, progress) {
  if (!mission || mission.unlock === "start") return true;
  const previous = missions.find((item) => item.id === mission.after);
  if (!previous) return false;
  return (progress.stars?.[previous.id] || 0) >= 1;
}

function learningStar(mission, summary) {
  const goal = mission.star3;
  const log = summary.log || [];
  if (goal === "finish") return summary.status === "complete";
  if (goal === "shelter") return log.some((row) => row.eventChoice === "shelter");
  if (goal === "sample") return summary.sampleRecovered === true;
  if (goal === "nightPower") {
    const nights = log.filter((row) => row.isNight);
    return nights.length > 0 && nights.every((row) => row.power >= 30);
  }
  if (goal === "lights") return log.length > 0 && log.every((row) => row.lightsOn);
  if (goal === "bars") return summary.bars.power > 25 && summary.bars.life > 25 && summary.bars.shield > 25;
  if (goal === "repair") return (summary.repairs || 0) > 0;
  return false;
}

export function starsFor(mission, summary) {
  if (!summary || summary.status !== "complete") return { count: 0, reasons: [] };
  const reasons = ["complete"];
  const barsOk = summary.bars.power > 25 && summary.bars.life > 25 && summary.bars.shield > 25;
  if (barsOk) reasons.push("bars");
  if (learningStar(mission, summary)) reasons.push(mission.star3 || "finish");
  return { count: reasons.length, reasons };
}

function addUnique(list, id) {
  return list.includes(id) ? list : [...list, id];
}

export function awardMission(progress, mission, summary, factIds = []) {
  const earned = starsFor(mission, summary);
  const next = {
    stars: { ...progress.stars },
    badges: [...progress.badges],
    journal: [...progress.journal],
    bestRank: progress.bestRank
  };
  const previous = next.stars[mission.id] || 0;
  if (earned.count > previous) next.stars[mission.id] = earned.count;
  if (earned.count >= 1) {
    for (const id of factIds) {
      if (mission.facts?.includes(id)) next.journal = addUnique(next.journal, id);
    }
  }
  const log = summary.log || [];
  if (log.some((row) => row.eventChoice === "shelter")) next.badges = addUnique(next.badges, "storm");
  if (log.filter((row) => row.isNight).some((row) => row.power >= 30) && earned.count >= 1) next.badges = addUnique(next.badges, "night");
  if (summary.sampleRecovered) next.badges = addUnique(next.badges, "water");
  if (log.length > 0 && log.every((row) => row.lightsOn) && earned.count >= 1) next.badges = addUnique(next.badges, "green");
  if (summary.missionPoints >= 40) next.badges = addUnique(next.badges, "science");
  if (earned.reasons.includes("bars")) next.badges = addUnique(next.badges, "careful");
  if ((summary.repairs || 0) > 0) next.badges = addUnique(next.badges, "fix");
  const rank = rankFor(totalStars(next));
  const rankUp = rank.id !== next.bestRank && RANKS.findIndex((item) => item.id === rank.id) > RANKS.findIndex((item) => item.id === next.bestRank);
  if (rankUp) next.bestRank = rank.id;
  return { progress: next, earned, rankUp, rank };
}
