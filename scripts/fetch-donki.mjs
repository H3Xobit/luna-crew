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

// Fetches solar flare (FLR) and solar energetic particle (SEP) events from
// NASA CCMC DONKI and writes them in the shape the game reads.
//
//   node scripts/fetch-donki.mjs --archive   -> data/storms.json
//   node scripts/fetch-donki.mjs --latest    -> data/latest.json
//
// Node 20+, no dependencies. No API key is needed for this host.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export const DONKI_BASE = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/";
export const SOURCE_NAME = "NASA CCMC DONKI";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FLARE_CLASS = /^[ABCMX]\d+(\.\d+)?$/;
const CLASS_RANK = { A: 1, B: 2, C: 3, M: 4, X: 5 };

// The old DONKI hosts can answer HTTP 200 with an HTML page. Anything that is
// not JSON, or is not a list, counts as a failed fetch.
export function parseDonkiBody(text, contentType) {
  const type = String(contentType || "").toLowerCase();
  if (!type.includes("json")) {
    throw new Error(`DONKI answered with content-type "${contentType || "none"}", not JSON`);
  }
  const body = String(text ?? "").trim();
  if (body === "") return [];
  if (body.startsWith("<")) throw new Error("DONKI answered with an HTML page");
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error("DONKI answer is not valid JSON");
  }
  if (!Array.isArray(data)) throw new Error("DONKI answer is not a list of events");
  return data;
}

function linkedIds(raw) {
  if (!Array.isArray(raw?.linkedEvents)) return [];
  return raw.linkedEvents
    .map((item) => item?.activityID)
    .filter((id) => typeof id === "string" && id.length > 0);
}

export function normalizeFlare(raw, fetchedAt) {
  const linked = linkedIds(raw);
  return {
    id: raw?.flrID,
    activityID: raw?.flrID,
    type: "FLR",
    date: raw?.peakTime || raw?.beginTime,
    classType: raw?.classType,
    linkedEvents: linked,
    hasLinkedSEP: linked.some((id) => id.includes("-SEP-")),
    link: raw?.link,
    fetchedAt,
    source: SOURCE_NAME
  };
}

export function normalizeSep(raw, fetchedAt) {
  return {
    id: raw?.sepID,
    activityID: raw?.sepID,
    type: "SEP",
    date: raw?.eventTime,
    classType: null,
    linkedEvents: linkedIds(raw),
    hasLinkedSEP: false,
    link: raw?.link,
    fetchedAt,
    source: SOURCE_NAME
  };
}

export function isValidEvent(event) {
  if (!event || typeof event !== "object") return false;
  if (typeof event.id !== "string" || event.id.length === 0) return false;
  if (event.type !== "FLR" && event.type !== "SEP") return false;
  if (typeof event.date !== "string" || Number.isNaN(Date.parse(event.date))) return false;
  if (typeof event.link !== "string" || !event.link.startsWith("https://")) return false;
  if (!Array.isArray(event.linkedEvents)) return false;
  if (event.type === "FLR") {
    if (typeof event.classType !== "string" || !FLARE_CLASS.test(event.classType)) return false;
  }
  return true;
}

export function isGameplayEvent(event) {
  if (event.type === "SEP") return true;
  return event.type === "FLR" && /^[MX]/.test(event.classType);
}

export function flareStrength(classType) {
  const match = /^([ABCMX])(\d+(?:\.\d+)?)$/.exec(String(classType || ""));
  if (!match) return 0;
  return CLASS_RANK[match[1]] * 1000 + Number(match[2]);
}

