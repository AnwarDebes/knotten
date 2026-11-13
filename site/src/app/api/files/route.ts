import { NextResponse } from "next/server";
import { STORAGE_MESSAGE } from "@/lib/errors";
import { MAX_BYTES } from "@/lib/server/files";
import { isStorageUnavailable, StorageBusyError } from "@/lib/server/kv";
import { DOC_UPLOADERS, receiveUpload, uploadDocument, type UploadAnswer } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";

const reply = (status: number, body: UploadAnswer) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * A document uploaded in the portal (components/portal/Docs.tsx), or a new version of one. A route handler with
 * its own size limit (lib/server/files.ts MAX_BYTES), so the server actions keep Next's small default. Who may
 * upload, and who may add a version, is decided in lib/server/uploads.ts.
 */
export async function POST(req: Request) {
  const en = new URL(req.url).searchParams.get("lang") === "en";
  try {
    const got = await receiveUpload(req, MAX_BYTES, DOC_UPLOADERS);
    if ("reply" in got) return reply(got.reply.status, got.reply.body);
    const r = await uploadDocument(got.fd, got.s);
    return reply(r.status, r.body);
  } catch (e) {
    if (isStorageUnavailable(e)) return reply(503, { error: STORAGE_MESSAGE[en ? "en" : "no"] });
    if (e instanceof StorageBusyError) return reply(503, { error: en ? "Many changes right now. Try again shortly." : "Mange endringer akkurat nå. Prøv igjen om litt." });
    console.error("[knotten] a document upload failed", e);
    return reply(500, { error: en ? "The upload failed. Try again shortly." : "Opplastingen feilet. Prøv igjen om litt." });
  }
}
