// The Moon base, drawn as one inline SVG. The picture follows the game state:
// day or night, greenhouse lights, dirt on the roof, panel damage, the storm,
// and Pip driving to the job that got the most work points.

const STARS = [
  [22, 30, 1.2], [58, 88, 0.9], [96, 22, 1.4], [140, 64, 1], [176, 128, 0.8], [204, 36, 1.3], [248, 92, 1],
  [286, 18, 0.9], [318, 150, 1.1], [352, 58, 1.4], [398, 112, 0.9], [432, 30, 1.2], [470, 168, 0.8],
  [508, 70, 1], [546, 22, 1.3], [566, 140, 0.9], [706, 44, 1.1], [742, 132, 1.4], [772, 78, 0.9],
  [730, 188, 1], [38, 170, 1], [118, 190, 0.8], [262, 184, 1.1], [420, 198, 0.9], [540, 196, 1]
];

export const PIP_SPOTS = {
  idle: [392, 388],
  power: [598, 372],
  life: [176, 392],
  shield: [318, 372],
  science: [716, 384],
  shelter: [430, 352],
  crater: [112, 404]
};

function stars() {
  return STARS.map(([x, y, r], i) => `<circle class="star${i % 3 === 0 ? " twinkle" : ""}" cx="${x}" cy="${y}" r="${r}"/>`).join("");
}

function shieldLayers() {
  let out = "";
  for (let k = 4; k >= 1; k -= 1) {
    const grow = k * 9;
    out +=
      `<g class="dirt-layer" data-layer="${k}">` +
      `<path d="M${346 - grow} 352 Q${346 - grow} ${268 - grow} 432 ${268 - grow} Q${518 + grow} ${268 - grow} ${518 + grow} 352 Z"/>` +
      `<circle class="pebble" cx="${360 - grow + 6}" cy="${330 - k * 3}" r="2.4"/>` +
      `<circle class="pebble" cx="${432 + k * 11}" cy="${272 - grow + 6}" r="2"/>` +
      `<circle class="pebble" cx="${506 + grow - 7}" cy="${322 - k * 2}" r="2.6"/>` +
      `</g>`;
  }
  return out;
}

function panel(x, index) {
  return (
    `<g class="solar-panel" data-panel="${index}">` +
    `<path class="panel-leg" d="M${x + 22} 352 V326"/>` +
    `<g transform="rotate(-16 ${x + 22} 318)">` +
    `<rect class="panel-face" x="${x}" y="304" width="44" height="26" rx="3"/>` +
    `<path class="panel-grid" d="M${x + 15} 304 V330 M${x + 29} 304 V330 M${x} 317 H${x + 44}"/>` +
    `<path class="panel-crack" d="M${x + 6} 306 l9 9 -5 5 11 9"/>` +
    `<circle class="repair-glow" cx="${x + 22}" cy="317" r="9"/>` +
    `</g></g>`
  );
}

function plant(x) {
  return (
    `<g class="plant">` +
    `<path class="plant-stem" d="M${x} 344 V330"/>` +
    `<path class="plant-leaf" d="M${x} 334 q-9 -3 -8 -11 q9 1 8 11 Z"/>` +
    `<path class="plant-leaf" d="M${x} 331 q9 -3 8 -11 q-9 1 -8 11 Z"/>` +
    `</g>`
  );
}

function stormStreaks() {
  let out = "";
  for (let i = 0; i < 16; i += 1) {
    const x = 20 + i * 52;
    const y = (i * 67) % 210;
    out += `<path class="storm-streak" style="animation-delay:${(i % 8) * 0.14}s" d="M${x} ${y} l34 52"/>`;
  }
  return out;
}

