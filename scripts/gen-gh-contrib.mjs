#!/usr/bin/env node
/**
 * Bakes a STATIC GitHub contribution graph into the socials GitHub card.
 *
 * The hero card (.gh-card) draws the same graph at RUNTIME from
 * github-contributions-api.jogruber.de. The socials card must not repeat that
 * fetch — it is far down the page and the markup has to exist for crawlers — so
 * the grid is rendered here at build time and spliced into index.html between
 * the generated markers. The SVG is a port of ghBuildGraph() in main.js, so both
 * cards read identically (dark palette, weeks as columns, month labels).
 *
 * Re-run to refresh the data:  node scripts/gen-gh-contrib.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

// node's fetch can't reach the host from some sandboxes/WSL setups where curl can,
// so fall back to curl rather than failing the build.
async function getJSON(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch {
    return JSON.parse(execFileSync("curl", ["-sfL", "-m", "30", url], { encoding: "utf8", maxBuffer: 1 << 24 }));
  }
}

const USER = "VishnujanNarayanan";
const MONTHS_BACK = 6;                 // narrower card than the hero's 8 months
const LEVELS = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const data = await getJSON(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`);
const cut = new Date();
cut.setMonth(cut.getMonth() - MONTHS_BACK);
const cutStr = cut.toISOString().slice(0, 10);
const days = (data.contributions || []).filter((c) => c.date >= cutStr);
if (!days.length) throw new Error("no contribution days returned");

const total = days.reduce((s, c) => s + (c.count || 0), 0);
const STEP = 13, SIZE = 11, TOP = 18;
let col = 0, lastMonth = -1, lastLabelCol = -99, cells = "", labels = "";
const first = new Date(days[0].date + "T00:00:00Z");
const stubMonth = first.getUTCDate() > 7 ? first.getUTCMonth() : -1;
days.forEach((d, i) => {
  const dt = new Date(d.date + "T00:00:00Z"), dow = dt.getUTCDay();
  if (i > 0 && dow === 0) col++;
  const x = col * STEP, y = TOP + dow * STEP;
  cells += `<rect x="${x}" y="${y}" width="${SIZE}" height="${SIZE}" rx="2" ry="2" fill="${LEVELS[d.level] || LEVELS[0]}"/>`;
  if (dow === 0) {
    const m = dt.getUTCMonth();
    if (m !== lastMonth) {
      lastMonth = m;
      if (m !== stubMonth && col - lastLabelCol >= 3) {
        labels += `<text x="${x}" y="11" fill="#7d8590" font-size="9">${MONTHS[m]}</text>`;
        lastLabelCol = col;
      }
    }
  }
});
const w = (col + 1) * STEP - (STEP - SIZE) + 16, h = TOP + 7 * STEP - (STEP - SIZE);
const svg = `<svg viewBox="0 -4 ${w} ${h + 4}" preserveAspectRatio="xMinYMin meet" role="img" aria-label="GitHub contribution graph, last ${MONTHS_BACK} months">${labels}${cells}</svg>`;

// One line: #term-body computes white-space:pre-wrap, so newlines here would render.
const block = `<div class="soc-card__gh-contrib"><span class="soc-card__gh-label"><b>${total.toLocaleString("en-US")}</b> contributions &middot; last ${MONTHS_BACK} months</span><div class="soc-card__gh-chart">${svg}</div></div>`;

const FILE = "index.html";
const BEGIN = "<!-- BEGIN generated: gh contributions -->";
const END = "<!-- END generated: gh contributions -->";
let html = readFileSync(FILE, "utf8");
const a = html.indexOf(BEGIN), b = html.indexOf(END);
if (a < 0 || b < 0) throw new Error(`markers not found in ${FILE}`);
const out = html.slice(0, a + BEGIN.length) + block + html.slice(b);
if (out !== html) { writeFileSync(FILE, out); console.log(`${FILE}: ${total} contributions, ${col + 1} weeks`); }
else console.log(`${FILE}: unchanged`);
