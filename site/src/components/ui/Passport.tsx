import Link from "next/link";
import type { Plot } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { plotName, rowLabel, sunLabel } from "@/lib/format";
import { fmt } from "@/lib/facts/core";
import { DOCS, dateLong } from "@/lib/facts";
import type { Design } from "@/lib/design";
import { kHref } from "@/lib/klassisk/locale";
import ks from "./Passport.module.css";

function SunRow({ label, day, small = false, summer = false, lang }: { label: string; day: Plot["sun"]["dec21"]; small?: boolean; summer?: boolean; lang: "no" | "en" }) {
  const pct = Math.max(0, Math.min(1, day.possible_hours ? day.hours / day.possible_hours : 0));
  return (
    <div className={`${small ? "py-1.5" : "py-2.5"} border-b line`}>
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-3">
        <div>
          <div className={small ? "text-[12.5px]" : "text-[14.5px]"}>{label}</div>
          <div className="provenance">{sunLabel(day.first_sun_cet, summer)} {lang === "no" ? "til" : "to"} {sunLabel(day.last_sun_cet, summer)}</div>
        </div>
        <div className={`num leading-none ${small ? "text-[19px]" : "text-[28px]"}`}>{fmt(day.hours, lang, 1)}<span className="text-[12px] font-body opacity-70 ml-1">h</span></div>
      </div>
      <div className="mt-2 h-[3px] rounded bg-ink/10 overflow-hidden"><div className="h-full bg-amber" style={{ width: `${pct * 100}%` }} /></div>
    </div>
  );
}

