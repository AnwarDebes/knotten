/**
 * A link to one view of the 3D stage, "Del denne visningen" / "Share this view": a plot, a day and an hour. Both
 * designs read and write the same three parameters:
 *
 *   ?tomt=07          the plot (on a plot's own page, /tomtene/07 or /no/tomter/plot-07, the page says which;
 *                     Moderne also takes ?plot=plot-07, which is what the design switch makes of ?tomt)
 *   ?dato=2026-12-21  the day (the model's sun is the same in every year; the year is there for the reader)
 *   ?kl=12, ?kl=12.15 the hour, in the quarters the dial moves in (12:15 is read too)
 *
 * Anything else on the address is kept as it is. No browser or Node imports: plain functions on strings.
 */
export type SharedView = { plot: string | null; month: number | null; day: number | null; hour: number | null };

const two = (n: number) => String(n).padStart(2, "0");

/** The days in a month of the dial's year (2026, the year of the model's sun). */
export const daysIn = (month: number) => new Date(Date.UTC(2026, month, 0)).getUTCDate();

/** "7", "07" or "plot-07" -> "plot-07" when that plot exists. */
function plotId(v: string | null, ids: readonly string[]): string | null {
  const m = /^(?:plot-)?(\d{1,2})$/.exec((v ?? "").trim());
  if (!m) return null;
  const id = `plot-${two(Number(m[1]))}`;
  return ids.includes(id) ? id : null;
}

/** The view a shared address asks for, or null when it asks for none (no plot, day or hour that can be read). */
export function readView(search: string, ids: readonly string[]): SharedView | null {
  const q = new URLSearchParams(search);
  const plot = plotId(q.get("tomt"), ids) ?? plotId(q.get("plot"), ids);
  let month: number | null = null, day: number | null = null, hour: number | null = null;
  const d = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec((q.get("dato") ?? "").trim());
  if (d) {
    const m = Number(d[2]), dd = Number(d[3]);
    if (m >= 1 && m <= 12 && dd >= 1 && dd <= 31) { month = m; day = Math.min(dd, daysIn(m)); }
  }
  const k = /^(\d{1,2})(?:[:.]?(\d{2}))?$/.exec((q.get("kl") ?? "").trim());
  if (k) {
    const h = Number(k[1]), mm = Number(k[2] ?? 0);
    // the dial moves in quarters of an hour, up to 23:45
    if (h <= 23 && mm <= 59) hour = Math.min(23.75, h + Math.round(mm / 15) / 4);
  }
  return plot || month !== null || hour !== null ? { plot, month, day, hour } : null;
}

/** The plot whose own page this is: Klassisk /tomtene/07 (and /english/tomtene/07), Moderne /no/tomter/plot-07. */
export function plotInPath(pathname: string): string | null {
  const k = /^(?:\/english)?\/tomtene\/(\d{2})\/?$/.exec(pathname);
  if (k) return `plot-${k[1]}`;
  const m = /^\/(?:no|en)\/tomter\/(plot-\d{2})\/?$/.exec(pathname);
  return m ? m[1] : null;
}

/** "12" for a whole hour, "12.15" for a quarter past, as Norwegian writes the time. */
export function hourParam(hour: number) {
  const h = Math.floor(hour), m = Math.round((hour - h) * 60);
  return m ? `${two(h)}.${two(m)}` : two(h);
}

/**
 * The address of a view: the page it is on (its other parameters kept), the plot unless it is the page's own, and
 * the day and hour. `year` is the calendar year written in the date.
 */
export function viewHref(href: string, view: { plot: string | null; month: number; day: number; hour: number }, year: number) {
  const u = new URL(href);
  for (const k of ["tomt", "plot", "dato", "kl"]) u.searchParams.delete(k);
  u.hash = "";
  if (view.plot && view.plot !== plotInPath(u.pathname)) u.searchParams.set("tomt", view.plot.replace("plot-", ""));
  u.searchParams.set("dato", `${year}-${two(view.month)}-${two(view.day)}`);
  u.searchParams.set("kl", hourParam(view.hour));
  return u.toString();
}
