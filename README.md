# Luna Crew: Moon Base Mission

A junior astronaut mission trainer for kids. You are the Mission Planner for a small Moon base: share work points, keep Power, Life Support and Shield above zero, and learn why Earth is a special home.

Built for the NASA Space Apps Challenge 2026 challenge **Build a Junior Astronaut Mission Trainer**. English and Japanese. Runs in the browser with no install.

## Play

1. Open the site (or run it locally, below).
2. Pick a language, then **Start mission**.
3. Choose a call sign and helmet color.
4. On the Mission Map, play the lessons in order. Full Mission is the three-day game.
5. Share 10 work points each round across Power, Life Support, Shield and Science. Press **?** to see that round's weight.
6. Watch for solar storms, Pip's rescue, and a science discovery. After each lunar day, read a planner review and a Mission Card.

Demo tip: add `?demo=1` to the URL to bring the storm earlier for a short talk.

Sound effects and music are made in the browser with WebAudio (no audio files), and read-aloud uses the device's built-in speech voice.

## Run locally

Needs Node 20+ only for tests and data scripts. Playing uses any static file server.

```bash
npm start
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

```bash
npm test
npm run simulate
```

## What is real NASA data?

Storm dates, flare classes and links come from saved NASA DONKI files in `data/`. Facts and Mission Cards only appear when they have a checked `https` source. Every NASA readout carries an honesty label:

- **NASA data updated …** from `data/latest.json`
- **Saved NASA data from …** from `data/storms.json`
- **Training alert** when no usable events are on disk

This build never claims live NASA data. Bar numbers are game units for learning, not real mission quantities.

## Docs

- [How to play and teach](docs/GAME.md)
- [Data sources and refresh](docs/DATA.md)
- [Design decisions](docs/DECISIONS.md)
- [Challenge submission notes](docs/SUBMISSION.md)

## License

Apache-2.0. Team Maja Madi.
