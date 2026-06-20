import { and, asc, desc, eq } from "drizzle-orm";
import {
  plots,
  timelineStages,
  faqEntries,
  newsPosts,
  contentBlocks,
  dashboardParams,
  imageSlots,
  contentVersions,
  auditLog,
  type Plot,
  type TimelineStage,
  type FaqEntry,
  type NewsPost,
  type ContentBlock,
  type ImageSlot,
} from "@/db/schema";
import type { DB } from "@/db";
import type {
  PlotInput,
  TimelineInput,
  FaqInput,
  NewsInput,
  ContentBlockInput,
  ImageSlotInput,
  DashboardInput,
} from "./validation";

/** Versioned entities: a change here is snapshotted and reversible. */
export type VersionedEntity = "plot" | "timeline" | "news" | "block";

async function audit(db: DB, action: string, editor: string, detail?: string): Promise<void> {
  await db.insert(auditLog).values({ action, actor: editor, detail: detail ?? null });
}

async function snapshot(
  db: DB,
  entity: VersionedEntity,
  entityId: string,
  current: unknown,
  editor: string,
): Promise<void> {
  if (!current) return;
  await db.insert(contentVersions).values({
    entity,
    entityId,
    snapshot: JSON.stringify(current),
    editor,
  });
}

function clean(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

// --- Plots -----------------------------------------------------------------

export function listPlots(db: DB): Promise<Plot[]> {
  return db.select().from(plots).orderBy(asc(plots.sortOrder), asc(plots.label));
}

export function getPlot(db: DB, id: string): Promise<Plot | undefined> {
  return db
    .select()
    .from(plots)
    .where(eq(plots.id, id))
    .then((r) => r[0]);
}

export async function createPlot(db: DB, input: PlotInput, editor: string): Promise<Plot> {
  const row = (
    await db
      .insert(plots)
      .values({
        label: input.label,
        sizeM2: input.sizeM2 ?? null,
        orientation: input.orientation ?? null,
        status: input.status,
        priceIndicative: input.priceIndicative ?? null,
        gnrBnr: clean(input.gnrBnr),
        positionX: input.positionX ?? null,
        positionZ: input.positionZ ?? null,
        sightlineBearing: input.sightlineBearing ?? null,
        note: clean(input.note),
        sortOrder: input.sortOrder,
      })
      .returning()
  )[0]!;
  await audit(db, "content.plot.create", editor, `label=${row.label}`);
  return row;
}

export async function updatePlot(
  db: DB,
  id: string,
  input: PlotInput,
  editor: string,
): Promise<Plot | null> {
  const current = await getPlot(db, id);
  if (!current) return null;
  await snapshot(db, "plot", id, current, editor);
  const row = (
    await db
      .update(plots)
      .set({
        label: input.label,
        sizeM2: input.sizeM2 ?? null,
        orientation: input.orientation ?? null,
        status: input.status,
        priceIndicative: input.priceIndicative ?? null,
        gnrBnr: clean(input.gnrBnr),
        positionX: input.positionX ?? null,
        positionZ: input.positionZ ?? null,
        sightlineBearing: input.sightlineBearing ?? null,
        note: clean(input.note),
        sortOrder: input.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(plots.id, id))
      .returning()
  )[0]!;
  await audit(db, "content.plot.update", editor, `label=${row.label} status=${row.status}`);
  return row;
}

export async function deletePlot(db: DB, id: string, editor: string): Promise<boolean> {
  const deleted = await db.delete(plots).where(eq(plots.id, id)).returning();
  if (!deleted.length) return false;
  await audit(db, "content.plot.delete", editor, `id=${id.slice(0, 8)}`);
  return true;
}

// --- Timeline --------------------------------------------------------------

export function listTimeline(db: DB): Promise<TimelineStage[]> {
  return db.select().from(timelineStages).orderBy(asc(timelineStages.sortOrder));
}

export async function createStage(
  db: DB,
  input: TimelineInput,
  editor: string,
): Promise<TimelineStage> {
  const row = (
    await db
      .insert(timelineStages)
      .values({
        key: input.key,
        labelNo: input.labelNo,
        labelEn: input.labelEn,
        dateOrStage: clean(input.dateOrStage),
        isCurrent: input.isCurrent,
        sortOrder: input.sortOrder,
      })
      .returning()
  )[0]!;
  await audit(db, "content.timeline.create", editor, `key=${row.key}`);
  return row;
}

export async function updateStage(
  db: DB,
  id: string,
  input: TimelineInput,
  editor: string,
): Promise<TimelineStage | null> {
  const current = (await db.select().from(timelineStages).where(eq(timelineStages.id, id)))[0];
  if (!current) return null;
  await snapshot(db, "timeline", id, current, editor);
  const row = (
    await db
      .update(timelineStages)
      .set({
        key: input.key,
        labelNo: input.labelNo,
        labelEn: input.labelEn,
        dateOrStage: clean(input.dateOrStage),
        isCurrent: input.isCurrent,
        sortOrder: input.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(timelineStages.id, id))
      .returning()
  )[0]!;
  await audit(db, "content.timeline.update", editor, `key=${row.key}`);
  return row;
}

export async function deleteStage(db: DB, id: string, editor: string): Promise<boolean> {
  const deleted = await db.delete(timelineStages).where(eq(timelineStages.id, id)).returning();
  if (!deleted.length) return false;
  await audit(db, "content.timeline.delete", editor, `id=${id.slice(0, 8)}`);
  return true;
}

// --- FAQ -------------------------------------------------------------------

export function listFaq(db: DB): Promise<FaqEntry[]> {
  return db.select().from(faqEntries).orderBy(asc(faqEntries.sortOrder));
}

export function listPublishedFaq(db: DB): Promise<FaqEntry[]> {
  return db
    .select()
    .from(faqEntries)
    .where(eq(faqEntries.status, "published"))
    .orderBy(asc(faqEntries.sortOrder));
}

export async function createFaq(db: DB, input: FaqInput, editor: string): Promise<FaqEntry> {
  const row = (
    await db
      .insert(faqEntries)
      .values({ ...input })
      .returning()
  )[0]!;
  await audit(db, "content.faq.create", editor);
  return row;
}

export async function updateFaq(
  db: DB,
  id: string,
  input: FaqInput,
  editor: string,
): Promise<FaqEntry | null> {
  const row = (
    await db
      .update(faqEntries)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(faqEntries.id, id))
      .returning()
  )[0];
  if (!row) return null;
  await audit(db, "content.faq.update", editor);
  return row;
}

export async function deleteFaq(db: DB, id: string, editor: string): Promise<boolean> {
  const deleted = await db.delete(faqEntries).where(eq(faqEntries.id, id)).returning();
  if (!deleted.length) return false;
  await audit(db, "content.faq.delete", editor);
  return true;
}

// --- News ------------------------------------------------------------------

export function listNews(db: DB): Promise<NewsPost[]> {
  return db.select().from(newsPosts).orderBy(desc(newsPosts.createdAt));
}

export function listPublishedNews(db: DB): Promise<NewsPost[]> {
  return db
    .select()
    .from(newsPosts)
    .where(eq(newsPosts.status, "published"))
    .orderBy(desc(newsPosts.publishedAt));
}

export function getNewsBySlug(db: DB, slug: string): Promise<NewsPost | undefined> {
  return db
    .select()
    .from(newsPosts)
    .where(eq(newsPosts.slug, slug))
    .then((r) => r[0]);
}

export async function createNews(db: DB, input: NewsInput, editor: string): Promise<NewsPost> {
  const row = (
    await db
      .insert(newsPosts)
      .values({
        ...input,
        publishedAt: input.status === "published" ? new Date() : null,
      })
      .returning()
  )[0]!;
  await audit(db, "content.news.create", editor, `slug=${row.slug}`);
  return row;
}

export async function updateNews(
  db: DB,
  id: string,
  input: NewsInput,
  editor: string,
): Promise<NewsPost | null> {
  const current = (await db.select().from(newsPosts).where(eq(newsPosts.id, id)))[0];
  if (!current) return null;
  await snapshot(db, "news", id, current, editor);
  const publishedAt = input.status === "published" ? (current.publishedAt ?? new Date()) : null;
  const row = (
    await db
      .update(newsPosts)
      .set({ ...input, publishedAt, updatedAt: new Date() })
      .where(eq(newsPosts.id, id))
      .returning()
  )[0]!;
  await audit(db, "content.news.update", editor, `slug=${row.slug} status=${row.status}`);
  return row;
}

export async function deleteNews(db: DB, id: string, editor: string): Promise<boolean> {
  const deleted = await db.delete(newsPosts).where(eq(newsPosts.id, id)).returning();
  if (!deleted.length) return false;
  await audit(db, "content.news.delete", editor);
  return true;
}

// --- Content blocks --------------------------------------------------------

export function getBlock(db: DB, key: string): Promise<ContentBlock | undefined> {
  return db
    .select()
    .from(contentBlocks)
    .where(eq(contentBlocks.key, key))
    .then((r) => r[0]);
}

export async function upsertBlock(
  db: DB,
  key: string,
  input: ContentBlockInput,
  editor: string,
): Promise<ContentBlock> {
  const current = await getBlock(db, key);
  if (current) await snapshot(db, "block", key, current, editor);
  const row = (
    await db
      .insert(contentBlocks)
      .values({ key, bodyNo: input.bodyNo, bodyEn: input.bodyEn })
      .onConflictDoUpdate({
        target: contentBlocks.key,
        set: { bodyNo: input.bodyNo, bodyEn: input.bodyEn, updatedAt: new Date() },
      })
      .returning()
  )[0]!;
  await audit(db, "content.block.update", editor, `key=${key}`);
  return row;
}

// --- Dashboard params ------------------------------------------------------

export function getDashboard(db: DB, key = "default") {
  return db
    .select()
    .from(dashboardParams)
    .where(eq(dashboardParams.key, key))
    .then((r) => r[0]);
}

export async function upsertDashboard(
  db: DB,
  key: string,
  input: DashboardInput,
  editor: string,
): Promise<void> {
  await db
    .insert(dashboardParams)
    .values({ key, mode: input.mode, values: input.values })
    .onConflictDoUpdate({
      target: dashboardParams.key,
      set: { mode: input.mode, values: input.values, updatedAt: new Date() },
    });
  await audit(db, "content.dashboard.update", editor, `key=${key} mode=${input.mode}`);
}

// --- Image slots -----------------------------------------------------------

export function listImageSlots(db: DB): Promise<ImageSlot[]> {
  return db.select().from(imageSlots).orderBy(asc(imageSlots.slotKey));
}

export function getImageSlot(db: DB, slotKey: string): Promise<ImageSlot | undefined> {
  return db
    .select()
    .from(imageSlots)
    .where(eq(imageSlots.slotKey, slotKey))
    .then((r) => r[0]);
}

export async function upsertImageSlot(
  db: DB,
  slotKey: string,
  input: ImageSlotInput,
  editor: string,
  assetRef?: string,
): Promise<ImageSlot> {
  const current = await getImageSlot(db, slotKey);
  const ref = assetRef ?? current?.assetRef ?? null;
  const row = (
    await db
      .insert(imageSlots)
      .values({
        slotKey,
        assetRef: ref,
        altNo: input.altNo,
        altEn: input.altEn,
        forbeholdText: clean(input.forbeholdText),
        isAiOrIllustration: input.isAiOrIllustration,
        disclosureText: clean(input.disclosureText),
      })
      .onConflictDoUpdate({
        target: imageSlots.slotKey,
        set: {
          assetRef: ref,
          altNo: input.altNo,
          altEn: input.altEn,
          forbeholdText: clean(input.forbeholdText),
          isAiOrIllustration: input.isAiOrIllustration,
          disclosureText: clean(input.disclosureText),
          updatedAt: new Date(),
        },
      })
      .returning()
  )[0]!;
  await audit(db, "content.image.update", editor, `slot=${slotKey}`);
  return row;
}

// --- Versioning ------------------------------------------------------------

export function listVersions(db: DB, entity: VersionedEntity, entityId: string) {
  return db
    .select()
    .from(contentVersions)
    .where(and(eq(contentVersions.entity, entity), eq(contentVersions.entityId, entityId)))
    .orderBy(desc(contentVersions.at));
}

/**
 * Restore a versioned entity to an earlier snapshot. The current state is
 * snapshotted first, so a restore is itself reversible. Returns false if the
 * version is unknown.
 */
export async function restoreVersion(db: DB, versionId: string, editor: string): Promise<boolean> {
  const version = (
    await db.select().from(contentVersions).where(eq(contentVersions.id, versionId))
  )[0];
  if (!version) return false;
  const snap = JSON.parse(version.snapshot) as Record<string, unknown>;

  if (version.entity === "plot") {
    const input = snap as unknown as PlotInput;
    await updatePlot(db, version.entityId, input, editor);
  } else if (version.entity === "timeline") {
    await updateStage(db, version.entityId, snap as unknown as TimelineInput, editor);
  } else if (version.entity === "news") {
    await updateNews(db, version.entityId, snap as unknown as NewsInput, editor);
  } else if (version.entity === "block") {
    await upsertBlock(
      db,
      version.entityId,
      { bodyNo: String(snap.bodyNo ?? ""), bodyEn: String(snap.bodyEn ?? "") },
      editor,
    );
  } else {
    return false;
  }
  await audit(db, "content.restore", editor, `entity=${version.entity}`);
  return true;
}
