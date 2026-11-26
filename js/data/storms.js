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

// Picks which saved NASA file the game uses and builds its honest label.
// The browser never calls DONKI directly. It only reads the JSON files that
// the scripts in scripts/ wrote.

export const LABEL_KINDS = ["live", "updated", "saved", "training"];

function isUsableEvent(event) {
  return Boolean(
    event &&
      typeof event.id === "string" &&
      (event.type === "FLR" || event.type === "SEP") &&
      typeof event.date === "string" &&
      !Number.isNaN(Date.parse(event.date)) &&
      typeof event.link === "string"
  );
}

export function usableEvents(file) {
  if (!file || file.status !== "ok" || !Array.isArray(file.events)) return [];
  return file.events.filter(isUsableEvent);
}

// "2026-11-14T03:00:02.709Z" -> "2026-11-14 03:00 UTC"
export function formatDateTimeUtc(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown time";
  const text = date.toISOString();
  return `${text.slice(0, 10)} ${text.slice(11, 16)} UTC`;
}

export function formatDateUtc(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return date.toISOString().slice(0, 10);
}

function stamp(file, kind, date) {
  return usableEvents(file).map((event) => ({ ...event, label: { kind, date } }));
}

// One pool. Latest rows win when the same id is in both files, so that
// event keeps the "updated" label. Every other archive row keeps "saved".
export function buildStormPool(latest, saved) {
  const seen = new Set();
  const pool = [];
  const add = (events) => {
    for (const event of events) {
      if (!event?.id || seen.has(event.id)) continue;
      seen.add(event.id);
      pool.push(event);
    }
  };
  if (latest?.status === "ok") add(stamp(latest, "updated", formatDateTimeUtc(latest.fetchedAt)));
  if (saved?.status === "ok") add(stamp(saved, "saved", formatDateUtc(saved.fetchedAt)));
  return pool;
}

function strongestEvent(file, kind, date) {
  const flare = file?.strongestFlare;
  if (!file || file.status !== "ok" || !flare?.id) return null;
  const match = usableEvents(file).find((event) => event.id === flare.id);
  const event = match || {
    id: flare.id,
    type: "FLR",
    date: flare.date,
    classType: flare.classType,
    link: flare.link,
    hasLinkedSEP: false
  };
  if (!isUsableEvent(event)) return null;
  return { ...event, label: { kind, date } };
}

// The playable pool is latest plus the archive. Nothing here is called live.
export function chooseStormSource(latest, saved) {
  const events = buildStormPool(latest, saved);
  const latestEvents = latest?.status === "ok" ? stamp(latest, "updated", formatDateTimeUtc(latest.fetchedAt)) : [];
  const strongest = strongestEvent(saved, "saved", saved?.fetchedAt ? formatDateUtc(saved.fetchedAt) : "") ||
    strongestEvent(latest, "updated", latest?.fetchedAt ? formatDateTimeUtc(latest.fetchedAt) : "");
  if (events.length === 0) {
    return {
      events: [],
      latestEvents: [],
      strongest: null,
      label: { kind: "training", date: null },
      file: null,
      fetchedAt: null
    };
  }
  return {
    events,
    latestEvents,
    strongest,
    label: null,
    file: "pool",
    fetchedAt: latest?.fetchedAt || saved?.fetchedAt || null
  };
}

// The exact English label. Other languages go through labelKey().
export function labelText(label) {
  if (!label || label.kind === "training") return "Training alert (not real data)";
  if (label.kind === "live") return "Live NASA data";
  if (label.kind === "updated") return `NASA data updated ${label.date}`;
  if (label.kind === "saved") return `Saved NASA data from ${label.date}`;
  return "Training alert (not real data)";
}

export function labelKey(label) {
  const kind = label && LABEL_KINDS.includes(label.kind) ? label.kind : "training";
  return { key: `label.${kind}`, vars: { date: label?.date ?? "" } };
}

// Strongest recent flare for the title banner, with the label of its own file.
export function bannerFlare(latest, saved) {
  if (latest && latest.status === "ok" && latest.strongestFlare) {
    return {
      flare: latest.strongestFlare,
      label: { kind: "updated", date: formatDateTimeUtc(latest.fetchedAt) }
    };
  }
  if (saved && saved.status === "ok" && saved.strongestFlare) {
    return {
      flare: saved.strongestFlare,
      label: { kind: "saved", date: formatDateUtc(saved.fetchedAt) }
    };
  }
  return null;
}

async function readJson(fetchImpl, path) {
  try {
    const response = await fetchImpl(path, { cache: "no-cache" });
    if (!response || !response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function loadStormData(fetchImpl = globalThis.fetch.bind(globalThis)) {
  const [latest, saved] = await Promise.all([
    readJson(fetchImpl, "data/latest.json"),
    readJson(fetchImpl, "data/storms.json")
  ]);
  return {
    latest,
    saved,
    source: chooseStormSource(latest, saved),
    banner: bannerFlare(latest, saved)
  };
}
