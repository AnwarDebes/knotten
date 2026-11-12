import { SITE } from "@/lib/meta";

/**
 * Checks for the public endpoints the site's own pages call with fetch (/api/ask, /api/collect): the body must be
 * JSON, and the request must come from a page on this site. Browsers say where a request comes from (Origin and
 * Sec-Fetch-Site); another website, or a form posted from one, cannot pretend otherwise.
 */
export function isJson(req: Request): boolean {
  return (req.headers.get("content-type") ?? "").toLowerCase().split(";")[0].trim() === "application/json";
}

function hosts(req: Request): Set<string> {
  const out = new Set<string>();
  try { out.add(new URL(req.url).host); } catch { /* not a URL */ }
  const h = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (h) out.add(h.split(",")[0].trim());
  try { out.add(new URL(SITE).host); } catch { /* not a URL */ }
  return out;
}

export function isSameOrigin(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = req.headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    return hosts(req).has(new URL(origin).host);
  } catch {
    return false;
  }
}
