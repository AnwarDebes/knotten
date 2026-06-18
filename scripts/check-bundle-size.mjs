// Hard gate on initial route JS (gzipped), per the performance budget in
// ADR-0011. It reads each prerendered route's HTML and sums the gzipped size of
// the scripts the browser actually loads, which is the most accurate, bundler
// agnostic measure of first-load JS. Legacy `noModule` polyfills (not run by
// modern browsers) and lazily-imported chunks (not referenced in the initial
// HTML, e.g. the 3D showpiece) are excluded by construction.
//
// Run after `pnpm build`. Fails if any route's first-load JS exceeds the budget.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const NEXT_DIR = ".next";
const APP_DIR = path.join(NEXT_DIR, "server", "app");
// Framework floor for Next 16 + React 19 App Router is about 122 KB gzip
// (see ADR-0011). The ceiling allows modest per-page client code while still
// catching heavy regressions, above all the 3D library entering an initial
// bundle. Interactive tool pages get explicit per-route budgets in SPEC-22.
const BUDGET_BYTES = 130 * 1024;

if (!fs.existsSync(APP_DIR)) {
  console.error(`No prerendered routes at ${APP_DIR}. Run \`pnpm build\` first.`);
  process.exit(1);
}

const htmlFiles = fs.readdirSync(APP_DIR).filter((f) => f.endsWith(".html"));
if (htmlFiles.length === 0) {
  console.error("No prerendered HTML routes found to measure.");
  process.exit(1);
}

const gzipSize = (src) => {
  const file = path.join(NEXT_DIR, src.replace(/^\/_next\//, ""));
  return fs.existsSync(file) ? zlib.gzipSync(fs.readFileSync(file)).length : 0;
};

const rows = [];
for (const htmlFile of htmlFiles) {
  const html = fs.readFileSync(path.join(APP_DIR, htmlFile), "utf8");
  const tags = [...html.matchAll(/<script ([^>]*?)src="([^"]+)"([^>]*)>/g)];
  let size = 0;
  for (const tag of tags) {
    const attrs = `${tag[1]} ${tag[3]}`;
    if (/nomodule/i.test(attrs)) continue; // legacy-only, modern browsers skip it
    if (!tag[2].endsWith(".js")) continue;
    size += gzipSize(tag[2]);
  }
  rows.push({ route: htmlFile.replace(/\.html$/, ""), size });
}

rows.sort((a, b) => b.size - a.size);
const kb = (bytes) => (bytes / 1024).toFixed(1);

console.log("First-load JS per prerendered route (gzipped, modern browsers):");
for (const row of rows) {
  console.log(`  ${kb(row.size).padStart(7)} KB  ${row.route}`);
}
console.log(
  `\nBudget: ${BUDGET_BYTES / 1024} KB gzip per route (excludes legacy polyfills and lazy chunks).`,
);

const heaviest = rows[0];
if (heaviest.size > BUDGET_BYTES) {
  console.error(
    `FAIL: ${heaviest.route} first-load JS is ${kb(heaviest.size)} KB, over the ${
      BUDGET_BYTES / 1024
    } KB budget.`,
  );
  process.exit(1);
}

console.log(`PASS: heaviest route ${heaviest.route} at ${kb(heaviest.size)} KB.`);
