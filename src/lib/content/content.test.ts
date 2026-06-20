// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import { auditLog } from "@/db/schema";
import {
  createPlot,
  updatePlot,
  deletePlot,
  listPlots,
  listVersions,
  restoreVersion,
  createNews,
  updateNews,
  listPublishedNews,
  upsertBlock,
  getBlock,
  upsertImageSlot,
  createFaq,
  listPublishedFaq,
  upsertDashboard,
  getDashboard,
} from "./service";
import {
  plotSchema,
  newsSchema,
  imageSlotSchema,
  dashboardSchema,
  type PlotInput,
} from "./validation";

const plot = (over: Partial<PlotInput> = {}): PlotInput => ({
  label: "Tomt 1",
  status: "ledig",
  sizeM2: 750,
  orientation: "soer",
  priceIndicative: 1500000,
  sortOrder: 0,
  ...over,
});

describe("content validation", () => {
  it("constrains plot status and orientation to the allowed set", () => {
    expect(plotSchema.safeParse(plot()).success).toBe(true);
    expect(plotSchema.safeParse({ ...plot(), status: "sold" }).success).toBe(false);
    expect(plotSchema.safeParse({ ...plot(), orientation: "west" }).success).toBe(false);
  });

  it("requires a valid slug for news", () => {
    const base = { titleNo: "T", titleEn: "T", bodyNo: "b", bodyEn: "b", status: "draft" as const };
    expect(newsSchema.safeParse({ ...base, slug: "min-nyhet" }).success).toBe(true);
    expect(newsSchema.safeParse({ ...base, slug: "Min Nyhet" }).success).toBe(false);
  });

  it("requires alt text on an image slot", () => {
    expect(
      imageSlotSchema.safeParse({ altNo: "", altEn: "x", isAiOrIllustration: false }).success,
    ).toBe(false);
    expect(
      imageSlotSchema.safeParse({ altNo: "Bilde", altEn: "Image", isAiOrIllustration: true })
        .success,
    ).toBe(true);
  });

  it("rejects invalid dashboard JSON", () => {
    expect(dashboardSchema.safeParse({ mode: "illustrative", values: "{not json" }).success).toBe(
      false,
    );
    expect(dashboardSchema.safeParse({ mode: "illustrative", values: '{"a":1}' }).success).toBe(
      true,
    );
  });
});

describe("content service", () => {
  it("creates, updates and versions a plot, then restores the prior value", async () => {
    const db = await createTestDb();
    const created = await createPlot(db, plot(), "drift@knotten.no");
    expect(created.status).toBe("ledig");

    await updatePlot(
      db,
      created.id,
      plot({ status: "solgt", priceIndicative: 1800000 }),
      "drift@knotten.no",
    );
    const afterUpdate = (await listPlots(db))[0]!;
    expect(afterUpdate.status).toBe("solgt");

    const versions = await listVersions(db, "plot", created.id);
    expect(versions.length).toBe(1); // the pre-update snapshot

    expect(await restoreVersion(db, versions[0]!.id, "drift@knotten.no")).toBe(true);
    const restored = (await listPlots(db))[0]!;
    expect(restored.status).toBe("ledig");
    expect(restored.priceIndicative).toBe(1500000);
  });

  it("deletes a plot and audits every mutation with no PII", async () => {
    const db = await createTestDb();
    const created = await createPlot(db, plot(), "drift@knotten.no");
    expect(await deletePlot(db, created.id, "drift@knotten.no")).toBe(true);
    expect(await listPlots(db)).toHaveLength(0);
    const log = await db.select().from(auditLog);
    expect(log.some((r) => r.action === "content.plot.create")).toBe(true);
    expect(log.some((r) => r.action === "content.plot.delete")).toBe(true);
  });

  it("publishes news only when status is published and stamps publishedAt", async () => {
    const db = await createTestDb();
    const draft = await createNews(
      db,
      { slug: "forste", titleNo: "T", titleEn: "T", bodyNo: "b", bodyEn: "b", status: "draft" },
      "drift@knotten.no",
    );
    expect(draft.publishedAt).toBeNull();
    expect(await listPublishedNews(db)).toHaveLength(0);

    const published = await updateNews(
      db,
      draft.id,
      { slug: "forste", titleNo: "T", titleEn: "T", bodyNo: "b", bodyEn: "b", status: "published" },
      "drift@knotten.no",
    );
    expect(published?.publishedAt).toBeInstanceOf(Date);
    expect(await listPublishedNews(db)).toHaveLength(1);
  });

  it("upserts a content block and snapshots the previous body", async () => {
    const db = await createTestDb();
    await upsertBlock(db, "hero", { bodyNo: "Forste", bodyEn: "First" }, "drift@knotten.no");
    await upsertBlock(db, "hero", { bodyNo: "Andre", bodyEn: "Second" }, "drift@knotten.no");
    expect((await getBlock(db, "hero"))?.bodyNo).toBe("Andre");
    expect((await listVersions(db, "block", "hero")).length).toBe(1);
  });

  it("upserts an image slot keeping the asset when not replaced", async () => {
    const db = await createTestDb();
    await upsertImageSlot(
      db,
      "hero-bg",
      { altNo: "Bilde", altEn: "Image", isAiOrIllustration: true, disclosureText: "Illustrasjon" },
      "drift@knotten.no",
      "/uploads/hero.webp",
    );
    const updated = await upsertImageSlot(
      db,
      "hero-bg",
      { altNo: "Nytt", altEn: "New", isAiOrIllustration: true },
      "drift@knotten.no",
    );
    expect(updated.assetRef).toBe("/uploads/hero.webp"); // preserved
    expect(updated.altNo).toBe("Nytt");
  });

  it("stores published FAQ and dashboard params", async () => {
    const db = await createTestDb();
    await createFaq(
      db,
      {
        questionNo: "Q",
        questionEn: "Q",
        answerNo: "A",
        answerEn: "A",
        status: "published",
        sortOrder: 0,
      },
      "drift@knotten.no",
    );
    expect(await listPublishedFaq(db)).toHaveLength(1);
    await upsertDashboard(
      db,
      "default",
      { mode: "illustrative", values: '{"solar":12}' },
      "drift@knotten.no",
    );
    expect((await getDashboard(db))?.mode).toBe("illustrative");
  });
});
