/**
 * The site has two designs of the same project, as Sigve asked for: Klassisk (the default, at /)
 * and Moderne (at /no and /en). Each keeps its own addresses and pages. The switch at the top of
 * every page opens the matching page in the other design and remembers the choice in a cookie,
 * so the front door (/) opens the design the visitor picked last (see src/proxy.ts).
 * No Node or browser imports here: the proxy, the server and the client all read this file.
 */
export type Design = "klassisk" | "moderne";
export const DEFAULT_DESIGN: Design = "klassisk";
export const DESIGN_COOKIE = "knotten_design";

/** Klassisk page to the Moderne page that says the same thing (path after /no). */
const KLASSISK_TO_MODERNE: Record<string, string> = {
  "/": "",
  "/prosjektet": "/prosjektet",
  "/tomtene": "/tomter",
  "/energi": "/energi",
  "/eksisterende-bygg": "/energi/eksisterende",
  "/investorer": "/investor",
  "/dokumentbank": "/dokumenter",
  "/kontakt": "/interesse",
  "/logg-inn": "/login",
  "/logg-inn/passord": "/login/passord",
  // buyers' own accounts (lib/server/members.ts)
  "/registrer": "/registrer",
  "/min-side": "/min-side",
  "/personvern": "/personvern",
  "/status": "/status",
  // only in Klassisk: the closest Moderne page
  "/kart": "/omradet",
  "/galleri": "/utsikt",
  "/kilder": "/dokumenter",
};

/** Moderne page (path after the locale) to Klassisk. Checked in order, so sub-pages come first. */
const MODERNE_TO_KLASSISK: [string, string][] = [
  ["/energi/eksisterende", "/eksisterende-bygg"],
  ["/energi", "/energi"],
  ["/tomter", "/tomtene"],
  ["/prosjektet", "/prosjektet"],
  ["/investor", "/investorer"],
  ["/dokumenter", "/dokumentbank"],
  ["/kontakt", "/kontakt"],
  ["/interesse", "/kontakt"],
  ["/login/passord", "/logg-inn/passord"],
  ["/login", "/logg-inn"],
  ["/registrer", "/registrer"],
  ["/min-side", "/min-side"],
  ["/personvern", "/personvern"],
  ["/status", "/status"],
  // only in Moderne: the closest Klassisk page
  ["/utsikt", "/galleri"],
  ["/omradet", "/kart"],
];

/** Klassisk is Norwegian only, so it always opens the Norwegian Moderne pages. */
export function toModerne(klassiskPath: string): string {
  return `/no${KLASSISK_TO_MODERNE[klassiskPath] ?? ""}`;
}

/** Plot pages, news and anything unknown open the Klassisk front page or the nearest section. */
export function toKlassisk(modernePath: string): string {
  const rest = modernePath.replace(/^\/(no|en)(?=\/|$)/, "");
  for (const [from, to] of MODERNE_TO_KLASSISK) if (rest === from || rest.startsWith(`${from}/`)) return to;
  return "/";
}

// ------------------------------------------------------------------ the query string
/**
 * The two designs name the same choices differently: Klassisk's contact form takes `?tomt=7&rolle=investor`,
 * Moderne's interest form `?plot=plot-07&purpose=invest`. A switch keeps the query string (a link's `token` on
 * the password pages, `next` on the login pages, anything else) and translates those two.
 */
const asString = (q: URLSearchParams) => {
  const s = q.toString();
  return s ? `?${s}` : "";
};

export function queryToModerne(search: string): string {
  const q = new URLSearchParams(search);
  const tomt = q.get("tomt")?.trim() ?? "";
  const rolle = q.get("rolle");
  q.delete("tomt");
  q.delete("rolle");
  if (/^\d{1,2}$/.test(tomt) && Number(tomt) >= 1) q.set("plot", `plot-${tomt.padStart(2, "0")}`);
  if (rolle === "investor") q.set("purpose", "invest");
  return asString(q);
}

export function queryToKlassisk(search: string): string {
  const q = new URLSearchParams(search);
  const plot = /^plot-(\d{2})$/.exec(q.get("plot") ?? "");
  const purpose = q.get("purpose");
  q.delete("plot");
  q.delete("purpose");
  if (plot && Number(plot[1]) >= 1) q.set("tomt", String(Number(plot[1])));
  if (purpose === "invest") q.set("rolle", "investor");
  return asString(q);
}

/** The whole address in the other design: the matching page and the translated query string. */
export function switchHref(current: Design, pathname: string, search = "") {
  return current === "klassisk" ? toModerne(pathname) + queryToModerne(search) : toKlassisk(pathname) + queryToKlassisk(search);
}

/** Remembered for a year; read by the proxy on the next visit to /. */
export function rememberDesign(design: Design) {
  document.cookie = `${DESIGN_COOKIE}=${design}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}
