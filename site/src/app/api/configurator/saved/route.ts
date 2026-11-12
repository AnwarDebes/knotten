import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { allow } from "@/lib/server/limit";
import { ConfigLimitError, cleanConfig, deleteSaved, listSaved, saveConfig } from "@/lib/server/configurations";
import type { SavePayload, SaveResponse, SavedListResponse } from "@/lib/configurator/types";
import { fail, jsonBody, sameOrigin } from "../checks";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const ID = /^cfg-[a-z0-9]{1,40}$/;

/**
 * The logged-in person's saved house configurations (Min side): GET lists them, POST saves one (a new one, or the
 * one with `id`), DELETE removes one (?id=cfg-...). Without a session the answer is 401; an administrator looking
 * at the portal as someone else may read but not change. At most 20 per account (409 "limit" for the 21st).
 */
export async function GET() {
  const s = await getSession();
  if (!s) return fail(401, "login_required");
  return NextResponse.json({ items: await listSaved(s.id) } satisfies SavedListResponse, { headers: NO_STORE });
}

export async function POST(req: Request) {
  const s = await getSession();
  if (!s) return fail(401, "login_required");
  if (s.preview) return fail(403, "preview");
  const got = await jsonBody(req);
  if ("error" in got) return got.error;
  const b = (got.body && typeof got.body === "object" ? got.body : {}) as Partial<Record<keyof SavePayload, unknown>>;
  const config = await cleanConfig(b.config);
  if (!config) return fail(400, "invalid_config");
  if (b.id !== undefined && (typeof b.id !== "string" || !ID.test(b.id))) return fail(400, "invalid_id");
  if (!(await allow("cfg-save", s.id, 60, 10))) return fail(429, "too_many");
  try {
    const item = await saveConfig(s.id, typeof b.name === "string" ? b.name : "", config, b.id as string | undefined);
    return NextResponse.json({ ok: true, item } satisfies SaveResponse, { headers: NO_STORE });
  } catch (e) {
    if (e instanceof ConfigLimitError) return fail(409, "limit");
    throw e;
  }
}

export async function DELETE(req: Request) {
  const s = await getSession();
  if (!s) return fail(401, "login_required");
  if (s.preview) return fail(403, "preview");
  let id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id && req.headers.get("content-type")) {
    const got = await jsonBody(req);
    if ("error" in got) return got.error;
    const v = (got.body as { id?: unknown } | null)?.id;
    id = typeof v === "string" ? v : "";
  } else if (!sameOrigin(req)) {
    return fail(403, "cross_origin");
  }
  if (!ID.test(id)) return fail(400, "invalid_id");
  await deleteSaved(s.id, id);
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
