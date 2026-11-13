import { ROLE_PARAM, roleFromParam } from "./forms";
import { kHref, kSplit, type KLocale } from "./klassisk/locale";
import { PATTERNS, matchKlassisk, matchModerne, type Match } from "./pages";

/**
 * The site has two designs of the same project, as Sigve asked for: Klassisk (the default, at / and /english) and
 * Moderne (at /no and /en). Each keeps its own addresses and pages. The switch at the top of every page opens the
 * matching page in the other design and remembers the choice in a cookie, so the front door (/ and /english) opens
 * the design the visitor picked last (see src/proxy.ts). Which page matches which comes from the page registry
 * (src/lib/pages.ts); the language stays: Norwegian Klassisk opens Norwegian Moderne, /english opens /en.
 * No Node or browser imports here: the proxy, the server and the client all read this file.
 */
export type Design = "klassisk" | "moderne";
export const DEFAULT_DESIGN: Design = "klassisk";
export const DESIGN_COOKIE = "knotten_design";

/** The Moderne path (after the language) for a Klassisk page path without /english, or null when the registry has none. */
function moderneFor(m: Match): string | null {
  if (m.pattern && m.id) return m.pattern.toModerne(m.id);
  const p = m.page;
  const path = p.twin?.moderne ?? p.moderne;
  return path === undefined ? null : path;
}

/** The Klassisk path (without /english) for a Moderne match, or null. */
function klassiskFor(m: Match): string | null {
  if (m.pattern && m.id) return m.pattern.toKlassisk(m.id);
  const p = m.page;
  return p.twin?.klassisk ?? p.klassisk ?? null;
}

/**
 * The Moderne page that says the same as a Klassisk address, in the same language: /energi to /no/energi,
 * /english/energi to /en/energi, /tomtene/07 to /no/tomter/plot-07, /kart to /no/omradet#kart. A page the
 * registry does not know opens the Moderne front page.
 */
