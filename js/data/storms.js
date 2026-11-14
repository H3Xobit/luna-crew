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

// Order: latest.json, then storms.json, then the training alert.
// A file can never be called live: nothing here returns the "live" kind.
export function chooseStormSource(latest, saved) {
  const fresh = usableEvents(latest);
  if (fresh.length > 0) {
    return {
      events: fresh,
      label: { kind: "updated", date: formatDateTimeUtc(latest.fetchedAt) },
      file: "data/latest.json",
      fetchedAt: latest.fetchedAt
    };
  }
  const archive = usableEvents(saved);
  if (archive.length > 0) {
    return {
      events: archive,
      label: { kind: "saved", date: formatDateUtc(saved.fetchedAt) },
      file: "data/storms.json",
      fetchedAt: saved.fetchedAt
    };
  }
  return { events: [], label: { kind: "training", date: null }, file: null, fetchedAt: null };
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
