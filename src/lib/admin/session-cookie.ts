import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { getAuth, type AuthContext, type Role } from "./auth";

export const ADMIN_COOKIE = "knotten_admin";

// Secure cookies require HTTPS; in local development over http the site URL is
// http://localhost, so the flag is relaxed only there.
const secure = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");

export async function getSessionToken(): Promise<string | undefined> {
  return (await cookies()).get(ADMIN_COOKIE)?.value;
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: "/admin",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
}

/** Resolve the current admin from the session cookie, or null. */
export async function currentAuth(): Promise<AuthContext | null> {
  const db = await getDb();
  return getAuth(db, await getSessionToken());
}

/**
 * Gate a protected admin surface: redirect anonymous requests to the login
 * page and not-yet-enrolled operators to MFA enrolment. Returns the verified
 * context for everyone else. Called server-side on every protected route.
 */
export async function requireAuth(): Promise<AuthContext> {
  const auth = await currentAuth();
  if (!auth) redirect("/admin/login");
  if (!auth.admin.totpEnabled) redirect("/admin/enroll");
  return auth;
}

/** Require a specific role; send an under-privileged operator back to the dashboard. */
export async function requireRole(role: Role): Promise<AuthContext> {
  const auth = await requireAuth();
  const allowed = role === "viewer" ? true : auth.admin.role === role;
  if (!allowed) redirect("/admin?error=forbidden");
  return auth;
}