/** The sun passport: one plot, its measured sun and view, on a card that reads like a document. */
export default function Passport({ plot, locale, compact = false, here = false, variant = "moderne" }: { plot: Plot; locale: Locale; compact?: boolean; here?: boolean; /** the design it sits in: Klassisk gets its own skin (default Moderne) */ variant?: Design }) {
  if (variant === "klassisk") return <KlassiskPassport plot={plot} locale={locale} compact={compact} here={here} />;
  const d = t(locale);
  const P = d.passport;
  const no = locale === "no";
  const lang = no ? "no" : "en";
  return (
    <div className={compact ? "paper p-3.5 text-[13px]" : "paper p-5 md:p-6"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`display leading-none ${compact ? "text-[20px]" : "text-[30px]"}`}>{plotName(plot.id, no)}</div>
          <div className="provenance mt-1.5">{plot.zone === "flat" ? P.flat : `${P.row} ${rowLabel(plot)}`}, {plot.local.z_ground.toFixed(0)} {no ? "moh." : "m a.s.l."}</div>
        </div>
        <div className="text-right">
          <div className={`num leading-none ${compact ? "text-[20px]" : "text-[30px]"}`}>{plot.view.water_visible_deg}°</div>
          <div className="text-[12.5px] text-granite">{P.seaDeg}</div>
        </div>
      </div>

      <div className={compact ? "mt-1 text-[12.5px]" : "mt-3"}>
        <SunRow label={P.sunDec} day={plot.sun.dec21} small={compact} lang={lang} />
        {!compact && <SunRow label={P.sunMar} day={plot.sun.mar21} lang={lang} />}
        <SunRow label={P.sunJun} day={plot.sun.jun21} small={compact} summer lang={lang} />
      </div>

      <div className={`grid grid-cols-3 gap-2 whitespace-nowrap ${compact ? "mt-2.5 text-[11.5px]" : "mt-4 text-[14px]"}`}>
        <div><div className="provenance">{P.openSea}</div><div className={plot.view.open_sea_visible ? "text-pine font-medium" : ""}>{plot.view.open_sea_visible ? `${P.yes}, ${plot.view.open_sea_deg}°` : P.no}</div></div>
        <div><div className="provenance">{P.slope}</div><div>{plot.terrain.slope_deg.toFixed(0)}°</div></div>
        <div><div className="provenance">{P.cutfill}</div><div>≈ {plot.terrain.level_pad_cutfill_m3.toFixed(0)} m³</div></div>
      </div>

      <div className={compact ? "hidden" : "provenance mt-4"}>
        {no
          ? "Kartverket DTM 1 m og NOAA solposisjon. Terrengskygge med feltet ryddet. Beregnet 2026-09-30 for foreløpig utlegg v6 (rekke A til D), med nabohusene stående."
          : "Kartverket DTM 1 m and NOAA solar position. Terrain shading with the field cleared. Computed 2026-09-30 for provisional layout v6 (rows A to D), with the neighbouring houses standing."}
      </div>
      {!compact && (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {/* (on the plot's own page the passport is already open) */}
          {!here && <Link className="btn btn-sm" href={`/${locale}/tomter/${plot.id}`}>{d.cta.passport}</Link>}
          <Link className="btn btn-ghost btn-sm" href={`/${locale}/interesse?plot=${plot.id}`}>{d.cta.register}</Link>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ the Klassisk skin
/** The plot's number as the Klassisk addresses write it: "plot-07" -> "07" (/tomtene/07, /kontakt?tomt=07). */
const nn = (id: string) => id.replace("plot-", "");

function KlassiskSunRow({ label, day, summer = false, lang }: { label: string; day: Plot["sun"]["dec21"]; summer?: boolean; lang: "no" | "en" }) {
  const pct = Math.max(0, Math.min(1, day.possible_hours ? day.hours / day.possible_hours : 0));
  return (
    <div className={ks.row}>
      <div className={ks.rowHead}>
        <div>
          <div className={ks.rowLabel}>{label}</div>
          <div className={ks.when}>{sunLabel(day.first_sun_cet, summer)} {lang === "no" ? "til" : "to"} {sunLabel(day.last_sun_cet, summer)}</div>
        </div>
        <div className={ks.hours}>{fmt(day.hours, lang, 1)}<span className={ks.unit}>h</span></div>
      </div>
      <div className={ks.bar}><span style={{ width: `${pct * 100}%` }} /></div>
    </div>
  );
}

/** The same passport, the same figures and links, in Klassisk's look and addresses (/tomtene/07, /english/tomtene/07). */
function KlassiskPassport({ plot, locale, compact, here }: { plot: Plot; locale: Locale; compact: boolean; here: boolean }) {
  const d = t(locale);
  const P = d.passport;
  const no = locale === "no";
  const lang = no ? "no" : "en";
  const when = dateLong(DOCS.plots_data.date, lang);
  return (
    <div className={compact ? `${ks.card} ${ks.compact}` : ks.card}>
      <div className={ks.top}>
        <div>
          <div className={ks.name}>{plotName(plot.id, no)}</div>
          <div className={ks.meta}>{plot.zone === "flat" ? P.flat : `${P.row} ${rowLabel(plot)}`}, {plot.local.z_ground.toFixed(0)} {no ? "moh." : "m a.s.l."}</div>
        </div>
        <div className={ks.right}>
          <div className={ks.big}>{plot.view.water_visible_deg}°</div>
          <div className={ks.small}>{P.seaDeg}</div>
        </div>
      </div>

      <div className={ks.rows}>
        <KlassiskSunRow label={P.sunDec} day={plot.sun.dec21} lang={lang} />
        {!compact && <KlassiskSunRow label={P.sunMar} day={plot.sun.mar21} lang={lang} />}
        <KlassiskSunRow label={P.sunJun} day={plot.sun.jun21} summer lang={lang} />
      </div>

      <dl className={ks.facts}>
        <div><dt>{P.openSea}</dt><dd className={plot.view.open_sea_visible ? ks.yes : undefined}>{plot.view.open_sea_visible ? `${P.yes}, ${plot.view.open_sea_deg}°` : P.no}</dd></div>
        <div><dt>{P.slope}</dt><dd>{plot.terrain.slope_deg.toFixed(0)}°</dd></div>
        <div><dt>{P.cutfill}</dt><dd>≈ {plot.terrain.level_pad_cutfill_m3.toFixed(0)} m³</dd></div>
      </dl>

      {!compact && (
        <p className={ks.prov}>
          {no
            ? `Kartverket DTM 1 m og NOAA solposisjon. Terrengskygge med feltet ryddet. Beregnet ${when} for foreløpig utlegg v6 (rekke A til D), med nabohusene stående.`
            : `Kartverket DTM 1 m and NOAA solar position. Terrain shading with the field cleared. Computed ${when} for provisional layout v6 (rows A to D), with the neighbouring houses standing.`}
        </p>
      )}
      {!compact && (
        <div className={ks.acts}>
          {/* (on the plot's own page the passport is already open) */}
          {!here && <Link className="btn sm" href={kHref(`/tomtene/${nn(plot.id)}`, locale)}>{d.cta.passport}</Link>}
          <Link className="btn ghost sm" href={kHref(`/kontakt?tomt=${nn(plot.id)}`, locale)}>{d.cta.register}</Link>
        </div>
      )}
    </div>
  );
}
