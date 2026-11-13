import { NextResponse } from "next/server";
import { rightNow } from "@/lib/server/live";

/**
 * "Akkurat nå på Knotten" for both front pages: the weather at the property now (MET) and the power price in NO2
 * now (hvakosterstrommen.no). Public figures only, nothing about the visitor. The front pages stay static and ask
 * for this after they have loaded, so the figures are always today's. Computed per request from the services'
 * cached answers (lib/server/live.ts), and kept for a few minutes by the browser and the CDN in front of the site.
 */
export async function GET() {
  const body = await rightNow();
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } });
}
