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

// Builds the list for the "Real NASA Data" screen from the data files
// themselves, so the screen always matches what the game really uses.

import { verifiedFacts, radiationReading, regolithStudy } from "./content.js";
import { usableEvents, formatDateUtc, formatDateTimeUtc } from "./storms.js";

function dataset(entry) {
  return { kind: "dataset", ...entry };
}

// status: "used" (in the game now), "planned" (fetched or listed, not shown yet),
// "failed" (the fetch did not work, nothing from it is shown).
export function buildSources({ stormInfo, osdr, radlab, facts }) {
  const list = [];
  const source = stormInfo?.source;
  const latestCount = usableEvents(stormInfo?.latest).length;
  const savedCount = usableEvents(stormInfo?.saved).length;

  list.push(
    dataset({
      id: "donki",
      name: "DONKI (Space Weather Database Of Notifications, Knowledge, Information)",
      agency: "NASA CCMC",
      url: "https://ccmc.gsfc.nasa.gov/tools/DONKI/",
      useKey: "data.use.donki",
      status: source && source.events.length > 0 ? "used" : "failed",
      label: source?.label?.kind ? source.label : null,
      detailKey: "data.detail.donki",
      detailVars: {
        latest: latestCount,
        saved: savedCount,
        savedDate: stormInfo?.saved?.fetchedAt ? formatDateUtc(stormInfo.saved.fetchedAt) : "",
        latestDate: stormInfo?.latest?.fetchedAt ? formatDateTimeUtc(stormInfo.latest.fetchedAt) : ""
      }
    })
  );

  const study = regolithStudy(osdr);
  list.push(
    dataset({
      id: "osdr",
      name: "Open Science Data Repository (OSDR)",
      agency: "NASA",
      url: study ? study.url : "https://osdr.nasa.gov/bio/repo/",
      useKey: "data.use.osdr",
      status: study ? "used" : osdr && osdr.status === "ok" ? "planned" : "failed",
      label: osdr && osdr.status === "ok" ? { kind: "saved", date: formatDateUtc(osdr.fetchedAt) } : null,
      detailKey: study ? "data.detail.osdr" : null,
      detailVars: { title: study ? study.title : "", count: osdr?.studies?.length ?? 0 }
    })
  );

  const reading = radiationReading(radlab);
  list.push(
    dataset({
      id: "radlab",
      name: "RadLab (space radiation readings)",
      agency: "NASA OSDR",
      url: "https://visualization.osdr.nasa.gov/radlab/",
      useKey: "data.use.radlab",
      status: reading ? "used" : "failed",
      label: reading ? { kind: "saved", date: formatDateUtc(radlab.fetchedAt) } : null,
      detailKey: reading ? "data.detail.radlab" : null,
      detailVars: reading
        ? {
            value: reading.doseRate,
            unit: reading.unit,
            instrument: reading.instrument,
            date: formatDateUtc(reading.date)
          }
        : {}
    })
  );

  const seen = new Set();
  for (const fact of verifiedFacts(facts)) {
    const key = fact.source.url;
    if (seen.has(key)) continue;
    seen.add(key);
    const related = verifiedFacts(facts).filter((item) => item.source.url === key);
    list.push({
      kind: "page",
      id: `page-${seen.size}`,
      name: fact.source.name,
      agency: fact.source.agency,
      url: fact.source.url,
      status: "used",
      accessed: fact.source.accessed,
      facts: related.map((item) => item.text),
      partner: fact.source.agency === "Canadian Space Agency"
    });
  }
  return list;
}
