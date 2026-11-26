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

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cutsceneLength, shotHold } from "../js/ui/cutscene.js";
import { SOUND_NAMES } from "../js/ui/audio.js";

const NEEDED = ["opening", "arrival", "nightfall", "rescue", "stormShelter", "stormWork", "discovery", "greenhouse", "rank", "endingComplete", "endingPaused"];

test("a shot stays up at least as long as its caption", () => {
  const hold = shotHold({ duration: 1000 }, "This caption is long enough to need more than one second on screen.");
  assert.ok(hold > 1000);
  assert.equal(shotHold({ duration: 4000 }, "Hi"), 4000);
});

test("every cutscene is 8 to 30 seconds, has subtitles and uses real sounds", async () => {
  const script = JSON.parse(await readFile(new URL("../data/content/cutscenes.json", import.meta.url), "utf8"));
  const en = JSON.parse(await readFile(new URL("../data/i18n/en.json", import.meta.url), "utf8"));
  const ja = JSON.parse(await readFile(new URL("../data/i18n/ja.json", import.meta.url), "utf8"));
  for (const id of NEEDED) {
    const scene = script[id];
    assert.ok(scene, id);
    const ms = cutsceneLength(scene);
    assert.ok(ms >= 8000 && ms <= 30000, `${id} is ${ms}ms`);
    for (const shot of scene.shots) {
      assert.equal(typeof en[shot.line], "string", shot.line);
      assert.equal(typeof ja[shot.line], "string", shot.line);
      for (const name of [shot.sound, ...(shot.cues || []).map((cue) => cue[1])]) {
        if (name) assert.ok(SOUND_NAMES.includes(name), `${id}: unknown sound ${name}`);
      }
    }
  }
});

test("Pip's droid phrases are short, varied and never empty", async () => {
  const { createAudio } = await import("../js/ui/audio.js");
  const audio = createAudio({ enabled: false });
  for (const mood of ["happy", "excited", "sad", "think", "sleepy"]) {
    const notes = audio.droidNotes(mood, 4);
    assert.ok(notes.length >= 2, mood);
    const end = Math.max(...notes.map((n) => (n.at || 0) + n.d));
    assert.ok(end > 0.2 && end < 3.5, `${mood} lasts ${end}s`);
  }
});
