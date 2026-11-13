"use client";
import { useState } from "react";
import SitePlan from "@/components/klassisk/SitePlan";
import type { Locale } from "@/lib/i18n";

const T = {
  no: {
    seg: "Vis terreng eller plan", today: "Terrenget i dag", plan: "Med boligene", north: "Nord opp. Sjøen ligger sør, nederst i planen.",
    plot: "Tomt", existing: "Eksisterende bygg", planned: "Planlagt næringsbygg",
    caption: "Prosjekteiers rekker, lagt inn i det målte terrenget innenfor eiendomsgrensen: eiendom 355/10, 5 m koter, skogen fra laserdata og veien i hårnålssvinger. Foreløpig utlegg v6; reguleringsplan er ikke vedtatt, avvik vil forekomme. Velg en tomt for å åpne siden dens.",
  },
  en: {
    seg: "Show the terrain or the plan", today: "The terrain today", plan: "With the homes", north: "North up. The sea lies to the south, at the bottom of the plan.",
    plot: "Plot", existing: "Existing buildings", planned: "Planned commercial building",
    caption: "The project owner's rows, placed in the measured terrain inside the property boundary: property 355/10, 5 m contours, the forest from laser data and the road in hairpin bends. Provisional layout v6; the zoning plan is not adopted, and changes will come. Choose a plot to open its page.",
  },
};

/**
 * The site plan on the Moderne plot pages (/no/tomter): the same drawing as the Klassisk plot picker, in the Moderne
 * colours and either language, each plot a link to its own page. Also what a browser that cannot draw the 3D model
 * sees in the model's place (`selected` and `note`).
 */
export default function PlanOverview({ locale, selected = null, note }: { locale: Locale; selected?: number | null; note?: string }) {
  const [mode, setMode] = useState<"today" | "plan">("plan");
  const t = T[locale];
  const btn = "rounded-full px-3.5 py-2 text-[14px] font-medium text-ink-2 hover:text-ink aria-pressed:bg-ink aria-pressed:text-white";
  return (
    <figure className="panel p-4 md:p-6">
      {note && <p role="status" className="mb-4 text-[15px] font-medium">{note}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="inline-flex gap-0.5 rounded-full bg-ink/[.08] p-[3px]" role="group" aria-label={t.seg}>
          <button type="button" className={btn} aria-pressed={mode === "today"} onClick={() => setMode("today")}>{t.today}</button>
          <button type="button" className={btn} aria-pressed={mode === "plan"} onClick={() => setMode("plan")}>{t.plan}</button>
        </div>
        <span className="provenance inline-flex items-center gap-2">
          <svg viewBox="0 0 18 18" aria-hidden="true" className="w-[18px] h-[18px] flex-none"><circle cx="9" cy="9" r="8" fill="none" stroke="#5a6975" /><path d="M9 2l3 7-3-2-3 2z" fill="#17283a" /></svg>
          {t.north}
        </span>
      </div>
      <SitePlan design="moderne" locale={locale} mode={mode} numbered selected={selected} revealOnView hrefFor={mode === "plan" ? (n) => `/${locale}/tomter/plot-${String(n).padStart(2, "0")}` : undefined} />
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-ink-2">
        <span className="inline-flex items-center gap-2"><i className="inline-block w-3.5 h-3.5 rounded-[3px] bg-pine" />{t.plot}</span>
        <span className="inline-flex items-center gap-2"><i className="inline-block w-3.5 h-3.5 rounded-[3px] bg-[#5a6975]" />{t.existing}</span>
        <span className="inline-flex items-center gap-2"><i className="inline-block w-3.5 h-3.5 rounded-[3px] border-[1.5px] border-dashed border-pine" />{t.planned}</span>
      </div>
      <figcaption className="provenance mt-3 max-w-[90ch]">{t.caption}</figcaption>
    </figure>
  );
}
