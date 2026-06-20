// Fetch real NO2 hourly spot prices for a few representative periods and cache
// them as compact JSON under public/data/no2. Source: hvakosterstrommen.no
// (free public API, attribution required; prices are NOK/kWh excluding VAT).
// Run once: node scripts/fetch-no2-prices.mjs
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "data", "no2");

// Representative windows from real history (two weeks each): an expensive,
// volatile winter; a recent winter; and a calm summer.
const PERIODS = [
  {
    key: "vinter-2022",
    labelNo: "Dyr vinter 2022",
    labelEn: "Expensive winter 2022",
    start: "2022-12-01",
    days: 14,
  },
  {
    key: "vinter-2024",
    labelNo: "Vinter 2024",
    labelEn: "Winter 2024",
    start: "2024-01-15",
    days: 14,
  },
  {
    key: "sommer-2024",
    labelNo: "Rolig sommer 2024",
    labelEn: "Calm summer 2024",
    start: "2024-07-01",
    days: 14,
  },
];

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function fetchDay(dateIso) {
  const [y, m, d] = dateIso.split("-");
  const url = `https://www.hvakosterstrommen.no/api/v1/prices/${y}/${m}-${d}_NO2.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const rows = await res.json();
  return rows.map((r) => ({ t: r.time_start, p: Math.round(r.NOK_per_kWh * 10000) / 10000 }));
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const index = [];
  for (const period of PERIODS) {
    const hours = [];
    for (let i = 0; i < period.days; i++) {
      const date = addDays(period.start, i);
      const day = await fetchDay(date);
      hours.push(...day);
    }
    const prices = hours.map((h) => h.p);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    await writeFile(
      path.join(OUT, `${period.key}.json`),
      JSON.stringify({
        key: period.key,
        zone: "NO2",
        start: period.start,
        days: period.days,
        unit: "NOK_per_kWh_ex_vat",
        source: "hvakosterstrommen.no",
        hours,
      }),
    );
    index.push({
      key: period.key,
      labelNo: period.labelNo,
      labelEn: period.labelEn,
      start: period.start,
      days: period.days,
      count: hours.length,
      avg: Math.round(avg * 10000) / 10000,
      min,
      max,
    });
    console.log(
      `${period.key}: ${hours.length}h avg=${avg.toFixed(3)} min=${min} max=${max} NOK/kWh`,
    );
  }
  await writeFile(path.join(OUT, "index.json"), JSON.stringify(index, null, 2));
  console.log(`Wrote ${index.length} periods to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
