import { NextResponse, type NextRequest } from "next/server";
import { DESIGN_COOKIE } from "@/lib/design";
import { AUTH_COOKIE, LEGACY_AUTH_COOKIE } from "@/lib/auth-shared";

/**
 * Two small jobs before a page renders.
 * The front doors remember the design: Klassisk lives at / and /english, Moderne at /no and /en, and a visitor who
 * picked Moderne with the switch is sent there when they come back to / (to /no) or /english (to /en). Links to a
 * specific page are left alone, so a shared link always opens the page that was shared.
 * The portal and Min side send visitors without a login cookie straight to the login page of their design and
 * language, with the way back: /min-side to /logg-inn, /english/min-side to /english/logg-inn, /no/min-side and
 * /no/portal to /no/login.
 * This is only a shortcut: every portal page and Min side check the signed session themselves.
 *
 * A session from before the cookie got its __Host- name (lib/auth-shared.ts) still counts: on these addresses the
 * old cookie is moved to the new name, for this request and in the browser, and the old one is cleared. The page
 * then checks the signature as always; a forged or broken cookie simply reads as no session there, and the login
 * page (which this proxy never redirects) shows the form, so nobody is sent in a circle.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const moved = moveLegacySession(request);
  const portal = pathname.match(/^\/(no|en)\/portal(\/|$)/);
  const mine = pathname.match(/^\/(?:(no|en|english)\/)?min-side(\/|$)/);
  if (portal || mine) {
    if (!request.cookies.get(AUTH_COOKIE) && !moved) {
      const lang = portal?.[1] ?? mine?.[1];
      const login = lang === "english" ? "/english/logg-inn" : lang ? `/${lang}/login` : "/logg-inn";
      const url = new URL(login, request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return moved ? moved.next() : undefined;
  }
  if ((pathname === "/" || pathname === "/english") && request.cookies.get(DESIGN_COOKIE)?.value === "moderne") {
    const res = NextResponse.redirect(new URL(`${pathname === "/english" ? "/en" : "/no"}${search}`, request.url));
    return moved ? moved.apply(res) : res;
  }
  return moved ? moved.next() : undefined;
}

/** Seconds left of a session token, read from its payload (the signature is checked by the page, not here); 0 when it is not one. */
function secondsLeft(token: string): number {
  try {
    const body = token.split(".")[0].replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(body)) as { e?: unknown };
    return typeof p.e === "number" ? Math.floor(p.e - Date.now() / 1000) : 0;
  } catch {
    return 0;
  }
}

/**
 * The session cookie under its old name only (production, where the new name has the __Host- prefix): the answer
 * that carries it over to the new name, or null when there is nothing to move. An old cookie that has run out (or is
 * not a session token at all) is left alone and counts as no session.
 */
function moveLegacySession(request: NextRequest) {
  if (AUTH_COOKIE === LEGACY_AUTH_COOKIE || request.cookies.get(AUTH_COOKIE)) return null;
  const old = request.cookies.get(LEGACY_AUTH_COOKIE)?.value;
  if (!old) return null;
  const left = secondsLeft(old);
  if (left <= 0) return null;
  const secure = process.env.NODE_ENV === "production";
  // the page sees the session under the new name at once; the browser keeps it under the new name from now on
  request.cookies.set(AUTH_COOKIE, old);
  request.cookies.delete(LEGACY_AUTH_COOKIE);
  const apply = (res: NextResponse) => {
    res.cookies.set(AUTH_COOKIE, old, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: left });
    res.cookies.set(LEGACY_AUTH_COOKIE, "", { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 0 });
    return res;
  };
  return { apply, next: () => apply(NextResponse.next({ request: { headers: request.headers } })) };
}

export const config = {
  matcher: ["/", "/english", "/no/portal/:path*", "/en/portal/:path*", "/min-side/:path*", "/english/min-side/:path*", "/no/min-side/:path*", "/en/min-side/:path*"],
};
