"use client";

/**
 * The energy figures for the configured house, every one marked provisional with the model's own method text.
 * "side": the panel under the 3D view on a computer. "dock": a small panel that rides at the bottom of the steps on
 * a phone or tablet, folded to one line until opened (the chat button keeps its corner on the right).
 */
import { useId, useState } from "react";
import { fmt, fmtRound } from "@/lib/facts";
import { kr } from "../text";
import type { Configurator, PriceModel } from "../useConfigurator";

function Figures({ c, compact = false }: { c: Configurator; compact?: boolean }) {
  const { t, lang, estimate: e } = c;
  const items: { k: string; v: string; u: string; l: string; n?: string }[] = [
    { k: "kwp", v: fmt(e.pvKwp, lang, 1), u: "kWp", l: t.solar },
    { k: "kwh", v: fmtRound(e.pvKwh, 100, lang), u: t.perYear, l: t.production },
    { k: "self", v: fmt(e.selfSufficiencyPct, lang), u: "%", l: t.selfSufficiency, n: t.selfSufficiencyNote },
  ];
  if (e.costNok !== null) items.push({ k: "cost", v: fmt(Math.round(e.costNok), lang), u: "kr", l: t.costYear, n: e.referenceCostNok !== null ? t.referenceCost(kr(e.referenceCostNok, lang)) : undefined });
  if (e.outageHours !== null) items.push({ k: "out", v: fmt(Math.round(e.outageHours), lang), u: lang === "no" ? "timer" : "hours", l: t.outage, n: t.outageNote });
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-4 mt-3.5">
      {items.map((f) => (
        <div key={f.k} className="min-w-0">
          <dt className="text-[13px] text-muted">{f.l}</dt>
          <dd className="mt-1">
            <span className={`num leading-none ${compact ? "text-[23px]" : "text-[27px]"}`}>{f.v}</span>
            <span className={`text-[12.5px] text-ink-2 ${compact ? "block mt-1" : "ml-1"}`}>{f.u}</span>
            {f.n && <span className="block text-[12px] text-muted mt-1 leading-snug">{f.n}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Details({ c }: { c: Configurator }) {
  const { t, estimate: e, lang } = c;
  return (
    <>
      {e.costNok !== null && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-muted">{t.priceModel}</span>
          <span className="cfg-m-views cfg-m-views-light" role="group" aria-label={t.priceModel}>
            {(Object.keys(t.priceModels) as PriceModel[]).map((m) => (
              <button key={m} type="button" aria-pressed={c.priceModel === m} onClick={() => c.setPriceModel(m)}>{t.priceModels[m]}</button>
            ))}
          </span>
        </div>
      )}
      <details className="cfg-m-method mt-3.5">
        <summary>{t.method}</summary>
        <p className="mt-2 text-[13.5px] text-ink-2 leading-snug">{e.method[lang]}</p>
      </details>
      {!c.cfg.plot && <p className="mt-2 text-[13px] text-muted">{t.energyNoPlot}</p>}
    </>
  );
}

function Head({ c, id }: { c: Configurator; id: string }) {
  const { t } = c;
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-amber shrink-0" />
      <h2 id={id} className="display text-[20px] leading-none">{t.energyTitle}</h2>
      <span className="chip">{t.provisional}</span>
      {c.energyLoading && <span className="text-[12.5px] text-muted ml-auto">{t.calculating} …</span>}
    </div>
  );
}

export default function ModerneEnergy({ c, variant }: { c: Configurator; variant: "side" | "dock" }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { t, lang, estimate: e } = c;
  if (variant === "side") {
    return (
      <section aria-labelledby={`${id}-h`} className="hidden lg:block panel p-5">
        <Head c={c} id={`${id}-h`} />
        <Figures c={c} />
        <Details c={c} />
      </section>
    );
  }
  return (
    <div className="cfg-m-dock lg:hidden">
      <section aria-labelledby={`${id}-h`} className="paper">
        {open && (
          <div id={`${id}-b`} className="px-4 pt-4 pb-1">
            <Head c={c} id={`${id}-h`} />
            <Figures c={c} compact />
            <Details c={c} />
          </div>
        )}
        <button type="button" className="cfg-m-docktoggle" aria-expanded={open} aria-controls={open ? `${id}-b` : undefined} onClick={() => setOpen((o) => !o)}>
          {!open && <span id={`${id}-h`} className="sr-only">{t.energyTitle}, {t.provisional}: </span>}
          <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-amber shrink-0" />
          {open ? (
            <span className="min-w-0">{t.hideEnergy}</span>
          ) : (
            <span className="min-w-0 grid">
              <span className="text-[12px] font-normal text-muted leading-tight" aria-hidden>{t.energyTitle}, {t.provisional}</span>
              <span className="leading-tight whitespace-nowrap">{fmt(e.pvKwp, lang, 1)} kWp · {fmtRound(e.pvKwh, 100, lang)} kWh · {fmt(e.selfSufficiencyPct, lang)} %</span>
            </span>
          )}
          {!open && <span className="sr-only">. {t.showEnergy}</span>}
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className={`shrink-0 transition-transform ${open ? "" : "rotate-180"}`}><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </section>
    </div>
  );
}
