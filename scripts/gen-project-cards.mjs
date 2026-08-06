/**
 * Generate the project-card markup into index.html as STATIC HTML.
 *
 * Why: the cards used to be built at runtime by the terminal IIFE in main.js, so the
 * densest keyword content on the site did not exist in the HTML source. Google renders
 * JS on a deferred second pass with no guarantee (and this page loads three.js + WebGL);
 * Bing, LinkedIn's preview bot and the AI crawlers largely do not render at all.
 *
 * How: rather than duplicating the markup by hand — which would silently drift from
 * main.js — this script EXTRACTS the real PROJECTS data and the real html-building
 * functions out of main.js, runs them under a tiny DOM shim, and writes the result
 * between the markers in index.html. main.js then reuses that DOM instead of creating it.
 *
 * Run after editing PROJECTS or any of the card/panel markup in main.js:
 *
 *   node scripts/gen-project-cards.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAIN = resolve(root, "main.js");
const INDEX = resolve(root, "index.html");

const BEGIN = "<!-- BEGIN generated: project cards — node scripts/gen-project-cards.mjs -->";
const END = "<!-- END generated: project cards -->";

// ---- 1. Extract the card-building source out of main.js -------------------------
const mainSrc = readFileSync(MAIN, "utf8");
const from = mainSrc.indexOf("    var PROJECTS = [");
const to = mainSrc.indexOf("    // The SELECT is the last script entry");
if (from === -1 || to === -1 || to <= from) {
  throw new Error("could not locate the PROJECTS…projectsHtml block in main.js — markers moved?");
}
const block = mainSrc.slice(from, to);

// ---- 2. Minimal DOM shim ---------------------------------------------------------
// escapeHtml() in main.js round-trips through a detached div's textContent/innerHTML.
// innerHTML escapes &, < and > — and notably NOT quotes — so mirror exactly that.
const shim = `
  const window = { matchMedia: null };
  const document = {
    createElement() {
      return {
        _t: "",
        set textContent(v) { this._t = String(v); },
        get textContent() { return this._t; },
        get innerHTML() {
          return this._t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        }
      };
    }
  };
`;

const fn = new Function(`${shim}\n${block}\n return { html: projectsHtml(), count: PROJECTS.length };`);
const { html, count } = fn();

// ---- 3. Break into lines at whitespace-SAFE boundaries only ----------------------
// Deliberately NOT a general pretty-printer. Indenting every tag would inject
// whitespace text nodes inside inline elements (.proj-card__title, .filter__label,
// the frame spans), and that changes rendering. The card markup must stay visually
// identical to what main.js used to produce at runtime.
//
// So the element interiors are left byte-for-byte as generated, and newlines are
// inserted ONLY before tags whose parent is a grid/flex/block container — contexts
// where the CSS spec discards inter-element whitespace:
//   .proj-card   → child of .term-projects   (display:grid)
//   <li>         → child of .filter__items   (ul, block-level children)
//   the structural divs/aside → children of flex or block containers
function breakUp(src, indent) {
  const SAFE = [
    ['<div class="term-pgrid">', 0],
    ['<aside class="term-side"', 1],
    ['<div class="term-cards-view">', 1],
    ['<div class="term-cards-pan">', 2],
    ['<div class="term-projects">', 3],
    ['<div class="term-result__meta">', 3],
    ['<div class="proj-card"', 4],
    ["<li>", 4]
  ];
  let out = src;
  for (const [tag, depth] of SAFE) {
    out = out.split(tag).join("\n" + "  ".repeat(indent + depth) + tag);
  }
  return out.replace(/^\n/, "").split("\n").map((l) => (l.trim() ? l : "")).filter(Boolean).join("\n");
}

const generated = [
  BEGIN,
  "<!-- Do not edit by hand: regenerate with `node scripts/gen-project-cards.mjs`.",
  "     Source of truth is the PROJECTS array + projectsHtml() in main.js.",
  "     main.js reuses this markup at runtime and only animates it. -->",
  '<div class="term-pre"></div>',
  '<div class="term-sel"></div>',
  '<div class="term-result">',
  breakUp(html, 1),
  "</div>",
  END
].join("\n");

// ---- 4. Splice into index.html ---------------------------------------------------
let indexSrc = readFileSync(INDEX, "utf8");
const bi = indexSrc.indexOf(BEGIN);
const ei = indexSrc.indexOf(END);

if (bi !== -1 && ei !== -1) {
  indexSrc = indexSrc.slice(0, bi) + generated + indexSrc.slice(ei + END.length);
} else {
  const anchor = '<div class="terminal__body" id="term-body">';
  const ai = indexSrc.indexOf(anchor);
  if (ai === -1) throw new Error('could not find <div class="terminal__body" id="term-body"> in index.html');
  const close = indexSrc.indexOf("</div>", ai + anchor.length);
  if (close === -1) throw new Error("could not find the closing tag for #term-body");
  indexSrc = indexSrc.slice(0, ai + anchor.length) + "\n" + generated + "\n" + indexSrc.slice(close);
}

writeFileSync(INDEX, indexSrc);
console.log(`index.html updated — ${count} project cards rendered statically`);
