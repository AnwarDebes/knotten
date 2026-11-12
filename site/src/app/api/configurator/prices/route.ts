import { NextResponse } from "next/server";
import { loadCommercial } from "@/lib/data";
import { getPrices } from "@/lib/server/configurations";
import type { PricesResponse } from "@/lib/configurator/types";

export const dynamic = "force-dynamic";

/**
 * The configurator's prices for both designs: the price table the administrator sets under Husvalg og priser
 * (a missing choice means "on request") and each plot's status and price as the plot pages show them. The
 * administrator's note on a plot is for the portal only (it may name a buyer), so it is never sent here.
 * Shared caches may keep the answer for a minute.
 */
export async function GET() {
  const [prices, commercial] = await Promise.all([getPrices(), loadCommercial()]);
  const plots: PricesResponse["plots"] = {};
  for (const [id, c] of Object.entries(commercial)) plots[id] = { status: c.status, price_nok: typeof c.price_nok === "number" ? c.price_nok : null, note: null };
  const body: PricesResponse = { prices, plots };
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } });
}
