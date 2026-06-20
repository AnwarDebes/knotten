import { and, eq, gt } from "drizzle-orm";
import { adminUsers, adminSessions, type AdminUser } from "@/db/schema";
import type { DB } from "@/db";
import { hashIp } from "@/lib/leads/security";
import {
  hashPassword,
  verifyPassword,
  verifyTotp,
  generateTotpSecret,
  totpProvisioningUri,
  generateSessionToken,
  hashToken,
} from "./crypto";

/** Short session, with a tight re-auth window gating destructive actions. */
export const SESSION_TTL_MS = 60 * 60 * 1000;
export const REAUTH_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export type Role = "owner" | "viewer";

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date; role: Role; needsEnrollment: boolean }
  | { ok: false; reason: "credentials" | "mfa" | "locked" };

/** Create an admin operator (used by the seed script and tests). */
export async function createAdmin(
  db: DB,
  input: { email: string; password: string; role?: Role },
): Promise<AdminUser> {
  const rows = await db
    .insert(adminUsers)
    .values({
      email: input.email.toLowerCase().trim(),
      passwordHash: hashPassword(input.password),
      role: input.role ?? "viewer",
    })
    .returning();
  return rows[0]!;
}

async function findByEmail(db: DB, email: string): Promise<AdminUser | undefined> {
  return (
    await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase().trim()))
  )[0];
}

function isLocked(user: AdminUser, now: number): boolean {
  return user.lockedUntil !== null && user.lockedUntil.getTime() > now;
}

async function registerFailure(db: DB, user: AdminUser): Promise<void> {
  const failed = user.failedAttempts + 1;
  const lockedUntil = failed >= MAX_FAILED ? new Date(Date.now() + LOCKOUT_MS) : user.lockedUntil;
  await db
    .update(adminUsers)
    .set({ failedAttempts: failed, lockedUntil })
    .where(eq(adminUsers.id, user.id));
}

async function clearFailures(db: DB, user: AdminUser): Promise<void> {
  await db
    .update(adminUsers)
    .set({ failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(adminUsers.id, user.id));
}

/**
 * Authenticate with password and (once enrolled) TOTP. A wrong password or code
 * counts toward the lockout. The same generic "credentials" reason is returned
 * for an unknown email and a bad password so accounts cannot be enumerated. A
 * first-time operator with no MFA yet is signed in with a session flagged for
 * enrolment, and can reach only the enrolment screen until MFA is active.
 */
export async function login(
  db: DB,
  input: { email: string; password: string; code?: string },
  meta: { ip?: string } = {},
): Promise<LoginResult> {
  const now = Date.now();
  const user = await findByEmail(db, input.email);
  if (!user) {
    // Equalise timing against a dummy verification.
    verifyPassword(input.password, hashPassword("dummy"));
    return { ok: false, reason: "credentials" };
  }
  if (isLocked(user, now)) return { ok: false, reason: "locked" };

  if (!verifyPassword(input.password, user.passwordHash)) {
    await registerFailure(db, user);
    return { ok: false, reason: "credentials" };
  }

  if (user.totpEnabled) {
    if (!user.totpSecret || !input.code || !verifyTotp(user.totpSecret, input.code)) {
      await registerFailure(db, user);
      return { ok: false, reason: "mfa" };
    }
  }

  await clearFailures(db, user);
  const session = await createSession(db, user.id, meta);
  return {
    ok: true,
    token: session.token,
    expiresAt: session.expiresAt,
    role: user.role as Role,
    needsEnrollment: !user.totpEnabled,
  };
}

/** Begin TOTP enrolment: generate and store a secret, return the scannable URI. */
export async function startEnrollment(
  db: DB,
  adminId: string,
): Promise<{ secret: string; uri: string } | null> {
  const user = (await db.select().from(adminUsers).where(eq(adminUsers.id, adminId)))[0];
  if (!user || user.totpEnabled) return null;
  const secret = user.totpSecret ?? generateTotpSecret();
  if (!user.totpSecret) {
    await db.update(adminUsers).set({ totpSecret: secret }).where(eq(adminUsers.id, adminId));
  }
  return { secret, uri: totpProvisioningUri(secret, user.email) };
}

/** Finish enrolment by verifying a code against the pending secret. */
export async function confirmEnrollment(db: DB, adminId: string, code: string): Promise<boolean> {
  const user = (await db.select().from(adminUsers).where(eq(adminUsers.id, adminId)))[0];
  if (!user || !user.totpSecret || user.totpEnabled) return false;
  if (!verifyTotp(user.totpSecret, code)) return false;
  await db.update(adminUsers).set({ totpEnabled: true }).where(eq(adminUsers.id, adminId));
  return true;
}

export async function createSession(
  db: DB,
  adminId: string,
  meta: { ip?: string } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const { token, hash } = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(adminSessions).values({
    tokenHash: hash,
    adminId,
    reauthAt: new Date(),
    ipHash: meta.ip ? hashIp(meta.ip) : null,
    expiresAt,
  });
  return { token, expiresAt };
}

export type AuthContext = { admin: AdminUser; reauthAt: Date | null };

/** Resolve a session token to its admin, or null if missing, unknown or expired. */
export async function getAuth(db: DB, token: string | undefined): Promise<AuthContext | null> {
  if (!token) return null;
  const hash = hashToken(token);
  const session = (
    await db
      .select()
      .from(adminSessions)
      .where(and(eq(adminSessions.tokenHash, hash), gt(adminSessions.expiresAt, new Date())))
  )[0];
  if (!session) return null;
  const admin = (await db.select().from(adminUsers).where(eq(adminUsers.id, session.adminId)))[0];
  if (!admin) return null;
  return { admin, reauthAt: session.reauthAt };
}

export async function revokeSession(db: DB, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
}

/** Refresh the re-auth timestamp after a successful re-authentication. */
export async function markReauth(db: DB, token: string): Promise<void> {
  await db
    .update(adminSessions)
    .set({ reauthAt: new Date() })
    .where(eq(adminSessions.tokenHash, hashToken(token)));
}

/** True when the session re-authenticated within the destructive-action window. */
export function isReauthFresh(reauthAt: Date | null, now = Date.now()): boolean {
  return reauthAt !== null && now - reauthAt.getTime() <= REAUTH_WINDOW_MS;
}

/** Re-verify a password (and code, when enrolled) without issuing a new session. */
export async function verifyReauth(
  db: DB,
  adminId: string,
  password: string,
  code?: string,
): Promise<boolean> {
  const user = (await db.select().from(adminUsers).where(eq(adminUsers.id, adminId)))[0];
  if (!user) return false;
  if (!verifyPassword(password, user.passwordHash)) return false;
  if (user.totpEnabled && (!user.totpSecret || !code || !verifyTotp(user.totpSecret, code))) {
    return false;
  }
  return true;
}

export function hasRole(admin: AdminUser, required: Role): boolean {
  if (required === "viewer") return admin.role === "viewer" || admin.role === "owner";
  return admin.role === required;
}
