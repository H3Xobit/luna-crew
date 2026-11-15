// Cutscene art. Every shot is a small scene with two parts:
//   build()            -> SVG markup, made once when the shot starts
//   frame(q, p, t)     -> moves things. p is 0..1 through the shot, t is seconds.
// Nothing here is rebuilt per frame: frame() only sets transform and opacity.
// The stage is 1600 x 900. All ids start with "cx" so they never clash with
// the game scene.

export const STAGE = { width: 1600, height: 900 };

const W = STAGE.width;
const H = STAGE.height;
const INK = "#1b1630";
const GY = 650; // the line the base, lander and crew stand on

// ---------------------------------------------------------------- helpers

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (p, a, b) => clamp01((p - a) / (b - a));
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeIn = (t) => t * t * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const outBack = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
const n = (v) => Number(v).toFixed(2);

// Writes are skipped when the value did not change, so parts that stand still
// are never painted again.
function T(el, x = 0, y = 0, s = 1, r = 0, sy = null) {
  if (!el) return;
  if (el.camera) {
    el.camera(x, y, s);
    return;
  }
  if (el.cxLayer) {
    const move = `translate(${((x / W) * 100).toFixed(3)}%, ${((y / H) * 100).toFixed(3)}%) rotate(${r.toFixed(2)}deg)`;
    if (el.cxMove !== move) {
      el.cxMove = move;
      el.cxLayer.style.transform = move;
    }
    const size = `scale(${n(s)}${sy === null ? "" : ` ${n(sy)}`})`;
    if (el.cxT !== size) {
      el.cxT = size;
      el.setAttribute("transform", size);
    }
    return;
  }
  const value = `translate(${n(x)} ${n(y)}) rotate(${n(r)}) scale(${n(s)}${sy === null ? "" : ` ${n(sy)}`})`;
  if (el.cxT === value) return;
  el.cxT = value;
  el.setAttribute("transform", value);
}

function O(el, value) {
  if (!el) return;
  const text = n(clamp01(value));
  if (el.cxO === text) return;
  el.cxO = text;
  el.setAttribute("opacity", text);
}

// Zoom the whole picture around a point, with an optional slide.
function cam(q, scale, cx = W / 2, cy = H / 2, dx = 0, dy = 0) {
  T(q("cam"), cx * (1 - scale) + dx, cy * (1 - scale) + dy, scale);
}

// ------------------------------------------------------------------- defs

export const DEFS = `<style>.cx-tw{animation:cx-twinkle 4.2s ease-in-out infinite}@keyframes cx-twinkle{50%{opacity:.2}}@media (prefers-reduced-motion:reduce){.cx-tw{animation:none}}</style><defs>
<linearGradient id="cxSpace" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#02030a"/><stop offset="0.55" stop-color="#070c24"/><stop offset="1" stop-color="#121a42"/></linearGradient>
<radialGradient id="cxOcean" cx="0.36" cy="0.32" r="0.8"><stop offset="0" stop-color="#58b4ff"/><stop offset="0.45" stop-color="#1f74dc"/><stop offset="0.8" stop-color="#0c3f9a"/><stop offset="1" stop-color="#06225c"/></radialGradient>
<radialGradient id="cxAtmo" cx="0.5" cy="0.5" r="0.5"><stop offset="0.80" stop-color="#58b8ff" stop-opacity="0"/><stop offset="0.87" stop-color="#7fd0ff" stop-opacity="0.6"/><stop offset="1" stop-color="#58b8ff" stop-opacity="0"/></radialGradient>
<radialGradient id="cxShade" cx="0.32" cy="0.3" r="0.82"><stop offset="0.5" stop-color="#030620" stop-opacity="0"/><stop offset="0.8" stop-color="#030620" stop-opacity="0.5"/><stop offset="1" stop-color="#02040f" stop-opacity="0.9"/></radialGradient>
<radialGradient id="cxMoon" cx="0.36" cy="0.32" r="0.8"><stop offset="0" stop-color="#f6f7fb"/><stop offset="0.55" stop-color="#c9ccd8"/><stop offset="1" stop-color="#8b90a5"/></radialGradient>
<linearGradient id="cxRidge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9bccb"/><stop offset="0.5" stop-color="#8d91a6"/><stop offset="1" stop-color="#6c7088"/></linearGradient>
<linearGradient id="cxGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6d8e2"/><stop offset="0.45" stop-color="#a9adbe"/><stop offset="1" stop-color="#737890"/></linearGradient>
<linearGradient id="cxDusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0.3" stop-color="#04061a" stop-opacity="0"/><stop offset="0.62" stop-color="#04061a" stop-opacity="1"/></linearGradient>
<radialGradient id="cxSun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffffff"/><stop offset="0.18" stop-color="#fff3c4" stop-opacity="0.95"/><stop offset="0.45" stop-color="#ffd27a" stop-opacity="0.35"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<radialGradient id="cxWarm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffe6a8" stop-opacity="0.95"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<radialGradient id="cxPink" cx="0.5" cy="0.55" r="0.5"><stop offset="0" stop-color="#ff7bd0" stop-opacity="0.9"/><stop offset="1" stop-color="#ff7bd0" stop-opacity="0"/></radialGradient>
<radialGradient id="cxBlue" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#9fe6ff" stop-opacity="0.95"/><stop offset="1" stop-color="#4fb4ff" stop-opacity="0"/></radialGradient>
<radialGradient id="cxRed" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff8a8a" stop-opacity="0.95"/><stop offset="1" stop-color="#ff3b5c" stop-opacity="0"/></radialGradient>
<radialGradient id="cxDustG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#eef0f6" stop-opacity="0.95"/><stop offset="0.6" stop-color="#cfd2dd" stop-opacity="0.6"/><stop offset="1" stop-color="#b9bccb" stop-opacity="0"/></radialGradient>
<linearGradient id="cxFlame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.2" stop-color="#fff0a0"/><stop offset="0.55" stop-color="#ff9a2e"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></linearGradient>
<linearGradient id="cxDome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#e3e8f6"/><stop offset="1" stop-color="#a9b2cc"/></linearGradient>
<linearGradient id="cxGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset="0.45" stop-color="#f0b944"/><stop offset="1" stop-color="#a97119"/></linearGradient>
<linearGradient id="cxMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#d5dbea"/><stop offset="1" stop-color="#8e96ae"/></linearGradient>
<linearGradient id="cxPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5c93ff"/><stop offset="1" stop-color="#1a3a9c"/></linearGradient>
<linearGradient id="cxIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1fdff"/><stop offset="0.5" stop-color="#9fdcff"/><stop offset="1" stop-color="#4a98e0"/></linearGradient>
<linearGradient id="cxVisor" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a62c8"/><stop offset="1" stop-color="#0f1c4a"/></linearGradient>
<linearGradient id="cxDirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3a892"/><stop offset="1" stop-color="#7d735f"/></linearGradient>
<linearGradient id="cxRoom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3350"/><stop offset="1" stop-color="#241d36"/></linearGradient>
<linearGradient id="cxBeam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6c8" stop-opacity="0.75"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></linearGradient>
<linearGradient id="cxScan" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7dffb0" stop-opacity="0.8"/><stop offset="1" stop-color="#7dffb0" stop-opacity="0"/></linearGradient>
<radialGradient id="cxMedal" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#fff6c4"/><stop offset="0.5" stop-color="#ffd166"/><stop offset="1" stop-color="#d18a17"/></radialGradient>
<radialGradient id="cxCrater" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#5d6178"/><stop offset="1" stop-color="#8a8ea4"/></radialGradient>
<linearGradient id="cxFadeR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#14162c" stop-opacity="0.5"/><stop offset="1" stop-color="#14162c" stop-opacity="0"/></linearGradient>
<radialGradient id="cxBowl" cx="0.5" cy="1" r="0.9"><stop offset="0" stop-color="#1a2140"/><stop offset="0.6" stop-color="#0c1026"/><stop offset="1" stop-color="#05060f"/></radialGradient>
<filter id="cxSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>`;

// -------------------------------------------------------------------- sky

function stars(seed, count = 150, y0 = 0, y1 = H, twinkle = true) {
  const r = mulberry(seed);
  let out = "";
  let blink = "";
  for (let i = 0; i < count; i += 1) {
    const x = r() * W;
    const y = y0 + r() * (y1 - y0);
    const rad = 0.7 + r() * r() * 2.6;
    const alpha = 0.35 + r() * 0.65;
    const color = i % 11 === 0 ? "#ffe9c2" : i % 7 === 0 ? "#cfe3ff" : "#ffffff";
    if (twinkle && i % 6 === 0) blink += `<circle class="cx-tw" style="animation-delay:${n(r() * 4)}s" cx="${n(x)}" cy="${n(y)}" r="${n(rad + 0.4)}" fill="${color}" opacity="${n(alpha)}"/>`;
    else out += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(rad)}" fill="${color}" opacity="${n(alpha)}"/>`;
  }
  return `<g>${out}</g>${blink ? `<g data-solo="1">${blink}</g>` : ""}`;
}

function sky(seed = 7, count = 150) {
  return `<rect width="${W}" height="${H}" fill="url(#cxSpace)"/>${stars(seed, count)}`;
}

function sparkle(key, x, y, size = 14, color = "#ffffff") {
  const s = size;
  return `<g transform="translate(${x} ${y})"><g data-a="${key}"><path d="M0 ${-s} L${s * 0.22} ${-s * 0.22} L${s} 0 L${s * 0.22} ${s * 0.22} L0 ${s} L${-s * 0.22} ${s * 0.22} L${-s} 0 L${-s * 0.22} ${-s * 0.22} Z" fill="${color}"/></g></g>`;
}

function twinkle(q, key, t, phase = 0, speed = 3) {
  const v = 0.5 + 0.5 * Math.sin(t * speed + phase);
  T(q(key), 0, 0, 0.35 + v * 0.85, t * 40 + phase * 30);
  O(q(key), 0.25 + v * 0.75);
}

// ------------------------------------------------------------------ Earth
// Coastlines as [longitude, latitude] points, simplified by hand.

const LAND = [
  [[-168, 66], [-156, 71], [-125, 70], [-95, 72], [-80, 73], [-64, 60], [-56, 52], [-66, 45], [-70, 42], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 30], [-97, 26], [-97, 20], [-90, 21], [-87, 16], [-83, 10], [-78, 8], [-83, 8], [-92, 15], [-105, 20], [-110, 24], [-114, 31], [-118, 34], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 55], [-160, 60]],
  [[-80, 9], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -15], [-48, -25], [-58, -35], [-65, -42], [-68, -53], [-73, -52], [-75, -45], [-72, -35], [-70, -20], [-76, -14], [-81, -5]],
  [[-17, 15], [-16, 22], [-10, 30], [-6, 35], [10, 37], [20, 32], [32, 31], [35, 24], [43, 12], [51, 12], [42, -2], [40, -15], [35, -24], [27, -34], [19, -35], [12, -18], [9, -1], [9, 4], [-5, 5], [-12, 8]],
  [[-9, 37], [-9, 43], [-1, 44], [-4, 48], [2, 51], [8, 54], [9, 57], [5, 59], [10, 64], [20, 70], [30, 70], [40, 67], [60, 70], [80, 73], [105, 77], [140, 73], [170, 70], [180, 66], [170, 60], [160, 52], [142, 54], [135, 45], [128, 38], [122, 31], [120, 23], [109, 20], [105, 10], [100, 13], [98, 8], [94, 17], [88, 22], [80, 13], [77, 8], [72, 20], [66, 25], [57, 26], [50, 30], [48, 30], [36, 36], [27, 37], [23, 40], [15, 38], [12, 44], [3, 43], [0, 39]],
  [[35, 30], [43, 13], [52, 14], [59, 22], [56, 26], [48, 30]],
  [[114, -22], [122, -18], [131, -12], [137, -16], [142, -11], [146, -19], [153, -27], [150, -37], [140, -38], [131, -32], [116, -34]],
  [[130, 32], [136, 35], [141, 40], [142, 44], [140, 36], [134, 34]],
  [[95, 5], [105, -6], [116, -8], [118, 2], [110, 2], [104, 0]],
  [[166, -46], [172, -41], [178, -38], [174, -41], [170, -46]],
  [[44, -13], [50, -15], [47, -25], [44, -22]],
  [[-6, 50], [-3, 58], [0, 53], [1, 51]]
];
const SAND = [
  [[-14, 30], [-14, 18], [32, 17], [34, 28], [10, 34]],
  [[38, 28], [44, 16], [52, 17], [55, 24], [48, 29]],
  [[120, -22], [140, -20], [145, -28], [126, -30]],
  [[-112, 38], [-104, 28], [-100, 32], [-106, 40]]
];
const ICE = [
  [[-52, 60], [-42, 60], [-22, 70], [-20, 80], [-40, 83], [-60, 81], [-70, 77], [-55, 70]],
  [[-180, -78], [-120, -79], [-60, -74], [0, -76], [60, -73], [120, -73], [180, -78], [180, -90], [-180, -90]],
  [[-180, 84], [-90, 82], [0, 85], [90, 82], [180, 84], [180, 90], [-180, 90]]
];

function shape(points, r) {
  return `M${points.map(([lon, lat]) => `${n(((lon + 180) / 360) * 4 * r)} ${n((-lat / 90) * r)}`).join("L")}Z`;
}

function earthMap(r) {
  const land = LAND.map((p) => shape(p, r)).join("");
  const sand = SAND.map((p) => shape(p, r)).join("");
  const ice = ICE.map((p) => shape(p, r)).join("");
  const edge = n(Math.max(1.5, r * 0.03));
  const one =
    `<path d="${land}" fill="#3fae68" stroke="#3fae68" stroke-width="${edge}" stroke-linejoin="round"/>` +
    `<path d="${land}" fill="none" stroke="#7fd68f" stroke-width="${n(r * 0.012)}" stroke-linejoin="round" opacity="0.6"/>` +
    `<path d="${sand}" fill="#d9c27a" stroke="#d9c27a" stroke-width="${edge}" stroke-linejoin="round" opacity="0.85"/>` +
    `<path d="${ice}" fill="#f4fbff" stroke="#f4fbff" stroke-width="${edge}" stroke-linejoin="round"/>`;
  return `${one}<g transform="translate(${4 * r} 0)">${one}</g>`;
}

function earthClouds(r) {
  const rand = mulberry(42);
  let one = "";
  for (let i = 0; i < 30; i += 1) {
    const x = rand() * 4 * r;
    const y = (rand() * 1.7 - 0.85) * r;
    const len = r * (0.22 + rand() * 0.5);
    const bend = r * (rand() * 0.16 - 0.08);
    const width = r * (0.035 + rand() * 0.06);
    one += `<path d="M${n(x)} ${n(y)} q${n(len / 2)} ${n(bend)} ${n(len)} 0" fill="none" stroke="#ffffff" stroke-width="${n(width)}" stroke-linecap="round" opacity="${n(0.35 + rand() * 0.4)}"/>`;
  }
  return `${one}<g transform="translate(${4 * r} 0)">${one}</g><g transform="translate(${-4 * r} 0)">${one}</g>`;
}

