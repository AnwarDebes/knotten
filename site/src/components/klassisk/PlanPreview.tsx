"use client";
import { useState } from "react";
import SitePlan from "./SitePlan";

const T = {
  no: {
    label: "Situasjonsplan for Knotten", seg: "Vis terreng eller plan", today: "Terrenget i dag", plan: "Med boligene",
    north: "Nord opp. Sjøen ligger sør, nederst i kartet.", plot: "Tomt, sjøutsikt ønsket", existing: "Eksisterende bygg", planned: "Planlagt næringsbygg",
    caption: "Prosjekteiers rekker, lagt inn i det målte terrenget innenfor eiendomsgrensen. Foreløpig utlegg; reguleringsplan er ikke vedtatt, avvik vil forekomme. Hold over en tomt for å se siktretningen.",
  },
  en: {
    label: "Site plan for Knotten", seg: "Show the terrain or the plan", today: "The terrain today", plan: "With the homes",
    north: "North up. The sea lies to the south, at the bottom of the map.", plot: "Plot, sea view wanted", existing: "Existing buildings", planned: "Planned commercial building",
    caption: "The project owner's rows, placed in the measured terrain inside the property boundary. A provisional layout; the zoning plan is not adopted, and changes will come. Hover over a plot to see which way it looks.",
  },
};

/** Front page preview: one before/after toggle, plots reveal once when scrolled into view. */
export default function PlanPreview({ locale = "no" }: { locale?: "no" | "en" }) {
  const [mode, setMode] = useState<"today" | "plan">("plan");
  const t = T[locale];
  return (
    <figure className="fig" aria-label={t.label}>
      <div className="fig-head">
        <div className="seg" role="group" aria-label={t.seg}>
          <button type="button" aria-pressed={mode === "today"} onClick={() => setMode("today")}>{t.today}</button>
          <button type="button" aria-pressed={mode === "plan"} onClick={() => setMode("plan")}>{t.plan}</button>
        </div>
        <span className="compass">
          <svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="9" cy="9" r="8" fill="none" stroke="#7C8A9B" /><path d="M9 2l3 7-3-2-3 2z" fill="#14263D" /></svg>
          {t.north}
        </span>
      </div>
      <SitePlan mode={mode} revealOnView locale={locale} />
      <div className="legend">
        <span><i style={{ background: "var(--pine)" }} />{t.plot}</span>
        <span><i style={{ background: "#7C8A9B" }} />{t.existing}</span>
        <span><i style={{ border: "1.5px dashed var(--pine)", background: "transparent" }} />{t.planned}</span>
      </div>
      <figcaption><span>{t.caption}</span></figcaption>
    </figure>
  );
}
