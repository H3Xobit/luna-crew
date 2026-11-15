# Data sources

The browser never calls NASA APIs directly. Scripts in `scripts/` fetch and save JSON. The game only reads those files.

## Files

Verified facts and Mission Cards, with the page that was checked, are in `data/content/facts.json` and `data/content/cards.json`. A line with `TODO_SOURCE` is not shown. The journal unlocks a fact only after the player meets it in a mission.

| File | Source | Role in play |
| --- | --- | --- |
| `data/latest.json` | NASA DONKI (weekly refresh) | Preferred storm list. Label: **NASA data updated …** |
| `data/storms.json` | NASA DONKI archive | Fallback storm list. Label: **Saved NASA data from …** |
| `data/osdr.json` | NASA OSDR | Regolith plant study for a greenhouse research line |
| `data/radlab.json` | NASA RadLab | One radiation reading on the storm card when present |
| `data/content/facts.json` | Checked agency pages | Sourced fact chips in dialogue |
| `data/content/cards.json` | Checked agency pages | Mission Card quiz |
| `data/content/nasa_choice.json` | Team lines | Planner review after each lunar day |

## Honesty labels

`js/data/storms.js` picks the storm source in this order: latest, then archive, then a training alert. Labels are:

1. **Live NASA data** reserved for a real live feed. This project does not emit it.
2. **NASA data updated {date}** from `latest.json`.
3. **Saved NASA data from {date}** from `storms.json`.
4. **Training alert (not real data)** when no usable events exist.

The Real NASA Data screen builds itself from the same files the game uses, including partner pages such as the Canadian Space Agency toolkit.

## Refresh commands

```bash
npm run data:latest    # write data/latest.json from DONKI
npm run data:archive   # write data/storms.json
npm run data:osdr
npm run data:radlab
```

GitHub Actions can refresh data on a schedule (see `.github/workflows/data.yml`). Pages deploys only from `main` after tests pass.

## Verification rules

A fact or Mission Card is shown only when:

- `status` is `verified`
- the source `url` starts with `https://`
- the source name is not a placeholder like `TODO_SOURCE`

Unverified lines are skipped quietly so the game never invents a citation.
