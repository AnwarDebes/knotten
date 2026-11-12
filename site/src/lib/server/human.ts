import { authSecret } from "./accounts";
import { hmac, safeEqual } from "./crypto";
import { MIN_FILL_MS } from "@/lib/forms";

/**
 * Checks that a person, not a program, sent a public form: Cloudflare Turnstile when its keys are set, and the
 * shortest believable time to fill a form in. Shared by /api/leads and the sign-up form.
 */

/** Cloudflare Turnstile, when TURNSTILE_SECRET_KEY is set: the browser's token is checked with Cloudflare. Without the key, skipped. */
export async function humanCheck(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "local") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store", signal: AbortSignal.timeout(8000) });
    return ((await res.json().catch(() => ({}))) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}

/** A form older than this is refused as stale (the page is reloaded and filled in again). */
const STAMP_MAX_MS = 24 * 3600e3;

/**
 * The time a form was shown, signed by the server, as a hidden field. Unlike a time the browser reports, a program
 * cannot claim it waited: it must fetch the page and wait before sending. Works without scripts in the page.
 */
export async function formStamp(purpose: string): Promise<string> {
  const t = Date.now().toString(36);
  return `${t}.${hmac(await authSecret(), `form|${purpose}|${t}`).slice(0, 32)}`;
}

/** "ok", "too_fast" (sent sooner than a person can fill the form in) or "bad" (missing, forged or stale). */
export async function checkStamp(purpose: string, stamp: unknown, at = Date.now()): Promise<"ok" | "too_fast" | "bad"> {
  if (typeof stamp !== "string" || stamp.length > 80) return "bad";
  const [t, mac] = stamp.split(".");
  if (!t || !mac || !safeEqual(mac, hmac(await authSecret(), `form|${purpose}|${t}`).slice(0, 32))) return "bad";
  const age = at - parseInt(t, 36);
  if (!Number.isFinite(age) || age > STAMP_MAX_MS) return "bad";
  return age < MIN_FILL_MS ? "too_fast" : "ok";
}
