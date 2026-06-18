import type { MetadataRoute } from "next";

const indexable = process.env.SITE_INDEXABLE === "true";

// The site is disallowed for crawlers until the client approves go-live
// (SITE_INDEXABLE=true). This keeps draft content and placeholders out of search.
export default function robots(): MetadataRoute.Robots {
  if (!indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" } };
}
