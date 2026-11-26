// Luna Crew
// Copyright 2026 Rishi Jambagi
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

// Two languages, loaded from data/i18n/*.json. Story and card text carry
// their own { en, ja } objects and go through pick().

export const LANGUAGES = ["en", "ja"];

export function fillVars(text, vars = {}) {
  return String(text).replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

export function createI18n(dictionaries, startLang = "en") {
  let lang = LANGUAGES.includes(startLang) ? startLang : "en";
  const listeners = new Set();

  const api = {
    get lang() {
      return lang;
    },
    setLang(next) {
      if (!LANGUAGES.includes(next) || next === lang) return;
      lang = next;
      for (const listener of listeners) listener(lang);
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    has(key) {
      return typeof dictionaries[lang]?.[key] === "string" || typeof dictionaries.en?.[key] === "string";
    },
    // Falls back to English, then to the key, so a missing line is easy to spot.
    t(key, vars) {
      const text = dictionaries[lang]?.[key] ?? dictionaries.en?.[key] ?? key;
      return fillVars(text, vars);
    },
    // For { en, ja } objects from the content files.
    pick(value, vars) {
      if (value === null || value === undefined) return "";
      if (typeof value === "string") return fillVars(value, vars);
      return fillVars(value[lang] ?? value.en ?? "", vars);
    },
    // Fills every element marked with data-i18n (text) or data-i18n-label (aria-label).
    apply(root = document) {
      for (const node of root.querySelectorAll("[data-i18n]")) node.textContent = api.t(node.dataset.i18n);
      for (const node of root.querySelectorAll("[data-i18n-label]")) {
        node.setAttribute("aria-label", api.t(node.dataset.i18nLabel));
      }
      document.documentElement.lang = lang;
    }
  };
  return api;
}

export async function loadDictionaries(fetchImpl = globalThis.fetch.bind(globalThis)) {
  const entries = await Promise.all(
    LANGUAGES.map(async (code) => {
      const response = await fetchImpl(`data/i18n/${code}.json`, { cache: "no-cache" });
      if (!response.ok) throw new Error(`Could not load data/i18n/${code}.json`);
      return [code, await response.json()];
    })
  );
  return Object.fromEntries(entries);
}

export function detectLanguage(search, stored, navigatorLanguage) {
  const fromUrl = new URLSearchParams(search || "").get("lang");
  if (LANGUAGES.includes(fromUrl)) return fromUrl;
  if (LANGUAGES.includes(stored)) return stored;
  if (String(navigatorLanguage || "").toLowerCase().startsWith("ja")) return "ja";
  return "en";
}
