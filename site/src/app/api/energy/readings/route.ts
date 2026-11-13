import { NextResponse } from "next/server";
import { STORAGE_MESSAGE } from "@/lib/errors";
import { isStorageUnavailable, StorageBusyError } from "@/lib/server/kv";
import { importMeterReadings, METER_IMPORTERS, METER_MAX_CHARS, receiveUpload, type UploadAnswer } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";

const reply = (status: number, body: UploadAnswer) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Meter data for the buildings that stand on the property, loaded by an administrator in the portal (Energi,
 * Eksisterende bygg): a meter export as a file or pasted figures, up to 8 million characters. A route handler
 * with its own size limit, so the server actions keep Next's small default.
 */
export async function POST(req: Request) {
  const en = new URL(req.url).searchParams.get("lang") === "en";
  try {
    const got = await receiveUpload(req, METER_MAX_CHARS, METER_IMPORTERS);
    if ("reply" in got) return reply(got.reply.status, got.reply.body);
    const r = await importMeterReadings(got.fd);
    return reply(r.status, r.body);
  } catch (e) {
    if (isStorageUnavailable(e)) return reply(503, { error: STORAGE_MESSAGE[en ? "en" : "no"] });
    if (e instanceof StorageBusyError) return reply(503, { error: en ? "Many changes right now. Try again shortly." : "Mange endringer akkurat nå. Prøv igjen om litt." });
    console.error("[knotten] a meter import failed", e);
    return reply(500, { error: en ? "The import failed. Try again shortly." : "Innlesingen feilet. Prøv igjen om litt." });
  }
}
