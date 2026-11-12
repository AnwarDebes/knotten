import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { authSecret, findById, loadAuth, type Account } from "./server/accounts";
import { hmac, safeEqual } from "./server/crypto";
import { ProblemError } from "./errors";
import type { Design } from "./design";
import { AUTH_COOKIE, can, isAdmin, PREVIEWS, VIEW_COOKIE, WHO_COOKIE, type Area, type Role, type Session } from "./auth-shared";

/**
 * Sessions: after a correct password the server sets a signed, httpOnly cookie that scripts in
 * the page cannot read. It carries the account id, the account's session version and an expiry.
 * Every request checks the signature and looks the account up again, so a disabled account or a
 * changed password ends old sessions at once. A second, readable cookie only carries the name
 * for the header's greeting; it grants nothing.
 */
export { ROLES, ROLE_LABEL, AREAS, AREA_LABEL, can, isAdmin } from "./auth-shared";
export type { Role, Session, Area } from "./auth-shared";

export { AUTH_COOKIE };
const LEGACY_COOKIE = "knotten_session";
const SHORT = 12 * 3600;        // a normal login lasts a working day
const LONG = 30 * 24 * 3600;    // "remember me": thirty days

/** u: account, v: session version, e: expiry; r: "remember me" was ticked; d: the design the person logged in from. */
type Payload = { u: string; v: number; e: number; r?: 1; d?: "k" | "m" };

