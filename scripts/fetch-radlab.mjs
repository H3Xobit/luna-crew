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

// Fetches a small sample of real radiation dose-rate readings from the
// International Space Station through the NASA OSDR RadLab data API and saves
// them to data/radlab.json.
//
//   node scripts/fetch-radlab.mjs
//
// API guide: https://visualization.osdr.nasa.gov/radlab/gui/data-api/
// The guide gives the unit of absorbed_dose_rate as micrograys per hour.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

export const RADLAB_API = "https://visualization.osdr.nasa.gov/radlab/api/";
export const RADLAB_GUIDE = "https://visualization.osdr.nasa.gov/radlab/gui/data-api/";
export const DOSE_UNIT = "\u03bcGy/hour";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_READINGS = 6;

const QUERY =
  "spacecraft=ISS&instrument_id=DosTel1" +
  "&timestamp%3E=2022-04-01T23%3A00&timestamp%3C2022-04-01T23%3A30" +
  "&absorbed_dose_rate&format=json";

// The API answers with a table: { columns: [...], data: [[...], ...] }.
// A plain list of row objects is accepted too.
function toRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.columns) && Array.isArray(data?.data)) {
    return data.data.map((values) => {
      const row = {};
      data.columns.forEach((name, index) => {
        row[name] = values[index];
      });
      return row;
    });
  }
  return null;
}

// Returns clean readings. Rows without a number are dropped.
export function parseReadings(text, contentType, url) {
  if (!String(contentType || "").toLowerCase().includes("json")) {
    throw new Error(`RadLab answered with content-type "${contentType || "none"}", not JSON`);
  }
  const rows = toRows(JSON.parse(text));
  if (!rows) throw new Error("RadLab answer has no list of readings");
  const readings = [];
  for (const row of rows) {
    const rate = Number(row?.absorbed_dose_rate);
    const stamp = row?.timestamp;
    const instrument = row?.instrument_id;
    if (!Number.isFinite(rate) || typeof instrument !== "string") continue;
    const date = typeof stamp === "number" ? new Date(stamp * 1000) : new Date(`${stamp}Z`.replace("ZZ", "Z"));
    if (Number.isNaN(date.getTime())) continue;
    readings.push({
      instrument,
      spacecraft: row.spacecraft || "ISS",
      date: date.toISOString(),
      doseRate: Math.round(rate * 1000) / 1000,
      unit: DOSE_UNIT,
      url
    });
  }
  return readings;
}

async function run() {
  const file = path.join(ROOT, "data", "radlab.json");
  await mkdir(path.dirname(file), { recursive: true });
  const fetchedAt = new Date().toISOString();
  const url = `${RADLAB_API}?${QUERY}`;
  let output;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const readings = parseReadings(await response.text(), response.headers.get("content-type"), url);
    if (readings.length === 0) throw new Error("no usable readings in the answer");
    console.log(`  RadLab: ${readings.length} readings`);
    output = {
      source: "NASA OSDR RadLab",
      endpoint: RADLAB_API,
      guide: RADLAB_GUIDE,
      status: "ok",
      fetchedAt,
      note: "Absorbed dose rate measured by the DosTel1 instrument on the International Space Station.",
      readings: readings.slice(0, MAX_READINGS)
    };
  } catch (error) {
    console.error(`  fetch failed: ${error.message}`);
    output = {
      source: "NASA OSDR RadLab",
      endpoint: RADLAB_API,
      guide: RADLAB_GUIDE,
      status: "fetch_failed",
      reason: error.message,
      fetchedAt,
      readings: []
    };
  }
  await writeFile(file, JSON.stringify(output, null, 2) + "\n");
  console.log(`  wrote data/radlab.json (${output.status}, ${output.readings.length} readings)`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await run();
