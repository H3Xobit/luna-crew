# Design decisions

## Classroom first

Three lunar days keep a class period short. Practice mode teaches the panel once. Demo mode moves the storm earlier so a five-minute talk still shows the NASA label.

## Honest data, clear fiction

Storms use saved DONKI events with visible labels. Rescue and discovery stories are marked as made up. Fact chips and Mission Cards always name a checked source. Bar values stay game units so kids do not confuse classroom meters with flight telemetry.

## Safety over punishment

Hitting zero pauses the mission. The crew goes home. The end screen offers one tip and a chance to try again with the same or a new seed.

## Bilingual from the start

UI strings live in `data/i18n/en.json` and `ja.json`. Story, cards and facts carry `{ en, ja }` objects. One button set, two languages.

## No framework

Plain ES modules, static hosting, Web Audio beeps, SVG scene. Easy to fork for a classroom or a GitHub Pages deploy.

## Storms come from one pool

`data/latest.json` and `data/storms.json` are combined. Each event keeps the honest label of the file it came from. Latest wins when the id is in both. Mission of the Day uses only the latest file. Storm Watch uses a level 2 storm. Other missions roll about 50 percent level 2, 35 percent level 3 and 15 percent level 4, and fall back when a level is missing. `?demo=1` with no seed shows the archive's strongest flare. The daily mission seed uses the player's local calendar date, not UTC.

## Campaign saves on this browser only

Missions reuse the same round engine. A mission may change the number of lunar days, which rounds are night, the start bars, and the event list. Full Mission and Challenge keep the normal three-day event list. Progress (stars, badges, journal, rank) is stored in localStorage under `luna-crew-progress`. Reset clears that key. No account and no player name is written there. The name stays in the older player settings key.

Star 1 means the mission was completed. Star 2 means it was completed with Power, Life Support and Shield all above 25. Star 3 is the mission's learning goal (shelter, saved night power, ice sample, lights left on, or simply finishing the first lesson). If several briefing lines could apply, the game still uses the order in the weights section.

## Job weights are different on purpose

Power, Life Support, Shield and Science are not equal. Power is 5 per point in daytime and 1 at night. Damaged panels halve that gain and round down, matching `applyJobs`. Life Support is 4 per point and spends 1 Power for every 2 points. Shield is 4 per point. Science is 10 Mission Points and does not fill a safety bar. A storm does not change the 4. It makes the Shield you already have matter N times more, because the shelter line is N times 20.

When several briefing lines could apply, the game shows the most urgent one: storm, then broken panels, then Life Support under 35, then night, then "plan for the night ahead."

## Balance targets

`npm run simulate` plays many headless games:

- balanced play should win often (at least about 70%)
- all-science should rarely survive (at most about 10%)
- random play should land in the middle

Night power cost (`powerNightExtra`) and storm shield lines were tuned so night and storms matter without making the mission feel unfair.

## Accessibility

Reduce motion, text size, high contrast, focus traps, and icons beside every bar. Sound is optional and synthesized in the browser.