// Turns raw FLR and SEP lists into the file the game reads.
export function buildDataset({ flares, seps, fetchedAt, mode, ranges }) {
  const normalized = [
    ...flares.map((raw) => normalizeFlare(raw, fetchedAt)),
    ...seps.map((raw) => normalizeSep(raw, fetchedAt))
  ];
  const valid = normalized.filter(isValidEvent);

  const seen = new Set();
  const unique = [];
  for (const event of valid) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    unique.push(event);
  }

  // A particle event often names its flare, even when the flare does not name it back.
  const flaresWithParticles = new Set();
  for (const event of unique) {
    if (event.type !== "SEP") continue;
    for (const id of event.linkedEvents) flaresWithParticles.add(id);
  }
  for (const event of unique) {
    if (event.type === "FLR" && flaresWithParticles.has(event.id)) event.hasLinkedSEP = true;
  }

  const allFlares = unique.filter((event) => event.type === "FLR");
  let strongest = null;
  for (const flare of allFlares) {
    if (!strongest || flareStrength(flare.classType) > flareStrength(strongest.classType)) {
      strongest = flare;
    }
  }

  const events = unique
    .filter(isGameplayEvent)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  return {
    source: SOURCE_NAME,
    endpoint: DONKI_BASE,
    mode,
    status: "ok",
    fetchedAt,
    ranges,
    counts: {
      received: normalized.length,
      valid: valid.length,
      dropped: normalized.length - valid.length,
      flaresKept: events.filter((event) => event.type === "FLR").length,
      sepKept: events.filter((event) => event.type === "SEP").length
    },
    strongestFlare: strongest
      ? { id: strongest.id, date: strongest.date, classType: strongest.classType, link: strongest.link }
      : null,
    events
  };
}

export function failedDataset(mode, ranges, reason) {
  return {
    source: SOURCE_NAME,
    endpoint: DONKI_BASE,
    mode,
    status: "fetch_failed",
    reason: String(reason),
    fetchedAt: new Date().toISOString(),
    ranges,
    counts: { received: 0, valid: 0, dropped: 0, flaresKept: 0, sepKept: 0 },
    strongestFlare: null,
    events: []
  };
}

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

async function fetchType(type, range) {
  const url = `${DONKI_BASE}${type}?startDate=${range.start}&endDate=${range.end}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(45000)
  });
  if (!response.ok) throw new Error(`${type} ${range.start}..${range.end}: HTTP ${response.status}`);
  const text = await response.text();
  const list = parseDonkiBody(text, response.headers.get("content-type"));
  console.log(`  ${type} ${range.start}..${range.end}: ${list.length} records`);
  return list;
}

async function readExisting(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

async function run(mode) {
  const now = new Date();
  const ranges =
    mode === "archive"
      ? [
          { start: "2024-05-01", end: "2024-05-31" },
          { start: ymd(daysAgo(60, now)), end: ymd(now) }
        ]
      : [{ start: ymd(daysAgo(7, now)), end: ymd(now) }];
  const file = path.join(ROOT, "data", mode === "archive" ? "storms.json" : "latest.json");
  await mkdir(path.dirname(file), { recursive: true });

  console.log(`DONKI ${mode}: ${ranges.map((r) => `${r.start}..${r.end}`).join(", ")}`);
  let dataset;
  try {
    const flares = [];
    const seps = [];
    for (const range of ranges) {
      flares.push(...(await fetchType("FLR", range)));
      seps.push(...(await fetchType("SEP", range)));
    }
    dataset = buildDataset({ flares, seps, fetchedAt: now.toISOString(), mode, ranges });
    console.log(
      `  kept ${dataset.counts.flaresKept} M/X flares and ${dataset.counts.sepKept} SEP events, ` +
        `dropped ${dataset.counts.dropped} invalid`
    );
  } catch (error) {
    console.error(`  fetch failed: ${error.message}`);
    const existing = await readExisting(file);
    if (existing && existing.status === "ok" && Array.isArray(existing.events) && existing.events.length > 0) {
      console.error(`  keeping the existing ${path.basename(file)} from ${existing.fetchedAt}`);
      return;
    }
    dataset = failedDataset(mode, ranges, error.message);
  }
  await writeFile(file, JSON.stringify(dataset, null, 2) + "\n");
  console.log(`  wrote ${path.relative(ROOT, file)} (${dataset.status}, ${dataset.events.length} events)`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const mode = process.argv.includes("--archive") ? "archive" : process.argv.includes("--latest") ? "latest" : null;
  if (!mode) {
    console.error("Usage: node scripts/fetch-donki.mjs --archive | --latest");
    process.exit(2);
  }
  await run(mode);
}