function earth(key, r, lon = null) {
  const width = 4 * r;
  const at = lon === null ? "" : ` transform="translate(${n(-r - ((((lon + 90) / 360) * width) % width + width) % width)} 0)"`;
  return (
    `<g data-a="${key}">` +
    `<circle r="${n(r * 1.19)}" fill="url(#cxAtmo)"/>` +
    `<clipPath id="cxClip-${key}"><circle r="${r}"/></clipPath>` +
    `<circle r="${r}" fill="url(#cxOcean)"/>` +
    `<g clip-path="url(#cxClip-${key})">` +
    `<g data-a="${key}-map"${at}>${earthMap(r)}</g>` +
    `<g data-a="${key}-cl"${at}>${earthClouds(r)}</g>` +
    `<circle r="${r}" fill="url(#cxShade)"/>` +
    `<ellipse cx="${n(-r * 0.36)}" cy="${n(-r * 0.4)}" rx="${n(r * 0.34)}" ry="${n(r * 0.2)}" fill="#ffffff" opacity="0.12"/>` +
    `</g>` +
    `<circle r="${r}" fill="none" stroke="#bfe6ff" stroke-width="${n(Math.max(1.5, r * 0.012))}" opacity="0.55"/>` +
    `</g>`
  );
}

// lon is the longitude in the middle of the disc. `turn` grows with time, so
// the land keeps sliding to the right the way Earth really turns, and the
// clouds drift a little faster than the land.
function spin(q, key, r, lon, turn = 0) {
  const width = 4 * r;
  const wrap = (v) => ((v % width) + width) % width;
  T(q(`${key}-map`), -r - wrap(((lon - turn * 130 + 90) / 360) * width), 0);
  T(q(`${key}-cl`), -r - wrap(((lon - turn * 190 + 90) / 360) * width), 0);
}

function moonDisc(key, r) {
  const craters = [[-0.35, -0.3, 0.16], [0.25, -0.15, 0.11], [-0.05, 0.3, 0.19], [0.45, 0.35, 0.09], [-0.52, 0.2, 0.08], [0.1, -0.55, 0.1], [0.36, -0.5, 0.06], [-0.2, -0.64, 0.07], [0.02, 0.72, 0.07], [-0.3, 0.62, 0.06], [0.6, 0.02, 0.07], [0.22, 0.55, 0.05]];
  let out = "";
  for (const [x, y, s] of craters) {
    out += `<circle cx="${n(x * r)}" cy="${n(y * r)}" r="${n(s * r)}" fill="#8f94a9" opacity="0.6"/>`;
    out += `<path d="M${n((x - s * 0.9) * r)} ${n((y + s * 0.2) * r)} A${n(s * r)} ${n(s * r)} 0 0 0 ${n((x + s * 0.5) * r)} ${n((y + s * 0.85) * r)}" fill="none" stroke="#f3f4f9" stroke-width="${n(Math.max(1, r * 0.012))}" opacity="0.7"/>`;
  }
  return (
    `<g data-a="${key}">` +
    `<clipPath id="cxClip-${key}"><circle r="${r}"/></clipPath>` +
    `<circle r="${r}" fill="url(#cxMoon)"/>` +
    `<g clip-path="url(#cxClip-${key})">` +
    `<ellipse cx="${n(-r * 0.25)}" cy="${n(-r * 0.22)}" rx="${n(r * 0.42)}" ry="${n(r * 0.3)}" fill="#7f849b" opacity="0.32"/>` +
    `<ellipse cx="${n(r * 0.32)}" cy="${n(-r * 0.02)}" rx="${n(r * 0.3)}" ry="${n(r * 0.24)}" fill="#7f849b" opacity="0.28"/>` +
    out +
    `<circle r="${r}" fill="url(#cxShade)" opacity="0.8"/>` +
    `</g></g>`
  );
}

// ----------------------------------------------------------------- ground

const RIDGE = "M0 560 C120 500 220 470 330 520 C420 560 470 500 560 470 C680 430 760 520 880 510 C1000 500 1040 440 1160 450 C1280 460 1340 530 1450 500 C1520 480 1570 500 1600 520 L1600 900 L0 900 Z";
const PLAIN = "M0 612 C300 584 600 602 900 592 C1200 582 1400 602 1600 588 L1600 900 L0 900 Z";

function crater(x, y, rx) {
  const ry = rx * 0.24;
  return (
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${n(ry)}" fill="url(#cxCrater)"/>` +
    `<path d="M${x - rx} ${y} A${rx} ${n(ry)} 0 0 1 ${x + rx} ${y}" fill="none" stroke="#5a5e75" stroke-width="3" opacity="0.6"/>` +
    `<path d="M${x - rx} ${y} A${rx} ${n(ry)} 0 0 0 ${x + rx} ${y}" fill="none" stroke="#f2f3f8" stroke-width="3" opacity="0.7"/>`
  );
}

function rock(x, y, s = 1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="6" cy="6" rx="26" ry="5" fill="#2a2d44" opacity="0.3"/><path d="M-16 4 L-10 -10 L4 -15 L16 -6 L18 4 Z" fill="#9a9eb2" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-10 -10 L4 -15 L2 -4 Z" fill="#c9ccd8"/></g>`;
}

function ground() {
  return (
    `<path d="${RIDGE}" fill="url(#cxRidge)"/>` +
    `<path d="M0 560 C120 500 220 470 330 520 C420 560 470 500 560 470 C680 430 760 520 880 510 C1000 500 1040 440 1160 450 C1280 460 1340 530 1450 500 C1520 480 1570 500 1600 520" fill="none" stroke="#f4f5fa" stroke-width="4" opacity="0.45"/>` +
    `<path d="${PLAIN}" fill="url(#cxGround)"/>` +
    crater(250, 780, 130) + crater(1330, 820, 110) + crater(700, 850, 80) + crater(1010, 742, 54) + crater(130, 668, 44) + crater(1500, 700, 50) +
    rock(470, 770, 1.1) + rock(1180, 700, 0.8) + rock(90, 840, 1.3) + rock(1470, 790, 1)
  );
}

function dusk(opacity = 0) {
  return `<rect data-a="dusk" data-solo="1" width="${W}" height="${H}" fill="url(#cxDusk)" opacity="${opacity}"/>`;
}

// ------------------------------------------------------------------- base
// Drawn around its own middle point on the ground: translate(x GY).

function solarPanel(x, i) {
  return (
    `<path d="M${x + 35} 0 V-52" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
    `<g transform="rotate(-18 ${x + 35} -64)">` +
    `<rect x="${x - 6}" y="-92" width="82" height="52" rx="6" fill="url(#cxPanel)" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M${x + 21} -92 V-40 M${x + 48} -92 V-40 M${x - 6} -66 H${x + 76}" stroke="#bcd3ff" stroke-width="2.5" opacity="0.8"/>` +
    `<path d="M${x} -86 L${x + 22} -86 L${x + 4} -62 Z" fill="#ffffff" opacity="0.25"/>` +
    `<rect data-a="pdim${i}" x="${x - 6}" y="-92" width="82" height="52" rx="6" fill="#05060f" opacity="0"/>` +
    `<path data-a="pcrack${i}" d="M${x + 4} -88 l18 16 -9 8 20 20" fill="none" stroke="#05060f" stroke-width="4" stroke-linejoin="round" opacity="0"/>` +
    `</g>`
  );
}

function plant(x, key, h = 1) {
  return `<g transform="translate(${x} 0)"><g data-a="${key}" transform="scale(${h})"><path d="M0 0 V-26" stroke="#2f9a5e" stroke-width="5" stroke-linecap="round"/><path d="M0 -14 q-17 -5 -15 -20 q16 2 15 20 Z" fill="#5ee08a" stroke="${INK}" stroke-width="2.5"/><path d="M0 -20 q17 -5 15 -20 q-16 2 -15 20 Z" fill="#5ee08a" stroke="${INK}" stroke-width="2.5"/></g></g>`;
}

function baseBody({ berm = 1, greenhouse = true, plants = true } = {}) {
  return (
    `<ellipse cx="60" cy="8" rx="640" ry="26" fill="#2a2d44" opacity="0.22"/>` +
    `<g data-a="berm" transform="scale(${berm})"><path d="M-262 0 Q-262 -168 0 -214 Q262 -168 262 0 Z" fill="url(#cxDirt)" stroke="${INK}" stroke-width="5"/><circle cx="-150" cy="-96" r="6" fill="#6b624f"/><circle cx="120" cy="-150" r="5" fill="#6b624f"/><circle cx="200" cy="-60" r="7" fill="#6b624f"/></g>` +
    // life support tank
    `<g transform="translate(-560 0)"><rect x="-44" y="-74" width="88" height="74" rx="18" fill="#7fe3ff" stroke="${INK}" stroke-width="5"/><path d="M0 -58 q16 22 0 34 q-16 -12 0 -34 Z" fill="#ffffff" opacity="0.85"/><path d="M-28 -16 H28" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M44 -20 H110" stroke="${INK}" stroke-width="8" stroke-linecap="round"/></g>` +
    // greenhouse
    (greenhouse
      ? `<path d="M-236 -44 H-190" stroke="#aeb6cc" stroke-width="26" stroke-linecap="butt"/><path d="M-236 -57 H-190 M-236 -31 H-190" stroke="${INK}" stroke-width="4"/>` +
        `<path d="M-430 0 V-54 Q-430 -118 -366 -118 H-300 Q-236 -118 -236 -54 V0 Z" fill="#cfe8ff" fill-opacity="0.3" stroke="${INK}" stroke-width="5"/>` +
        `<path d="M-412 -102 H-254" stroke="#ff7bd0" stroke-width="7" stroke-linecap="round"/>` +
        (plants ? plant(-396, "gp0") + plant(-354, "gp1") + plant(-312, "gp2") + plant(-270, "gp3") : "") +
        `<path d="M-384 -118 V0 M-333 -118 V0 M-282 -118 V0" stroke="${INK}" stroke-width="3" opacity="0.5"/>`
      : "") +
    // habitat dome
    `<path d="M-196 0 V-62 Q-196 -178 0 -178 Q196 -178 196 -62 V0 Z" fill="url(#cxDome)" stroke="${INK}" stroke-width="6"/>` +
    `<path d="M-156 -74 Q-146 -146 -62 -158" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.8"/>` +
    `<path d="M-196 -30 H196" stroke="${INK}" stroke-width="3" opacity="0.35"/>` +
    [-140, 62].map((x) => `<rect x="${x}" y="-118" width="78" height="54" rx="16" fill="#26304f" stroke="${INK}" stroke-width="5"/>`).join("") +
    `<rect x="-34" y="-72" width="68" height="72" rx="14" fill="#8a93ad" stroke="${INK}" stroke-width="5"/><rect x="-16" y="-58" width="32" height="24" rx="8" fill="#26304f" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M0 -178 V-226" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-232" r="10" fill="#3a3f5c" stroke="${INK}" stroke-width="4"/>` +
    // solar panels and dish
    solarPanel(290, 0) + solarPanel(392, 1) + solarPanel(494, 2) +
    `<g transform="translate(640 0)"><path d="M0 0 V-58" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M-40 -92 Q0 -40 40 -92 Z" fill="#eef1f8" stroke="${INK}" stroke-width="5"/><path d="M0 -70 L0 -104" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-108" r="6" fill="#ff9f43" stroke="${INK}" stroke-width="3"/></g>`
  );
}

// Everything that glows. Drawn after dusk() so it stays bright at night.
function baseGlow({ greenhouse = true } = {}) {
  return (
    `<g data-a="wins" opacity="0">` +
    [-140, 62].map((x) => `<ellipse cx="${x + 39}" cy="-91" rx="92" ry="64" fill="url(#cxWarm)" opacity="0.7"/><rect x="${x + 5}" y="-113" width="68" height="44" rx="12" fill="#ffe29a"/>`).join("") +
    `<rect x="-11" y="-53" width="22" height="14" rx="5" fill="#ffe29a"/></g>` +
    (greenhouse ? `<g data-a="ghglow" opacity="0"><ellipse cx="-333" cy="-58" rx="170" ry="110" fill="url(#cxPink)"/><path d="M-412 -102 H-254" stroke="#ffd0ee" stroke-width="5" stroke-linecap="round"/></g>` : "") +
    `<g data-a="beacon" opacity="0"><circle cx="0" cy="-232" r="34" fill="url(#cxWarm)"/><circle cx="0" cy="-232" r="9" fill="#5ee08a"/></g>` +
    `<g data-a="alarm" opacity="0"><circle cx="0" cy="-232" r="70" fill="url(#cxRed)"/><circle cx="0" cy="-232" r="10" fill="#ff5c8a"/></g>`
  );
}

function base(x, scale = 1, options = {}) {
  return `<g transform="translate(${x} ${GY}) scale(${scale})">${baseBody(options)}</g>`;
}

function baseLights(x, scale = 1, options = {}) {
  return `<g transform="translate(${x} ${GY}) scale(${scale})">${baseGlow(options)}</g>`;
}

function shelterMound(key = "hatch") {
  return (
    `<path d="M-190 0 Q-190 -120 0 -150 Q190 -120 190 0 Z" fill="url(#cxDirt)" stroke="${INK}" stroke-width="5"/>` +
    `<circle cx="-90" cy="-60" r="6" fill="#6b624f"/><circle cx="96" cy="-84" r="5" fill="#6b624f"/>` +
    `<path d="M-52 0 V-58 Q-52 -92 0 -92 Q52 -92 52 -58 V0 Z" fill="#59607a" stroke="${INK}" stroke-width="5"/>` +
    `<g data-a="${key}"><ellipse cx="0" cy="-44" rx="96" ry="70" fill="url(#cxWarm)" opacity="0.8"/><path d="M-38 0 V-56 Q-38 -78 0 -78 Q38 -78 38 -56 V0 Z" fill="#ffe29a"/></g>`
  );
}

// ----------------------------------------------------------------- lander

function flame(key, size = 1) {
  return (
    `<g data-a="${key}">` +
    `<ellipse cx="0" cy="${n(70 * size)}" rx="${n(80 * size)}" ry="${n(90 * size)}" fill="url(#cxWarm)" opacity="0.55"/>` +
    `<path d="M${n(-36 * size)} 0 Q${n(-52 * size)} ${n(110 * size)} 0 ${n(230 * size)} Q${n(52 * size)} ${n(110 * size)} ${n(36 * size)} 0 Z" fill="url(#cxFlame)"/>` +
    `<path d="M${n(-17 * size)} 0 Q${n(-24 * size)} ${n(70 * size)} 0 ${n(140 * size)} Q${n(24 * size)} ${n(70 * size)} ${n(17 * size)} 0 Z" fill="#ffffff" opacity="0.92"/>` +
    `</g>`
  );
}

function flicker(q, key, t, power = 1) {
  const wob = 0.86 + 0.1 * Math.sin(t * 47) + 0.07 * Math.sin(t * 83 + 1.3);
  T(q(key), 0, 0, power * (0.94 + 0.06 * Math.sin(t * 61)), 0, power * wob);
  O(q(key), power > 0.02 ? 1 : 0);
}

// Legs and the gold descent stage. Feet sit on y = 0.
function landerStage() {
  const leg = (s) =>
    `<path d="M${70 * s} -128 L${168 * s} -10" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M${70 * s} -128 L${168 * s} -10" stroke="#c9cfdf" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M${112 * s} -150 L${150 * s} -34" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
    `<ellipse cx="${168 * s}" cy="-4" rx="34" ry="9" fill="#aeb6cc" stroke="${INK}" stroke-width="5"/>`;
  return (
    leg(-1) + leg(1) +
    `<path d="M-30 -122 L-46 -66 H46 L30 -122 Z" fill="#4b5068" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M-38 -90 H38" stroke="${INK}" stroke-width="3" opacity="0.5"/>` +
    `<path d="M-118 -206 H118 L150 -176 V-136 L118 -112 H-118 L-150 -136 V-176 Z" fill="url(#cxGold)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="M-60 -206 V-112 M60 -206 V-112 M-150 -156 H150" stroke="#8a5a12" stroke-width="3" opacity="0.55"/>` +
    `<path d="M-108 -196 L-70 -196 L-100 -168 Z" fill="#ffffff" opacity="0.45"/>` +
    `<circle data-a="llight" cx="-128" cy="-150" r="9" fill="#fff7c2" stroke="${INK}" stroke-width="3"/>`
  );
}

