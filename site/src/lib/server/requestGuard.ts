import "server-only";
import { SITE } from "@/lib/meta";

/**
 * Checks for the public endpoints the site's own pages call with fetch (/api/ask, /api/collect): the body must be
 * JSON, and the request must come from a page on this site. Browsers say where a request comes from (Origin and
 * Sec-Fetch-Site); another website, or a form posted from one, cannot pretend otherwise. Bodies are read with a
 * cap (readCapped), here for every public endpoint and the portal's uploads.
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

/**
 * The body, read up to `max` bytes; null when it is larger. A declared Content-Length over the limit is refused
 * before anything is read, and a body without one (or one that lies) is read only until it passes the limit: the
 * rest is never read. Every public endpoint reads its body this way and answers 413 on null.
 */
export async function readCapped(req: Request, max: number): Promise<Uint8Array | null> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > max) return null;
  if (!req.body) return new Uint8Array(0);
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => undefined);
      return null;
    }
    parts.push(value);
  }
  const out = new Uint8Array(total);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.byteLength; }
  return out;
}

/** The body as text (UTF-8), at most `max` bytes; null when it is larger. */
export async function readTextCapped(req: Request, max: number): Promise<string | null> {
  const bytes = await readCapped(req, max);
  return bytes === null ? null : new TextDecoder().decode(bytes);
}
