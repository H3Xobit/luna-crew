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

// Looks up a few studies in NASA's Open Science Data Repository (OSDR) and
// saves their own titles and descriptions to data/osdr.json.
//
//   node scripts/fetch-osdr.mjs
//
// Node 20+, no dependencies. Nothing in the output is written by hand: titles
// and summaries are copied from the API answer.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export const OSDR_SEARCH = "https://osdr.nasa.gov/osdr/data/search";
export const OSDR_STUDY_PAGE = "https://osdr.nasa.gov/bio/repo/data/studies/";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TERMS = ["lunar regolith plants", "Apollo regolith", "bone loss spaceflight", "muscle spaceflight"];
const WANTED = "OSD-476";
const MAX_STUDIES = 5;
const SUMMARY_LIMIT = 700;

function firstSentences(text, limit) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const stop = cut.lastIndexOf(". ");
  return stop > 200 ? cut.slice(0, stop + 1) : cut;
}

// One search hit -> the small record the game keeps. Returns null for hits
// that are not OSDR studies (the search also lists other repositories).
export function normalizeStudy(hit, term) {
  const source = hit?._source;
  if (!source) return null;
  const accession = String(source.Accession || "").trim();
  if (!/^OSD-\d+$/.test(accession)) return null;
  const title = String(source["Study Title"] || "").trim();
  if (!title) return null;
  const organism = Array.isArray(source.organism) ? source.organism.join(", ") : source.organism;
  const study = {
    accession,
    title,
    url: OSDR_STUDY_PAGE + accession,
    summary: firstSentences(source["Study Description"], SUMMARY_LIMIT),
    searchTerm: term
  };
  if (organism) study.organism = String(organism);
  return study;
}

export function parseSearchBody(text, contentType) {
  if (!String(contentType || "").toLowerCase().includes("json")) {
    throw new Error(`OSDR answered with content-type "${contentType || "none"}", not JSON`);
  }
  const data = JSON.parse(text);
  const hits = data?.hits?.hits;
  if (!Array.isArray(hits)) throw new Error("OSDR answer has no hits list");
  return hits;
}

async function search(term) {
  const url = `${OSDR_SEARCH}?term=${encodeURIComponent(term)}&size=10`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(45000)
  });
  if (!response.ok) throw new Error(`"${term}": HTTP ${response.status}`);
  const hits = parseSearchBody(await response.text(), response.headers.get("content-type"));
  console.log(`  "${term}": ${hits.length} hits`);
  return hits;
}

async function run() {
  const file = path.join(ROOT, "data", "osdr.json");
  await mkdir(path.dirname(file), { recursive: true });
  const fetchedAt = new Date().toISOString();
  let output;
  try {
    const picked = [];
    const seen = new Set();
    for (const term of TERMS) {
      const hits = await search(term);
      // Take at most two studies per search term so every topic is represented.
      let taken = 0;
      for (const hit of hits) {
        const study = normalizeStudy(hit, term);
        if (!study || seen.has(study.accession)) continue;
        seen.add(study.accession);
        picked.push(study);
        taken += 1;
        if (taken >= 2) break;
      }
    }
    picked.sort((a, b) => Number(b.accession === WANTED) - Number(a.accession === WANTED));
    const studies = picked.slice(0, MAX_STUDIES);
    output = {
      source: "NASA Open Science Data Repository (OSDR)",
      endpoint: OSDR_SEARCH,
      status: "ok",
      fetchedAt,
      searchTerms: TERMS,
      regolithStudyFound: studies.some((study) => study.accession === WANTED),
      studies
    };
  } catch (error) {
    console.error(`  fetch failed: ${error.message}`);
    output = {
      source: "NASA Open Science Data Repository (OSDR)",
      endpoint: OSDR_SEARCH,
      status: "fetch_failed",
      reason: error.message,
      fetchedAt,
      searchTerms: TERMS,
      regolithStudyFound: false,
      studies: []
    };
  }
  await writeFile(file, JSON.stringify(output, null, 2) + "\n");
  console.log(`  wrote data/osdr.json (${output.status}, ${output.studies.length} studies)`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await run();
