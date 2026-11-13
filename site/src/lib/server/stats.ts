import "server-only";
import { addUnique, incrementMany, mutate, readCountersMany, readJSON } from "./kv";
import { randomToken, sha256 } from "./crypto";

/**
 * Visitor statistics without cookies and without storing anyone's address. A visitor is counted
 * once a day from a one-way code of a random key for the day, the address and the browser. The key
 * is made fresh each day and the old one is overwritten, so a code cannot be recomputed or linked
 * to another day afterwards; the codes themselves are forgotten after two days. What is kept is
 * counts per day: page views, visitors, visits, pages, referring sites, phone or computer (read
 * from the browser's name on the server), design, and a few named events (form started, interest
 * registered, document downloaded). Logged-in team members, robots and browsers that ask not to
 * be tracked are not counted.
 */
export const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|httpclient|axios|node-fetch/i;

/** The calendar day in Norway, YYYY-MM-DD. */
export function osloDay(d = new Date()) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Oslo" });
}

export type Hit = { path: string; ref: string; design: "klassisk" | "moderne" };

/** Phone or tablet by the browser's own name (its user agent); everything else counts as a computer. */
export function isMobile(ua: string) {
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|Silk|Kindle|Opera Mini/i.test(ua);
}

type DaySalt = { day: string; salt: string };
/**
 * The random key of the day, stored with the records and overwritten by the next day's. Each server process keeps
 * it for ten minutes, then reads it again, so processes that started the day at the same moment agree soon after.
 */
let daySalt: (DaySalt & { at: number }) | null = null;
async function saltFor(day: string): Promise<string> {
  if (daySalt?.day === day && Date.now() - daySalt.at < 10 * 60e3) return daySalt.salt;
  const stored = await readJSON<DaySalt>("stats-salt").catch(() => null);
  const salt = stored?.day === day && stored.salt
    ? stored.salt
    : await mutate<DaySalt, string>("stats-salt", () => ({ day: "", salt: "" }), (v) => {
        if (v.day !== day || !v.salt) {
          v.day = day;
          v.salt = randomToken(32);
        }
        return v.salt;
      });
  daySalt = { day, salt, at: Date.now() };
  return salt;
}

export async function recordPageview(h: Hit, ip: string, ua: string, host: string) {
  const day = osloDay();
  const visitor = sha256(`${await saltFor(day)}|${day}|${ip}|${ua}`).slice(0, 24);
  const fresh = await addUnique(`uv-${day}`, visitor, 2 * 86400);
  let from = "";
  try { from = h.ref ? new URL(h.ref).hostname.replace(/^www\./, "") : ""; } catch { /* not a URL */ }
  const internal = from && from === host.replace(/^www\./, "").split(":")[0];
  const fields: Record<string, number> = { pv: 1, [`p:${h.path}`]: 1, [`s:${h.design}`]: 1 };
  if (fresh) fields.uv = 1;
  if (!internal) {
    fields.visits = 1;
    fields[`r:${from || "direkte"}`] = 1;
    fields[`d:${isMobile(ua) ? "mobil" : "pc"}`] = 1;
  }
  await incrementMany(`stats-${day}`, fields, () => ({}));
}

/** Named events: form_start, lead, lead_buy, doc_download, dataset_download, question, login. */
export async function recordEvent(name: string, n = 1) {
  try {
    await incrementMany(`stats-${osloDay()}`, { [`e:${name}`]: n }, () => ({}));
  } catch { /* statistics must never break the action that triggered them */ }
}

export type Day = { date: string; c: Record<string, number> };

/** The last `n` days including today, oldest first. */
export async function readDays(n: number): Promise<Day[]> {
  const days = Array.from({ length: n }, (_, i) => osloDay(new Date(Date.now() - (n - 1 - i) * 86400e3)));
  const counts = await readCountersMany(days.map((d) => `stats-${d}`)).catch(() => days.map(() => ({} as Record<string, number>)));
  return days.map((date, i) => ({ date, c: counts[i] }));
}

/** Sum the counters of several days; `prefix` keeps one family (e.g. "p:" for pages) without the prefix. */
export function sum(days: Day[], prefix?: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const d of days) {
    for (const [k, v] of Object.entries(d.c)) {
      if (prefix ? !k.startsWith(prefix) : k.includes(":")) continue;
      const key = prefix ? k.slice(prefix.length) : k;
      out[key] = (out[key] ?? 0) + v;
    }
  }
  return out;
}

export const total = (days: Day[], key: string) => days.reduce((a, d) => a + (d.c[key] ?? 0), 0);
