/**
 * Inject the canonical footer (partials/footer.html) into every page as STATIC HTML.
 *
 * Why a generator and not a runtime include: the footer carries the site's internal
 * link graph (Pages column, social links with rel="me", the email pill). Building it
 * with JS would hide those links from the crawlers that do not execute JS — the same
 * reason the project cards are pre-rendered, and the same rule SEO.md states as
 * "do not put important content only inside JS". A build step keeps one source of
 * truth AND ships real markup.
 *
 * Why not copy-paste: the footer previously existed in ten files. Any edit had to be
 * repeated ten times or the pages silently drifted apart.
 *
 * Tokens resolved per page:
 *   {{CONTACT_ID}}  ' id="contact"' on the homepage only — the id must stay unique
 *                   and the header's Contact link targets it.
 *   {{HOME}}        '' on the homepage so its in-page anchors behave exactly as
 *                   before; '/' on sub-pages so #projects leaves the sub-page.
 *
 * Run after editing partials/footer.html:
 *
 *   node scripts/gen-footer.mjs
 *
 * Idempotent: re-running with no source change produces no diff.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PARTIAL = resolve(root, "partials/footer.html");

const BEGIN = "<!-- BEGIN generated: footer (source: partials/footer.html — run scripts/gen-footer.mjs) -->";
const END = "<!-- END generated: footer -->";

// Strip the partial's own leading explanatory comment; it is guidance for whoever
// edits the source, not something to ship on every page.
const partial = readFileSync(PARTIAL, "utf8").replace(/^<!--[\s\S]*?-->\n/, "").trim();

// node:fs globSync needs Node 22; enumerate the two content dirs instead so this
// runs on whatever Node the machine has.
function pagesIn(dir) {
  const base = resolve(root, dir);
  if (!existsSync(base)) return [];
  return readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => resolve(base, e.name, "index.html"))
    .filter(existsSync);
}

const pages = [
  resolve(root, "index.html"),
  resolve(root, "blog/index.html"),
  ...pagesIn("blog"),
  ...pagesIn("projects"),
].filter((p, i, a) => existsSync(p) && a.indexOf(p) === i);

let changed = 0;

for (const file of pages) {
  const rel = relative(root, file);
  const isHome = rel === "index.html";
  const html = readFileSync(file, "utf8");

  const rendered =
    BEGIN +
    "\n" +
    partial
      .replaceAll("{{CONTACT_ID}}", isHome ? ' id="contact"' : "")
      .replaceAll("{{HOME}}", isHome ? "" : "/") +
    "\n" +
    END;

  let out;
  if (html.includes(BEGIN)) {
    // Re-generate in place.
    out = html.replace(
      new RegExp(escapeRe(BEGIN) + "[\\s\\S]*?" + escapeRe(END)),
      () => rendered,
    );
  } else {
    // First run: adopt whatever footer the page currently has.
    const footer = /<footer[\s\S]*?<\/footer>/;
    if (!footer.test(html)) {
      console.warn(`skip (no <footer>): ${rel}`);
      continue;
    }
    out = html.replace(footer, () => rendered);
  }

  if (out !== html) {
    writeFileSync(file, out);
    changed++;
    console.log(`wrote ${rel}`);
  } else {
    console.log(`unchanged ${rel}`);
  }
}

console.log(`\n${pages.length} pages, ${changed} written`);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
