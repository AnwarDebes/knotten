import { NextResponse, type NextRequest } from "next/server";
import { DESIGN_COOKIE } from "@/lib/design";
import { AUTH_COOKIE } from "@/lib/auth-shared";

/**
 * Two small jobs before a page renders.
 * The front door remembers the design: Klassisk lives at /, Moderne at /no, and a visitor who
 * picked Moderne with the switch is sent there when they come back to /. Links to a specific page
 * are left alone, so a shared link always opens the page that was shared.
 * The portal and Min side send visitors without a login cookie straight to the login page of their design and
 * language, with the way back: /min-side to /logg-inn, /no/min-side and /no/portal to /no/login.
 * This is only a shortcut: every portal page and Min side check the signed session themselves.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const portal = pathname.match(/^\/(no|en)\/portal(\/|$)/);
  const mine = pathname.match(/^\/(?:(no|en)\/)?min-side(\/|$)/);
  if (portal || mine) {
    if (!request.cookies.get(AUTH_COOKIE)) {
      const lang = portal?.[1] ?? mine?.[1];
      const url = new URL(lang ? `/${lang}/login` : "/logg-inn", request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    return;
  }
  if (request.cookies.get(DESIGN_COOKIE)?.value === "moderne") {
    return NextResponse.redirect(new URL("/no", request.url));
  }
}

export const config = { matcher: ["/", "/no/portal/:path*", "/en/portal/:path*", "/min-side/:path*", "/no/min-side/:path*", "/en/min-side/:path*"] };