function svgMarkup() {
  return `
<svg class="scene-svg" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff7d6"/><stop offset="35%" stop-color="#ffe9a3" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#ffe9a3" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="growGlow" cx="50%" cy="60%" r="60%">
      <stop offset="0%" stop-color="#ff7bd0" stop-opacity="0.95"/><stop offset="100%" stop-color="#ff7bd0" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="groundDay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c9ccd8"/><stop offset="100%" stop-color="#8f93a8"/>
    </linearGradient>
    <linearGradient id="groundNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#474b66"/><stop offset="100%" stop-color="#262940"/>
    </linearGradient>
  </defs>

  <rect class="sky" width="800" height="450"/>
  <g class="stars">${stars()}</g>

  <g class="earth-in-sky">
    <circle cx="640" cy="92" r="31" fill="#2f7fd6"/>
    <path d="M620 78 q10 -12 22 -6 q4 8 -6 13 q-8 0 -10 9 q-9 -4 -6 -16 Z" fill="#5ee08a"/>
    <path d="M648 96 q13 -3 17 8 q-4 12 -13 14 q-7 -8 -4 -22 Z" fill="#5ee08a"/>
    <path d="M612 92 q16 6 30 2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <path d="M640 61 a31 31 0 0 1 0 62 a44 44 0 0 0 0 -62 Z" fill="#05060f" opacity="0.45"/>
  </g>

  <g class="sun">
    <circle cx="74" cy="236" r="78" fill="url(#sunGlow)"/>
    <circle cx="74" cy="236" r="22" fill="#fff7d6"/>
  </g>

  <path class="far-rim" d="M0 252 L54 226 L126 246 L208 216 L300 248 L420 230 L520 250 L612 222 L702 246 L800 228 L800 270 L0 270 Z"/>
  <rect class="ground ground-day" x="0" y="250" width="800" height="200" fill="url(#groundDay)"/>
  <rect class="ground ground-night" x="0" y="250" width="800" height="200" fill="url(#groundNight)"/>

  <g class="long-shadows">
    <path d="M250 352 L520 372 L520 352 Z"/>
    <path d="M430 352 L760 392 L600 352 Z"/>
    <path d="M585 352 L800 372 L800 356 L690 352 Z"/>
    <path d="M300 292 L470 300 L330 286 Z"/>
  </g>

  <g class="craters">
    <ellipse class="crater" cx="520" cy="286" rx="46" ry="9"/>
    <ellipse class="crater" cx="250" cy="278" rx="30" ry="6"/>
    <ellipse class="crater" cx="690" cy="424" rx="54" ry="12"/>
    <ellipse class="crater" cx="470" cy="432" rx="34" ry="8"/>
  </g>

  <g class="ice-crater">
    <ellipse cx="112" cy="408" rx="104" ry="30" fill="#060711"/>
    <path d="M10 406 Q112 372 214 406" fill="none" stroke="#dfe2ee" stroke-width="3" opacity="0.5"/>
    <path class="ice" d="M70 410 l8 -9 9 9 -9 7 Z"/>
    <path class="ice" d="M118 418 l7 -8 8 8 -8 6 Z"/>
    <path class="ice" d="M150 406 l6 -7 7 7 -7 5 Z"/>
  </g>

  <g class="life-unit">
    <path class="pipe" d="M214 352 H250"/>
    <rect x="168" y="322" width="44" height="32" rx="8" fill="#7fe3ff" stroke="#1b1630" stroke-width="2.5"/>
    <path d="M176 338 h28" stroke="#1b1630" stroke-width="2.5" stroke-linecap="round"/>
    <path class="drop" d="M190 326 q6 8 0 12 q-6 -4 0 -12 Z"/>
  </g>

  <g class="greenhouse">
    <ellipse class="grow-glow" cx="292" cy="326" rx="78" ry="48" fill="url(#growGlow)"/>
    <path class="greenhouse-shell" d="M240 352 V326 Q240 300 268 300 H316 Q344 300 344 326 V352 Z"/>
    <path class="grow-lamp" d="M256 306 H328"/>
    ${plant(262)}${plant(284)}${plant(306)}${plant(326)}
    <path class="greenhouse-ribs" d="M266 300 V352 M292 300 V352 M318 300 V352"/>
  </g>

  <g class="habitat">
    ${shieldLayers()}
    <path class="dome" d="M346 352 Q346 268 432 268 Q518 268 518 352 Z"/>
    <path class="dome-shine" d="M366 322 Q374 286 412 280"/>
    <rect class="window" x="378" y="310" width="24" height="18" rx="6"/>
    <rect class="window" x="462" y="310" width="24" height="18" rx="6"/>
    <path class="hatch" d="M418 352 V326 Q418 314 432 314 Q446 314 446 326 V352 Z"/>
    <circle class="hatch-light" cx="432" cy="306" r="4.5"/>
    <path class="mast" d="M432 268 V244"/>
    <circle class="mast-light" cx="432" cy="242" r="4"/>
  </g>

  <g class="panels">${panel(566, 1)}${panel(622, 2)}${panel(678, 3)}</g>

  <g class="lab">
    <rect x="722" y="328" width="52" height="26" rx="8" fill="#b79cff" stroke="#1b1630" stroke-width="2.5"/>
    <path d="M748 328 V308" stroke="#1b1630" stroke-width="3"/>
    <path d="M732 300 Q748 322 764 300 Z" fill="#f4f6fb" stroke="#1b1630" stroke-width="2.5" stroke-linejoin="round"/>
    <circle class="lab-light" cx="748" cy="341" r="5"/>
  </g>

  <g class="pip-rover" transform="translate(${PIP_SPOTS.idle[0]} ${PIP_SPOTS.idle[1]})">
    <g class="pip-bob">
      <ellipse class="pip-shadow" cx="0" cy="17" rx="26" ry="4"/>
      <path d="M0 -20 V-30" stroke="#1b1630" stroke-width="2.5" stroke-linecap="round"/>
      <circle class="pip-antenna" cx="0" cy="-32" r="4" stroke="#1b1630" stroke-width="2"/>
      <rect x="-24" y="6" width="48" height="10" rx="5" fill="#3a3f5c" stroke="#1b1630" stroke-width="2"/>
      <circle cx="-15" cy="13" r="6" fill="#555c80" stroke="#1b1630" stroke-width="2"/>
      <circle cx="0" cy="13" r="6" fill="#555c80" stroke="#1b1630" stroke-width="2"/>
      <circle cx="15" cy="13" r="6" fill="#555c80" stroke="#1b1630" stroke-width="2"/>
      <rect x="-20" y="-20" width="40" height="30" rx="9" fill="#ffd166" stroke="#1b1630" stroke-width="2"/>
      <rect x="-15" y="-15" width="30" height="20" rx="6" fill="#7fe3ff" stroke="#1b1630" stroke-width="2"/>
      <ellipse cx="-6" cy="-6" rx="2.6" ry="3.6" fill="#0b2b3a"/><ellipse cx="6" cy="-6" rx="2.6" ry="3.6" fill="#0b2b3a"/>
      <path d="M-4 0 Q0 3 4 0" fill="none" stroke="#0b2b3a" stroke-width="1.8" stroke-linecap="round"/>
      <g class="pip-tool pip-tool-power"><rect x="16" y="-8" width="14" height="4" rx="1" fill="#d7deee"/></g>
      <g class="pip-tool pip-tool-life"><ellipse cx="22" cy="-4" rx="6" ry="8" fill="#b7f0ff"/></g>
      <g class="pip-tool pip-tool-shield"><path d="M18 -10 l8 4 v6 l-8 4 -8 -4 v-6 z" fill="#c4a574"/></g>
      <g class="pip-tool pip-tool-science"><rect x="16" y="-12" width="6" height="14" rx="2" fill="#e8eefc"/></g>
    </g>
  </g>

  <g class="storm-layer">
    <rect class="storm-tint" width="800" height="450"/>
    ${stormStreaks()}
  </g>
</svg>`;
}