// The crew cabin. Its bottom edge sits on y = 0.
function bust(cx, cy, r, accent) {
  const k = r / 12;
  return (
    `<g transform="translate(${cx} ${cy}) scale(${n(k)})">` +
    `<path d="M-15 21 V14 Q-15 7 -7 7 H7 Q15 7 15 14 V21 Z" fill="#f8faff" stroke="${INK}" stroke-width="2"/><rect x="-15" y="14" width="30" height="4" fill="${accent}"/>` +
    `<circle r="12" fill="#fdfdff" stroke="${INK}" stroke-width="2"/><ellipse cx="0.5" cy="0.5" rx="8.6" ry="7.4" fill="url(#cxVisor)"/>` +
    `<path d="M-5 -0.5 q2 -3 4 0 M2 -0.5 q2 -3 4 0" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/><path d="M-3 3.2 q3.5 3 7 0" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>` +
    `</g>`
  );
}

function landerCabin(faces = false) {
  const face = (x, accent) => bust(x, -79, 11.5, accent);
  return (
    `<path d="M-88 0 V-74 Q-88 -138 0 -138 Q88 -138 88 -74 V0 Z" fill="url(#cxMetal)" stroke="${INK}" stroke-width="6"/>` +
    `<path d="M-66 -78 Q-60 -116 -22 -124" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity="0.85"/>` +
    `<rect x="-64" y="-94" width="48" height="42" rx="12" fill="#7fe3ff" stroke="${INK}" stroke-width="5"/><rect x="16" y="-94" width="48" height="42" rx="12" fill="#7fe3ff" stroke="${INK}" stroke-width="5"/>` +
    (faces ? face(-40, "#ff9f43") + face(40, "#5ee08a") : `<path d="M-58 -86 l14 0 -14 14 Z M22 -86 l14 0 -14 14 Z" fill="#ffffff" opacity="0.7"/>`) +
    `<rect x="-22" y="-44" width="44" height="44" rx="9" fill="#aeb6cc" stroke="${INK}" stroke-width="4"/><circle cx="12" cy="-22" r="4" fill="${INK}"/>` +
    `<rect x="-108" y="-70" width="20" height="26" rx="5" fill="#59607a" stroke="${INK}" stroke-width="4"/><rect x="88" y="-70" width="20" height="26" rx="5" fill="#59607a" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M44 -132 L74 -186" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M52 -206 Q86 -214 96 -180 Z" fill="#eef1f8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M-88 -22 H88" stroke="#ff9f43" stroke-width="8"/>`
  );
}

function lander(key, { engine = true } = {}) {
  return (
    `<g data-a="${key}" data-solo="1">` +
    (engine ? `<g transform="translate(0 -66)">${flame(`${key}-flame`, 1)}</g>` : "") +
    landerStage() +
    `<g transform="translate(0 -206)">${landerCabin()}</g>` +
    `</g>`
  );
}

function dustPuffs(key, count = 12) {
  let out = "";
  for (let i = 0; i < count; i += 1) {
    out += `<g data-a="${key}${i}" opacity="0"><circle r="60" fill="url(#cxDustG)" opacity="0.6"/><circle cx="-30" cy="10" r="26" fill="#d9dce6"/><circle cx="32" cy="8" r="28" fill="#d9dce6"/><circle cx="0" cy="-4" r="36" fill="#eceef4"/><circle cx="-12" cy="-16" r="16" fill="#ffffff" opacity="0.8"/></g>`;
  }
  return out;
}

// Puffs roll out along the ground from x, then thin away.
function blowDust(q, key, count, x, y, amount) {
  for (let i = 0; i < count; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const rank = Math.floor(i / 2) / Math.max(1, count / 2 - 1);
    const local = clamp01(amount * 1.3 - rank * 0.3);
    const reach = 110 + rank * 520;
    const lift = 30 + (i % 3) * 34 + rank * 40;
    T(q(`${key}${i}`), x + side * (50 + reach * easeOut(local)), y - 20 - lift * easeOut(local), 0.45 + easeOut(local) * (1.0 + rank * 0.8), side * local * 40);
    O(q(`${key}${i}`), local <= 0 ? 0 : Math.min(1, local * 6) * (1 - seg(local, 0.55, 1)) * 0.95);
  }
}

// ------------------------------------------------------------- characters

function pipEye(cx, expr) {
  const cy = 56;
  const c = "#0b2b3a";
  if (expr === "happy") return `<path d="M${cx - 7} ${cy + 3} Q${cx} ${cy - 8} ${cx + 7} ${cy + 3}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
  if (expr === "sleepy") return `<path d="M${cx - 7} ${cy} H${cx + 7}" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`;
  if (expr === "excited") return `<path d="M${cx} ${cy - 9} l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z" fill="${c}"/>`;
  if (expr === "worried") return `<ellipse cx="${cx}" cy="${cy + 1}" rx="5" ry="6" fill="${c}"/><path d="M${cx - 8} ${cy - 11} L${cx + 6} ${cy - 8}" transform="rotate(${cx < 60 ? -28 : 28} ${cx} ${cy - 10})" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  if (expr === "thinking") return `<ellipse cx="${cx + 2}" cy="${cy - 2}" rx="5.5" ry="7" fill="${c}"/>`;
  return `<ellipse cx="${cx}" cy="${cy}" rx="5.5" ry="7.5" fill="${c}"/><circle cx="${cx - 1.6}" cy="${cy - 3}" r="1.8" fill="#dff8ff"/>`;
}

function pipMouth(expr) {
  const c = "#0b2b3a";
  if (expr === "happy" || expr === "excited") return `<path d="M51 68 Q60 79 69 68 Z" fill="${c}"/>`;
  if (expr === "worried") return `<path d="M52 73 Q56 68 60 73 Q64 78 68 73" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  if (expr === "sleepy") return `<circle cx="60" cy="72" r="3" fill="${c}"/>`;
  if (expr === "thinking") return `<path d="M54 72 H66" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  return `<path d="M53 69 Q60 75 67 69" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
}

// Pip the rover, same design as the game portrait. Wheels rest on y = 0.
function pip(key, expr = "happy", extra = "") {
  const light = expr === "worried" ? "#ff5c8a" : expr === "sleepy" ? "#8aa0b8" : "#5ee08a";
  const wheel = (x, i) => `<g transform="translate(${x} 104)"><g data-a="${key}-w${i}"><circle r="11" fill="#555c80" stroke="${INK}" stroke-width="2.5"/><path d="M-7 0 H7 M0 -7 V7" stroke="#cfd6ea" stroke-width="2.5" stroke-linecap="round"/></g></g>`;
  return (
    `<g data-a="${key}" data-solo="1"><g transform="translate(-60 -115)">` +
    `<ellipse cx="60" cy="117" rx="54" ry="7" fill="#05060f" opacity="0.3"/>` +
    `<path d="M60 22 V10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle data-a="${key}-led" cx="60" cy="8" r="5" fill="${light}" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="14" y="92" width="92" height="18" rx="9" fill="#3a3f5c" stroke="${INK}" stroke-width="2.5"/>` +
    wheel(30, 0) + wheel(60, 1) + wheel(90, 2) +
    `<rect x="20" y="22" width="80" height="72" rx="20" fill="#ffd166" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="28" y="34" width="64" height="50" rx="14" fill="#7fe3ff" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M34 42 Q40 36 50 37" fill="none" stroke="#e9fbff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>` +
    pipEye(46, expr) + pipEye(74, expr) + pipMouth(expr) +
    `<rect x="10" y="48" width="10" height="20" rx="5" fill="#ff9f43" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="100" y="48" width="10" height="20" rx="5" fill="#ff9f43" stroke="${INK}" stroke-width="2.5"/>` +
    extra +
    `</g></g>`
  );
}

function roll(q, key, degrees) {
  for (let i = 0; i < 3; i += 1) T(q(`${key}-w${i}`), 0, 0, 1, degrees);
}

// A small ice crystal that rides on Pip's roof (in Pip's own 120 x 124 box).
const PIP_ICE = `<g transform="translate(60 4)"><ellipse cx="0" cy="6" rx="26" ry="20" fill="url(#cxBlue)" opacity="0.7"/><path d="M-14 16 L-8 -6 L2 -16 L12 -4 L16 16 Z" fill="url(#cxIce)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-8 -6 L2 2 L12 -4 M2 2 V16" stroke="#ffffff" stroke-width="2" opacity="0.8" fill="none"/></g>`;

// A small astronaut. Boots rest on y = 0. accent is the suit stripe color.
function astro(key, accent = "#ff9f43") {
  return (
    `<g data-a="${key}" data-solo="1">` +
    `<ellipse cx="0" cy="2" rx="40" ry="7" fill="#05060f" opacity="0.28"/>` +
    `<rect x="-30" y="-106" width="60" height="62" rx="12" fill="#aeb6cc" stroke="${INK}" stroke-width="4"/>` +
    `<g transform="translate(-13 -40)"><g data-a="${key}-l0"><rect x="-10" y="0" width="20" height="40" rx="9" fill="#eef1f8" stroke="${INK}" stroke-width="4"/><rect x="-12" y="28" width="26" height="13" rx="6" fill="#59607a" stroke="${INK}" stroke-width="3"/></g></g>` +
    `<g transform="translate(13 -40)"><g data-a="${key}-l1"><rect x="-10" y="0" width="20" height="40" rx="9" fill="#eef1f8" stroke="${INK}" stroke-width="4"/><rect x="-12" y="28" width="26" height="13" rx="6" fill="#59607a" stroke="${INK}" stroke-width="3"/></g></g>` +
    `<g transform="translate(-34 -90)"><g data-a="${key}-a0"><rect x="-9" y="-4" width="18" height="46" rx="9" fill="#eef1f8" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="42" r="9" fill="#59607a" stroke="${INK}" stroke-width="3"/></g></g>` +
    `<rect x="-30" y="-98" width="60" height="64" rx="20" fill="#f8faff" stroke="${INK}" stroke-width="4"/>` +
    `<rect x="-30" y="-74" width="60" height="11" fill="${accent}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="-12" y="-58" width="24" height="14" rx="4" fill="#59607a" stroke="${INK}" stroke-width="3"/>` +
    `<g transform="translate(34 -90)"><g data-a="${key}-a1"><rect x="-9" y="-4" width="18" height="46" rx="9" fill="#eef1f8" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="42" r="9" fill="#59607a" stroke="${INK}" stroke-width="3"/></g></g>` +
    `<circle cx="0" cy="-126" r="37" fill="#fdfdff" stroke="${INK}" stroke-width="4"/>` +
    `<ellipse cx="2" cy="-124" rx="27" ry="23" fill="url(#cxVisor)" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M-9 -122 q5 -7 10 0 M8 -122 q5 -7 10 0" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M-4 -112 q6 6 12 0" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M-14 -138 q8 -8 20 -6" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.6"/>` +
    `</g>`
  );
}

function walk(q, key, t, amount = 22) {
  const swing = Math.sin(t * 9) * amount;
  T(q(`${key}-l0`), 0, 0, 1, swing);
  T(q(`${key}-l1`), 0, 0, 1, -swing);
  T(q(`${key}-a0`), 0, 0, 1, -swing * 0.8);
  T(q(`${key}-a1`), 0, 0, 1, swing * 0.8);
}

function wave(q, key, t) {
  T(q(`${key}-a1`), 0, 0, 1, -150 + Math.sin(t * 8) * 22);
}

function cheer(q, key) {
  T(q(`${key}-a0`), 0, 0, 1, 150);
  T(q(`${key}-a1`), 0, 0, 1, -150);
}

const hop = (t, speed = 6, height = 46, phase = 0) => -Math.abs(Math.sin(t * speed + phase)) * height;

// ------------------------------------------------------- storm and extras

function streaks(key, count = 26, seed = 5) {
  const r = mulberry(seed);
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const len = 60 + r() * 120;
    out += `<path data-a="${key}${i}" d="M0 0 l${n(len)} ${n(len * 0.55)}" stroke="#ffe08a" stroke-width="${n(2 + r() * 3)}" stroke-linecap="round" opacity="${n(0.45 + r() * 0.5)}"/>`;
  }
  return `<g data-a="${key}" data-solo="1">${out}</g>`;
}

function rain(q, key, count, t, seed = 5, yStop = 0) {
  const r = mulberry(seed + 99);
  for (let i = 0; i < count; i += 1) {
    const x0 = r() * (W + 600) - 500;
    const y0 = r() * H - 300;
    const speed = 620 + r() * 520;
    const travel = (t * speed + r() * 1500) % 1500;
    let x = x0 + travel;
    let y = y0 + travel * 0.55;
    x = ((x + 300) % (W + 600)) - 300;
    y = ((y + 300) % (H + 300)) - 300;
    const el = q(`${key}${i}`);
    T(el, x, y);
    if (yStop) O(el, y > yStop - 60 ? 0 : 0.8);
  }
}

function confetti(key, count = 46, seed = 11) {
  const r = mulberry(seed);
  const colors = ["#ffd166", "#ff7bd0", "#7fe3ff", "#5ee08a", "#ffffff", "#ff9f43"];
  let out = "";
  for (let i = 0; i < count; i += 1) {
    const c = colors[i % colors.length];
    const s = 7 + r() * 9;
    const piece = i % 3 === 0
      ? `<path d="M0 ${-s} L${s * 0.3} ${-s * 0.3} L${s} 0 L${s * 0.3} ${s * 0.3} L0 ${s} L${-s * 0.3} ${s * 0.3} L${-s} 0 L${-s * 0.3} ${-s * 0.3} Z" fill="${c}"/>`
      : i % 3 === 1
        ? `<rect x="${-s / 2}" y="${-s / 4}" width="${s}" height="${s / 2}" rx="2" fill="${c}"/>`
        : `<circle r="${s / 2.4}" fill="${c}"/>`;
    out += `<g data-a="${key}${i}">${piece}</g>`;
  }
  return `<g data-solo="1">${out}</g>`;
}

function fall(q, key, count, t, seed = 11) {
  const r = mulberry(seed + 7);
  for (let i = 0; i < count; i += 1) {
    const x = r() * W;
    const speed = 150 + r() * 190;
    const y = ((r() * H + t * speed) % (H + 80)) - 40;
    T(q(`${key}${i}`), x + Math.sin(t * 2 + i) * 26, y, 1, t * (90 + r() * 160) + i * 40);
  }
}

function iceCluster(scale = 1) {
  const spike = (x, w, h, lean) => `<path d="M${x - w} 0 L${x - w * 0.4 + lean} ${-h * 0.7} L${x + lean} ${-h} L${x + w * 0.5 + lean} ${-h * 0.62} L${x + w} 0 Z" fill="url(#cxIce)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M${x - w * 0.4 + lean} ${-h * 0.7} L${x + lean * 0.4} ${-h * 0.3} L${x + w * 0.5 + lean} ${-h * 0.62} M${x + lean * 0.4} ${-h * 0.3} V0" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.75"/>`;
  return `<g transform="scale(${scale})"><ellipse cx="0" cy="-30" rx="170" ry="110" fill="url(#cxBlue)" opacity="0.55"/>${spike(-70, 30, 80, -8)}${spike(62, 34, 104, 10)}${spike(0, 42, 150, 0)}${spike(-30, 20, 54, -4)}${spike(98, 18, 46, 6)}</g>`;
}

