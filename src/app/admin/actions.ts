"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { login, revokeSession, confirmEnrollment, verifyReauth } from "@/lib/admin/auth";
import {
  setSessionCookie,
  clearSessionCookie,
  getSessionToken,
  currentAuth,
  requireAuth,
  requireRole,
} from "@/lib/admin/session-cookie";
import { setPipelineStatus, PIPELINE_STATUSES, type PipelineStatus } from "@/lib/admin/leads-admin";
import { eraseLeadById } from "@/lib/leads/service";

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "") || undefined;
  const db = await getDb();
  const res = await login(db, { email, password, code }, { ip: await clientIp() });
  if (!res.ok) redirect(`/admin/login?error=${res.reason}`);
  await setSessionCookie(res.token, res.expiresAt);
  redirect(res.needsEnrollment ? "/admin/enroll" : "/admin");
}

export async function logoutAction(): Promise<void> {
  const db = await getDb();
  await revokeSession(db, await getSessionToken());
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function enrollAction(formData: FormData): Promise<void> {
  const auth = await currentAuth();
  if (!auth) redirect("/admin/login");
  if (auth.admin.totpEnabled) redirect("/admin");
  const code = String(formData.get("code") ?? "");
  const db = await getDb();
  const ok = await confirmEnrollment(db, auth.admin.id, code);
  if (!ok) redirect("/admin/enroll?error=mfa");
  redirect("/admin");
}

export async function setStatusAction(formData: FormData): Promise<void> {
  const auth = await requireAuth();
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!PIPELINE_STATUSES.includes(status as PipelineStatus)) {
    redirect(`/admin/leads/${leadId}?error=status`);
  }
  const db = await getDb();
  await setPipelineStatus(db, leadId, status as PipelineStatus, auth.admin.email);
  redirect(`/admin/leads/${leadId}?updated=1`);
}

export async function eraseAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const leadId = String(formData.get("leadId") ?? "");
  const password = String(formData.get("password") ?? "");
  const code = String(formData.get("code") ?? "") || undefined;
  const db = await getDb();
  const reauthed = await verifyReauth(db, auth.admin.id, password, code);
  if (!reauthed) redirect(`/admin/leads/${leadId}?error=reauth`);
  await eraseLeadById(db, leadId, auth.admin.email);
  redirect("/admin?erased=1");
}
