import manifest from "../../public/deliverables/manifest.json";

/**
 * The concept deliverables (SPEC-25) offered as a download kit. File sizes come
 * from the generated manifest; titles and language notes are curated here. The
 * documents are static, versioned files under public/deliverables.
 */
export type Deliverable = {
  file: string;
  bytes: number;
  ext: string;
  titleNo: string;
  titleEn: string;
  norwegianOnly: boolean;
};

type Meta = { titleNo: string; titleEn: string; norwegianOnly: boolean };

// Curated order and titles. Norwegian-only documents are flagged for the UI.
const META: Record<string, Meta> = {
  "Sammendrag_en_side_Knotten.pdf": {
    titleNo: "Sammendrag (en side)",
    titleEn: "One-page summary",
    norwegianOnly: true,
  },
  "Presentasjon_kommune_og_partnere_Knotten.pptx": {
    titleNo: "Presentasjon for kommune og partnere",
    titleEn: "Municipality and partner deck",
    norwegianOnly: true,
  },
  "Energikonsept_Knotten.docx": {
    titleNo: "Energikonsept",
    titleEn: "Energy concept",
    norwegianOnly: true,
  },
  "Mulighetsstudier_Knotten.docx": {
    titleNo: "Mulighetsstudier",
    titleEn: "Feasibility briefs",
    norwegianOnly: true,
  },
  "Energimodell_Knotten.xlsx": {
    titleNo: "Energimodell (redigerbar)",
    titleEn: "Editable energy model",
    norwegianOnly: true,
  },
  "Reguleringsplan_anbefalinger_Knotten.docx": {
    titleNo: "Reguleringsplan: anbefalinger",
    titleEn: "Zoning recommendations",
    norwegianOnly: true,
  },
  "Robusthet_og_beredskap_Knotten.docx": {
    titleNo: "Robusthet og beredskap",
    titleEn: "Resilience and preparedness",
    norwegianOnly: true,
  },
  "Markedsstrategi_og_prospekt_Knotten.docx": {
    titleNo: "Markedsstrategi og prospekt",
    titleEn: "Market strategy and prospectus",
    norwegianOnly: true,
  },
  "Oversikt_for_Sigve_Simonsen_AS.docx": {
    titleNo: "Oversikt (ikke-teknisk)",
    titleEn: "Non-technical overview",
    norwegianOnly: true,
  },
  "Personvernerklaering_Knotten.docx": {
    titleNo: "Personvernerklaering (utkast)",
    titleEn: "Privacy policy (draft)",
    norwegianOnly: true,
  },
};

const byFile = new Map(
  (manifest as { file: string; bytes: number; ext: string }[]).map((m) => [m.file, m]),
);

export const DELIVERABLES: Deliverable[] = Object.entries(META)
  .filter(([file]) => byFile.has(file))
  .map(([file, meta]) => {
    const m = byFile.get(file)!;
    return { file, bytes: m.bytes, ext: m.ext, ...meta };
  });