function headlight(key, length = 520, spread = 150) {
  return `<path data-a="${key}" d="M0 0 L${length} ${-spread} L${length} ${spread * 0.5} Z" fill="url(#cxBeam)"/>`;
}

function cart(key) {
  const wheel = (x, i) => `<g transform="translate(${x} -16)"><g data-a="${key}-w${i}"><circle r="16" fill="#3a3f5c" stroke="${INK}" stroke-width="4"/><path d="M-10 0 H10 M0 -10 V10" stroke="#cfd6ea" stroke-width="3" stroke-linecap="round"/></g></g>`;
  return (
    `<g data-a="${key}">` +
    `<ellipse cx="0" cy="2" rx="80" ry="8" fill="#05060f" opacity="0.3"/>` +
    `<rect x="-70" y="-66" width="140" height="44" rx="14" fill="#ffd166" stroke="${INK}" stroke-width="5"/>` +
    `<rect x="14" y="-98" width="46" height="36" rx="10" fill="#7fe3ff" stroke="${INK}" stroke-width="4"/>` +
    `<path d="M-60 -66 V-86 H-10" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
    `<circle cx="70" cy="-46" r="8" fill="#fff7c2" stroke="${INK}" stroke-width="3"/>` +
    wheel(-42, 0) + wheel(0, 1) + wheel(42, 2) +
    `</g>`
  );
}

function medal(key) {
  return (
    `<g data-a="${key}" data-solo="1">` +
    `<path d="M-54 -40 L-96 150 L-52 128 L-30 170 L0 20 Z" fill="#ff5c8a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="M54 -40 L96 150 L52 128 L30 170 L0 20 Z" fill="#4fd1ff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<circle r="130" fill="url(#cxMedal)" stroke="${INK}" stroke-width="8"/>` +
    `<circle r="104" fill="none" stroke="#fff3c0" stroke-width="6" opacity="0.8"/>` +
    `<path d="M0 -78 L22 -26 L78 -22 L34 14 L48 70 L0 40 L-48 70 L-34 14 L-78 -22 L-22 -26 Z" fill="#ffffff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
    `<clipPath id="cxClip-${key}"><circle r="126"/></clipPath>` +
    `<g clip-path="url(#cxClip-${key})"><rect data-a="${key}-shine" x="-40" y="-200" width="70" height="400" fill="#ffffff" opacity="0.5" transform="translate(-400 0) rotate(20)"/></g>` +
    `</g>`
  );
}

function rays(key, count = 14, length = 900) {
  let out = "";
  for (let i = 0; i < count; i += 1) out += `<path d="M0 0 L-46 ${-length} L46 ${-length} Z" fill="#ffd166" opacity="0.16" transform="rotate(${(360 / count) * i})"/>`;
  return `<g data-a="${key}" data-solo="1">${out}</g>`;
}

// --------------------------------------------------------------- the shots

const wrap = (body, after = "") => `<g data-a="cam">${body}</g>${after}`;

export const SCENES = {
  // ------------------------------------------------------------ opening
  "opening.earth": {
    build: () => wrap(sky(1, 190) + `<g transform="translate(1330 170)">${moonDisc("m", 44)}</g><g transform="translate(800 470)">${earth("e", 310)}</g>`),
    frame(q, p, t) {
      cam(q, lerp(1, 1.14, easeInOut(p)), 800, 470);
      spin(q, "e", 310, 135, t * 0.03);
    }
  },
  "opening.moon": {
    build: () =>
      wrap(
        sky(2, 170) +
          `<g transform="translate(250 180)">${earth("e", 74)}</g>` +
          `<g transform="translate(800 520)">${moonDisc("m", 330)}<g data-a="ring" transform="translate(0 286)"><circle r="20" fill="none" stroke="#ffd166" stroke-width="5"/></g><circle cx="0" cy="286" r="46" fill="url(#cxWarm)"/><circle cx="0" cy="286" r="8" fill="#fff7c2"/></g>`
      ),
    frame(q, p, t) {
      cam(q, lerp(1, 1.3, easeInOut(p)), 800, 820);
      spin(q, "e", 74, 130, t * 0.03);
      const pulse = (t % 1.2) / 1.2;
      T(q("ring"), 0, 286, 1 + pulse * 2.4);
      O(q("ring"), 1 - pulse);
    }
  },
  "opening.surface": {
    build: () =>
      wrap(
        sky(3, 150) +
          `<g transform="translate(1260 200)">${earth("e", 62)}</g>` +
          ground() +
          base(800, 1, { plants: false }) + dusk(0.35) + baseLights(800)
      ),
    frame(q, p, t) {
      cam(q, 1.12, 800, 560, lerp(-90, 90, easeInOut(p)), 0);
      spin(q, "e", 62, 130, t * 0.03);
    }
  },
  "opening.lights": {
    build: () =>
      wrap(
        sky(3, 150) + `<g transform="translate(1260 200)">${earth("e", 62)}</g>` + ground() + base(800, 1, { plants: false }) + dusk(0.45) + baseLights(800) + pip("pip", "excited")
      ),
    frame(q, p, t) {
      cam(q, lerp(1.12, 1, easeOut(p)), 800, 560);
      spin(q, "e", 62, 128, t * 0.03);
      O(q("wins"), seg(p, 0.12, 0.3));
      O(q("ghglow"), seg(p, 0.35, 0.55) * (0.85 + 0.15 * Math.sin(t * 3)));
      O(q("beacon"), seg(p, 0.5, 0.6) * (0.5 + 0.5 * Math.sin(t * 6)));
      const drive = easeOut(seg(p, 0.1, 0.7));
      T(q("pip"), lerp(1760, 1010, drive), GY + 120 + (drive >= 1 ? hop(t, 7, 26) : 0), 1.45);
      roll(q, "pip", -drive * 900);
    }
  },

  // ------------------------------------------------------------ arrival
  "arrival.descent": {
    build: () =>
      wrap(
        sky(4, 160) + `<g transform="translate(300 170)">${earth("e", 58)}</g>` + ground() +
          `<ellipse data-a="shade" cx="800" cy="${GY + 6}" rx="150" ry="16" fill="#1a1c33" opacity="0.2"/>` +
          `<ellipse data-a="glow" cx="800" cy="${GY}" rx="260" ry="46" fill="url(#cxWarm)" opacity="0"/>` +
          lander("ship")
      ),
    frame(q, p, t) {
      const y = lerp(-60, 420, easeOut(p));
      T(q("ship"), 800 + Math.sin(t * 1.6) * 12, y, 1, Math.sin(t * 1.6 + 1) * 2);
      flicker(q, "ship-flame", t, 1.05);
      O(q("llight"), 0.6 + 0.4 * Math.sin(t * 10));
      T(q("shade"), 0, 0, 1);
      q("shade")?.setAttribute("rx", n(lerp(60, 170, p)));
      O(q("shade"), lerp(0.08, 0.36, p));
      O(q("glow"), lerp(0, 0.5, p) * (0.8 + 0.2 * Math.sin(t * 30)));
      spin(q, "e", 58, 120, t * 0.03);
    }
  },
  "arrival.touchdown": {
    build: () =>
      wrap(
        sky(4, 160) + `<g transform="translate(300 170)">${earth("e", 58)}</g>` + ground() +
          `<ellipse cx="800" cy="${GY + 6}" rx="190" ry="18" fill="#1a1c33" opacity="0.36"/>` +
          `<ellipse data-a="glow" cx="800" cy="${GY}" rx="300" ry="54" fill="url(#cxWarm)" opacity="0"/>` +
          lander("ship") + dustPuffs("d", 14)
      ),
    frame(q, p, t) {
      const down = easeOut(seg(p, 0, 0.45));
      const settle = p > 0.45 ? Math.sin((p - 0.45) * 46) * 9 * Math.exp(-(p - 0.45) * 12) : 0;
      T(q("ship"), 800, lerp(430, GY, down) + settle, 1, 0);
      const power = 1 - seg(p, 0.36, 0.5);
      flicker(q, "ship-flame", t, power * lerp(1, 0.55, down));
      O(q("glow"), power * 0.7);
      blowDust(q, "d", 14, 800, GY, seg(p, 0.18, 1));
      cam(q, 1.12, 800, 600, Math.sin(t * 13) * 4 * power * down, Math.sin(t * 17) * 3 * power * down);
      spin(q, "e", 58, 119, t * 0.03);
    }
  },
  "arrival.ramp": {
    build: () =>
      wrap(
        sky(4, 160) + `<g transform="translate(1260 190)">${earth("e", 58)}</g>` + ground() +
          `<g transform="translate(470 ${GY})"><ellipse cx="0" cy="6" rx="190" ry="18" fill="#1a1c33" opacity="0.36"/>${landerStage()}<g transform="translate(0 -206)">${landerCabin()}</g>` +
          `<rect x="-17" y="-246" width="34" height="38" rx="7" fill="#ffe29a"/></g>` +
          `<g transform="translate(492 ${GY - 206}) rotate(33)"><g data-a="ramp"><rect x="0" y="-9" width="380" height="18" rx="6" fill="#c9cfdf" stroke="${INK}" stroke-width="5"/><path d="M40 -9 V9 M110 -9 V9 M180 -9 V9 M250 -9 V9 M320 -9 V9" stroke="${INK}" stroke-width="3" opacity="0.5"/></g></g>` +
          astro("a1", "#ff9f43") + astro("a2", "#5ee08a") + pip("pip", "excited")
      ),
    frame(q, p, t) {
      const out = easeOut(seg(p, 0, 0.18));
      T(q("ramp"), 0, 0, 1, 0);
      q("ramp")?.setAttribute("transform", `scale(${n(Math.max(0.02, out))} 1)`);
      const slide = easeInOut(seg(p, 0.16, 0.5));
      const onRamp = slide < 1;
      const px = lerp(520, 812, slide);
      const py = lerp(GY - 206, GY - 14, slide) - 12;
      const turn = easeInOut(seg(p, 0.56, 0.86));
      const along = easeOut(seg(p, 0.5, 0.62));
      T(q("pip"), onRamp ? px : lerp(812, 960, along), onRamp ? py : GY + hop(turn * Math.PI, 1, 90), 1.15, onRamp ? 33 : turn * 360);
      O(q("pip"), seg(p, 0.14, 0.2));
      roll(q, "pip", slide * 700 + along * 300);
      const step = seg(p, 0.5, 0.72);
      T(q("a1"), lerp(800, 1130, easeOut(step)), GY + (step < 1 ? hop(t, 9, 8) : 0), 1.05);
      T(q("a2"), lerp(800, 1250, easeOut(seg(p, 0.58, 0.82))), GY + (seg(p, 0.58, 0.82) < 1 ? hop(t, 9, 8, 1) : 0), 1.05);
      O(q("a1"), seg(p, 0.5, 0.56));
      O(q("a2"), seg(p, 0.58, 0.64));
      if (step < 1) walk(q, "a1", t); else { walk(q, "a1", 0, 0); wave(q, "a1", t); }
      if (seg(p, 0.58, 0.82) < 1) walk(q, "a2", t + 1); else { walk(q, "a2", 0, 0); wave(q, "a2", t + 0.4); }
      spin(q, "e", 58, 118, t * 0.03);
    }
  },
  "arrival.base": {
    build: () =>
      wrap(
        sky(4, 160) + `<g transform="translate(1320 170)">${earth("e", 58)}</g>` + ground() +
          `<g transform="translate(190 ${GY - 6}) scale(0.5)">${landerStage()}<g transform="translate(0 -206)">${landerCabin()}</g></g>` +
          base(1090, 0.82, { plants: false }) + dusk(0.2) + baseLights(1090, 0.82) + astro("a1", "#ff9f43") + astro("a2", "#5ee08a") + pip("pip", "happy")
      ),
    frame(q, p, t) {
      cam(q, 1.08, 800, 600, lerp(60, -60, easeInOut(p)), 0);
      O(q("wins"), 1);
      O(q("ghglow"), 0.85 + 0.15 * Math.sin(t * 3));
      O(q("beacon"), 0.5 + 0.5 * Math.sin(t * 6));
      const go = easeInOut(p);
      T(q("a1"), lerp(360, 640, go), GY + 50 + hop(t, 9, 8), 0.95);
      T(q("a2"), lerp(270, 550, go), GY + 60 + hop(t, 9, 8, 1), 0.95);
      walk(q, "a1", t);
      walk(q, "a2", t + 1);
      T(q("pip"), lerp(470, 760, go), GY + 80, 1);
      roll(q, "pip", go * 700);
      spin(q, "e", 58, 117, t * 0.03);
    }
  },

  // ---------------------------------------------------------- nightfall
  "night.sunset": {
    build: () =>
      wrap(
        sky(5, 150) + `<g data-a="sun" data-solo="1"><circle r="330" fill="url(#cxSun)"/><circle r="64" fill="#fffbe6"/></g>` + ground() +
          `<g transform="translate(900 ${GY})"><g data-a="shadow"><path d="M-200 4 L900 76 L900 8 L190 -4 Z" fill="url(#cxFadeR)"/></g></g>` +
          base(900) + dusk(0) + baseLights(900)
      ),
    frame(q, p) {
      const e = easeInOut(p);
      T(q("sun"), 300, lerp(430, 600, e));
      T(q("shadow"), 0, 0, 1, 0, 1);
      q("shadow")?.setAttribute("transform", `scale(${n(lerp(0.5, 1.5, e))} 1)`);
      O(q("dusk"), lerp(0, 0.5, e));
      O(q("wins"), seg(p, 0.6, 0.9));
    }
  },
  "night.shadows": {
    build: () =>
      wrap(
        sky(5, 150) + `<g data-a="sun" data-solo="1"><circle r="300" fill="url(#cxSun)"/></g>` + ground() + base(700, 1.25) +
          `<path data-a="sweep" data-solo="1" d="M-1700 420 L0 420 L260 900 L-1700 900 Z" fill="#070a1c" opacity="0.72"/>` + dusk(0.45) + baseLights(700, 1.25)
      ),
    frame(q, p) {
      const e = easeInOut(p);
      cam(q, lerp(1.18, 1.26, easeInOut(p)), 1250, 600);
      T(q("sun"), 300, lerp(600, 720, e));
      O(q("sun"), 1 - e);
      T(q("sweep"), lerp(300, 1750, e), 0);
      for (let i = 0; i < 3; i += 1) O(q(`pdim${i}`), seg(e, 0.35 + i * 0.14, 0.55 + i * 0.14) * 0.65);
      O(q("dusk"), lerp(0.45, 0.7, e));
      O(q("wins"), 1);
    }
  },
  "night.battery": {
    build: () =>
      wrap(
        sky(6, 190) + `<g transform="translate(1290 180)">${earth("e", 62)}</g>` + ground() + base(720) +
          `<g transform="translate(1340 ${GY + 170})"><ellipse cx="0" cy="4" rx="150" ry="12" fill="#05060f" opacity="0.3"/><rect x="-130" y="-120" width="260" height="120" rx="20" fill="#3a3f5c" stroke="${INK}" stroke-width="6"/><rect x="-22" y="-136" width="44" height="18" rx="6" fill="#59607a" stroke="${INK}" stroke-width="5"/></g>` +
          dusk(0.78) + baseLights(720) +
          `<g transform="translate(1340 ${GY + 170})">${[0, 1, 2, 3].map((i) => `<g data-a="cell${i}"><rect x="${-112 + i * 58}" y="-102" width="46" height="84" rx="10" fill="#5ee08a"/><rect x="${-112 + i * 58}" y="-102" width="46" height="20" rx="8" fill="#b9ffd0"/></g>`).join("")}<ellipse data-a="bglow" cx="0" cy="-60" rx="210" ry="120" fill="url(#cxWarm)" opacity="0.25"/></g>`
      ),
    frame(q, p, t) {
      cam(q, lerp(1, 1.08, easeInOut(p)), 1000, 620);
      O(q("wins"), 0.9 + 0.1 * Math.sin(t * 2));
      O(q("ghglow"), 0.85 + 0.15 * Math.sin(t * 3));
      O(q("beacon"), 0.5 + 0.5 * Math.sin(t * 6));
      O(q("cell3"), 1 - seg(p, 0.25, 0.6) * 0.82);
      O(q("cell2"), 1 - seg(p, 0.65, 0.95) * 0.5);
      spin(q, "e", 62, 120, t * 0.03);
    }
  },
  "night.pip": {
    build: () =>
      wrap(
        sky(6, 190) + ground() + base(640, 1.5) + dusk(0.8) + baseLights(640, 1.5) + pip("pip", "sleepy") +
          [0, 1, 2].map((i) => `<path data-a="z${i}" d="M-14 -12 H14 L-14 12 H14" fill="none" stroke="#cfe3ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`).join("")
      ),
    frame(q, p, t) {
      cam(q, lerp(1.15, 1.3, easeInOut(p)), 1090, 640);
      O(q("wins"), 0.9 + 0.1 * Math.sin(t * 2));
      O(q("ghglow"), 0.8);
      T(q("pip"), 1110, GY + 70 + Math.sin(t * 2) * 3, 1.5, Math.sin(t * 1.4) * 2);
      for (let i = 0; i < 3; i += 1) {
        const life = ((t * 0.5 + i / 3) % 1);
        T(q(`z${i}`), 1190 + life * 70 + Math.sin(life * 6) * 10, GY - 150 - life * 150, 0.5 + life * 0.9);
        O(q(`z${i}`), Math.sin(life * Math.PI));
      }
    }
  },

  // ------------------------------------------------------------- rescue
  "rescue.dark": {
    build: () =>
      wrap(
        `<rect width="${W}" height="${H}" fill="#02030a"/>${stars(8, 110, 0, 300)}` +
          `<path d="M0 250 C120 236 200 262 300 250 C420 420 520 640 700 720 C900 780 1100 770 1250 690 C1380 610 1440 400 1500 262 C1540 250 1570 258 1600 250 L1600 900 L0 900 Z" fill="url(#cxBowl)"/>` +
          `<path d="M0 250 C120 236 200 262 300 250 M1500 262 C1540 250 1570 258 1600 250" fill="none" stroke="#e9ebf4" stroke-width="7" stroke-linecap="round"/>` +
          `<path d="M300 250 C420 420 520 640 700 720 C900 780 1100 770 1250 690 C1380 610 1440 400 1500 262" fill="none" stroke="#6f7591" stroke-width="4" opacity="0.6"/>` +
          `<path d="M360 380 q60 30 90 110 M1440 400 q-50 40 -70 120 M430 560 q60 40 120 90" fill="none" stroke="#2c3354" stroke-width="5" stroke-linecap="round"/>` +
          `<g opacity="0.55">${rock(560, 800, 1.6)}${rock(1260, 780, 1.3)}${rock(380, 720, 1)}</g>` +
          `<g transform="translate(1130 800)" opacity="0.55">${iceCluster(0.7)}</g>` +
          `<g transform="translate(830 710)">${headlight("beam", 620, 150)}</g>` + pip("pip", "worried") +
          `<g data-a="warn" transform="translate(720 500)"><circle r="70" fill="url(#cxRed)"/></g>`
      ),
    frame(q, p, t) {
      cam(q, lerp(1, 1.16, easeInOut(p)), 800, 640);
      T(q("pip"), 720, 800 + Math.sin(t * 20) * 1.2, 2.1);
      const blink = Math.sin(t * 7) > 0.2 ? 1 : 0.18;
      O(q("beam"), blink * 0.8);
      O(q("warn"), 0.4 + 0.6 * Math.abs(Math.sin(t * 4)));
    }
  },
  "rescue.frost": {
    build: () => {
      const r = mulberry(21);
      let frost = "";
      for (let i = 0; i < 16; i += 1) frost += sparkle(`f${i}`, 700 + r() * 780, 560 + r() * 250, 8 + r() * 12, i % 3 ? "#e9fbff" : "#9fdcff");
      return wrap(
        `<rect width="${W}" height="${H}" fill="#02030a"/>${stars(8, 60, 0, 260)}` +
          `<path d="M0 260 C300 240 700 270 1000 255 C1250 245 1450 265 1600 250 L1600 900 L0 900 Z" fill="#0a0d1e"/>` +
          `<path d="M0 650 C400 720 1200 720 1600 650 L1600 900 L0 900 Z" fill="#070914"/>` +
          `<g transform="translate(520 640)">${headlight("beam", 1000, 300)}</g>` +
          `<g transform="translate(1120 790)">${iceCluster(1.5)}</g>` + frost + pip("pip", "excited", PIP_ICE)
      );
    },
    frame(q, p, t) {
      cam(q, lerp(1.05, 1.16, easeInOut(p)), 900, 640);
      T(q("pip"), 410, 800, 2.5);
      O(q("beam"), 0.75 + 0.1 * Math.sin(t * 9));
      for (let i = 0; i < 16; i += 1) twinkle(q, `f${i}`, t, i * 1.7, 3 + (i % 4));
    }
  },
  "rescue.cart": {
    build: () => {
      const dots = [[300, 372], [410, 420], [520, 470], [640, 530], [760, 600], [880, 670], [1000, 730]];
      return wrap(
        `<rect width="${W}" height="${H}" fill="#02030a"/>${stars(9, 110, 0, 320)}` +
          `<g transform="translate(140 300) scale(0.34)"><g transform="translate(0 0)">${baseBody()}</g>${baseGlow()}</g>` +
          `<path d="M0 320 C150 300 260 320 330 360 C560 480 900 700 1180 800 C1350 850 1500 850 1600 830 L1600 900 L0 900 Z" fill="#0d1124"/>` +
          `<path d="M0 320 C150 300 260 320 330 360 C560 480 900 700 1180 800" fill="none" stroke="#aeb3c8" stroke-width="5" opacity="0.6"/>` +
          dots.map(([x, y], i) => `<g data-a="mk${i}" opacity="0.15"><circle cx="${x}" cy="${y + 26}" r="34" fill="url(#cxWarm)"/><circle cx="${x}" cy="${y + 26}" r="7" fill="#fff7c2"/></g>`).join("") +
          `<g transform="translate(1330 868) scale(1.25)">${pip("pip", "happy", PIP_ICE)}</g>` +
          `<g data-a="cartpos" data-solo="1"><g transform="translate(60 -50) rotate(4)">${headlight("beam", 380, 110)}</g>${cart("cart")}</g>`
      );
    },
    frame(q, p, t) {
      const e = easeInOut(p);
      const x = lerp(250, 1060, e);
      const y = lerp(338, 778, Math.pow(e, 1.15));
      T(q("cartpos"), x, y + Math.sin(t * 18) * 1.5, 1, 27);
      for (let i = 0; i < 3; i += 1) T(q(`cart-w${i}`), 0, 0, 1, e * 1500);
      for (let i = 0; i < 7; i += 1) O(q(`mk${i}`), 0.15 + 0.85 * seg(e, i / 8 - 0.02, i / 8 + 0.06));
      O(q("wins"), 1);
      O(q("ghglow"), 0.8);
      O(q("pip-led"), 0.4 + 0.6 * Math.abs(Math.sin(t * 5)));
    }
  },
  "rescue.tow": {
    build: () =>
      wrap(
        sky(10, 170) + `<g transform="translate(330 190)">${earth("e", 58)}</g>` + ground() + base(1230, 0.8) + dusk(0.62) + baseLights(1230, 0.8) +
          `<path data-a="rope" d="M0 0 H10" stroke="#cfd6ea" stroke-width="5" stroke-linecap="round"/>` +
          pip("pip", "happy", PIP_ICE) + `<g data-a="cartpos" data-solo="1"><g transform="translate(60 -50)">${headlight("beam", 360, 100)}</g>${cart("cart")}</g>`
      ),
    frame(q, p, t) {
      const e = easeInOut(p);
      const x = lerp(430, 780, e);
      T(q("cartpos"), x, GY + 90 + Math.sin(t * 18) * 1.5);
      for (let i = 0; i < 3; i += 1) T(q(`cart-w${i}`), 0, 0, 1, e * 900);
      const px = x - 230;
      T(q("pip"), px, GY + 92, 1.25);
      roll(q, "pip", e * 900);
      q("rope")?.setAttribute("d", `M${n(px + 62)} ${GY + 30} Q${n((px + x) / 2)} ${GY + 62} ${n(x - 70)} ${GY + 30}`);
      O(q("wins"), 1);
      O(q("ghglow"), 0.85 + 0.15 * Math.sin(t * 3));
      O(q("beacon"), 0.5 + 0.5 * Math.sin(t * 6));
      spin(q, "e", 58, 118, t * 0.03);
    }
  },

  // -------------------------------------------------------------- storm
  "storm.flare": {
    build: () =>
      wrap(
        sky(12, 150) +
          `<g transform="translate(380 330)">` +
          `<g data-a="rays">${Array.from({ length: 16 }, (_, i) => `<path d="M0 -130 L-16 -${330 + (i % 3) * 90} L16 -${330 + (i % 3) * 90} Z" fill="#ffd27a" opacity="0.3" transform="rotate(${i * 22.5})"/>`).join("")}</g>` +
          `<circle r="420" fill="url(#cxSun)"/>` +
          `<g data-a="ring"><circle r="120" fill="none" stroke="#ffe7a8" stroke-width="5" opacity="0.8" vector-effect="non-scaling-stroke"/></g>` +
          `<g data-a="loop"><path d="M60 -80 C210 -260 330 -60 150 40" fill="none" stroke="#ff9a2e" stroke-width="30" stroke-linecap="round"/><path d="M60 -80 C210 -260 330 -60 150 40" fill="none" stroke="#fff3c4" stroke-width="12" stroke-linecap="round"/></g>` +
          `<circle r="118" fill="#fff7d6"/><circle r="118" fill="none" stroke="#ffcf66" stroke-width="10"/>` +
          `<circle cx="-34" cy="-30" r="20" fill="#ffd27a" opacity="0.7"/><circle cx="36" cy="36" r="13" fill="#ffd27a" opacity="0.7"/>` +
          `<g data-a="flash"><circle r="560" fill="url(#cxSun)"/></g></g>` +
          streaks("s", 26, 5) +
          `<g transform="translate(1560 1420)">${moonDisc("m", 720)}</g>`
      ),
    frame(q, p, t) {
      cam(q, lerp(1.04, 1.1, easeInOut(p)), 380, 330, Math.sin(t * 12) * 5 * (1 - seg(p, 0.3, 0.6)) * seg(p, 0.15, 0.3), 0);
      T(q("rays"), 0, 0, 1 + 0.06 * Math.sin(t * 3), t * 8);
      const burst = easeOut(seg(p, 0.15, 0.5));
      T(q("loop"), 0, 0, lerp(0.2, 1.25, burst));
      O(q("loop"), seg(p, 0.12, 0.2));
      const wave = seg(p, 0.2, 0.95);
      T(q("ring"), 0, 0, 1 + wave * 9);
      O(q("ring"), (1 - wave) * seg(p, 0.2, 0.25));
      O(q("flash"), Math.sin(seg(p, 0.12, 0.45) * Math.PI) * 0.9);
      O(q("s"), seg(p, 0.4, 0.6));
      rain(q, "s", 26, t, 5);
    }
  },
  "storm.shelter": {
    build: () =>
      wrap(
        sky(13, 140) + ground() + base(1070, 0.9, { greenhouse: false }) +
          `<g transform="translate(400 ${GY + 20})">${shelterMound("hatch")}</g>` +
          astro("a1", "#ff9f43") + astro("a2", "#5ee08a") +
          [0, 1, 2].map((i) => `<circle data-a="clod${i}" r="13" fill="#9a8f7c" stroke="${INK}" stroke-width="4"/>`).join("") +
          pip("pip", "worried", `<g transform="translate(108 60)"><path d="M0 0 L34 -34" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M26 -46 L48 -40 L42 -18 Z" fill="#c9cfdf" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`) +
          baseLights(1070, 0.9, { greenhouse: false }) + streaks("s", 26, 6)
      ),
    frame(q, p, t) {
      rain(q, "s", 26, t, 6);
      O(q("alarm"), 0.35 + 0.65 * Math.abs(Math.sin(t * 5)));
      O(q("wins"), 0.6);
      O(q("hatch"), 0.8 + 0.2 * Math.sin(t * 4));
      const g1 = easeInOut(seg(p, 0, 0.6));
      const g2 = easeInOut(seg(p, 0.12, 0.78));
      T(q("a1"), lerp(840, 420, g1), GY + 26 + hop(t, 11, 8), -1, 0, 1);
      T(q("a2"), lerp(960, 420, g2), GY + 30 + hop(t, 11, 8, 1), -1, 0, 1);
      walk(q, "a1", t * 1.3);
      walk(q, "a2", t * 1.3 + 1);
      O(q("a1"), 1 - seg(p, 0.52, 0.62));
      O(q("a2"), 1 - seg(p, 0.7, 0.8));
      T(q("pip"), 730, GY + 60, 1.15, Math.sin(t * 8) * 4);
      for (let i = 0; i < 3; i += 1) {
        const life = (t * 0.9 + i / 3) % 1;
        T(q(`clod${i}`), lerp(790, 990, life), GY - 20 - Math.sin(life * Math.PI) * 190 - life * 90, 1 - life * 0.3, life * 300);
        O(q(`clod${i}`), life < 0.92 ? 1 : 0);
      }
    }
  },
  "storm.inside": {
    build: () => {
      const r = mulberry(31);
      let pebbles = "";
      for (let i = 0; i < 40; i += 1) pebbles += `<circle cx="${n(r() * W)}" cy="${n(250 + r() * 150)}" r="${n(4 + r() * 9)}" fill="#6b624f" opacity="${n(0.4 + r() * 0.5)}"/>`;
      return wrap(
        sky(13, 90) + streaks("s", 30, 7) +
          `<path d="M0 232 C400 214 1200 214 1600 232 L1600 900 L0 900 Z" fill="url(#cxDirt)"/><path d="M0 232 C400 214 1200 214 1600 232" fill="none" stroke="${INK}" stroke-width="6"/>` + pebbles +
          [0, 1, 2, 3, 4, 5].map((i) => `<circle data-a="hit${i}" cx="${180 + i * 250}" cy="226" r="16" fill="#fff3c4"/>`).join("") +
          `<rect x="330" y="420" width="940" height="400" rx="60" fill="url(#cxRoom)" stroke="${INK}" stroke-width="8"/>` +
          `<ellipse data-a="lamp" cx="800" cy="520" rx="470" ry="250" fill="url(#cxWarm)" opacity="0.5"/>` +
          `<path d="M800 420 V470" stroke="${INK}" stroke-width="6"/><path d="M760 470 H840 L826 500 H774 Z" fill="#ffe29a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
          `<rect x="430" y="770" width="740" height="26" rx="10" fill="#59607a" stroke="${INK}" stroke-width="5"/>` +
          `<g transform="translate(1090 640)"><rect x="-70" y="-60" width="140" height="100" rx="14" fill="#101733" stroke="${INK}" stroke-width="5"/><path d="M0 -40 L32 -26 V2 Q32 26 0 36 Q-32 26 -32 2 V-26 Z" fill="#5ee08a" stroke="${INK}" stroke-width="4"/><path d="M-14 -4 L-3 8 L16 -14" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>` +
          astro("a1", "#ff9f43") + astro("a2", "#5ee08a")
      );
    },
    frame(q, p, t) {
      rain(q, "s", 30, t, 7, 226);
      for (let i = 0; i < 6; i += 1) {
        const life = (t * 1.6 + i * 0.37) % 1;
        T(q(`hit${i}`), 0, 0, 1);
        q(`hit${i}`)?.setAttribute("r", n(6 + life * 26));
        O(q(`hit${i}`), (1 - life) * 0.8);
      }
      O(q("lamp"), 0.45 + 0.08 * Math.sin(t * 3));
      T(q("a1"), 620, 770 + Math.sin(t * 2.2) * 3, 1.7);
      T(q("a2"), 840, 770 + Math.sin(t * 2.2 + 1) * 3, 1.7);
      wave(q, "a1", t);
      T(q("a2-a0"), 0, 0, 1, Math.sin(t * 3) * 10);
      cam(q, lerp(1, 1.06, easeInOut(p)), 800, 620);
    }
  },
  "storm.pass": {
    build: () =>
      wrap(
        sky(14, 190) + `<g transform="translate(1280 190)">${earth("e", 62)}</g>` + ground() + base(1070, 0.9, { greenhouse: false }) +
          `<g transform="translate(400 ${GY + 20})">${shelterMound("hatch")}</g>` + astro("a1", "#ff9f43") + astro("a2", "#5ee08a") + pip("pip", "happy") +
          baseLights(1070, 0.9, { greenhouse: false }) + streaks("s", 26, 6)
      ),
    frame(q, p, t) {
      rain(q, "s", 26, t, 6);
      O(q("s"), 1 - seg(p, 0, 0.3));
      O(q("wins"), 1);
      O(q("beacon"), seg(p, 0.3, 0.4) * (0.5 + 0.5 * Math.sin(t * 6)));
      const o1 = easeOut(seg(p, 0.3, 0.6));
      const o2 = easeOut(seg(p, 0.42, 0.72));
      T(q("a1"), lerp(410, 560, o1), GY + 30 + (o1 >= 1 ? hop(t, 7, 26) : 0), 1.05);
      T(q("a2"), lerp(410, 250, o2), GY + 34 + (o2 >= 1 ? hop(t, 7, 26, 1) : 0), 1.05);
      O(q("a1"), seg(p, 0.3, 0.36));
      O(q("a2"), seg(p, 0.42, 0.48));
      if (o1 < 1) walk(q, "a1", t); else { walk(q, "a1", 0, 0); wave(q, "a1", t); }
      if (o2 < 1) walk(q, "a2", t); else { walk(q, "a2", 0, 0); cheer(q, "a2"); }
      T(q("pip"), 760, GY + 62 + hop(t, 7, 30) * seg(p, 0.3, 0.4), 1.15);
      spin(q, "e", 62, 118, t * 0.03);
    }
  },
  "storm.work": {
    build: () =>
      wrap(
        sky(13, 140) + ground() + base(760, 1.05) + baseLights(760, 1.05) +
          `<g transform="translate(760 ${GY}) scale(1.05)">${[-140, 62].map((x, i) => bust(x + 39, -97, 15, i ? "#5ee08a" : "#ff9f43")).join("")}</g>` +
          [0, 1, 2, 3, 4, 5].map((i) => sparkle(`sp${i}`, 1070 + (i % 3) * 107 + (i > 2 ? 30 : 0), GY - 110 + (i > 2 ? 40 : 0), 20, i % 2 ? "#fff3c4" : "#ffd166")).join("") +
          streaks("s", 28, 6)
      ),
    frame(q, p, t) {
      cam(q, lerp(1.04, 1.1, easeInOut(p)), 900, 600);
      rain(q, "s", 28, t, 6);
      O(q("wins"), 1);
      O(q("ghglow"), 0.8);
      O(q("alarm"), 0.35 + 0.65 * Math.abs(Math.sin(t * 5)));
      for (let i = 0; i < 6; i += 1) {
        const on = Math.sin(t * (13 + i * 3) + i * 2) > 0.55;
        T(q(`sp${i}`), 0, 0, on ? 1 + Math.sin(t * 40) * 0.2 : 0.01, t * 200);
        O(q(`sp${i}`), on ? 1 : 0);
      }
    }
  },
  "storm.panels": {
    build: () =>
      wrap(
        sky(13, 140) + ground() + base(420, 1.7) + baseLights(420, 1.7) +
          [0, 1, 2, 3, 4].map((i) => sparkle(`sp${i}`, 940 + i * 95, GY - 190 + (i % 2) * 70, 28, i % 2 ? "#fff3c4" : "#ffd166")).join("") +
          [0, 1, 2].map((i) => `<circle data-a="smoke${i}" r="34" fill="url(#cxDustG)"/>`).join("") + streaks("s", 20, 6)
      ),
    frame(q, p, t) {
      cam(q, lerp(1, 1.1, easeInOut(p)), 1150, 520);
      rain(q, "s", 20, t, 6);
      O(q("s"), 1 - seg(p, 0.5, 0.9));
      for (let i = 0; i < 3; i += 1) {
        O(q(`pcrack${i}`), seg(p, 0.1 + i * 0.15, 0.2 + i * 0.15));
        O(q(`pdim${i}`), seg(p, 0.1 + i * 0.15, 0.3 + i * 0.15) * 0.45);
        const life = (t * 0.45 + i / 3) % 1;
        T(q(`smoke${i}`), 970 + i * 172 + Math.sin(life * 5) * 16, GY - 190 - life * 200, 0.5 + life * 1.4);
        O(q(`smoke${i}`), Math.sin(life * Math.PI) * 0.6 * seg(p, 0.2, 0.4));
      }
      for (let i = 0; i < 5; i += 1) {
        const on = Math.sin(t * (11 + i * 4) + i) > 0.5 && p < 0.85;
        T(q(`sp${i}`), 0, 0, on ? 1 : 0.01, t * 200);
        O(q(`sp${i}`), on ? 1 : 0);
      }
      O(q("wins"), 1);
    }
  },
  "storm.ok": {
    build: () =>
      wrap(
        sky(14, 190) + `<g transform="translate(300 190)">${earth("e", 62)}</g>` + ground() + base(700, 1.05) + baseLights(700, 1.05) +
          `<g transform="translate(700 ${GY}) scale(1.05)">${[-140, 62].map((x, i) => bust(x + 34, -97, 15, i ? "#5ee08a" : "#ff9f43") + `<g transform="translate(${x + 62} -76)"><g data-a="hand${i}"><rect x="-5" y="-24" width="10" height="26" rx="5" fill="#eef1f8" stroke="${INK}" stroke-width="3"/></g></g>`).join("")}</g>` +
          pip("pip", "thinking") +
          `<g data-a="tool" data-solo="1"><circle r="46" fill="#101733" stroke="#7fe3ff" stroke-width="5"/><path d="M-18 18 L10 -10" stroke="#cfd6ea" stroke-width="10" stroke-linecap="round"/><path d="M6 -24 A16 16 0 1 0 24 -6 L12 -8 L8 -12 Z" fill="#cfd6ea" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`
      ),
    frame(q, p, t) {
      cam(q, lerp(1.04, 1.12, easeInOut(p)), 1000, 600);
      for (let i = 0; i < 3; i += 1) { O(q(`pcrack${i}`), 1); O(q(`pdim${i}`), 0.45); }
      O(q("wins"), 1);
      O(q("ghglow"), 0.85);
      O(q("beacon"), 0.5 + 0.5 * Math.sin(t * 6));
      T(q("hand0"), 0, 0, 1, Math.sin(t * 8) * 28);
      T(q("hand1"), 0, 0, 1, Math.sin(t * 8 + 1) * 28);
      T(q("pip"), 1330, GY + 170, 1.6, Math.sin(t * 2) * 3);
      T(q("tool"), 1470, GY - 90 + Math.sin(t * 3) * 10, Math.max(0.01, easeOut(seg(p, 0.15, 0.4))));
      spin(q, "e", 62, 118, t * 0.03);
    }
  },

  // ---------------------------------------------------------- discovery
  "find.scan": {
    build: () =>
      wrap(
        sky(15, 170) + ground() +
          `<g transform="translate(1180 ${GY + 120})">${iceCluster(0.9)}</g>` +
          `<g transform="translate(560 ${GY + 16})"><g data-a="fan"><path d="M0 0 L760 -70 L760 200 Z" fill="url(#cxScan)"/></g></g>` +
          [0, 1, 2].map((i) => `<ellipse data-a="ping${i}" cx="1180" cy="${GY + 118}" rx="60" ry="14" fill="none" stroke="#7dffb0" stroke-width="5"/>`).join("") +
          pip("pip", "thinking", `<circle cx="104" cy="40" r="7" fill="#7dffb0" stroke="${INK}" stroke-width="2.5"/>`)
      ),
    frame(q, p, t) {
      cam(q, lerp(1.1, 1.26, easeInOut(p)), 860, 760);
      T(q("pip"), 480, GY + 110, 1.5);
      T(q("fan"), 0, 0, 1, Math.sin(t * 2.4) * 9);
      O(q("fan"), 0.65 + 0.2 * Math.sin(t * 12));
      for (let i = 0; i < 3; i += 1) {
        const life = (t * 0.8 + i / 3) % 1;
        const el = q(`ping${i}`);
        el?.setAttribute("rx", n(40 + life * 240));
        el?.setAttribute("ry", n(10 + life * 50));
        O(el, 1 - life);
      }
    }
  },
  "find.glow": {
    build: () => {
      let bands = "";
      const colors = ["#dff6ff", "#a9dcff", "#7fc4f5", "#bfe8ff", "#8fd0fa", "#d8f3ff", "#9ad4fb", "#6fb6ec"];
      for (let i = 0; i < 8; i += 1) bands += `<path d="M330 ${330 + i * 52} C620 ${310 + i * 52} 980 ${350 + i * 52} 1270 ${326 + i * 52} V${382 + i * 52} C980 ${402 + i * 52} 620 ${362 + i * 52} 330 ${382 + i * 52} Z" fill="${colors[i]}"/>`;
      const r = mulberry(51);
      let sp = "";
      for (let i = 0; i < 12; i += 1) sp += sparkle(`g${i}`, 380 + r() * 840, 330 + r() * 400, 10 + r() * 16, "#ffffff");
      return wrap(
        sky(15, 120) + `<path d="M0 640 C400 600 1200 600 1600 640 L1600 900 L0 900 Z" fill="url(#cxGround)"/>` +
          `<clipPath id="cxClip-wall"><path d="M330 760 L330 400 Q420 250 640 290 Q820 220 1000 300 Q1220 270 1270 420 L1270 760 Z"/></clipPath>` +
          `<g clip-path="url(#cxClip-wall)"><rect x="300" y="200" width="1000" height="600" fill="#e6f7ff"/>${bands}<rect data-a="shine" x="-60" y="200" width="150" height="640" fill="#ffffff" opacity="0.35" transform="rotate(14 0 500)"/></g>` +
          `<path d="M330 760 L330 400 Q420 250 640 290 Q820 220 1000 300 Q1220 270 1270 420 L1270 760 Z" fill="none" stroke="#f4fdff" stroke-width="9" stroke-linejoin="round"/>` +
          `<path d="M250 770 L300 520 L330 470 L330 770 Z M1270 770 L1270 480 L1320 540 L1370 770 Z" fill="#7d8198" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>` +
          `<g data-a="halo"><circle cx="800" cy="640" r="250" fill="url(#cxBlue)"/></g>` +
          `<g transform="translate(800 790)">${iceCluster(1.1)}</g>` + sp
      );
    },
    frame(q, p, t) {
      cam(q, lerp(1, 1.14, easeInOut(p)), 800, 560);
      O(q("halo"), 0.45 + 0.4 * Math.sin(t * 3));
      T(q("shine"), lerp(200, 1500, (t * 0.35) % 1), 0, 1, 14);
      for (let i = 0; i < 12; i += 1) twinkle(q, `g${i}`, t, i * 1.3, 3 + (i % 3));
    }
  },
  "find.lab": {
    build: () =>
      wrap(
        `<rect width="${W}" height="${H}" fill="#1c1a33"/>` +
          `<path d="M0 0 H1600 V620 H0 Z" fill="#262446"/><path d="M0 200 H1600 M0 410 H1600 M400 0 V620 M800 0 V620 M1200 0 V620" stroke="#1c1a33" stroke-width="8"/>` +
          `<rect x="0" y="620" width="${W}" height="280" fill="#3a3760"/><path d="M0 620 H1600" stroke="${INK}" stroke-width="8"/>` +
          `<rect x="980" y="180" width="460" height="300" rx="26" fill="#0b1230" stroke="${INK}" stroke-width="8"/>` +
          `<g transform="translate(1100 400) scale(0.5)">${iceCluster(1)}</g>` +
          [0, 1, 2, 3, 4].map((i) => `<g transform="translate(${1230 + i * 38} 440)"><rect data-a="bar${i}" x="-12" y="-100" width="24" height="100" rx="6" fill="#7dffb0"/></g>`).join("") +
          `<path data-a="trace" d="M1010 240 l40 0 l16 -30 l22 60 l20 -44 l14 14 l60 0 l18 -26 l20 40 l16 -14 l150 0" fill="none" stroke="#7fe3ff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
          `<g data-a="beep"><circle cx="1400" cy="216" r="40" fill="url(#cxWarm)"/><circle cx="1400" cy="216" r="12" fill="#ffd166"/></g>` +
          `<rect x="900" y="560" width="620" height="60" rx="14" fill="#59607a" stroke="${INK}" stroke-width="7"/><path d="M960 620 V760 M1460 620 V760" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>` +
          `<g transform="translate(1210 560)"><ellipse cx="0" cy="-40" rx="120" ry="80" fill="url(#cxBlue)" opacity="0.7"/><g transform="scale(0.34)">${iceCluster(1)}</g><path d="M-80 0 V-50 Q-80 -110 0 -110 Q80 -110 80 -50 V0 Z" fill="#cfe8ff" fill-opacity="0.25" stroke="${INK}" stroke-width="6"/></g>` +
          astro("sp", "#5ee08a") + confetti("c", 18, 3)
      ),
    frame(q, p, t) {
      cam(q, lerp(1, 1.06, easeInOut(p)), 900, 520);
      for (let i = 0; i < 5; i += 1) q(`bar${i}`)?.setAttribute("transform", `scale(1 ${n(0.35 + 0.65 * Math.abs(Math.sin(t * (3 + i) + i)))})`);
      O(q("beep"), Math.sin(t * 9) > 0 ? 1 : 0.2);
      O(q("trace"), 0.6 + 0.4 * Math.sin(t * 6));
      T(q("sp"), 520, 800 + hop(t, 6.5, 80), 2.4);
      cheer(q, "sp");
      T(q("sp-l0"), 0, 0, 1, 14);
      T(q("sp-l1"), 0, 0, 1, -14);
      fall(q, "c", 18, t, 3);
    }
  },
  "find.choice": {
    build: () =>
      wrap(
        sky(16, 170) + `<g transform="translate(800 170)">${earth("e", 56)}</g>` + ground() +
          `<g data-a="left"><circle cx="270" cy="${GY + 40}" r="230" fill="url(#cxBlue)"/></g><g transform="translate(270 ${GY + 90})">${iceCluster(0.85)}</g>` +
          base(1290, 0.66) + `<g data-a="right"><circle cx="1290" cy="${GY - 60}" r="250" fill="url(#cxWarm)" opacity="0.6"/></g>` + baseLights(1290, 0.66) +
          [0, 1, 2].map((i) => `<path data-a="al${i}" d="M${640 - i * 62} ${GY + 150} l34 -26 M${640 - i * 62} ${GY + 150} l34 26" stroke="#7fe3ff" stroke-width="12" stroke-linecap="round"/>`).join("") +
          [0, 1, 2].map((i) => `<path data-a="ar${i}" d="M${960 + i * 62} ${GY + 150} l-34 -26 M${960 + i * 62} ${GY + 150} l-34 26" stroke="#ffd166" stroke-width="12" stroke-linecap="round"/>`).join("") +
          pip("pip", "thinking")
      ),
    frame(q, p, t) {
      const side = Math.sin(t * 1.8);
      O(q("left"), 0.35 + 0.5 * clamp01(-side));
      O(q("right"), 0.35 + 0.5 * clamp01(side));
      O(q("wins"), 1);
      O(q("ghglow"), 0.8);
      for (let i = 0; i < 3; i += 1) {
        O(q(`al${i}`), side < 0 ? 0.3 + 0.7 * Math.abs(Math.sin(t * 5 - i * 0.7)) : 0.2);
        O(q(`ar${i}`), side > 0 ? 0.3 + 0.7 * Math.abs(Math.sin(t * 5 - i * 0.7)) : 0.2);
      }
      T(q("pip"), 800 + side * 22, GY + 150, 1.5, side * 5);
      spin(q, "e", 56, 118, t * 0.03);
      cam(q, lerp(1, 1.05, easeInOut(p)), 800, 620);
    }
  },

  // --------------------------------------------------------- greenhouse
  "green.lights": {
    build: () => wrap(greenhouseRoom(4, false)),
    frame(q, p, t) {
      cam(q, lerp(1, 1.08, easeInOut(p)), 800, 560);
      const on = seg(p, 0.08, 0.3);
      O(q("leds"), on * (0.9 + 0.1 * Math.sin(t * 20)));
      O(q("wash"), on * 0.8);
      spin(q, "e", 40, 125, t * 0.03);
      for (let i = 0; i < 4; i += 1) q(`pl${i}`)?.setAttribute("transform", `scale(${n(i === 1 ? lerp(0.05, 0.5, easeOut(seg(p, 0.4, 0.95))) : 0.08)})`);
    }
  },
  "green.grow": {
    build: () => wrap(greenhouseRoom(4, true)),
    frame(q, p, t) {
      cam(q, lerp(1.08, 1, easeInOut(p)), 800, 560);
      O(q("leds"), 0.9 + 0.1 * Math.sin(t * 20));
      O(q("wash"), 0.8);
      spin(q, "e", 40, 125, t * 0.03);
      for (let i = 0; i < 4; i += 1) {
        const g = easeOut(seg(p, 0.05 + i * 0.1, 0.75 + i * 0.07));
        q(`pl${i}`)?.setAttribute("transform", `scale(${n(lerp(i === 1 ? 0.5 : 0.08, 1, g))}) rotate(${n(Math.sin(t * 2 + i) * 2)})`);
      }
      const life = (t * 0.9) % 1;
      T(q("drop"), 0, life * life * 250);
      O(q("drop"), life < 0.9 ? 1 : 0);
    }
  },
  "green.soil": {
    build: () => {
      const tray = (x, soil, key, leaf, tag) =>
        `<g transform="translate(${x} 720)">` +
        `<path d="M-230 0 L-200 110 H200 L230 0 Z" fill="#59607a" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>` +
        `<path d="M-222 0 Q0 -46 222 0 Z" fill="${soil}" stroke="${INK}" stroke-width="6"/>` +
        `<g transform="translate(0 -18)"><g data-a="${key}">${bigPlant(leaf)}</g></g>` +
        `<g transform="translate(0 56)"><circle r="42" fill="#2a2f48" stroke="${INK}" stroke-width="5"/>${tag}</g></g>`;
      return wrap(
        `<rect width="${W}" height="${H}" fill="#241036"/><ellipse cx="800" cy="300" rx="900" ry="420" fill="url(#cxPink)" opacity="0.55"/>` +
          `<rect x="150" y="70" width="1300" height="26" rx="12" fill="#ff7bd0" stroke="${INK}" stroke-width="5"/>` +
          `<rect x="0" y="850" width="${W}" height="50" fill="#1a0b28"/>` +
          tray(480, "#7a5a3c", "good", "#5ee08a", earth("te", 34)) + tray(1120, "#a9adbe", "weak", "#b9a45e", moonDisc("tm", 34))
      );
    },
    frame(q, p, t) {
      cam(q, lerp(1, 1.05, easeInOut(p)), 800, 560);
      q("good")?.setAttribute("transform", `scale(${n(lerp(0.15, 1, easeOut(seg(p, 0, 0.7))))}) rotate(${n(Math.sin(t * 2) * 2)})`);
      q("weak")?.setAttribute("transform", `scale(${n(lerp(0.12, 0.46, easeOut(seg(p, 0.1, 0.95))))}) rotate(${n(10 + Math.sin(t * 2 + 1) * 2)})`);
      spin(q, "te", 34, 125, t * 0.03);
    }
  },
  "green.plan": {
    build: () =>
      wrap(
        sky(17, 190) + `<g transform="translate(1250 190)">${earth("e", 62)}</g>` + ground() + base(960, 1.2) + dusk(0.7) + baseLights(960, 1.2) + astro("sp", "#5ee08a") + pip("pip", "happy")
      ),
    frame(q, p, t) {
      cam(q, lerp(1.25, 1.1, easeInOut(p)), 620, 620);
      O(q("wins"), 1);
      O(q("ghglow"), 0.8 + 0.2 * Math.sin(t * 3));
      O(q("beacon"), 0.5 + 0.5 * Math.sin(t * 6));
      for (let i = 0; i < 4; i += 1) q(`gp${i}`)?.setAttribute("transform", `scale(${n(1.1 + 0.08 * Math.sin(t * 2 + i))})`);
      T(q("sp"), 330, GY + 70, 1.25);
      wave(q, "sp", t);
      T(q("pip"), 190, GY + 90 + hop(t, 6, 18), 1.2);
      spin(q, "e", 62, 118, t * 0.03);
    }
  },

  // --------------------------------------------------------------- rank
  "rank.fly": {
    build: () => wrap(sky(18, 200) + rays("rays") + medal("medal") + rankSparkles()),
    frame(q, p, t) {
      const e = outBack(seg(p, 0, 0.55));
      T(q("medal"), 800 + lerp(520, 0, easeOut(seg(p, 0, 0.55))), 420 + lerp(-640, 0, easeOut(seg(p, 0, 0.55))), Math.max(0.02, e), lerp(-200, 0, easeOut(seg(p, 0, 0.55))));
      T(q("rays"), 800, 420, Math.max(0.01, easeOut(seg(p, 0.4, 0.7))), t * 14);
      for (let i = 0; i < 10; i += 1) { twinkle(q, `rs${i}`, t, i * 1.1, 4); O(q(`rs${i}`), seg(p, 0.5, 0.65) * (0.3 + 0.7 * Math.abs(Math.sin(t * 4 + i)))); }
    }
  },
  "rank.shine": {
    build: () =>
      wrap(sky(18, 200) + rays("rays") + medal("medal") + rankSparkles() + astro("a1", "#ff9f43") + astro("a2", "#5ee08a") + pip("pip", "excited")),
    frame(q, p, t) {
      T(q("medal"), 800, 330 + Math.sin(t * 2) * 8, 1.25);
      T(q("rays"), 800, 330, 1, t * 14);
      q("medal-shine")?.setAttribute("transform", `translate(${n(lerp(-420, 420, (t * 0.6) % 1))} 0) rotate(20)`);
      for (let i = 0; i < 10; i += 1) twinkle(q, `rs${i}`, t, i * 1.1, 4);
      T(q("a1"), 470, 850 + hop(t, 6, 60), 1.5);
      T(q("a2"), 1130, 850 + hop(t, 6, 60, 1), 1.5);
      cheer(q, "a1");
      cheer(q, "a2");
      T(q("pip"), 800, 860 + hop(t, 6, 40, 0.5), 1.5);
    }
  },
  "rank.stars": {
    build: () =>
      wrap(
        sky(18, 200) + rays("rays") + medal("medal") +
          [0, 1, 2, 3, 4].map((i) => {
            const a = (-150 + i * 30) * (Math.PI / 180);
            return `<g transform="translate(${n(800 + Math.cos(a) * 380)} ${n(430 + Math.sin(a) * 330)})"><g data-a="star${i}"><path d="M0 -44 L13 -14 L45 -12 L20 8 L28 40 L0 22 L-28 40 L-20 8 L-45 -12 L-13 -14 Z" fill="#ffd166" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/></g></g>`;
          }).join("") + confetti("c", 46, 11)
      ),
    frame(q, p, t) {
      T(q("medal"), 800, 400 + Math.sin(t * 2) * 8, 1.2);
      T(q("rays"), 800, 400, 1, t * 14);
      q("medal-shine")?.setAttribute("transform", `translate(${n(lerp(-420, 420, (t * 0.6) % 1))} 0) rotate(20)`);
      for (let i = 0; i < 5; i += 1) T(q(`star${i}`), 0, 0, Math.max(0.01, outBack(seg(p, 0.08 + i * 0.12, 0.26 + i * 0.12))), Math.sin(t * 3 + i) * 10);
      fall(q, "c", 46, t, 11);
    }
  },

  // ------------------------------------------------------ mission complete
  "end.cheer": {
    build: () =>
      wrap(
        sky(19, 180) + `<g transform="translate(1270 180)">${earth("e", 62)}</g>` + ground() + base(820, 0.95) + dusk(0.25) + baseLights(820, 0.95) +
          astro("a1", "#ff9f43") + astro("a2", "#5ee08a") + pip("pip", "excited") + confetti("c", 46, 11)
      ),
    frame(q, p, t) {
      cam(q, lerp(1.08, 1, easeOut(p)), 800, 620);
      O(q("wins"), 1);
      O(q("ghglow"), 0.85 + 0.15 * Math.sin(t * 3));
      O(q("beacon"), 0.5 + 0.5 * Math.sin(t * 6));
      T(q("a1"), 470, GY + 110 + hop(t, 6, 70), 1.3);
      T(q("a2"), 640, GY + 120 + hop(t, 6, 70, 1), 1.3);
      cheer(q, "a1");
      cheer(q, "a2");
      T(q("pip"), 1090, GY + 120 + hop(t, 6, 50, 0.5), 1.4, Math.sin(t * 6) * 8);
      fall(q, "c", 46, t, 11);
      spin(q, "e", 62, 118, t * 0.03);
    }
  },
  "end.lookup": {
    build: () =>
      wrap(
        `<rect y="-700" width="${W}" height="${H + 700}" fill="url(#cxSpace)"/>${stars(19, 180)}<g transform="translate(0 -700)">${stars(20, 200, 0, 700, false)}</g>` +
          `<g transform="translate(800 -330)">${earth("e", 210)}</g>` + ground() + base(820, 0.95) + dusk(0.25) + baseLights(820, 0.95) +
          astro("a1", "#ff9f43") + astro("a2", "#5ee08a") + pip("pip", "happy")
      ),
    frame(q, p, t) {
      T(q("cam"), 0, lerp(0, 640, easeInOut(p)));
      O(q("wins"), 1);
      O(q("ghglow"), 0.85);
      T(q("a1"), 470, GY + 110, 1.3);
      T(q("a2"), 640, GY + 120, 1.3);
      T(q("a1-a1"), 0, 0, 1, -140);
      T(q("pip"), 1090, GY + 120, 1.4, -8);
      spin(q, "e", 210, 134, t * 0.03);
    }
  },
  "end.earth": {
    build: () =>
      wrap(sky(21, 200) + `<g data-a="glint" transform="translate(520 250)"><circle r="260" fill="url(#cxSun)" opacity="0.5"/></g><g transform="translate(800 470)">${earth("e", 340)}</g>`),
    frame(q, p, t) {
      cam(q, lerp(1.12, 1, easeInOut(p)), 800, 470);
      spin(q, "e", 340, 140, t * 0.03);
      O(q("glint"), 0.35 + 0.15 * Math.sin(t * 2));
    }
  },
  "end.rise": {
    build: () =>
      wrap(
        sky(22, 210) + `<g data-a="rise" data-solo="1">${`<g>${earth("e", 230)}</g>`}</g>` +
          `<path d="M-200 900 C200 640 1400 640 1800 900 Z" fill="url(#cxGround)"/><path d="M-200 900 C200 640 1400 640 1800 900" fill="none" stroke="#f4f5fa" stroke-width="5" opacity="0.6"/>` +
          crater(520, 800, 120) + crater(1080, 830, 150) + crater(820, 760, 60)
      ),
    frame(q, p, t) {
      T(q("rise"), 800, lerp(760, 380, easeOut(p)));
      spin(q, "e", 230, 135, t * 0.03);
    }
  },

  // -------------------------------------------------------- mission paused
  "home.liftoff": {
    build: () =>
      wrap(
        sky(23, 170) + `<g transform="translate(1270 180)">${earth("e", 62)}</g>` + ground() + base(1220, 0.6) + baseLights(1220, 0.6) +
          `<ellipse data-a="glow" cx="620" cy="${GY + 20}" rx="300" ry="54" fill="url(#cxWarm)" opacity="0"/>` +
          `<g transform="translate(620 ${GY + 20})">${landerStage()}</g>` +
          `<g data-a="cab" data-solo="1"><g transform="translate(0 6)">${flame("cab-flame", 0.7)}</g>${landerCabin(true)}</g>` + dustPuffs("d", 12)
      ),
    frame(q, p, t) {
      const up = easeIn(seg(p, 0.15, 1));
      T(q("cab"), 620 + Math.sin(t * 2) * 4, GY + 20 - 206 - up * 620, 1, Math.sin(t * 2) * 1.2);
      flicker(q, "cab-flame", t, seg(p, 0.08, 0.2));
      O(q("glow"), seg(p, 0.08, 0.2) * (1 - up) * 0.7);
      blowDust(q, "d", 12, 620, GY + 20, seg(p, 0.1, 0.8));
      O(q("wins"), 0.8);
      spin(q, "e", 62, 118, t * 0.03);
    }
  },
  "home.wave": {
    build: () =>
      wrap(
        `<rect width="${W}" height="${H}" fill="url(#cxSpace)"/><g data-a="st0" data-solo="1">${stars(24, 150, 0, H, false)}<g transform="translate(0 ${-H})">${stars(24, 150, 0, H, false)}</g></g>` +
          `<g data-a="cab" data-solo="1"><g transform="translate(0 6)">${flame("cab-flame", 0.7)}</g>${landerCabin(true)}` +
          `<g transform="translate(-22 -62)"><g data-a="h0"><rect x="-4" y="-18" width="8" height="20" rx="4" fill="#eef1f8" stroke="${INK}" stroke-width="2.5"/></g></g>` +
          `<g transform="translate(58 -62)"><g data-a="h1"><rect x="-4" y="-18" width="8" height="20" rx="4" fill="#eef1f8" stroke="${INK}" stroke-width="2.5"/></g></g></g>`
      ),
    frame(q, p, t) {
      T(q("st0"), 0, (t * 90) % H);
      T(q("cab"), 800 + Math.sin(t * 1.4) * 14, lerp(560, 500, easeInOut(p)) + Math.sin(t * 2) * 8, 2.7, Math.sin(t * 1.4) * 2);
      flicker(q, "cab-flame", t, 1);
      T(q("h0"), 0, 0, 1, Math.sin(t * 9) * 30);
      T(q("h1"), 0, 0, 1, Math.sin(t * 9 + 1) * 30);
    }
  },
  "home.cruise": {
    build: () =>
      wrap(
        sky(25, 200) + `<g transform="translate(1180 320)">${earth("e", 190)}</g><g transform="translate(60 1180)">${moonDisc("m", 560)}</g>` +
          `<path data-a="trail" d="M330 700 Q620 420 930 420" fill="none" stroke="#fff3c4" stroke-width="6" stroke-linecap="round" stroke-dasharray="4 22" opacity="0.8"/>` +
          `<g data-a="cab" data-solo="1"><g transform="translate(0 6)">${flame("cab-flame", 0.7)}</g>${landerCabin(true)}</g>`
      ),
    frame(q, p, t) {
      const e = easeInOut(p);
      const u = 1 - e;
      const x = u * u * 330 + 2 * u * e * 620 + e * e * 930;
      const y = u * u * 700 + 2 * u * e * 420 + e * e * 420;
      T(q("cab"), x, y, lerp(0.85, 0.5, e), lerp(50, 82, e));
      flicker(q, "cab-flame", t, 0.9);
      q("trail")?.setAttribute("stroke-dashoffset", n(-t * 40));
      O(q("trail"), 0.3 + 0.5 * e);
      spin(q, "e", 190, 134, t * 0.03);
    }
  },
  "home.plan": {
    build: () =>
      wrap(
        sky(26, 190) + `<g transform="translate(1100 220)">${earth("e", 96)}</g>` + sparkle("ship", 960, 300, 16, "#fff3c4") + ground() + base(420, 0.8) + dusk(0.3) + baseLights(420, 0.8) +
          pip("pip", "happy") +
          `<g data-a="idea" data-solo="1"><circle r="70" fill="url(#cxWarm)"/><path d="M-22 -8 A22 22 0 1 1 22 -8 Q22 8 12 18 H-12 Q-22 8 -22 -8 Z" fill="#ffe29a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><rect x="-11" y="20" width="22" height="12" rx="4" fill="#aeb6cc" stroke="${INK}" stroke-width="4"/></g>`
      ),
    frame(q, p, t) {
      cam(q, lerp(1, 1.08, easeInOut(p)), 1000, 600);
      O(q("wins"), 1);
      O(q("ghglow"), 0.85);
      twinkle(q, "ship", t, 0, 5);
      T(q("pip"), 1010, GY + 110 + hop(t, 6, 26) * seg(p, 0.4, 0.5), 1.6, -6);
      const pop = outBack(seg(p, 0.3, 0.5));
      T(q("idea"), 1010, GY - 130 + Math.sin(t * 3) * 6, Math.max(0.01, pop));
      O(q("idea"), seg(p, 0.3, 0.36));
      spin(q, "e", 96, 134, t * 0.03);
    }
  }
};

