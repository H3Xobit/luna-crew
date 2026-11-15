// Loads the story, cards, facts and saved NASA files. All paths are relative
// so the game works from any folder (for example GitHub Pages).

const FILES = {
  config: "data/content/config.json",
  story: "data/content/story.json",
  nasaChoice: "data/content/nasa_choice.json",
  cards: "data/content/cards.json",
  facts: "data/content/facts.json",
  cutscenes: "data/content/cutscenes.json",
  osdr: "data/osdr.json",
  radlab: "data/radlab.json"
};

async function readJson(fetchImpl, path) {
  try {
    const response = await fetchImpl(path, { cache: "no-cache" });
    if (!response || !response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// A fact may be shown only when it is marked verified and names a real source.
export function isVerifiedFact(fact) {
  if (!fact || fact.status !== "verified") return false;
  const source = fact.source;
  if (!source || typeof source.url !== "string" || !source.url.startsWith("https://")) return false;
  if (typeof source.name !== "string" || !source.name.trim() || source.name === "TODO_SOURCE") return false;
  if (!fact.text || typeof fact.text.en !== "string" || !fact.text.en.trim()) return false;
  return true;
}

export function verifiedFacts(factsFile) {
  const list = Array.isArray(factsFile?.facts) ? factsFile.facts : [];
  return list.filter(isVerifiedFact);
}

export function factIndex(factsFile) {
  const index = new Map();
  for (const fact of verifiedFacts(factsFile)) index.set(fact.id, fact);
  return index;
}

// Turns a story line into what the dialogue box shows. Returns null when the
// line depends on a fact that is not verified, so the line is skipped.
export function resolveLine(line, facts) {
  if (!line) return null;
  if (!line.fact) return { who: line.who, expr: line.expr, text: line.text, fact: null, target: line.target ?? null };
  const fact = facts.get(line.fact);
  if (!fact) return null;
  return {
    who: line.who,
    expr: line.expr,
    lead: line.lead ?? null,
    text: fact.text,
    fact,
    target: line.target ?? null
  };
}

export function resolveLines(lines, facts) {
  return (Array.isArray(lines) ? lines : [lines])
    .map((line) => resolveLine(line, facts))
    .filter(Boolean);
}

// One real space station reading, or null when the RadLab fetch failed.
export function radiationReading(radlab) {
  if (!radlab || radlab.status !== "ok" || !Array.isArray(radlab.readings)) return null;
  const reading = radlab.readings.find(
    (item) => item && Number.isFinite(item.doseRate) && typeof item.unit === "string" && typeof item.url === "string"
  );
  return reading || null;
}

export function regolithStudy(osdr) {
  if (!osdr || osdr.status !== "ok" || !Array.isArray(osdr.studies)) return null;
  return osdr.studies.find((study) => study.accession === "OSD-476") || null;
}

export async function loadContent(fetchImpl = globalThis.fetch.bind(globalThis)) {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, path]) => [key, await readJson(fetchImpl, path)])
  );
  const content = Object.fromEntries(entries);
  const missing = ["config", "story", "nasaChoice", "cards", "facts"].filter((key) => !content[key]);
  if (missing.length > 0) {
    throw new Error(`Could not load: ${missing.map((key) => FILES[key]).join(", ")}`);
  }
  content.factIndex = factIndex(content.facts);
  return content;
}
