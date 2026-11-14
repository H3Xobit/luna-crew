// The crew, drawn in code. Original characters, no outside art.
// portrait(who, expr) returns an SVG string. who: nova, sprout, pip, earth.
// expr: neutral, happy, excited, worried, sleepy, thinking.

export const EXPRESSIONS = ["neutral", "happy", "excited", "worried", "sleepy", "thinking"];
export const CHARACTERS = ["nova", "sprout", "pip", "earth"];

const INK = "#1b1630";

function expression(expr) {
  return EXPRESSIONS.includes(expr) ? expr : "neutral";
}

function humanEye(cx, expr, iris, side) {
  const cy = 63;
  if (expr === "happy") {
    return `<path d="M${cx - 7} ${cy + 2} Q${cx} ${cy - 8} ${cx + 7} ${cy + 2}" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (expr === "sleepy") {
    return (
      `<path d="M${cx - 7} ${cy} Q${cx} ${cy + 8} ${cx + 7} ${cy} Z" fill="${iris}"/>` +
      `<path d="M${cx - 8} ${cy} H${cx + 8}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
    );
  }
  const big = expr === "excited";
  const rx = big ? 7.5 : 6.5;
  const ry = big ? 10 : expr === "worried" ? 7 : 8.5;
  const dx = expr === "thinking" ? 2 : 0;
  const dy = expr === "thinking" ? -2.5 : 0;
  let out =
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx + 1.5}" ry="${ry + 1.5}" fill="#fff"/>` +
    `<ellipse cx="${cx + dx}" cy="${cy + dy}" rx="${rx}" ry="${ry}" fill="${iris}"/>` +
    `<ellipse cx="${cx + dx}" cy="${cy + dy + 1}" rx="${rx - 3}" ry="${ry - 3.5}" fill="${INK}"/>` +
    `<circle cx="${cx + dx - 2.5}" cy="${cy + dy - 3.5}" r="${big ? 3 : 2.4}" fill="#fff"/>`;
  if (big) out += `<circle cx="${cx + dx + 3}" cy="${cy + dy + 3.5}" r="1.6" fill="#fff"/>`;
  out += `<path d="M${cx - rx - 2} ${cy - ry + 1} Q${cx} ${cy - ry - 4} ${cx + rx + 2} ${cy - ry + 1}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (expr === "worried") {
    const inner = cx + side * -7;
    const outer = cx + side * 8;
    out += `<path d="M${outer} ${cy - 15} L${inner} ${cy - 19}" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  if (expr === "thinking" && side === 1) {
    out += `<path d="M${cx - 8} ${cy - 18} Q${cx} ${cy - 23} ${cx + 8} ${cy - 18}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return out;
}

function humanMouth(expr) {
  if (expr === "happy") return `<path d="M52 79 Q60 90 68 79 Z" fill="#b8324f" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  if (expr === "excited") {
    return `<ellipse cx="60" cy="82" rx="6" ry="7" fill="#b8324f" stroke="${INK}" stroke-width="2"/><path d="M56 86 Q60 83 64 86" fill="#ff8fa3"/>`;
  }
  if (expr === "worried") return `<path d="M53 83 Q56.5 79 60 83 Q63.5 87 67 83" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (expr === "sleepy") return `<ellipse cx="60" cy="82" rx="3" ry="3.6" fill="#b8324f" stroke="${INK}" stroke-width="1.8"/>`;
  if (expr === "thinking") return `<path d="M55 82 Q61 80 66 83" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  return `<path d="M54 80 Q60 85 66 80" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
}

function blush(expr) {
  if (expr !== "happy" && expr !== "excited") return "";
  return `<ellipse cx="38" cy="74" rx="6" ry="3.4" fill="#ff8fa3" opacity="0.7"/><ellipse cx="82" cy="74" rx="6" ry="3.4" fill="#ff8fa3" opacity="0.7"/>`;
}

function extras(expr) {
  if (expr === "sleepy") {
    return `<text x="92" y="30" font-size="15" font-weight="700" fill="#cfe6ff" font-family="sans-serif">z</text><text x="102" y="19" font-size="11" font-weight="700" fill="#cfe6ff" font-family="sans-serif">z</text>`;
  }
  if (expr === "worried") return `<path d="M97 44 q5 8 0 12 q-5 -4 0 -12 Z" fill="#7fd4ff"/>`;
  if (expr === "excited") {
    return `<path d="M98 26 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z" fill="#ffd166"/><path d="M18 34 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" fill="#ffd166"/>`;
  }
  if (expr === "thinking") {
    return `<circle cx="96" cy="36" r="3" fill="#cfe6ff"/><circle cx="103" cy="27" r="4.4" fill="#cfe6ff"/>`;
  }
  return "";
}

function suit(main, trim, badge) {
  return (
    `<path d="M22 122 Q24 98 44 94 L76 94 Q96 98 98 122 Z" fill="${main}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M40 96 Q60 110 80 96 L78 92 Q60 102 42 92 Z" fill="${trim}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    badge
  );
}

