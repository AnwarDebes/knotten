import { randomBytes, scryptSync, timingSafeEqual, createHmac, createHash } from "node:crypto";

/**
 * Admin authentication primitives, built on the Node crypto module so there is
 * no native dependency and no secret ever leaves the server. Passwords use
 * scrypt with a per-user salt; MFA is RFC 6238 TOTP; session tokens are random
 * and only their hash is stored.
 */

const SCRYPT_N = 16384;
const SCRYPT_KEYLEN = 64;

/** Hash a password with scrypt and a random salt. Format: scrypt:<saltHex>:<hashHex>. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_N });
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Verify a password against a stored scrypt hash in constant time. */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1]!, "hex");
  const expected = Buffer.from(parts[2]!, "hex");
  const actual = scryptSync(password, salt, expected.length, { N: SCRYPT_N });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** Encode bytes as unpadded RFC 4648 base32 (used for TOTP secrets). */
export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** Decode an RFC 4648 base32 string (case-insensitive, padding ignored). */
export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new Error("invalid base32");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Generate a new base32 TOTP secret (160 bits). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Build the otpauth:// provisioning URI an authenticator app scans. */
export function totpProvisioningUri(secret: string, account: string, issuer = "Knotten"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Compute the 6-digit TOTP code for a given step (RFC 6238, SHA1, 30s). */
function totpCode(secret: string, step: number): string {
  const key = base32Decode(secret);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binary =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return (binary % 1_000_000).toString().padStart(6, "0");
}

/** Current 6-digit TOTP code for a secret (server-side only, e.g. enrolment checks). */
export function generateTotp(secret: string, now = Date.now()): string {
  return totpCode(secret, Math.floor(now / 1000 / 30));
}

/**
 * Verify a TOTP token, accepting the adjacent steps (default +/-1) to allow for
 * clock drift. `now` is injectable for tests. Comparison is constant-time.
 */
export function verifyTotp(secret: string, token: string, window = 1, now = Date.now()): boolean {
  const cleaned = token.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const step = Math.floor(now / 1000 / 30);
  for (let i = -window; i <= window; i++) {
    const candidate = totpCode(secret, step + i);
    const a = Buffer.from(candidate);
    const b = Buffer.from(cleaned);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

/** A fresh session token and its storage hash. The raw token goes in the cookie. */
export function generateSessionToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

/** SHA-256 hash of a session token (only the hash is ever persisted). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
