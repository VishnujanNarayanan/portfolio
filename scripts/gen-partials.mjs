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

// The footer headline. Blog pages ask for the subscription the card below it
// takes; every other page keeps the site's line.
const FOOTER_HEADLINE_DEFAULT = `          <span class="lfooter__hl-row">Data in.</span>
          <span class="lfooter__hl-row"><span class="is-hl">Products</span> out.</span>`;
const FOOTER_HEADLINE_BLOG = `          <span class="lfooter__hl-row">Subscribe to my</span>
          <span class="lfooter__hl-row"><span class="is-hl">Newsletter</span></span>`;

// The two things that can fill the bottom of the footer's dark box.
const FOOTER_PORTRAIT = `      <img class="lfooter__me" src="/images/footer-me2.webp" alt="Vishnujan Narayanan" loading="lazy" decoding="async">`;

// A real form, not a picture of one: same GET-to-Substack handoff as the modal in
// partials/header.html, so a reader who scrolls to the end of a post can subscribe
// without opening anything. Its id is suffixed to keep it unique against the
// modal's field, which is present on the same page.
const FOOTER_SUBSCRIBE = `      <div class="lfooter__sub">
        <h3 class="lfooter__sub-title">Get new posts by email</h3>
        <p class="lfooter__sub-text">Data pipelines, web scraping, and market-data experiments — delivered as they go up.</p>
        <form class="subform" action="https://vishnujannarayanan.substack.com/subscribe" method="get" target="_blank" rel="noopener">
          <label class="subform__label" for="footer-subscribe-email">Email</label>
          <div class="subform__row">
            <input class="subform__input" id="footer-subscribe-email" type="email" name="email" required autocomplete="email" placeholder="you@example.com" spellcheck="false">
            <button class="subform__btn" type="submit">Subscribe</button>
          </div>
        </form>
        <p class="lfooter__sub-note">No account needed, and you can unsubscribe from this email. By subscribing you agree to Substack's <a href="https://substack.com/tos" target="_blank" rel="noopener">Terms of Use</a> and <a href="https://substack.com/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</p>
        <a class="substack-badge substack-badge--dark" href="https://vishnujannarayanan.substack.com/" target="_blank" rel="me noopener">
          <svg viewBox="0 0 21 24" width="13" height="15" aria-hidden="true" focusable="false"><path d="M20.999 0H0v2.836h20.999V0Z" fill="currentColor"></path><path d="M20.999 5.406H0v2.836h20.999V5.406Z" fill="currentColor"></path><path d="M0 10.813V24l10.499-5.887L21 24V10.813H0Z" fill="currentColor"></path></svg>
          <span>Substack</span>
        </a>
      </div>`;

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
  const isBlog = rel.startsWith("blog/");
  const before = readFileSync(file, "utf8");
  let html = before;

  for (const part of PARTIALS) {
    const rendered =
      part.begin +
      "\n" +
      part.body
        .replaceAll("{{HOME}}", isHome ? "" : "/")
        // Always the blog PAGE, never the homepage's in-page writing section: the
        // nav item promises a blog and the section is only a teaser for it.
        .replaceAll("{{BLOG}}", "/blog/")
        .replaceAll("{{HOME_HREF}}", isHome ? "#top" : "/")
        .replaceAll("{{CONTACT_ID}}", isHome ? ' id="contact"' : "")
        // Blog pages close on the subscribe card; every other page keeps the
        // portrait cutout. Same field, different invitation.
        .replaceAll("{{FOOTER_FEATURE}}", isBlog ? FOOTER_SUBSCRIBE : FOOTER_PORTRAIT)
        .replaceAll("{{FOOTER_HEADLINE}}", isBlog ? FOOTER_HEADLINE_BLOG : FOOTER_HEADLINE_DEFAULT) +
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