export function shieldLayerCount(shield) {
  if (shield <= 0) return 0;
  return Math.min(4, Math.floor((shield - 1) / 25) + 1);
}

export function createScene(container) {
  container.innerHTML = svgMarkup();
  const svg = container.querySelector("svg");
  const rover = svg.querySelector(".pip-rover");

  return {
    element: svg,
    update(view) {
      svg.classList.toggle("is-night", Boolean(view.isNight));
      svg.classList.toggle("lights-on", Boolean(view.lightsOn));
      svg.classList.toggle("panels-damaged", Boolean(view.panelsDamaged));
      svg.classList.toggle("storm", Boolean(view.storm));
      svg.classList.toggle("sheltered", Boolean(view.sheltered));
      svg.classList.toggle("low-power", view.power <= 25);
      svg.dataset.dirt = String(shieldLayerCount(view.shield ?? 0));
      const life = Number.isFinite(view.life) ? view.life : 70;
      const scale = view.lightsOn ? 0.55 + life / 180 : 0.4;
      svg.style.setProperty("--plant-scale", String(Math.max(0.35, Math.min(1.15, scale))));
    },
    movePip(spot) {
      const [x, y] = PIP_SPOTS[spot] || PIP_SPOTS.idle;
      rover.setAttribute("transform", `translate(${x} ${y})`);
      rover.style.transform = `translate(${x}px, ${y}px)`;
      svg.dataset.pip = spot in PIP_SPOTS ? spot : "idle";
    },
    flashRepair() {
      svg.classList.add("repaired");
      setTimeout(() => svg.classList.remove("repaired"), 900);
    }
  };
}

