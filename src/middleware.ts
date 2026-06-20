import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all paths except API routes, the non-localized admin area, Next
  // internals, and files with an extension (robots.txt, sitemap.xml, images).
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