function nova(expr) {
  const skin = "#c98a5e";
  const hair = "#27336e";
  return (
    `<path d="M26 66 Q20 22 60 18 Q100 22 94 66 Q96 84 88 92 L32 92 Q24 84 26 66 Z" fill="${hair}" stroke="${INK}" stroke-width="2.5"/>` +
    suit("#f4f6fb", "#ff9f43", `<path d="M60 106 l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7 Z" fill="#ffd166" stroke="${INK}" stroke-width="1.4"/>`) +
    `<path d="M52 86 h16 v10 q-8 6 -16 0 Z" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>` +
    `<ellipse cx="60" cy="62" rx="29" ry="31" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M30 58 Q30 26 62 26 Q92 28 91 58 Q84 40 66 38 Q60 48 44 46 Q34 48 30 58 Z" fill="${hair}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M66 38 Q72 30 84 34" fill="none" stroke="#4fd1ff" stroke-width="4" stroke-linecap="round"/>` +
    humanEye(47, expr, "#7a4a1c", -1) +
    humanEye(73, expr, "#7a4a1c", 1) +
    blush(expr) +
    humanMouth(expr)
  );
}

function sprout(expr) {
  const skin = "#f7d6bd";
  const hair = "#35a868";
  return (
    `<circle cx="60" cy="20" r="12" fill="${hair}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M60 9 Q52 -2 44 4 Q50 12 60 9 Z" fill="#8be28f" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M60 9 Q68 -2 76 4 Q70 12 60 9 Z" fill="#8be28f" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M27 70 Q20 26 60 24 Q100 26 93 70 Q94 82 90 88 L30 88 Q26 82 27 70 Z" fill="${hair}" stroke="${INK}" stroke-width="2.5"/>` +
    suit("#eafff1", "#5ee08a", `<path d="M60 118 Q60 108 68 106 Q68 114 60 118 Z" fill="#35a868" stroke="${INK}" stroke-width="1.4"/><path d="M60 118 Q60 108 52 106 Q52 114 60 118 Z" fill="#8be28f" stroke="${INK}" stroke-width="1.4"/>`) +
    `<path d="M52 86 h16 v10 q-8 6 -16 0 Z" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>` +
    `<ellipse cx="60" cy="62" rx="29" ry="31" fill="${skin}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M30 60 Q28 30 60 30 Q92 30 90 60 Q82 44 60 42 Q38 44 30 60 Z" fill="${hair}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>` +
    humanEye(47, expr, "#2f7d4f", -1) +
    humanEye(73, expr, "#2f7d4f", 1) +
    `<circle cx="47" cy="63" r="12.5" fill="#bfe9ff" fill-opacity="0.18" stroke="${INK}" stroke-width="2.2"/>` +
    `<circle cx="73" cy="63" r="12.5" fill="#bfe9ff" fill-opacity="0.18" stroke="${INK}" stroke-width="2.2"/>` +
    `<path d="M59.5 62 h1" stroke="${INK}" stroke-width="2.2"/>` +
    blush(expr) +
    humanMouth(expr)
  );
}

function pipEye(cx, expr) {
  const cy = 56;
  const color = "#0b2b3a";
  if (expr === "happy") return `<path d="M${cx - 7} ${cy + 3} Q${cx} ${cy - 8} ${cx + 7} ${cy + 3}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  if (expr === "sleepy") return `<path d="M${cx - 7} ${cy} H${cx + 7}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
  if (expr === "excited") return `<path d="M${cx} ${cy - 9} l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z" fill="${color}"/>`;
  if (expr === "worried") return `<ellipse cx="${cx}" cy="${cy + 1}" rx="5" ry="6" fill="${color}"/><path d="M${cx - 8} ${cy - 11} L${cx + 6} ${cy - 8}" transform="rotate(${cx < 60 ? -28 : 28} ${cx} ${cy - 10})" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  if (expr === "thinking") return `<ellipse cx="${cx + 2}" cy="${cy - 2}" rx="5.5" ry="7" fill="${color}"/>`;
  return `<ellipse cx="${cx}" cy="${cy}" rx="5.5" ry="7.5" fill="${color}"/><circle cx="${cx - 1.6}" cy="${cy - 3}" r="1.8" fill="#dff8ff"/>`;
}

function pipMouth(expr) {
  const color = "#0b2b3a";
  if (expr === "happy" || expr === "excited") return `<path d="M51 68 Q60 79 69 68 Z" fill="${color}"/>`;
  if (expr === "worried") return `<path d="M52 73 Q56 68 60 73 Q64 78 68 73" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  if (expr === "sleepy") return `<circle cx="60" cy="72" r="3" fill="${color}"/>`;
  if (expr === "thinking") return `<path d="M54 72 H66" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
  return `<path d="M53 69 Q60 75 67 69" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
}

