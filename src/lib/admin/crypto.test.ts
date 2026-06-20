// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  base32Encode,
  base32Decode,
  generateTotpSecret,
  generateTotp,
  totpProvisioningUri,
  verifyTotp,
  generateSessionToken,
  hashToken,
} from "./crypto";

describe("password hashing", () => {
  it("verifies a correct password and rejects a wrong one", () => {
    const stored = hashPassword("riktig-hemmelig-passord");
    expect(verifyPassword("riktig-hemmelig-passord", stored)).toBe(true);
    expect(verifyPassword("feil-passord", stored)).toBe(false);
  });

  it("uses a random salt so two hashes of the same password differ", () => {
    expect(hashPassword("samme")).not.toBe(hashPassword("samme"));
  });

  it("rejects a malformed stored hash", () => {
    expect(verifyPassword("x", "not-a-valid-hash")).toBe(false);
  });
});

describe("base32", () => {
  it("round-trips bytes", () => {
    const buf = Buffer.from("Knotten lead engine", "utf8");
    expect(base32Decode(base32Encode(buf)).equals(buf)).toBe(true);
  });

  it("matches the RFC 4648 test vector for 'foobar'", () => {
    expect(base32Encode(Buffer.from("foobar"))).toBe("MZXW6YTBOI");
  });
});

describe("TOTP (RFC 6238)", () => {
  const STEP_MS = 30 * 1000;
  const now = 1_700_000_000_000;

  it("accepts a code generated at the same time and rejects a stale one", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, generateTotp(secret, now), 1, now)).toBe(true);
    expect(verifyTotp(secret, generateTotp(secret, now), 1, now + 10 * 60 * 1000)).toBe(false);
  });

  it("tolerates one step of clock drift but not two", () => {
    const secret = generateTotpSecret();
    const codePrev = generateTotp(secret, now - STEP_MS);
    const codeTwoBack = generateTotp(secret, now - 2 * STEP_MS);
    expect(verifyTotp(secret, codePrev, 1, now)).toBe(true);
    expect(verifyTotp(secret, codeTwoBack, 1, now)).toBe(false);
  });

  it("matches a known RFC 6238 test vector (SHA1 secret '12345678901234567890')", () => {
    // The RFC's seed is the ASCII bytes; base32-encode them, then check T=59s.
    const secret = base32Encode(Buffer.from("12345678901234567890"));
    expect(generateTotp(secret, 59_000)).toBe("287082");
  });

  it("rejects non-numeric or wrong-length input", () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, "abcdef")).toBe(false);
    expect(verifyTotp(secret, "12345")).toBe(false);
  });

  it("builds a scannable provisioning URI", () => {
    const uri = totpProvisioningUri("JBSWY3DPEHPK3PXP", "drift@knotten.no");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("issuer=Knotten");
  });
});

describe("session tokens", () => {
  it("stores only the hash, never the token", () => {
    const { token, hash } = generateSessionToken();
    expect(hash).toBe(hashToken(token));
    expect(hash).not.toBe(token);
    expect(hash).toHaveLength(64);
  });
});
