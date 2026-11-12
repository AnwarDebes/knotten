import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/server/crypto";
import { cleanupAccounts } from "@/lib/server/accounts";
import { cleanupLeads } from "@/lib/server/leads";
import { pruneMembers } from "@/lib/server/member-store";
import { isStorageUnavailable } from "@/lib/server/kv";

/**
 * The nightly cleanup, run by Vercel Cron (vercel.json) with the CRON_SECRET as a bearer token, like the weekly
 * summary. It deletes interest registrations 24 months after the last contact (the delivery plan's retention
 * rule), accounts that were signed up but never confirmed after 7 days, and expired links. What those accounts
 * kept (followed plots, consent records, saved houses) goes with them.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const [leads, accounts] = await Promise.all([cleanupLeads(), cleanupAccounts()]);
    const members = await pruneMembers();
    return NextResponse.json({ ok: true, ...leads, ...accounts, ...members }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (isStorageUnavailable(e)) return NextResponse.json({ ok: false, reason: "storage is not set up" }, { status: 503 });
    console.error("[knotten] the cleanup failed", e);
    return NextResponse.json({ ok: false, reason: "the cleanup failed; see the function log" }, { status: 500 });
  }
}
