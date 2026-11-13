import { NextResponse, type NextRequest } from "next/server";
import { DESIGN_COOKIE } from "@/lib/design";
import { AUTH_COOKIE } from "@/lib/auth-shared";

/**
 * Two small jobs before a page renders.
 * The front doors remember the design: Klassisk lives at / and /english, Moderne at /no and /en, and a visitor who
 * picked Moderne with the switch is sent there when they come back to / (to /no) or /english (to /en). Links to a
 * specific page are left alone, so a shared link always opens the page that was shared.
 * The portal and Min side send visitors without a login cookie straight to the login page of their design and
 * language, with the way back: /min-side to /logg-inn, /english/min-side to /english/logg-inn, /no/min-side and
 * /no/portal to /no/login.
 * This is only a shortcut: every portal page and Min side check the signed session themselves.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const portal = pathname.match(/^\/(no|en)\/portal(\/|$)/);
  const mine = pathname.match(/^\/(?:(no|en|english)\/)?min-side(\/|$)/);
  if (portal || mine) {
    if (!request.cookies.get(AUTH_COOKIE)) {
      const lang = portal?.[1] ?? mine?.[1];
      const login = lang === "english" ? "/english/logg-inn" : lang ? `/${lang}/login` : "/logg-inn";
      const url = new URL(login, request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return;
  }
  if ((pathname === "/" || pathname === "/english") && request.cookies.get(DESIGN_COOKIE)?.value === "moderne") {
    return NextResponse.redirect(new URL(`${pathname === "/english" ? "/en" : "/no"}${search}`, request.url));
  }
}

export const config = {
  matcher: ["/", "/english", "/no/portal/:path*", "/en/portal/:path*", "/min-side/:path*", "/english/min-side/:path*", "/no/min-side/:path*", "/en/min-side/:path*"],
};
