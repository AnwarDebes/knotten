import { z } from "zod";

/**
 * Server-side validation for the editable content layer. Structure is
 * constrained where it matters (status enums, orientation, numeric ranges,
 * slugs) rather than left as free text, and every string is trimmed. Bodies
 * allow line breaks; labels do not.
 */

const singleLine = z
  .string()
  .trim()
  .min(1, "Pakrevd")
  .max(200, "For lang")
  .regex(/^[^\r\n\t]*$/, "Ugyldige tegn");

const optionalSingleLine = z
  .string()
  .trim()
  .max(200)
  .regex(/^[^\r\n\t]*$/, "Ugyldige tegn")
  .optional()
  .or(z.literal(""));

const richText = z.string().trim().min(1, "Pakrevd").max(8000);

export const ORIENTATIONS = ["soer", "oestVest", "nord"] as const;
export const PLOT_STATUSES = ["ledig", "reservert", "solgt"] as const;
export const PUBLISH_STATUSES = ["draft", "published"] as const;

// HTML forms submit empty optional fields as "" and unselected options as "".
// Treat those as "not provided" so optional numbers and enums validate.
const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

const optionalInt = (max: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).max(max).optional());
const optionalNum = (min?: number, max?: number) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .min(min ?? -1e12)
      .max(max ?? 1e12)
      .optional(),
  );

export const plotSchema = z.object({
  label: singleLine,
  sizeM2: optionalInt(100000),
  orientation: z.preprocess(emptyToUndefined, z.enum(ORIENTATIONS).optional()),
  status: z.enum(PLOT_STATUSES),
  priceIndicative: optionalInt(1_000_000_000),
  gnrBnr: optionalSingleLine,
  positionX: optionalNum(),
  positionZ: optionalNum(),
  sightlineBearing: optionalNum(0, 360),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type PlotInput = z.infer<typeof plotSchema>;

export const timelineSchema = z.object({
  key: singleLine,
  labelNo: singleLine,
  labelEn: singleLine,
  dateOrStage: optionalSingleLine,
  isCurrent: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type TimelineInput = z.infer<typeof timelineSchema>;

export const faqSchema = z.object({
  questionNo: singleLine,
  questionEn: singleLine,
  answerNo: richText,
  answerEn: richText,
  status: z.enum(PUBLISH_STATUSES).default("published"),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type FaqInput = z.infer<typeof faqSchema>;

export const newsSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Bruk sma bokstaver, tall og bindestrek"),
  titleNo: singleLine,
  titleEn: singleLine,
  bodyNo: richText,
  bodyEn: richText,
  status: z.enum(PUBLISH_STATUSES).default("draft"),
});
export type NewsInput = z.infer<typeof newsSchema>;

export const contentBlockSchema = z.object({
  bodyNo: z.string().trim().max(4000),
  bodyEn: z.string().trim().max(4000),
});
export type ContentBlockInput = z.infer<typeof contentBlockSchema>;

export const imageSlotSchema = z.object({
  altNo: singleLine,
  altEn: singleLine,
  forbeholdText: z.string().trim().max(300).optional().or(z.literal("")),
  isAiOrIllustration: z.coerce.boolean().default(false),
  disclosureText: z.string().trim().max(300).optional().or(z.literal("")),
});
export type ImageSlotInput = z.infer<typeof imageSlotSchema>;

export const dashboardSchema = z.object({
  mode: z.enum(["illustrative", "live"]).default("illustrative"),
  values: z
    .string()
    .trim()
    .max(4000)
    .refine((s) => {
      try {
        JSON.parse(s || "{}");
        return true;
      } catch {
        return false;
      }
    }, "Ugyldig JSON"),
});
export type DashboardInput = z.infer<typeof dashboardSchema>;