function pip(expr) {
  const light = expr === "worried" ? "#ff5c8a" : expr === "sleepy" ? "#8aa0b8" : "#5ee08a";
  return (
    `<path d="M60 22 V10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="60" cy="8" r="5" fill="${light}" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="14" y="92" width="92" height="18" rx="9" fill="#3a3f5c" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="30" cy="104" r="11" fill="#555c80" stroke="${INK}" stroke-width="2.5"/><circle cx="30" cy="104" r="4" fill="#cfd6ea"/>` +
    `<circle cx="60" cy="104" r="11" fill="#555c80" stroke="${INK}" stroke-width="2.5"/><circle cx="60" cy="104" r="4" fill="#cfd6ea"/>` +
    `<circle cx="90" cy="104" r="11" fill="#555c80" stroke="${INK}" stroke-width="2.5"/><circle cx="90" cy="104" r="4" fill="#cfd6ea"/>` +
    `<rect x="20" y="22" width="80" height="72" rx="20" fill="#ffd166" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="28" y="34" width="64" height="50" rx="14" fill="#7fe3ff" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M34 42 Q40 36 50 37" fill="none" stroke="#e9fbff" stroke-width="3" stroke-linecap="round" opacity="0.9"/>` +
    pipEye(46, expr) +
    pipEye(74, expr) +
    pipMouth(expr) +
    `<rect x="10" y="48" width="10" height="20" rx="5" fill="#ff9f43" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="100" y="48" width="10" height="20" rx="5" fill="#ff9f43" stroke="${INK}" stroke-width="2.5"/>`
  );
}

function earth() {
  return (
    `<circle cx="60" cy="62" r="40" fill="#2f7fd6" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M34 44 Q44 30 60 34 Q66 42 58 50 Q50 52 46 62 Q36 60 34 44 Z" fill="#5ee08a" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M70 58 Q86 54 92 68 Q88 84 76 88 Q68 80 70 58 Z" fill="#5ee08a" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M40 82 Q50 76 58 86 Q52 96 44 94 Z" fill="#5ee08a" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M26 54 Q44 60 58 56" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.75"/>` +
    `<path d="M62 74 Q76 78 96 72" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.75"/>` +
    `<path d="M18 62 Q18 16 60 16 Q102 16 102 62" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="10" y="54" width="14" height="24" rx="6" fill="#ff9f43" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="96" y="54" width="14" height="24" rx="6" fill="#ff9f43" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M22 78 Q26 100 50 100" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
    `<rect x="48" y="95" width="14" height="9" rx="4.5" fill="#3a3f5c" stroke="${INK}" stroke-width="2"/>`
  );
}

const DRAW = { nova, sprout, pip, earth };

export function portrait(who, expr = "neutral", { title = "" } = {}) {
  const name = CHARACTERS.includes(who) ? who : "pip";
  const mood = expression(expr);
  const label = title ? `role="img" aria-label="${title.replace(/"/g, "&quot;")}"` : 'aria-hidden="true"';
  return (
    `<svg class="portrait portrait-${name}" data-expr="${mood}" viewBox="0 0 120 124" ${label} xmlns="http://www.w3.org/2000/svg">` +
    `<g class="portrait-body">${DRAW[name](mood)}</g>` +
    `<g class="portrait-extras">${name === "earth" ? "" : extras(mood)}</g>` +
    `</svg>`
  );
}

// The player's badge: a helmet in the color they picked. No face, so every
// child can picture themselves inside.
export function playerBadge(color = "#4fd1ff", { title = "" } = {}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#4fd1ff";
  const label = title ? `role="img" aria-label="${title.replace(/"/g, "&quot;")}"` : 'aria-hidden="true"';
  return (
    `<svg class="portrait portrait-player" viewBox="0 0 120 124" ${label} xmlns="http://www.w3.org/2000/svg">` +
    `<path d="M24 122 Q26 100 46 96 L74 96 Q94 100 96 122 Z" fill="#f4f6fb" stroke="${INK}" stroke-width="2.5"/>` +
    `<rect x="44" y="90" width="32" height="12" rx="6" fill="${safe}" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="60" cy="56" r="40" fill="#f4f6fb" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M28 56 Q28 32 60 32 Q92 32 92 56 Q92 78 60 78 Q28 78 28 56 Z" fill="#1d2440" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M36 50 Q40 38 56 38" fill="none" stroke="#9fdcff" stroke-width="4" stroke-linecap="round" opacity="0.8"/>` +
    `<circle cx="74" cy="62" r="5" fill="#2f7fd6"/><path d="M71 61 q3 -3 5 1" fill="none" stroke="#5ee08a" stroke-width="2"/>` +
    `<path d="M20 56 Q20 14 60 14 Q100 14 100 56" fill="none" stroke="${safe}" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="20" cy="58" r="8" fill="${safe}" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="100" cy="58" r="8" fill="${safe}" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M60 104 l2 4.2 4.6 .6 -3.3 3.2 .8 4.6 -4.1 -2.2 -4.1 2.2 .8 -4.6 -3.3 -3.2 4.6 -.6 Z" fill="#ffd166" stroke="${INK}" stroke-width="1.4"/>` +
    `</svg>`
  );
}
