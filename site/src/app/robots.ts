import type { MetadataRoute } from "next";
import { SITE } from "@/lib/meta";

/**
 * Search engines may read the website, not the portal, the login and sign-up screens, Min side (pages for the
 * logged-in) or the data endpoints.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/no/portal", "/en/portal", "/no/login", "/en/login", "/logg-inn", "/min-side", "/no/min-side", "/en/min-side", "/registrer", "/no/registrer", "/en/registrer"],
    }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
