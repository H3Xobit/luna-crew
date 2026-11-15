import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cutsceneLength, shotHold } from "../js/ui/cutscene.js";

const NEEDED = ["opening", "arrival", "nightfall", "rescue", "stormShelter", "stormWork", "discovery", "greenhouse", "rank", "endingComplete", "endingPaused"];

test("a shot stays up at least as long as its caption", () => {
  const hold = shotHold({ duration: 1000 }, "This caption is long enough to need more than one second on screen.");
  assert.ok(hold > 1000);
  assert.equal(shotHold({ duration: 4000 }, "Hi"), 4000);
});

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
