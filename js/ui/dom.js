// Small helpers for building the page without a framework.

export function h(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, "");
    else node.setAttribute(key, String(value));
  }
  append(node, children);
  return node;
}

export function append(node, children) {
  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

export function $(selector, root = document) {
  return root.querySelector(selector);
}

let newTabNote = "(opens in a new tab)";

export function setNewTabNote(text) {
  newTabNote = text;
}

// Links to NASA pages always open in a new tab and say so.
export function sourceLink(url, label, extraClass = "") {
  return h("a", { href: url, target: "_blank", rel: "noopener noreferrer", class: `source-link ${extraClass}`.trim() }, [
    label,
    h("span", { class: "link-arrow", "aria-hidden": "true", text: " \u2197" }),
    h("span", { class: "visually-hidden", text: ` ${newTabNote}` })
  ]);
}

export function reducedMotion() {
  return document.documentElement.dataset.motion === "reduced";
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
