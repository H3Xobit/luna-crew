// Wires the engine to the page: title, setup, play loop, data and settings.

import { createGame, forecastRound, parseSeed, randomSeed, topJob, config as engineConfig, mergeConfig } from "./engine/index.js";
import { loadContent, resolveLines, radiationReading, regolithStudy } from "./data/content.js";
import { loadStormData } from "./data/storms.js";
import { buildSources } from "./data/sources.js";
import { createI18n, loadDictionaries, detectLanguage } from "./ui/i18n.js";
import { $, clear, h, setNewTabNote, sleep } from "./ui/dom.js";
import { createAudio } from "./ui/audio.js";
import { createModals, rescueCard, discoveryCard, stormCard, resultCard, reviewCard } from "./ui/modals.js";
import { playCutscene } from "./ui/cutscene.js";
import { createDialogue } from "./ui/dialogue.js";
import { createHud, LOW_BAR } from "./ui/hud.js";
import { createJobsPanel, emptyPlan } from "./ui/jobs.js";
import { createScene, introArt } from "./ui/scene.js";
import { runRepair } from "./ui/repair.js";
import { askQuiz, showQuizAnswer } from "./ui/quizView.js";
import { renderTitle, renderSetup, renderMap, openJournal, openDataScreen, openTeachers, openSettings } from "./ui/screens.js";
import { awardMission, loadProgress, resetProgress, saveProgress, verifiedFactIds } from "./ui/progress.js";
import { renderEnd } from "./ui/endScreen.js";
import { portrait, playerBadge } from "./ui/characters.js";

const SETTINGS_KEY = "luna-crew-settings";
const PLAYER_KEY = "luna-crew-player";

