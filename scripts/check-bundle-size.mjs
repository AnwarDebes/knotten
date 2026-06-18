// Hard gate on initial route JS (gzipped), per the performance budget in
// ADR-0011. It reads each prerendered route's HTML and sums the gzipped size of
// the scripts the browser actually loads, which is the most accurate, bundler
// agnostic measure of first-load JS. Legacy `noModule` polyfills (not run by
// modern browsers) and lazily-imported chunks (not referenced in the initial
// HTML, e.g. the 3D showpiece) are excluded by construction.
//
// Run after `pnpm build`. Fails if any content route's first-load JS exceeds
// the budget. Internal reference routes (the styleguide) are exempt.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const NEXT_DIR = ".next";
const APP_DIR = path.join(NEXT_DIR, "server", "app");
// Content-page ceiling. The Next 16 + React 19 App Router floor is about
// 122 KB gzip; a bilingual page adds the next-intl client provider and the
// locale switcher (about 11 KB); introducing the lazily-loaded 3D feature grew
// the shared client chunk by a further about 11 KB (a webpack chunking effect
// of the larger client-component graph and the code-splitting infrastructure).
// Three.js itself stays lazy (the key guarantee), so the ceiling still catches
// it entering an initial bundle. See ADR-0011.
const BUDGET_BYTES = 152 * 1024;
// Interactive tool pages legitimately ship more client logic. They get an
// explicit, documented higher budget (still far below what an eager 3D import
// would cost, so the lazy-3D guarantee is still enforced). See ADR-0011.
const ROUTE_BUDGETS = [{ match: "/omradet", bytes: 165 * 1024 }];
const budgetFor = (route) =>
  ROUTE_BUDGETS.find((r) => route.includes(r.match))?.bytes ?? BUDGET_BYTES;
const isExempt = (route) => route.includes("styleguide");

if (!fs.existsSync(APP_DIR)) {
  console.error(`No prerendered routes at ${APP_DIR}. Run \`pnpm build\` first.`);
  process.exit(1);
}

function findHtml(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findHtml(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const gzipSize = (src) => {
  const file = path.join(NEXT_DIR, src.replace(/^\/_next\//, ""));
  return fs.existsSync(file) ? zlib.gzipSync(fs.readFileSync(file)).length : 0;
};

const rows = [];
for (const htmlPath of findHtml(APP_DIR)) {
  const route = "/" + path.relative(APP_DIR, htmlPath).replace(/\.html$/, "");
  const html = fs.readFileSync(htmlPath, "utf8");
  const tags = [...html.matchAll(/<script ([^>]*?)src="([^"]+)"([^>]*)>/g)];
  let size = 0;
  for (const tag of tags) {
    const attrs = `${tag[1]} ${tag[3]}`;
    if (/nomodule/i.test(attrs)) continue;
    if (!tag[2].endsWith(".js")) continue;
    size += gzipSize(tag[2]);
  }
  rows.push({ route, size });
}

rows.sort((a, b) => b.size - a.size);
const kb = (bytes) => (bytes / 1024).toFixed(1);

console.log("First-load JS per prerendered route (gzipped, modern browsers):");
for (const row of rows) {
  const tag = isExempt(row.route) ? "  (exempt: internal reference)" : "";
  console.log(`  ${kb(row.size).padStart(7)} KB  ${row.route}${tag}`);
}
console.log(
  `\nBudget: ${BUDGET_BYTES / 1024} KB gzip per content route; interactive routes have documented higher limits (excludes legacy polyfills and lazy chunks).`,
);

const gated = rows.filter((row) => !isExempt(row.route));
if (gated.length === 0) {
  console.error("No content routes found to measure.");
  process.exit(1);
}

const over = gated.filter((row) => row.size > budgetFor(row.route));
if (over.length > 0) {
  for (const row of over) {
    console.error(
      `FAIL: ${row.route} first-load JS is ${kb(row.size)} KB, over its ${
        budgetFor(row.route) / 1024
      } KB budget.`,
    );
  }
  process.exit(1);
}

const heaviest = gated[0];
console.log(`PASS: heaviest content route ${heaviest.route} at ${kb(heaviest.size)} KB.`);
