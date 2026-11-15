# Challenge submission notes

**Challenge:** NASA Space Apps Challenge 2026, Challenge 03: Build a Junior Astronaut Mission Trainer
**Project:** Luna Crew: Moon Base Mission
**Team:** Maja Madi
**Languages:** English, Japanese

## High-Level Summary

Kids plan a small Moon base, one work-point choice at a time. The jobs do not weigh the same: Power is strong in the day and weak at night, Life Support makes air and water but spends power, Shield matters more when a saved NASA storm arrives, and Science earns learning points without filling the safety bars. If a bar hits zero, the crew goes home safe.

## Detailed Description

The game is a static page. English and Japanese. A mission map unlocks eight lessons, from a one-day tutorial to the full three-day mission, a daily storm seed, and a harder challenge. Stars, ranks and a science journal stay in the browser. Cutscenes can be skipped. Reduced motion shows still frames. Every shown fact has a checked https source. Storms are labeled updated, saved, or training. This build never says the data is live.

## NASA Data

- DONKI flares and particle events in `data/latest.json` and `data/storms.json` drive the storm card, including the date and class when the event is real.
- OSDR study OSD-476 (plants in Apollo lunar soil) is saved in `data/osdr.json` and supports the greenhouse fact.
- RadLab: one ISS dose-rate reading is saved in `data/radlab.json` and can appear on the storm card when the file is usable.

## Space Agency Partner Data

The Canadian Space Agency food-production toolkit is a checked partner page behind the classroom food fact. It is marked Partner on the Real NASA Data screen.

## References

Source links live next to each verified fact and Mission Card in `data/content/facts.json` and `data/content/cards.json`, and on the Real NASA Data screen.

## 30-second demo

Open `?demo=1`. Start, pick a call sign, then open Full Mission only if it is unlocked, or play First Light and point at the briefing line and a Why? button. For the storm, use Storm Watch or `?demo=1` on a fresh full run from the end screen's same seed after unlocking. Show the storm card date, the NASA's Choice review, and a rank-up if stars cross a rank.

## One-sentence pitch

Kids plan a Moon base for three lunar days, meet a solar storm built from saved NASA data, and see why Earth is the best base we will ever have.

## Judging rubric

### Impact

Teachers can run a full mission in one short class block. Practice mode, EN/JA toggle, demo URL and a teachers page lower the barrier. Kids leave with a concrete idea: on the Moon, air, water and power take work that Earth gives us every day.

### Creativity

Anime-inspired crew (Commander Nova, Dr. Sprout, Pip the rover) in a visual-novel style, with an interactive SVG base that reacts to night, lights, dirt shield and storms. Story choices sit beside sourced science without mixing the two.

### How the jobs are weighted

The jobs are not equal. Power is 5 per point in daytime and 1 at night (half of that, rounded down, if panels are damaged). Life Support is 4 per point and costs 1 Power for every 2 points. Shield is 4 per point, and a storm of level N needs N times 20 Shield. Science is 10 Mission Points and does not fill a safety bar. A Why? button, a one-line briefing, and the teachers table all read these same numbers.

### Validity

DONKI storms, OSDR plant research and RadLab readings are saved in-repo. Honesty labels say whether data is updated, saved or training. Facts and quiz cards require verified https sources. Game meters are labeled as classroom units.

### Relevance

Matches Challenge 03: a junior astronaut mission trainer about living away from Earth, life support (ECLSS and water recycling facts), power across lunar night, and space weather decisions. Aligns with Japanese classroom materials that stress careful, sourced science for kids.

### Presentation

Static SPA, works on phone and laptop, clear HUD, large buttons, optional sound and reduce-motion. README and `docs/` explain play, data honesty and teacher use. No install beyond a browser.

## Demo script (about 5 minutes)

1. Open with `?demo=1` and Japanese or English.
2. Show the title banner and Real NASA Data screen (labels).
3. Start with practice off if time is tight, or skip practice after one tip.
4. Play until the storm. Point at the data chip and DONKI link.
5. Finish a lunar day: planner review + Mission Card with source.
6. End on the closing line about Earth as home.

## Links to include in the submission form

- Live demo URL (GitHub Pages or published app)
- This repository
- `docs/DATA.md` for source honesty
- `docs/GAME.md` for teachers

## What we are proud of

Kids can see the difference between a made-up story beat and a real NASA citation in the same session, and still have fun driving Pip across the base.