const DEFAULT_SETTINGS = {
  lang: "en",
  sound: true,
  reduceMotion: false,
  highContrast: false,
  textSize: "normal"
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return structuredClone(fallback);
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function queryFlag(name) {
  return new URLSearchParams(location.search).get(name);
}

function seedFromUrl() {
  const raw = queryFlag("seed");
  if (raw === null || raw === "") return null;
  const parsed = parseSeed(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

async function boot() {
  const app = $("#app");
  const screen = $("#screen");
  const play = $("#play");
  const sceneRoot = $("#scene");
  const hudRoot = $("#hud");
  const jobsRoot = $("#jobs");
  const crewRail = $("#crew-rail");
  const dialogueRoot = $("#dialogue");
  const modalRoot = $("#modals");
  const bootNote = $("#boot-note");

  const dictionaries = await loadDictionaries();
  const content = await loadContent();
  const stormInfo = await loadStormData();
  const sources = buildSources({
    stormInfo,
    osdr: content.osdr,
    radlab: content.radlab,
    facts: content.facts
  });

  const stored = readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  const startLang = detectLanguage(location.search, stored.lang, navigator.language);
  const i18n = createI18n(dictionaries, startLang);
  const settings = { ...DEFAULT_SETTINGS, ...stored, lang: startLang };
  const audio = createAudio({ enabled: settings.sound });
  const modals = createModals(modalRoot, { i18n, audio });

  let player = readJson(PLAYER_KEY, {
    name: "",
    helmet: content.config.helmetColors[0],
    practice: true
  });
  let game = null;
  let hud = null;
  let jobs = null;
  let scene = null;
  let dialogue = null;
  let busy = false;
  let lastSeed = null;
  let forceSeed = seedFromUrl();
  let sawNight = false;
  let sawGreenhouse = false;
  let progress = loadProgress();
  let currentMission = null;
  const demo = queryFlag("demo") === "1";

  async function cut(id) {
    const host = document.getElementById("app");
    if (!host || !content.cutscenes) return;
    await playCutscene(host, {
      id,
      script: content.cutscenes,
      i18n,
      audio,
      reduced: settings.reduceMotion,
      nameOf
    });
  }

  const nameOf = (who) => {
    if (who === "player") return player.name || i18n.pick(content.config.defaultPlayerName);
    const entry = content.config.characters?.[who];
    return entry ? i18n.pick(entry.short || entry.name) : who;
  };

  const storyVars = () => ({
    player: nameOf("player"),
    nova: nameOf("nova"),
    sprout: nameOf("sprout"),
    pip: nameOf("pip"),
    n: game?.state?.lunarDay ?? 1
  });

  function applySettings() {
    document.documentElement.lang = i18n.lang;
    document.documentElement.dataset.motion = settings.reduceMotion ? "reduced" : "full";
    document.documentElement.dataset.contrast = settings.highContrast ? "high" : "normal";
    document.documentElement.dataset.text = settings.textSize;
    audio.setEnabled(settings.sound);
    setNewTabNote(i18n.t("ui.newTab"));
    writeJson(SETTINGS_KEY, settings);
    document.title = i18n.pick(content.config.title);
  }

  function paintCrewRail(state) {
    clear(crewRail).append(
      h("div", { class: "crew-rail-inner" }, [
        h("span", { html: portrait("nova", "neutral", { title: nameOf("nova") }) }),
        h("span", { html: portrait("sprout", state?.lightsOn ? "happy" : "worried", { title: nameOf("sprout") }) }),
        h("span", { html: portrait("pip", "happy", { title: nameOf("pip") }) }),
        h("span", { html: playerBadge(player.helmet, { title: nameOf("player") }) })
      ])
    );
  }

  function showScreen(mode) {
    play.hidden = mode !== "play";
    screen.hidden = mode === "play";
    app.dataset.mode = mode;
  }

  function lines(raw) {
    return resolveLines(raw, content.factIndex);
  }

  async function say(raw, opts = {}) {
    return dialogue.say(lines(raw), { vars: { ...storyVars(), ...(opts.vars || {}) }, skippable: opts.skippable });
  }

  function playConfig() {
    return game?.config || mergeConfig(engineConfig, content.config.overrides || {});
  }

  function openData() {
    audio.unlock();
    return openDataScreen(modals, { i18n, sources });
  }

  async function showTeachers() {
    audio.unlock();
    await openTeachers(modals, { i18n, facts: content.factIndex, config: playConfig(), missions: content.missions?.missions || [] });
  }

  async function showSettings() {
    audio.unlock();
    let again = true;
    while (again) {
      const result = await openSettings(modals, {
        i18n,
        settings,
        onChange: (patch) => {
          Object.assign(settings, patch);
          if (patch.lang) i18n.setLang(patch.lang);
          applySettings();
        }
      });
      again = result === "changed";
      if (again && app.dataset.mode === "title") showTitle();
      if (again && app.dataset.mode === "setup") showSetup();
    }
  }

  function showTitle() {
    showScreen("title");
    renderTitle(screen, {
      i18n,
      content,
      stormInfo,
      demo,
      nameOf,
      onStart: () => {
        audio.unlock();
        audio.play("tap");
        showSetup();
      },
      onData: () => openData(),
      onTeachers: () => showTeachers(),
      onSettings: () => showSettings(),
      onLang: (code) => {
        settings.lang = code;
        i18n.setLang(code);
        applySettings();
        showTitle();
      }
    });
  }

  function showSetup() {
    showScreen("setup");
    renderSetup(screen, {
      i18n,
      content,
      player,
      onBack: () => showTitle(),
      onBegin: (next) => {
        player = { ...player, ...next };
        writeJson(PLAYER_KEY, player);
        audio.unlock();
        audio.play("go");
        if (content.missions?.missions?.length) showMap();
        else startMission({ practice: player.practice, seed: forceSeed ?? randomSeed() });
      }
    });
  }

  function wirePlayUi(config) {
    scene = createScene(sceneRoot);
    hud = createHud(hudRoot, { i18n, config });
    jobs = createJobsPanel(jobsRoot, {
      i18n,
      audio,
      config,
      facts: content.factIndex,
      onChange: (plan) => {
        if (!game || busy) return;
        const state = game.state;
        if (state.phase !== "allocate") {
          hud.forecast(null);
          return;
        }
        hud.forecast(forecastRound(state, plan, game.config));
        const spot = state.eventChoice === "shelter" ? "shelter" : topJob(plan) || "idle";
        scene.movePip(spot);
      },
      onLights: (on) => {
        game.setLights(on);
        refreshPlay();
      },
      onAsk: () => askEarth(),
      onGo: (plan) => submitPlan(plan)
    });
    dialogue = createDialogue(dialogueRoot, { i18n, audio, nameOf });
    paintCrewRail(null);
  }

  function refreshPlay() {
    if (!game || !hud || !jobs || !scene) return;
    const state = game.state;
    hud.render(state);
    const stormLine =
      state.event?.type === "storm"
        ? state.event.shieldLine
        : state.roundEvent?.type === "storm"
          ? state.roundEvent.shieldLine
          : null;
    hud.shieldLine(stormLine);
    jobs.render(state, game.available(), { reset: false });
    scene.update({
      isNight: state.isNight,
      lightsOn: state.lightsOn,
      panelsDamaged: state.panelsDamaged,
      storm: state.phase === "event" && state.event?.type === "storm",
      sheltered: state.eventChoice === "shelter",
      power: state.power,
      shield: state.shield
    });
    paintCrewRail(state);
  }

  async function runIntro() {
    showScreen("play");
    if (!dialogue) dialogue = createDialogue(dialogueRoot, { i18n, audio, nameOf });
    play.classList.add("is-intro");
    for (const panel of content.story.intro) {
      clear(sceneRoot).append(h("div", { class: "intro-panel", html: introArt(panel.art) }));
      await say(panel.lines, { skippable: true });
    }
    play.classList.remove("is-intro");
  }

  function showMap() {
    showScreen("title");
    renderMap(screen, {
      i18n,
      missions: content.missions?.missions || [],
      progress,
      demo,
      onPlay: (mission, seed) => {
        currentMission = mission;
        const chosen = Number.isFinite(seed) && seed > 0 ? seed : randomSeed();
        startMission({ practice: false, seed: chosen, skipIntro: true, mission });
      },
      onJournal: () => openJournal(modals, { i18n, facts: content.factIndex, progress }),
      onReset: () => {
        progress = resetProgress();
        showMap();
      },
      onHome: () => showTitle()
    });
  }

  async function startMission({ practice, seed, skipIntro = false, mission = null }) {
    busy = true;
    lastSeed = seed;
    forceSeed = null;
    sawNight = false;
    sawGreenhouse = false;
    if (!skipIntro) {
      await runIntro();
      await cut("opening");
      await cut("arrival");
    } else showScreen("play");

    const stormData = {
      events: stormInfo.source.events,
      label: stormInfo.source.label
    };
    const overrides = { ...(content.config.overrides || {}) };
    if (mission) {
      if (mission.lunarDays) overrides.lunarDays = mission.lunarDays;
      if (mission.nightRounds) overrides.nightRounds = mission.nightRounds;
      if (mission.start) overrides.start = mission.start;
      if (Array.isArray(mission.events)) overrides.events = mission.events;
    }
    game = createGame({
      seed,
      demo: demo && (!mission || mission.id === "full-mission"),
      practice: Boolean(practice),
      stormData,
      cards: content.cards.cards,
      nasaChoice: content.nasaChoice,
      config: overrides
    });
    wirePlayUi(game.config);
    game.start();
    busy = false;
    await handlePhase();
  }

  async function handlePhase() {
    if (!game || busy) return;
    busy = true;
    jobs.lock(true);
    try {
      let guard = 0;
      while (game && guard < 40) {
        guard += 1;
        const state = game.state;
        const phase = state.phase;
        refreshPlay();

        if (phase === "event") {
          await runEvent(state);
          continue;
        }
        if (phase === "repair") {
          await runRepairPhase(state);
          continue;
        }
        if (phase === "allocate") {
          await openAllocate(state);
          return;
        }
        if (phase === "result") {
          await showResult(state);
          game.next();
          continue;
        }
        if (phase === "review") {
          await showReview(state);
          game.next();
          continue;
        }
        if (phase === "quiz") {
          await showQuiz(state);
          continue;
        }
        if (phase === "quizDone") {
          await showQuizDone(state);
          game.next();
          continue;
        }
        if (phase === "practiceDone") {
          await say(content.story.practiceDone, { skippable: true });
          busy = false;
          await startMission({ practice: false, seed: lastSeed, skipIntro: true });
          return;
        }
        if (phase === "end") {
          const summary = game.summary();
          if (currentMission) {
            const result = awardMission(progress, currentMission, summary, verifiedFactIds(content.factIndex));
            progress = result.progress;
            saveProgress(progress);
            summary.starReasons = result.earned.reasons;
            summary.starCount = result.earned.count;
            if (result.rankUp) await cut("rank");
          }
          await cut(summary.status === "complete" ? "endingComplete" : "endingPaused");
          showEnd(summary);
          return;
        }
        break;
      }
    } finally {
      busy = false;
    }
  }

  async function runEvent(state) {
    const event = state.event;
    if (event.type === "rescue") {
      await cut("rescue");
      scene.movePip("crater");
      await say(content.story.rescue.intro, { skippable: true });
      const choice = await rescueCard(modals, { i18n, event, available: game.available() });
      game.chooseEvent(choice);
      await say(content.story.rescue[choice] || [], { skippable: true });
      return;
    }
    if (event.type === "discovery") {
      await cut("discovery");
      scene.movePip("crater");
      await say(content.story.discovery.intro, { skippable: true });
      const choice = await discoveryCard(modals, { i18n, event, available: game.available() });
      game.chooseEvent(choice);
      await say(content.story.discovery[choice] || [], { skippable: true });
      return;
    }
    if (event.type === "storm") {
      audio.play("alarm");
      scene.update({ ...game.state, storm: true });
      await say(content.story.storm.intro, { skippable: true });
      const reading = radiationReading(content.radlab);
      const choice = await stormCard(modals, {
        i18n,
        storm: event,
        shield: state.shield,
        config: game.config,
        facts: content.factIndex,
        reading
      });
      game.chooseEvent(choice);
      await cut(choice === "shelter" ? "stormShelter" : "stormWork");
      if (choice === "shelter") await say(content.story.storm.shelter, { skippable: true });
      return;
    }
    game.chooseEvent(event.options?.[0]?.id);
  }

  async function runRepairPhase() {
    await say(content.story.repair.intro, { skippable: true });
    const ok = await runRepair(modals, {
      i18n,
      audio,
      hotspots: game.config.repair.hotspots,
      timeLimitMs: game.config.repair.timeLimitMs
    });
    const result = game.completeRepair(ok);
    if (result.fixed) {
      scene.flashRepair();
      audio.play("good");
      await say(content.story.repair.success, { skippable: true });
    } else {
      audio.play("oops");
      await say(content.story.repair.fail, { skippable: true });
    }
  }

  async function openAllocate(state) {
    jobs.lock(false);
    jobs.render(state, game.available(), { reset: true });
    hud.forecast(forecastRound(state, emptyPlan(), game.config));
    scene.movePip(state.eventChoice === "shelter" ? "shelter" : "idle");
    if (state.isNight && state.lunarDay === 1 && !sawNight) {
      sawNight = true;
      await cut("nightfall");
    }
    if (!sawGreenhouse && state.lightsOn && state.round === 2 && content.factIndex.get("regolith_plants")?.status === "verified") {
      sawGreenhouse = true;
      await cut("greenhouse");
    }

    if (state.eventChoice === "shelter") {
      await say([content.story.shelterHint], { skippable: true });
    } else if (game.practice && state.round === 1) {
      await say(content.story.tutorial, { skippable: true });
    } else if (!game.practice) {
      if (state.round === 1) await say(content.story.missionStart, { skippable: true });
      const tip = content.story.roundTips?.[String(state.round)];
      if (tip) await say([tip], { skippable: true });
      if (state.round === 2 && regolithStudy(content.osdr)) {
        await say(content.story.research, { skippable: true });
      }
    }
    jobs.lock(false);
    refreshPlay();
  }

  async function askEarth() {
    if (!game || busy || game.state.phase !== "allocate") return;
    audio.play("radio");
    jobs.lock(true);
    const result = await game.askEarth();
    jobs.lock(false);
    if (!result.ok) {
      audio.play("blocked");
      refreshPlay();
      return;
    }
    const tip = content.story.askEarth[result.bar];
    if (tip) await say([tip], { skippable: false });
    jobs.render(game.state, game.available(), { reset: false });
    refreshPlay();
  }

  async function submitPlan(plan) {
    if (!game || busy || game.state.phase !== "allocate") return;
    audio.play("go");
    busy = true;
    jobs.lock(true);
    const beforeNight = game.state.isNight;
    const result = game.submit(plan);
    if (!result.ok) {
      audio.play("blocked");
      busy = false;
      jobs.lock(false);
      return;
    }
    const spot = result.result.topJob || "idle";
    scene.movePip(spot);
    await sleep(settings.reduceMotion ? 120 : 480);
    if (game.state.isNight !== beforeNight) audio.play(game.state.isNight ? "night" : "day");
    hud.showChange(result.result.change);
    busy = false;
    await handlePhase();
  }

  function resultComment(state, result) {
    if (result.unused > 0) return i18n.pick(content.story.result.unused.text, { ...storyVars(), n: result.unused });
    if (result.after.power <= LOW_BAR) return i18n.pick(content.story.result.lowPower.text, storyVars());
    if (result.after.life <= LOW_BAR) return i18n.pick(content.story.result.lowLife.text, storyVars());
    if (result.after.shield <= LOW_BAR) return i18n.pick(content.story.result.lowShield.text, storyVars());
    const goods = content.story.result.good;
    const pick = goods[result.round % goods.length];
    return i18n.pick(pick.text, storyVars());
  }

  async function showResult(state) {
    const result = state.lastResult;
    if (result?.flags?.shieldHeld === true) await say(content.story.storm.held, { skippable: true });
    if (result?.flags?.shieldHeld === false) await say(content.story.storm.notHeld, { skippable: true });
    if (result?.flags?.panelsDamaged) await say(content.story.storm.damaged, { skippable: true });
    const comment = result ? resultComment(state, result) : null;
    audio.play(state.status === "paused" ? "home" : "tap");
    await resultCard(modals, { i18n, result, state, config: game.config, comment });
    hud.clearChange();
  }

  async function showReview(state) {
    await say(content.story.review, { vars: { ...storyVars(), n: state.review.lunarDay }, skippable: true });
    await reviewCard(modals, { i18n, review: state.review });
  }

  async function showQuiz(state) {
    const index = await askQuiz(modals, { i18n, card: state.quizCard });
    const answered = game.answerQuiz(index);
    audio.play(answered.correct ? "good" : "oops");
  }

  async function showQuizDone(state) {
    const hasNextRound = state.status === "playing";
    await showQuizAnswer(modals, {
      i18n,
      card: state.quizCard,
      result: state.quizResult,
      bonus: game.config.quiz.bonusPoints,
      hasNextRound
    });
  }

  function showEnd(summary) {
    showScreen("end");
    audio.play(summary.status === "complete" ? "win" : "home");
    renderEnd(screen, {
      i18n,
      summary,
      story: content.story,
      config: game.config,
      player,
      nameOf,
      onAgain: () => (content.missions?.missions?.length ? showMap() : startMission({ practice: false, seed: randomSeed(), skipIntro: true })),
      onSameSeed: () => startMission({ practice: false, seed: summary.seed, skipIntro: true, mission: currentMission }),
      onData: () => openData(),
      onHome: () => showTitle()
    });
  }

  applySettings();
  if (bootNote) bootNote.remove();
  i18n.onChange(() => {
    setNewTabNote(i18n.t("ui.newTab"));
    if (app.dataset.mode === "title") showTitle();
  });
  showTitle();
}

boot().catch((error) => {
  const note = document.getElementById("boot-note");
  if (note) {
    note.hidden = false;
    note.textContent = `Could not start: ${error.message}`;
  }
  console.error(error);
});