export function toModerne(klassiskPath: string): string {
  const { locale, path } = kSplit(klassiskPath.split(/[?#]/)[0] || "/");
  const m = matchKlassisk(path);
  const target = m ? moderneFor(m) : null;
  return `/${locale}${target ?? ""}`;
}

/**
 * The Klassisk page that says the same as a Moderne address, in the same language: /no/energi to /energi,
 * /en/energi to /english/energi, /no/tomter/plot-07 to /tomtene/07, /no/omradet#bilder to /galleri. The portal and
 * anything unknown open the Klassisk front page.
 */
export function toKlassisk(modernePath: string): string {
  const m = /^\/(no|en)(?=\/|$|#)([^?]*)/.exec(modernePath);
  const locale: KLocale = m?.[1] === "en" ? "en" : "no";
  const rest = m ? m[2] : modernePath.split("?")[0];
  const found = matchModerne(rest);
  const target = found && found.page.key !== "portal" ? klassiskFor(found) : null;
  return kHref(target ?? "/", locale);
}

// ------------------------------------------------------------------------------------------------- the query string
/**
 * The two designs name the same choices differently: Klassisk's contact form takes `?tomt=07&rolle=investor`,
 * Moderne's interest form `?plot=plot-07&purpose=invest`. A switch keeps the query string (a link's `token` on the
 * password pages, anything else) and translates these: the plot, who is getting in touch (every role, by the one
 * table the forms read too: ROLE_PARAM in lib/forms.ts), and `next` on the login pages (a page of the design being
 * left is sent to its twin). The configurator writes the same state in both designs, so its query string is kept as
 * it is.
 */

const asString = (q: URLSearchParams) => {
  const s = q.toString();
  return s ? `?${s}` : "";
};

/** Pages whose query string is the same in both designs. */
const SAME_QUERY = /^\/konfigurator$/;

/** A plot number as both designs write it in their addresses: "7", "07" or "plot-07" to "07"; null when it is none. */
function plotNo(v: string | null | undefined): string | null {
  const m = /^(?:plot-)?(\d{1,2})$/.exec((v ?? "").trim());
  return m && Number(m[1]) >= 1 ? m[1].padStart(2, "0") : null;
}

/** `next` on a login page: a page of the design being left becomes its twin; the portal and unknown pages stay as they are. */
function nextTo(design: Design, next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) return next;
  const [path, query = ""] = next.split("?");
  const moderne = /^\/(no|en)(\/|$)/.test(path);
  if (design === "moderne") {
    if (moderne) return next;
    const { path: kp } = kSplit(path);
    if (!matchKlassisk(kp)) return next;
    return toModerne(path) + queryToModerne(query, kp);
  }
  if (!moderne || /^\/(no|en)\/portal(\/|$)/.test(path)) return next;
  const rest = path.replace(/^\/(no|en)/, "");
  if (!matchModerne(rest)) return next;
  return toKlassisk(path) + queryToKlassisk(query, rest);
}

/** Klassisk's query string as Moderne reads it. `page` is the Klassisk path without /english, when known. */
export function queryToModerne(search: string, page = ""): string {
  const q = new URLSearchParams(search);
  if (SAME_QUERY.test(page)) return asString(q);
  const tomt = plotNo(q.get("tomt"));
  const role = roleFromParam(q.get("rolle"));
  q.delete("tomt");
  q.delete("rolle");
  // the plot picker with a plot open becomes that plot's page (toModerneHref), not a query
  if (tomt && page !== "/tomtene") q.set("plot", `plot-${tomt}`);
  if (role) q.set("purpose", ROLE_PARAM[role].purpose);
  const next = q.get("next");
  if (next) q.set("next", nextTo("moderne", next));
  return asString(q);
}

/** Moderne's query string as Klassisk reads it. `page` is the Moderne path after the language, when known. */
export function queryToKlassisk(search: string, page = ""): string {
  const q = new URLSearchParams(search);
  if (SAME_QUERY.test(page)) return asString(q);
  const plot = plotNo(q.get("plot"));
  const role = roleFromParam(q.get("purpose"));
  q.delete("plot");
  q.delete("purpose");
  if (plot) q.set("tomt", plot);
  if (role) q.set("rolle", ROLE_PARAM[role].rolle);
  const next = q.get("next");
  if (next) q.set("next", nextTo("klassisk", next));
  return asString(q);
}

/**
 * The whole address in the other design: the matching page, the translated query string, and the section when the
 * other design has one (Moderne's #kart and #bilder are Klassisk's map and photo pages). The Klassisk plot picker
 * with a plot open (/tomtene?tomt=07) opens that plot's Moderne page.
 */
export function switchHref(current: Design, pathname: string, search = "", hash = "") {
  if (current === "klassisk") {
    const { locale, path } = kSplit(pathname);
    const tomt = path === "/tomtene" ? plotNo(new URLSearchParams(search).get("tomt")) : null;
    const plot = PATTERNS.find((p) => p.key === "plot")!;
    const base = toModerne(tomt ? kHref(plot.toKlassisk(tomt), locale) : pathname);
    const query = queryToModerne(search, path);
    // a target that is a section of its own (#kart) wins over the section of the page being left
    const at = base.indexOf("#");
    return at >= 0 ? base.slice(0, at) + query + base.slice(at) : base + query + hash;
  }
  const rest = pathname.replace(/^\/(no|en)(?=\/|$)/, "");
  // a section the registry knows (#kart, #bilder) is a page of its own in Klassisk; any other section comes along
  const section = !!hash && matchModerne(`${rest}${hash}`)?.page.moderne === `${rest}${hash}`;
  return toKlassisk(section ? pathname + hash : pathname) + queryToKlassisk(search, rest) + (section ? "" : hash);
}

/** Remembered for a year; read by the proxy on the next visit to / or /english. */
export function rememberDesign(design: Design) {
  document.cookie = `${DESIGN_COOKIE}=${design}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

// ---------------------------------------------------------------------------------------------- the other language
/**
 * The same Klassisk page in the other language, with the query string and the section: /energi?x=1#a to
 * /english/energi?x=1#a. `next` on the login pages follows the language.
 */
export function klassiskLangHref(pathname: string, search: string, hash: string, to: KLocale): string {
  const { path } = kSplit(pathname);
  const q = new URLSearchParams(search);
  const next = q.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//") && !/^\/(no|en)(\/|$)/.test(next)) {
    const [np, nq] = next.split("?");
    q.set("next", kHref(kSplit(np).path, to) + (nq ? `?${nq}` : ""));
  }
  return kHref(path, to) + asString(q) + hash;
}