// ---------------------------------------------------- shared larger pieces

function rankSparkles() {
  const r = mulberry(61);
  let out = "";
  for (let i = 0; i < 10; i += 1) out += sparkle(`rs${i}`, 240 + r() * 1120, 110 + r() * 600, 14 + r() * 18, i % 2 ? "#fff3c4" : "#ffffff");
  return out;
}

function bigPlant(leaf) {
  return (
    `<path d="M0 0 C-6 -70 8 -150 0 -230" fill="none" stroke="#2f9a5e" stroke-width="13" stroke-linecap="round"/>` +
    [[-1, -60, 1], [1, -100, 0.95], [-1, -150, 0.85], [1, -190, 0.7]].map(([side, y, s]) => `<path d="M0 ${y} q${side * 120 * s} ${-26 * s} ${side * 150 * s} ${-110 * s} q${side * -110 * s} ${-4 * s} ${side * -150 * s} ${110 * s} Z" fill="${leaf}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M0 ${y} q${side * 70 * s} ${-30 * s} ${side * 130 * s} ${-96 * s}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.45"/>`).join("") +
    `<path d="M0 -230 q-40 -30 -30 -80 q40 20 30 80 Z M0 -230 q40 -30 30 -80 q-40 20 -30 80 Z" fill="${leaf}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`
  );
}

