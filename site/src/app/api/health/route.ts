import { NextResponse } from "next/server";
import { getRealSession, isAdmin } from "@/lib/auth";
import { kvPing, STORAGE } from "@/lib/server/kv";
import { configuredOrigin, MAIL_PROVIDER } from "@/lib/server/mail";
import { authSecretSource } from "@/lib/server/accounts";
import { MODEL_ON } from "@/lib/server/assistant";
import { FILE_STORE } from "@/lib/server/files";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Is the site up, and can it keep records? Anyone may ask (an uptime monitor, the person deploying): the answer is
 * only that, and 503 when records cannot be kept. A logged-in administrator also sees what the deployment runs
 * on, for a quick check after a release: where records and uploaded files are kept, how email goes out, the public
 * address, the spam check, the language model, the region and the version. Names and states only; no keys, tokens or
 * addresses of people.
 */
export async function GET() {
  const reachable = await kvPing();
  const ok = (STORAGE === "kv" && reachable) || STORAGE === "file";
  const status = ok ? 200 : 503;
  // the session is looked at only when a login cookie came with the request; storage trouble then reads as no session
  const session = await getRealSession().catch(() => null);
  if (!session || !isAdmin(session)) return NextResponse.json({ ok, storage: ok ? "ok" : "unavailable" }, { status, headers: NO_STORE });
  const authSecret = authSecretSource();
  return NextResponse.json(
    {
      ok,
      storage: STORAGE === "kv" ? (reachable ? "kv" : "kv-unreachable") : STORAGE,
      files: FILE_STORE,
      mail: MAIL_PROVIDER ?? "off",
      siteUrl: configuredOrigin(),
      turnstile: !!(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      model: MODEL_ON ? process.env.KNOTTEN_AI_MODEL || "on" : "off",
      region: process.env.VERCEL_REGION ?? null,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.npm_package_version ?? null,
      authSecret: authSecret === "env" ? "set" : authSecret === "short" ? "too-short" : "stored",
      cron: !!process.env.CRON_SECRET,
      env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
    },
    { status, headers: NO_STORE },
  );
}
