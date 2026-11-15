import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cutsceneLength } from "../js/ui/cutscene.js";

const NEEDED = ["opening", "arrival", "nightfall", "rescue", "stormShelter", "stormWork", "discovery", "greenhouse", "rank", "endingComplete", "endingPaused"];

test("every cutscene is 8 to 20 seconds and has subtitles", async () => {
  const script = JSON.parse(await readFile(new URL("../data/content/cutscenes.json", import.meta.url), "utf8"));
  const en = JSON.parse(await readFile(new URL("../data/i18n/en.json", import.meta.url), "utf8"));
  const ja = JSON.parse(await readFile(new URL("../data/i18n/ja.json", import.meta.url), "utf8"));
  for (const id of NEEDED) {
    const scene = script[id];
    assert.ok(scene, id);
    const ms = cutsceneLength(scene);
    assert.ok(ms >= 8000 && ms <= 20000, `${id} is ${ms}ms`);
    for (const shot of scene.shots) {
      assert.equal(typeof en[shot.line], "string", shot.line);
      assert.equal(typeof ja[shot.line], "string", shot.line);
    }
  }
});