// Small pictures for the four intro panels, built from the same style.
export function introArt(kind) {
  const open = `<svg class="intro-art intro-${kind}" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="320" height="180" rx="16" fill="#05060f"/>`;
  const starField = STARS.slice(0, 16).map(([x, y, r]) => `<circle cx="${(x * 0.4).toFixed(0)}" cy="${(y * 0.8).toFixed(0)}" r="${r}" fill="#fff" opacity="0.8"/>`).join("");
  if (kind === "earth") {
    return (
      `${open}${starField}<circle cx="160" cy="96" r="62" fill="#2f7fd6"/>` +
      `<path d="M118 70 q22 -26 48 -12 q8 16 -12 26 q-16 0 -20 18 q-20 -8 -16 -32 Z" fill="#5ee08a"/>` +
      `<path d="M176 104 q26 -6 34 16 q-8 24 -26 28 q-14 -16 -8 -44 Z" fill="#5ee08a"/>` +
      `<path d="M104 96 q32 12 60 4 M168 128 q22 6 48 -4" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="0.8"/>` +
      `<circle cx="160" cy="96" r="72" fill="none" stroke="#7fd4ff" stroke-width="5" opacity="0.5"/></svg>`
    );
  }
  if (kind === "moon") {
    return (
      `${open}${starField}<circle cx="160" cy="96" r="62" fill="#c9ccd8"/>` +
      `<circle cx="136" cy="78" r="13" fill="#a4a8ba"/><circle cx="182" cy="108" r="18" fill="#a4a8ba"/>` +
      `<circle cx="150" cy="126" r="8" fill="#a4a8ba"/><circle cx="188" cy="66" r="7" fill="#a4a8ba"/>` +
      `<circle cx="268" cy="40" r="14" fill="#2f7fd6"/></svg>`
    );
  }
  if (kind === "base") {
    return (
      `${open}${starField}<rect y="118" width="320" height="62" fill="#8f93a8"/>` +
      `<ellipse cx="60" cy="158" rx="58" ry="14" fill="#060711"/><path d="M40 158 l6 -7 7 7 -7 5 Z" fill="#bfe9ff"/>` +
      `<path d="M120 132 Q120 78 170 78 Q220 78 220 132 Z" fill="#8d8fa3"/>` +
      `<path d="M130 132 Q130 88 170 88 Q210 88 210 132 Z" fill="#eef1f8" stroke="#1b1630" stroke-width="2.5"/>` +
      `<rect x="160" y="110" width="20" height="22" rx="8" fill="#3a3f5c"/>` +
      `<g transform="rotate(-16 262 112)"><rect x="240" y="100" width="44" height="24" rx="3" fill="#2f5fd6" stroke="#1b1630" stroke-width="2.5"/></g>` +
      `<path d="M262 132 V118" stroke="#1b1630" stroke-width="3"/>` +
      `<circle cx="22" cy="112" r="16" fill="#fff7d6"/><circle cx="280" cy="36" r="14" fill="#2f7fd6"/></svg>`
    );
  }
  return (
    `${open}${starField}<rect x="56" y="34" width="208" height="112" rx="14" fill="#141a33" stroke="#4fd1ff" stroke-width="3"/>` +
    `<rect x="78" y="58" width="120" height="14" rx="7" fill="#263056"/><rect x="78" y="58" width="84" height="14" rx="7" fill="#ffd166"/>` +
    `<rect x="78" y="84" width="120" height="14" rx="7" fill="#263056"/><rect x="78" y="84" width="96" height="14" rx="7" fill="#5ee08a"/>` +
    `<rect x="78" y="110" width="120" height="14" rx="7" fill="#263056"/><rect x="78" y="110" width="48" height="14" rx="7" fill="#b79cff"/>` +
    `<circle cx="232" cy="90" r="18" fill="#ff9f43"/><path d="M224 90 h16 M232 82 v16" stroke="#1b1630" stroke-width="4" stroke-linecap="round"/></svg>`
  );
}
