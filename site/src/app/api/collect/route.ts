import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/auth";
import { BOT, recordEvent, recordPageview } from "@/lib/server/stats";
import { isJson, isSameOrigin } from "@/lib/server/requestGuard";

/** Events the browser may report. Everything else is counted on the server where it happens. */
const CLIENT_EVENTS = new Set(["form_start"]);
/** The public pages only: the portal, the login and sign-up screens and Min side are not part of the website's statistics. */
const PAGE = /^\/[\p{L}0-9\-_/.]*$/u;
const SKIP = /^\/(api|_next|portal|logg-inn|min-side|registrer|(no|en)\/(portal|login|min-side|registrer))(\/|$)/;

const done = () => new Response(null, { status: 204 });

/** The page-view beacon from components/Track.tsx. See lib/server/stats.ts for what is kept. */
export async function POST(req: Request) {
  // only the site's own pages, sending JSON
  if (!isJson(req) || !isSameOrigin(req)) return new Response(null, { status: 403 });
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua) || req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1") return done();
  // the team's own visits while logged in would only blur the numbers
  if ((await cookies()).get(AUTH_COOKIE)) return done();
  let body: { p?: unknown; r?: unknown; d?: unknown; e?: unknown };
  try {
    body = JSON.parse((await req.text()).slice(0, 2000));
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!body || typeof body !== "object") return new Response(null, { status: 400 });
  if (typeof body.e === "string") {
    if (CLIENT_EVENTS.has(body.e)) await recordEvent(body.e);
    return done();
  }
  const path = typeof body.p === "string" ? body.p.toLowerCase().slice(0, 100) : "";
  if (!PAGE.test(path) || SKIP.test(path)) return done();
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
  await recordPageview(
    { path, ref: typeof body.r === "string" ? body.r.slice(0, 300) : "", design: body.d === "moderne" ? "moderne" : "klassisk" },
    ip,
    ua,
    req.headers.get("host") ?? "",
  ).catch(() => undefined);
  return done();
}
