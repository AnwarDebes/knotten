import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUsers } from "@/db/schema";
import { createAdmin, type Role } from "@/lib/admin/auth";

export const runtime = "nodejs";

/**
 * Provision an admin operator. Gated by ADMIN_BOOTSTRAP_SECRET so only the
 * deployer can call it (there is no public sign-up). Used once at go-live to
 * create the owner account, who then enrols MFA on first login. Creating a
 * duplicate email is refused.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { email?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const email = (body.email ?? "").toLowerCase().trim();
  const password = body.password ?? "";
  const role: Role = body.role === "owner" ? "owner" : "viewer";
  if (!email.includes("@") || password.length < 12) {
    return Response.json({ ok: false, error: "weak" }, { status: 400 });
  }

  const db = await getDb();
  const existing = (await db.select().from(adminUsers).where(eq(adminUsers.email, email)))[0];
  if (existing) return Response.json({ ok: false, error: "exists" }, { status: 409 });

  const admin = await createAdmin(db, { email, password, role });
  return Response.json({ ok: true, id: admin.id, role: admin.role });
}
