import { NextResponse } from "next/server";
import { readTextCapped } from "@/lib/server/requestGuard";

/**
 * The checks every configurator route makes before it reads a body: JSON only, from a page on this site, not
 * too large. A browser always sends Origin with a POST or DELETE, so a request without one (or from another
 * site) is refused; the host is the one this request came to, or SITE_URL.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  for (const h of [req.headers.get("x-forwarded-host"), req.headers.get("host")]) if (h) allowed.add(h.split(",")[0].trim().toLowerCase());
  if (process.env.SITE_URL) {
    try {
      allowed.add(new URL(process.env.SITE_URL).host.toLowerCase());
    } catch { /* a malformed SITE_URL adds nothing */ }
  }
  return allowed.has(host);
}

/** The visitor's network, as the other public forms count it (the first hop the host adds). */
export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim().slice(0, 64);
}

export const fail = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * The JSON body, or the answer to give when it is not JSON, too large, or not from this site. At most `max` bytes are
 * read (lib/server/requestGuard.ts readTextCapped): a larger body is refused with 413 and the rest is never read.
 */
export async function jsonBody(req: Request, max = 20_000): Promise<{ body: unknown } | { error: NextResponse }> {
  if (!/^application\/json\b/i.test(req.headers.get("content-type") ?? "")) return { error: fail(415, "json_only") };
  if (!sameOrigin(req)) return { error: fail(403, "cross_origin") };
  let text: string | null;
  try {
    text = await readTextCapped(req, max);
  } catch {
    // the connection broke off while the body was read
    return { error: fail(400, "invalid_json") };
  }
  if (text === null) return { error: fail(413, "too_large") };
  try {
    return { body: JSON.parse(text) as unknown };
  } catch {
    return { error: fail(400, "invalid_json") };
  }
}
