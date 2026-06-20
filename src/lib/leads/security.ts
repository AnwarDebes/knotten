import { createHash, randomBytes } from "node:crypto";

/** Salted hash of an IP address for abuse control. The raw IP is never stored. */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("IP_HASH_SALT must be set in production");
    }
    return createHash("sha256").update(`knotten-dev-salt:${ip}`).digest("hex").slice(0, 32);
  }
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** Unguessable token for the double opt-in confirmation link. */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Verify a Cloudflare Turnstile token. If no secret is configured (development)
 * the challenge is skipped. Returns true when the request may proceed.
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