async function sign(p: Payload) {
  const body = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${body}.${hmac(await authSecret(), body)}`;
}

async function verify(token: string | undefined): Promise<Payload | null> {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac || !safeEqual(mac, hmac(await authSecret(), body))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as Payload;
    return typeof p.u === "string" && typeof p.v === "number" && p.e * 1000 > Date.now() ? p : null;
  } catch {
    return null;
  }
}

/** A buyer's own account (a member) is always a plain user with no areas, whatever else the record says. */
const toSession = (a: Account): Session =>
  a.kind === "member"
    ? { id: a.id, email: a.email, name: a.name, role: "user", areas: [], kind: "member", verified: !!a.email_verified_at }
    : { id: a.id, email: a.email, name: a.name, role: a.role, areas: a.areas, plot: a.plot, org: a.org };

/** The person behind this request, ignoring any "view as" preview. Looked up once per request. */
export const getRealSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const p = await verify(jar.get(AUTH_COOKIE)?.value);
  if (!p) return null;
  const a = findById(await loadAuth(), p.u);
  if (!a || a.status !== "active" || a.sv !== p.v) return null;
  return toSession(a);
});

/**
 * How the current session was started: whether "remember me" was ticked and from which design. A session re-issued
 * after a password or profile change keeps both. Sessions from before this was recorded count as remembered when
 * they last longer than a working day.
 */
export const sessionInfo = cache(async (): Promise<{ remember: boolean; design?: Design } | null> => {
  const p = await verify((await cookies()).get(AUTH_COOKIE)?.value);
  if (!p) return null;
  return { remember: p.r === 1 || p.e - Date.now() / 1000 > SHORT + 60, design: p.d === "k" ? "klassisk" : p.d === "m" ? "moderne" : undefined };
});

/**
 * The person behind this request as the portal should treat them. For an administrator who has
 * chosen "view as", that is the narrower access of the chosen person; nobody else is affected.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const real = await getRealSession();
  if (!real || !isAdmin(real)) return real;
  const raw = (await cookies()).get(VIEW_COOKIE)?.value;
  if (!raw) return real;
  try {
    const v = JSON.parse(raw) as { id?: string; plot?: string };
    const p = PREVIEWS.find((x) => x.id === v.id);
    if (!p) return real;
    const plot = p.id === "resident" && typeof v.plot === "string" && /^plot-\d{2}$/.test(v.plot) ? v.plot : undefined;
    return { ...real, role: "user", areas: [...p.areas], plot, preview: { id: p.id, realRole: real.role } };
  } catch {
    return real;
  }
});

export async function getRole(): Promise<Role> {
  return (await getSession())?.role ?? "public";
}

/**
 * Set the cookies after a successful login (Server Functions only). `design` is where the person logged in, so a
 * later logout lands on the same design's login page; when not given, the current session's design is kept.
 */
export async function startSession(a: Account, remember: boolean, design?: Design) {
  const age = remember ? LONG : SHORT;
  const d = design ?? (await sessionInfo())?.design;
  const token = await sign({ u: a.id, v: a.sv, e: Math.floor(Date.now() / 1000) + age, ...(remember ? { r: 1 as const } : {}), ...(d ? { d: d === "klassisk" ? ("k" as const) : ("m" as const) } : {}) });
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(AUTH_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: age });
  const who = a.kind === "member" ? { name: a.name, role: "user", kind: "member" } : { name: a.name, role: a.role };
  jar.set(WHO_COOKIE, JSON.stringify(who), { httpOnly: false, sameSite: "lax", secure, path: "/", maxAge: age });
  jar.delete(LEGACY_COOKIE);
}

/** Log out on this device: the session, the greeting and any "view as" choice are forgotten. */
export async function endSession() {
  const jar = await cookies();
  jar.delete(AUTH_COOKIE);
  jar.delete(WHO_COOKIE);
  jar.delete(VIEW_COOKIE);
  jar.delete(LEGACY_COOKIE);
}

/**
 * True when another site made the browser send this request (a link or an image on another site). Downloads that
 * count, log or audit something answer only to the site's own pages and to addresses typed or bookmarked
 * ("same-origin" and "none"); browsers that send no Sec-Fetch-Site header are let through as before.
 */
export function fromOtherSite(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  return !!site && site !== "same-origin" && site !== "none";
}

/** The visitor's address, for counting attempts. Only the first hop that the host adds. */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim().slice(0, 64);
}

const LOGIN_PATH = /^\/((no|en)\/login|logg-inn)(\/|\?|#|$)/;

/**
 * A same-site path to continue to after logging in; anything else, or a login page, falls back to the portal.
 * The path is parsed the way the browser will read it: a tab or a newline in "/\t/evil.example" is dropped
 * by the URL parser and leaves "//evil.example", another site, so control characters are refused outright
 * and only a path that stays on this site is kept.
 */
export function safeNext(next: string | null | undefined, locale: string) {
  const fallback = `/${locale}/portal`;
  const n = String(next ?? "");
  if (!n.startsWith("/") || n.startsWith("//") || /[\u0000-\u001f\u007f\\]/.test(n)) return fallback;
  const base = "https://knotten.invalid";
  let u: URL;
  try { u = new URL(n, base); } catch { return fallback; }
  if (u.origin !== base) return fallback;
  const path = u.pathname + u.search + u.hash;
  if (LOGIN_PATH.test(path)) return fallback;
  return path;
}

/** The login page in a design and language (Klassisk is Norwegian; English opens the Moderne page). */
export function loginPath(design: Design | undefined, locale: "no" | "en") {
  return design === "klassisk" && locale === "no" ? "/logg-inn" : `/${locale}/login`;
}

/**
 * Where a logout lands: the login page of the design and language the person was using. The form may say so
 * (`design`, `locale`, or a login page in `to`); otherwise the design the session was started from decides.
 * Another same-site page in `to` is kept.
 */
export function afterLogout(fd: FormData, sessionDesign?: Design) {
  const to = String(fd.get("to") ?? "").trim().slice(0, 300);
  const locale: "no" | "en" = fd.get("locale") === "en" || fd.get("lang") === "en" || /^\/en(\/|$)/.test(to) ? "en" : "no";
  const asked = fd.get("design");
  const design: Design = asked === "klassisk" || /^\/logg-inn(\/|$)/.test(to) ? "klassisk" : asked === "moderne" ? "moderne" : (sessionDesign ?? "moderne");
  if (to && !LOGIN_PATH.test(to)) {
    const safe = safeNext(to, locale);
    if (safe !== `/${locale}/portal` || to === safe) return safe;
  }
  return loginPath(design, locale);
}

/**
 * For portal pages and their actions: the session, or a redirect to the login page (with the way
 * back). When `area` is given and the person may not open it, the result is null and the page
 * shows "no access" instead.
 */
export async function requireSession(locale: string, here: string): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/${locale}/login?next=${encodeURIComponent(here)}`);
  return s;
}

export async function requireArea(locale: string, here: string, area: Area | "admin" | "superadmin"): Promise<{ session: Session; ok: boolean }> {
  const session = await requireSession(locale, here);
  return { session, ok: can(session, area) };
}

/**
 * For Server Actions: the acting session, or a ProblemError ("preview" or "forbidden") that the portal's error
 * page explains in production as well (the reason travels in the error's digest, not its message).
 */
export async function actor(area: Area | "admin" | "superadmin" | "any" = "admin"): Promise<Session> {
  const s = await getSession();
  // a preview is for looking: nothing is changed in someone else's name
  if (s?.preview) throw new ProblemError("preview");
  // a buyer's own account acts on Min side (lib/server/members.ts), never in the portal
  if (!s || s.kind === "member" || (area !== "any" && !can(s, area))) throw new ProblemError("forbidden");
  return s;
}
