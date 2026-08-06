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

// ---- 3. Emit on ONE line — do NOT reformat ---------------------------------------
// The markup ships exactly as projectsHtml() produced it: no added newlines, no
// indentation. That is ugly in the source and it is the only correct option.
//
// The terminal body renders with `white-space: pre` — it is a terminal, the typed
// output depends on it. Under `pre` whitespace is NOT collapsible, so every newline
// between tags becomes a rendered line break and every indent becomes literal spaces.
// The familiar "inter-element whitespace is discarded in block/grid/flex containers"
// rule does not save you here: that rule is about COLLAPSIBLE white space.
//
// Measured cost of getting this wrong: breaking the line before each <li> in the
// filter list turned a 30px facet row into a 78px stride — 48px of blank line per
// facet. The same hazard applies to the .proj-card grid and every inline span.
//
// If you need to read this block, pipe it through a formatter in your terminal
// rather than changing what ships.

// Everything below is concatenated with NO separators. Newlines between these pieces
// would be text nodes inside the `white-space: pre` terminal body and would render as
// blank lines. Newlines INSIDE an HTML comment are safe — comments produce no text
// node — which is why the note below can stay multi-line.
const NOTE =
  "<!-- Do not edit by hand: regenerate with `node scripts/gen-project-cards.mjs`.\n" +
  "     Source of truth is the PROJECTS array + projectsHtml() in main.js; main.js\n" +
  "     reuses this markup at runtime and only animates it. Kept on one line on\n" +
  "     purpose: #term-body is `white-space: pre`, so any newline here renders. -->";

const generated =
  BEGIN + NOTE +
  '<div class="term-pre"></div><div class="term-sel"></div><div class="term-result">' +
  html +
  "</div>" + END;

// ---- 4. Splice into index.html ---------------------------------------------------
let indexSrc = readFileSync(INDEX, "utf8");
const bi = indexSrc.indexOf(BEGIN);
const ei = indexSrc.indexOf(END);

if (bi !== -1 && ei !== -1) {
  // Swallow any whitespace that already surrounds the block — an earlier revision
  // wrote the markers on their own lines, and those newlines render inside `pre`.
  let start = bi;
  while (start > 0 && /\s/.test(indexSrc[start - 1])) start--;
  let end = ei + END.length;
  while (end < indexSrc.length && /\s/.test(indexSrc[end])) end++;
  indexSrc = indexSrc.slice(0, start) + generated + indexSrc.slice(end);
} else {
  const anchor = '<div class="terminal__body" id="term-body">';
  const ai = indexSrc.indexOf(anchor);
  if (ai === -1) throw new Error('could not find <div class="terminal__body" id="term-body"> in index.html');
  const close = indexSrc.indexOf("</div>", ai + anchor.length);
  if (close === -1) throw new Error("could not find the closing tag for #term-body");
  // No newlines added: the block must butt directly against the open/close tags.
  indexSrc = indexSrc.slice(0, ai + anchor.length) + generated + indexSrc.slice(close);
}

writeFileSync(INDEX, indexSrc);
console.log(`index.html updated — ${count} project cards rendered statically`);
