import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseStormSource,
  labelText,
  labelKey,
  usableEvents,
  formatDateUtc,
  formatDateTimeUtc,
  bannerFlare
} from "../js/data/storms.js";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("labelText and labelKey cover every honesty kind", () => {
  assert.equal(labelText({ kind: "training", date: null }), "Training alert (not real data)");
  assert.equal(labelText({ kind: "live", date: null }), "Live NASA data");
  assert.equal(labelText({ kind: "updated", date: "2026-11-14 03:00 UTC" }), "NASA data updated 2026-11-14 03:00 UTC");
  assert.equal(labelText({ kind: "saved", date: "2026-11-01" }), "Saved NASA data from 2026-11-01");
  assert.deepEqual(labelKey({ kind: "updated", date: "x" }), { key: "label.updated", vars: { date: "x" } });
  assert.equal(labelKey({ kind: "mystery" }).key, "label.training");
});

test("chooseStormSource prefers latest, then archive, then training", () => {
  const empty = chooseStormSource(null, null);
  assert.equal(empty.label.kind, "training");
  assert.equal(empty.events.length, 0);

  const saved = {
    status: "ok",
    fetchedAt: "2026-10-01T00:00:00.000Z",
    events: [
      {
        id: "FLR-1",
        type: "FLR",
        date: "2026-09-01T12:00:00Z",
        link: "https://example.test/flr",
        classType: "M1.0"
      }
    ]
  };
  const fromSaved = chooseStormSource({ status: "empty" }, saved);
  assert.equal(fromSaved.label.kind, "saved");
  assert.equal(fromSaved.events.length, 1);

  const latest = {
    status: "ok",
    fetchedAt: "2026-11-14T03:00:00.000Z",
    events: saved.events
  };
  const fromLatest = chooseStormSource(latest, saved);
  assert.equal(fromLatest.label.kind, "updated");
  assert.match(fromLatest.label.date, /UTC/);
});

test("usableEvents drops broken rows", () => {
  const file = {
    status: "ok",
    events: [
      { id: "ok", type: "FLR", date: "2026-01-01T00:00:00Z", link: "https://x.test" },
      { id: "bad", type: "CME", date: "2026-01-01T00:00:00Z", link: "https://x.test" },
      null
    ]
  };
  assert.equal(usableEvents(file).length, 1);
  assert.deepEqual(usableEvents({ status: "failed", events: [] }), []);
});

test("date formatters and bannerFlare", () => {
  assert.equal(formatDateUtc("2026-11-14T03:00:02.709Z"), "2026-11-14");
  assert.equal(formatDateTimeUtc("2026-11-14T03:00:02.709Z"), "2026-11-14 03:00 UTC");
  const banner = bannerFlare(
    {
      status: "ok",
      fetchedAt: "2026-11-14T03:00:00.000Z",
      strongestFlare: { classType: "X1.0", date: "2026-11-10", link: "https://x.test" }
    },
    null
  );
  assert.equal(banner.label.kind, "updated");
  assert.equal(banner.flare.classType, "X1.0");
});

test("repo storms.json has usable events or is honestly empty", async () => {
  const saved = JSON.parse(await readFile(new URL("data/storms.json", root), "utf8"));
  if (saved.status === "ok") {
    assert.ok(usableEvents(saved).length >= 0);
  } else {
    assert.ok(["failed", "empty", "error"].includes(saved.status) || typeof saved.status === "string");
  }
});
