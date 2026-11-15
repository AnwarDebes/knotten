import { NextResponse } from "next/server";
import { loadCommercial } from "@/lib/data";
import { readPublicPrices } from "@/lib/server/publicRecords";
import type { PricesResponse } from "@/lib/configurator/types";

// made once and kept, like a static page: the answer depends only on the two cached records read below
export const dynamic = "force-static";

/**
 * The configurator's prices for both designs: the price table the administrator sets under Husvalg og priser
 * (a missing choice means "on request") and each plot's status and price as the plot pages show them. The
 * administrator's note on a plot is for the portal only (it may name a buyer), so it is never sent here.
 * Both parts come from the public pages' cache (lib/server/publicRecords.ts), so a visit costs the database
 * nothing, and saving prices or a plot in the admin makes this answer again for the next visitor. No lifetime
 * is set for browsers: the configurator always asks, and gets the kept answer.
 */
export async function GET() {
  const [prices, commercial] = await Promise.all([readPublicPrices(), loadCommercial()]);
  const plots: PricesResponse["plots"] = {};
  for (const [id, c] of Object.entries(commercial)) plots[id] = { status: c.status, price_nok: typeof c.price_nok === "number" ? c.price_nok : null, note: null };
  const body: PricesResponse = { prices, plots };
  return NextResponse.json(body);
}