function greenhouseRoom(count, pipe) {
  const pots = Array.from({ length: count }, (_, i) => {
    const x = 320 + i * 320;
    return (
      `<g transform="translate(${x} 700)">` +
      `<rect x="-110" y="0" width="220" height="80" rx="22" fill="#eef1f8" stroke="${INK}" stroke-width="6"/><path d="M-96 0 Q0 -30 96 0 Z" fill="#7a5a3c" stroke="${INK}" stroke-width="5"/>` +
      `<g transform="translate(0 -12) scale(0.62)"><g data-a="pl${i}">${bigPlant("#5ee08a")}</g></g></g>`
    );
  }).join("");
  return (
    `<rect width="${W}" height="${H}" fill="#241036"/>` +
    `<path d="M120 900 V330 Q120 60 800 60 Q1480 60 1480 330 V900 Z" fill="#2f1848" stroke="${INK}" stroke-width="8"/>` +
    `<clipPath id="cxClip-win"><path d="M560 160 H1040 Q1080 160 1080 200 V330 H520 V200 Q520 160 560 160 Z"/></clipPath>` +
    `<g clip-path="url(#cxClip-win)"><rect x="520" y="160" width="560" height="170" fill="#03040c"/>${stars(33, 60, 150, 340, false)}<g transform="translate(960 250)">${earth("e", 40)}</g></g>` +
    `<path d="M560 160 H1040 Q1080 160 1080 200 V330 H520 V200 Q520 160 560 160 Z" fill="none" stroke="${INK}" stroke-width="7"/>` +
    `<ellipse data-a="wash" cx="800" cy="560" rx="760" ry="420" fill="url(#cxPink)" opacity="0"/>` +
    `<rect x="230" y="372" width="1140" height="30" rx="14" fill="#3a2a52" stroke="${INK}" stroke-width="6"/>` +
    `<g data-a="leds" opacity="0">${Array.from({ length: 9 }, (_, i) => `<rect x="${262 + i * 124}" y="380" width="92" height="14" rx="7" fill="${i % 3 === 1 ? "#7fb0ff" : "#ff7bd0"}"/>`).join("")}<rect x="230" y="398" width="1140" height="12" fill="#ffd0ee" opacity="0.5"/></g>` +
    `<rect x="170" y="780" width="1260" height="34" rx="12" fill="#59607a" stroke="${INK}" stroke-width="6"/>` +
    pots +
    (pipe ? `<path d="M1480 470 H1300 V520" fill="none" stroke="#aeb6cc" stroke-width="16" stroke-linecap="round"/><path d="M1480 470 H1300 V520" fill="none" stroke="${INK}" stroke-width="3"/><g transform="translate(1300 540)"><g data-a="drop"><path d="M0 -14 q14 20 0 30 q-14 -10 0 -30 Z" fill="#7fe3ff" stroke="${INK}" stroke-width="3"/></g></g>` : "")
  );
}

