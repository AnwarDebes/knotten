import { NextResponse } from "next/server";
import { kvPing, STORAGE } from "@/lib/server/kv";
import { configuredOrigin, MAIL_PROVIDER } from "@/lib/server/mail";
import { authSecretSource } from "@/lib/server/accounts";
import { MODEL_ON } from "@/lib/server/assistant";

export const dynamic = "force-dynamic";

/**
 * What a deployment runs on, for a quick check after a release: where records are kept (and whether the database
 * answers), how email goes out, the public address, the spam check, the language model, the region and the version.
 * Names and states only; no keys, tokens or addresses of people. 503 when the site cannot keep records.
 */
export async function GET() {
  const reachable = await kvPing();
  const storage = STORAGE === "kv" ? (reachable ? "kv" : "kv-unreachable") : STORAGE;
  const authSecret = authSecretSource();
  const ok = (STORAGE === "kv" && reachable) || STORAGE === "file";
  const body = {
    ok,
    storage,
    mail: MAIL_PROVIDER ?? "off",
    siteUrl: configuredOrigin(),
    turnstile: !!(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    model: MODEL_ON ? process.env.KNOTTEN_AI_MODEL || "on" : "off",
    region: process.env.VERCEL_REGION ?? null,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.npm_package_version ?? null,
    authSecret: authSecret === "env" ? "set" : authSecret === "short" ? "too-short" : "stored",
    cron: !!process.env.CRON_SECRET,
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? null,
  };
  return NextResponse.json(body, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
