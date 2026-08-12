#!/usr/bin/env node
/**
 * Downscale source images to the largest size any consumer actually displays.
 *
 * Run this after dropping new images into any directory listed in TARGETS —
 * it is idempotent, so re-running it on already-optimised files does nothing.
 *
 *   node scripts/optimize-images.mjs          # report what would change
 *   node scripts/optimize-images.mjs --write  # actually rewrite the files
 *
 * WHY a script and not a one-off `convert`: the requirement is a property of the
 * CSS (how big the box is on screen), not of any particular file. Photos land in
 * these folders at whatever the camera or export produced — 2048px wide in one
 * case — and every pixel above what the box can show is decode time and memory on
 * every visitor's machine for no visible gain.
 *
 * HOW the numbers are derived: for `object-fit: cover`, the image is scaled until
 * BOTH axes cover the box, so the binding constraint is whichever axis needs the
 * most upscaling. Take the largest box any consumer renders the image in, multiply
 * by 2 for retina, and that is the useful resolution. Anything beyond is waste.
 *
 * Images are only ever SHRUNK (`>` suffix). A file already at or below target is
 * left untouched — upscaling it would invent detail and just cost bytes.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * Each entry: a directory, and the biggest CSS box its images are displayed in.
 * Keep the comment next to each box in sync with styles.css — if a card grows,
 * the number here has to grow with it or the images turn soft.
 */
const DPR = 2;                       // serve retina; beyond 2x is not worth the bytes
const TARGETS = [
  {
    dir: "images/flow",
    // Two consumers share this folder. The socials card is the taller of the two,
    // so its height is what binds; the flow card is square and smaller on both axes.
    //   .flow-panel__cards .proj-card  ~281 x 281 css  (min(44vw,581px) grid, 2 cols)
    //   .callout-socials-card-w         288 x 504 css  (18rem x 31.5rem)
    box: { w: 288, h: 504 },
  },
];

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const write = process.argv.includes("--write");

function dims(file) {
  const out = execFileSync("identify", ["-format", "%w %h", file], { encoding: "utf8" });
  const [w, h] = out.trim().split(/\s+/).map(Number);
  return { w, h };
}

let totalBefore = 0, totalAfter = 0, changed = 0, kept = 0;

for (const { dir, box } of TARGETS) {
  const maxW = box.w * DPR, maxH = box.h * DPR;
  console.log(`\n${dir}  ->  target ${maxW}x${maxH} (box ${box.w}x${box.h} css @${DPR}x)`);

  let files;
  try {
    files = readdirSync(dir).filter((f) => EXT.has(extname(f).toLowerCase()));
  } catch {
    console.log("  (directory not found — skipped)");
    continue;
  }

  for (const name of files.sort()) {
    const file = join(dir, name);
    const before = statSync(file).size;
    const { w, h } = dims(file);
    totalBefore += before;

    // Scale needed for the image to still COVER the box on both axes. If it is
    // already at or under that, there is nothing to reclaim.
    const scale = Math.max(maxW / w, maxH / h);
    if (scale >= 1) {
      totalAfter += before;
      kept++;
      console.log(`  keep    ${name.padEnd(26)} ${w}x${h}  (already at/below target)`);
      continue;
    }

    const nw = Math.ceil(w * scale), nh = Math.ceil(h * scale);
    if (!write) {
      totalAfter += before;
      console.log(`  WOULD   ${name.padEnd(26)} ${w}x${h} -> ${nw}x${nh}`);
      continue;
    }

    execFileSync("convert", [file, "-resize", `${nw}x${nh}>`, "-quality", "82", "-strip", file]);
    const after = statSync(file).size;
    totalAfter += after;
    changed++;
    const pct = Math.round((1 - after / before) * 100);
    console.log(
      `  resize  ${name.padEnd(26)} ${w}x${h} -> ${nw}x${nh}   ` +
      `${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB (-${pct}%)`
    );
  }
}

const pct = totalBefore ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
console.log(
  `\n${write ? "rewrote" : "would rewrite"} ${write ? changed : ""} file(s), ${kept} already optimal` +
  `\ntotal ${(totalBefore / 1024).toFixed(0)}KB -> ${(totalAfter / 1024).toFixed(0)}KB (-${pct}%)` +
  (write ? "" : "\n\nre-run with --write to apply")
);