export function sceneNames() {
  return Object.keys(SCENES);
}

// ------------------------------------------------- using the art elsewhere
// Every copy of the art gets its own id prefix, so two pictures on the page
// (or one inside a hidden screen) never borrow each other's gradients.

let copies = 0;

function retag(markup, tag) {
  return markup.replace(/id="cx/g, `id="${tag}cx`).replace(/url\(#cx/g, `url(#${tag}cx`);
}

export function artMarkup(name) {
  const scene = SCENES[name];
  copies += 1;
  return retag(DEFS + (scene ? scene.build() : ""), `a${copies}`);
}

// ------------------------------------------------------------- the stage
// A scene is cut into stacked layers, one small SVG each:
//   - things that never move (sky, ground) are painted once,
//   - things that move get their own layer, so only they are painted again,
//   - the camera is a CSS transform on the whole stack, which the browser
//     moves without painting anything.
// This is what keeps the motion smooth on slow laptops and phones.

const NS = "http://www.w3.org/2000/svg";
const LAYER_STYLE = "position:absolute;left:0;top:0;width:100%;height:100%;display:block;overflow:visible;transform-origin:0 0;will-change:transform;pointer-events:none";

// Sample moments used to learn which parts of a scene really move.
const PROBES = [[0, 0], [0.2, 0.9], [0.45, 2.3], [0.7, 3.4], [1, 5.1]];

// How fast the small loops (hops, waves, wheels) run. 1 is full speed.
export const CALM = 0.6;

export function buildStage(name, { className = "" } = {}) {
  const scene = SCENES[name] || null;
  const el = document.createElement("div");
  el.className = className ? `cx-stage ${className}` : "cx-stage";
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = "position:relative;aspect-ratio:16/9;overflow:hidden;background:#02030a;contain:paint";
  const camera = document.createElement("div");
  camera.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;transform-origin:0 0;will-change:transform";
  el.append(camera);

  const source = document.createElementNS(NS, "svg");
  source.innerHTML = artMarkup(name);

  // Gradients and the star twinkle live in one tiny SVG that every layer uses.
  const shared = document.createElementNS(NS, "svg");
  shared.setAttribute("width", "0");
  shared.setAttribute("height", "0");
  shared.style.cssText = "position:absolute;width:0;height:0";
  for (const node of [...source.children]) {
    if (node.tagName === "style" || node.tagName === "defs") shared.append(node);
  }
  el.prepend(shared);

  const parts = new Map();
  for (const node of source.querySelectorAll("[data-a]")) parts.set(node.getAttribute("data-a"), node);
  const q = (key) => parts.get(key) || null;
  const group = parts.get("cam") || null;
  const items = group ? [...group.children] : [...source.children];

  // While probing, the camera only reports how far this shot zooms in.
  let zoom = 1;
  parts.set("cam", { camera: (x, y, scale) => (zoom = Math.max(zoom, scale)) });

  // Play a few sample moments and see which top-level pieces change at all.
  // Pieces that never change are "still" and get painted once.
  const moved = new Set();
  if (scene) {
    try {
      let before = null;
      for (const [p, t] of PROBES) {
        scene.frame(q, p, t);
        const now = items.map((node) => node.outerHTML);
        if (before) now.forEach((text, i) => text !== before[i] && moved.add(items[i]));
        before = now;
      }
    } catch (error) {
      console.error("art probe failed", name, error);
    }
  }
  for (const node of parts.values()) {
    delete node.cxT;
    delete node.cxO;
  }

  const kindOf = (node) => (node.hasAttribute("data-solo") ? "solo" : moved.has(node) ? "moving" : "still");
  let layer = null;
  let layerKind = "";
  for (const node of items) {
    const kind = kindOf(node);
    if (!layer || kind === "solo" || layerKind === "solo" || kind !== layerKind) {
      layer = document.createElementNS(NS, "svg");
      layer.setAttribute("viewBox", `0 0 ${W} ${H}`);
      layer.setAttribute("preserveAspectRatio", "none");
      layer.style.cssText = LAYER_STYLE;
      camera.append(layer);
      layerKind = kind;
    }
    layer.append(node);
    // A piece alone on its layer is moved by the compositor, not repainted.
    if (kind === "solo" && node.hasAttribute("data-a")) {
      node.removeAttribute("transform");
      node.cxLayer = layer;
    }
  }

  // The layers are painted at the biggest zoom the shot uses and scaled down
  // from there, so a zoomed-in picture stays sharp.
  const big = Math.min(1.35, Math.max(1, zoom));
  camera.style.width = `${(big * 100).toFixed(2)}%`;
  camera.style.height = `${(big * 100).toFixed(2)}%`;
  let lastCamera = "";
  parts.set("cam", {
    camera(x, y, scale) {
      const value = `translate(${((x / W / big) * 100).toFixed(3)}%, ${((y / H / big) * 100).toFixed(3)}%) scale(${(scale / big).toFixed(4)})`;
      if (value === lastCamera) return;
      lastCamera = value;
      camera.style.transform = value;
    }
  });

  parts.get("cam").camera(0, 0, 1);
  let alive = Boolean(scene);
  function draw(p, seconds) {
    if (!alive) return false;
    try {
      scene.frame(q, Math.max(0, Math.min(1, p)), seconds * CALM);
      return true;
    } catch (error) {
      alive = false;
      console.error("art frame failed", name, error);
      return false;
    }
  }
  return { el, draw, layers: camera.children.length };
}

// Put one animated scene inside any element. It plays once over `seconds`,
// then keeps its small idle motion. It stops by itself when it leaves the page.
export function mountArt(host, name, { reduced = false, seconds = 9, still = 0.8, className = "intro-art" } = {}) {
  if (!SCENES[name] || typeof document === "undefined") return null;
  const stage = buildStage(name, { className });
  host.append(stage.el);
  if (reduced) {
    stage.draw(still, still * seconds);
    return stage.el;
  }
  const started = performance.now();
  const step = (now) => {
    if (!stage.el.isConnected) return;
    const t = Math.max(0, now - started) / 1000;
    const p = Math.min(1, t / seconds);
    if (stage.draw(1 - (1 - p) * (1 - p), t)) requestAnimationFrame(step);
  };
  stage.draw(0, 0);
  requestAnimationFrame(step);
  return stage.el;
}

// A small still Earth for the game sky. Goes inside another SVG.
export function skyEarth(cx, cy, r, lon = 128) {
  const grads = (DEFS.match(/<radialGradient id="cx(?:Ocean|Atmo|Shade)"[\s\S]*?<\/radialGradient>/g) || []).join("");
  return retag(`<g transform="translate(${cx} ${cy})"><defs>${grads}</defs>${earth("sky", r, lon)}</g>`, "ge");
}

// The strip at the top of the title card: stars, Earth, the Moon's edge and
// the lander coming down with its engine on.
export function titleBanner() {
  const body =
    `<rect width="1320" height="120" fill="url(#cxSpace)"/>` +
    `<g transform="scale(0.825 0.5)">${stars(77, 150, 0, 240, false)}</g>` +
    `<g transform="translate(830 54)">${earth("tb", 34, 128)}</g>` +
    `<path d="M-20 120 C300 92 900 96 1340 112 L1340 120 Z" fill="url(#cxGround)"/>` +
    `<path d="M-20 120 C300 92 900 96 1340 112" fill="none" stroke="#f4f5fa" stroke-width="2" opacity="0.6"/>` +
    `<g transform="translate(520 88) scale(0.17)"><g transform="translate(0 -66)"><g class="cx-burn">${flame("tbf", 1)}</g></g>${landerStage()}<g transform="translate(0 -206)">${landerCabin()}</g></g>`;
  return retag(
    `<svg viewBox="0 0 1320 120" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
      `<style>.cx-burn{transform-box:fill-box;transform-origin:50% 0;animation:cx-burn .22s ease-in-out infinite alternate}@keyframes cx-burn{to{transform:scaleY(.82)}}@media (prefers-reduced-motion:reduce){.cx-burn{animation:none}}</style>` +
      DEFS + body + `</svg>`,
    "tb"
  );
}
