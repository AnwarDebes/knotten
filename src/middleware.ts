import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all paths except API routes, Next internals, and files with an
  // extension (robots.txt, sitemap.xml, images, and so on).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
