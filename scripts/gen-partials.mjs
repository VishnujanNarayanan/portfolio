/**
 * Inject the canonical header and footer (partials/*.html) into every page as STATIC HTML.
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
 * Run after editing partials/header.html or partials/footer.html:
 *
 *   node scripts/gen-partials.mjs
 *
 * Idempotent: re-running with no source change produces no diff.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Each partial: the source file, the markers it lives between, and the element it
// replaces on a page that has not been generated into yet.
const PARTIALS = [
  { name: "header", file: "partials/header.html", adopt: /<header[\s\S]*?<\/header>/ },
  { name: "footer", file: "partials/footer.html", adopt: /<footer[\s\S]*?<\/footer>/ },
].map((p) => ({
  ...p,
  // Strip the partial's own leading comment; it is guidance for whoever edits the
  // source, not something to ship on every page.
  body: readFileSync(resolve(root, p.file), "utf8").replace(/^<!--[\s\S]*?-->\n/, "").trim(),
  begin: `<!-- BEGIN generated: ${p.name} (source: ${p.file} — run scripts/gen-partials.mjs) -->`,
  end: `<!-- END generated: ${p.name} -->`,
}));

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
  const before = readFileSync(file, "utf8");
  let html = before;

  for (const part of PARTIALS) {
    const rendered =
      part.begin +
      "\n" +
      part.body
        .replaceAll("{{HOME}}", isHome ? "" : "/")
        .replaceAll("{{BLOG}}", isHome ? "#blog" : "/blog/")
        .replaceAll("{{HOME_HREF}}", isHome ? "#top" : "/")
        .replaceAll("{{CONTACT_ID}}", isHome ? ' id="contact"' : "") +
      "\n" +
      part.end;

    if (html.includes(part.begin)) {
      html = html.replace(
        new RegExp(escapeRe(part.begin) + "[\\s\\S]*?" + escapeRe(part.end)),
        () => rendered,
      );
    } else if (part.adopt.test(html)) {
      // First run: adopt whatever the page currently has.
      html = html.replace(part.adopt, () => rendered);
    } else {
      console.warn(`skip ${part.name} (not found): ${rel}`);
    }
  }

  if (html !== before) {
    writeFileSync(file, html);
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
