import type { MetadataRoute } from "next";
import { SITE } from "@/lib/meta";
import { privatePrefixes } from "@/lib/pages";

/**
 * Search engines may read the website in both designs and languages, not the data endpoints, the portal, or the
 * login, password, sign-up and Min side pages (src/lib/pages.ts marks them; every design and language is covered).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", ...privatePrefixes()] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
