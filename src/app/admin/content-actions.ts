"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { requireRole } from "@/lib/admin/session-cookie";
import {
  plotSchema,
  timelineSchema,
  faqSchema,
  newsSchema,
  contentBlockSchema,
  imageSlotSchema,
  dashboardSchema,
} from "@/lib/content/validation";
import * as content from "@/lib/content/service";
import { saveImage } from "@/lib/content/storage";

/** Refresh the public NO and EN copies of a route after an edit. */
function revalidateBoth(pathname: string): void {
  revalidatePath(`/no${pathname}`);
  revalidatePath(`/en${pathname}`);
}

function obj(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  // Unchecked checkboxes are absent; coerce known booleans explicitly per schema.
  return out;
}

// --- Plots -----------------------------------------------------------------

export async function savePlotAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const parsed = plotSchema.safeParse(obj(formData));
  if (!parsed.success) redirect(`/admin/innhold/tomter${id ? `/${id}` : "/ny"}?error=validation`);
  const db = await getDb();
  if (id) await content.updatePlot(db, id, parsed.data, auth.admin.email);
  else await content.createPlot(db, parsed.data, auth.admin.email);
  revalidateBoth("/omradet");
  redirect("/admin/innhold/tomter?saved=1");
}

export async function deletePlotAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const db = await getDb();
  await content.deletePlot(db, id, auth.admin.email);
  revalidateBoth("/omradet");
  redirect("/admin/innhold/tomter?deleted=1");
}

// --- Timeline --------------------------------------------------------------

export async function saveStageAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const raw = obj(formData);
  raw.isCurrent = formData.get("isCurrent") === "on";
  const parsed = timelineSchema.safeParse(raw);
  if (!parsed.success)
    redirect(`/admin/innhold/fremdrift${id ? `/${id}` : "/ny"}?error=validation`);
  const db = await getDb();
  if (id) await content.updateStage(db, id, parsed.data, auth.admin.email);
  else await content.createStage(db, parsed.data, auth.admin.email);
  revalidateBoth("/fremdrift");
  revalidateBoth("/visjon");
  redirect("/admin/innhold/fremdrift?saved=1");
}

export async function deleteStageAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const db = await getDb();
  await content.deleteStage(db, String(formData.get("id") ?? ""), auth.admin.email);
  revalidateBoth("/fremdrift");
  revalidateBoth("/visjon");
  redirect("/admin/innhold/fremdrift?deleted=1");
}

// --- FAQ -------------------------------------------------------------------

export async function saveFaqAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const parsed = faqSchema.safeParse(obj(formData));
  if (!parsed.success) redirect(`/admin/innhold/faq${id ? `/${id}` : "/ny"}?error=validation`);
  const db = await getDb();
  if (id) await content.updateFaq(db, id, parsed.data, auth.admin.email);
  else await content.createFaq(db, parsed.data, auth.admin.email);
  revalidateBoth("/fremdrift");
  revalidateBoth("/kontakt");
  redirect("/admin/innhold/faq?saved=1");
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const db = await getDb();
  await content.deleteFaq(db, String(formData.get("id") ?? ""), auth.admin.email);
  revalidateBoth("/fremdrift");
  revalidateBoth("/kontakt");
  redirect("/admin/innhold/faq?deleted=1");
}

// --- News ------------------------------------------------------------------

export async function saveNewsAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const id = String(formData.get("id") ?? "");
  const parsed = newsSchema.safeParse(obj(formData));
  if (!parsed.success) redirect(`/admin/innhold/aktuelt${id ? `/${id}` : "/ny"}?error=validation`);
  const db = await getDb();
  if (id) await content.updateNews(db, id, parsed.data, auth.admin.email);
  else await content.createNews(db, parsed.data, auth.admin.email);
  revalidateBoth("/aktuelt");
  redirect("/admin/innhold/aktuelt?saved=1");
}

export async function deleteNewsAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const db = await getDb();
  await content.deleteNews(db, String(formData.get("id") ?? ""), auth.admin.email);
  revalidateBoth("/aktuelt");
  redirect("/admin/innhold/aktuelt?deleted=1");
}

// --- Content blocks --------------------------------------------------------

export async function saveBlockAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const key = String(formData.get("key") ?? "");
  const parsed = contentBlockSchema.safeParse(obj(formData));
  if (!key || !parsed.success) redirect(`/admin/innhold/blokker?error=validation`);
  const db = await getDb();
  await content.upsertBlock(db, key, parsed.data, auth.admin.email);
  revalidateBoth("");
  redirect("/admin/innhold/blokker?saved=1");
}

// --- Dashboard params ------------------------------------------------------

export async function saveDashboardAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const parsed = dashboardSchema.safeParse(obj(formData));
  if (!parsed.success) redirect(`/admin/innhold/dashbord?error=validation`);
  const db = await getDb();
  await content.upsertDashboard(db, "default", parsed.data, auth.admin.email);
  revalidateBoth("/robusthet");
  redirect("/admin/innhold/dashbord?saved=1");
}

// --- Image slots -----------------------------------------------------------

export async function saveImageSlotAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const slotKey = String(formData.get("slotKey") ?? "");
  const parsed = imageSlotSchema.safeParse({
    altNo: formData.get("altNo"),
    altEn: formData.get("altEn"),
    forbeholdText: formData.get("forbeholdText"),
    isAiOrIllustration: formData.get("isAiOrIllustration") === "on",
    disclosureText: formData.get("disclosureText"),
  });
  if (!slotKey || !parsed.success) redirect(`/admin/innhold/bilder?error=validation`);

  const db = await getDb();
  const file = formData.get("file");
  let assetRef: string | undefined;
  if (file instanceof File && file.size > 0) {
    const saved = await saveImage(file);
    if (!saved.ok) redirect(`/admin/innhold/bilder?error=${saved.error}`);
    assetRef = saved.ref;
  }
  await content.upsertImageSlot(db, slotKey, parsed.data, auth.admin.email, assetRef);
  revalidateBoth("");
  redirect("/admin/innhold/bilder?saved=1");
}

// --- Versioning ------------------------------------------------------------

export async function restoreVersionAction(formData: FormData): Promise<void> {
  const auth = await requireRole("owner");
  const versionId = String(formData.get("versionId") ?? "");
  // Constrain the return path to an internal editor route so the field cannot
  // be used as an open redirect.
  const backRaw = String(formData.get("back") ?? "");
  const back = /^\/admin\/innhold\/[a-z]+\/[a-z0-9-]+$/.test(backRaw) ? backRaw : "/admin/innhold";
  const db = await getDb();
  await content.restoreVersion(db, versionId, auth.admin.email);
  redirect(`${back}?restored=1`);
}
