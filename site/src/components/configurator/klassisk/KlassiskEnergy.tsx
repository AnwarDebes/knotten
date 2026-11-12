"use client";

/**
 * The energy figures in the Klassisk margin, set like the site's number rows (serif figures, small labels), each
 * marked "Foreløpig" with the model's method text. "dock": the folded panel at the bottom of the steps on a phone.
 */
import { useId, useState } from "react";
import { fmt, fmtRound } from "@/lib/facts";
import { kr } from "../text";
import type { Configurator, PriceModel } from "../useConfigurator";

function Figures({ c }: { c: Configurator }) {
  const { t, lang, estimate: e } = c;
  const items: { k: string; v: string; u: string; l: string; n?: string }[] = [
    { k: "kwp", v: fmt(e.pvKwp, lang, 1), u: "kWp", l: t.solar },
    { k: "kwh", v: fmtRound(e.pvKwh, 100, lang), u: t.perYear, l: t.production },
    { k: "self", v: fmt(e.selfSufficiencyPct, lang), u: "%", l: t.selfSufficiency, n: t.selfSufficiencyNote },
  ];
  if (e.costNok !== null) items.push({ k: "cost", v: fmt(Math.round(e.costNok), lang), u: "kr", l: t.costYear, n: e.referenceCostNok !== null ? t.referenceCost(kr(e.referenceCostNok, lang)) : undefined });
  if (e.outageHours !== null) items.push({ k: "out", v: fmt(Math.round(e.outageHours), lang), u: lang === "no" ? "timer" : "hours", l: t.outage, n: t.outageNote });
  return (
    <dl className="cfg-nums">
      {items.map((f) => (
        <div key={f.k}>
          <dt>{f.l}</dt>
          <dd><span className="v"><b>{f.v}</b> {f.u}</span>{f.n && <small>{f.n}</small>}</dd>
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
        <div className="cfg-pricemodel">
          <span className="small">{t.priceModel}</span>
          <span className="seg" role="group" aria-label={t.priceModel}>
            {(Object.keys(t.priceModels) as PriceModel[]).map((m) => (
              <button key={m} type="button" aria-pressed={c.priceModel === m} onClick={() => c.setPriceModel(m)}>{t.priceModels[m]}</button>
            ))}
          </span>
        </div>
      )}
      <details className="cfg-method">
        <summary>{t.method}</summary>
        <p className="small">{e.method[lang]}</p>
      </details>
      {!c.cfg.plot && <p className="small">{t.energyNoPlot}</p>}
    </>
  );
}

export default function KlassiskEnergy({ c, variant }: { c: Configurator; variant: "side" | "dock" }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const { t, lang, estimate: e } = c;
  if (variant === "side") {
    return (
      <section className="cfg-energy" aria-labelledby={`${id}-h`}>
        <div className="cfg-energy-head">
          <h3 id={`${id}-h`}>{t.energyTitle}</h3>
          <span className="tag">{t.provisional}</span>
          {c.energyLoading && <span className="small">{t.calculating} …</span>}
        </div>
        <Figures c={c} />
        <Details c={c} />
      </section>
    );
  }
  return (
    <div className="cfg-dock">
      <section aria-labelledby={`${id}-h`}>
        {open && (
          <div id={`${id}-b`} className="cfg-dock-body">
            <div className="cfg-energy-head">
              <h3 id={`${id}-h`}>{t.energyTitle}</h3>
              <span className="tag">{t.provisional}</span>
            </div>
            <Figures c={c} />
            <Details c={c} />
          </div>
        )}
        <button type="button" className="cfg-dock-toggle" aria-expanded={open} aria-controls={open ? `${id}-b` : undefined} onClick={() => setOpen((o) => !o)}>
          {!open && <span id={`${id}-h`} className="sr">{t.energyTitle}, {t.provisional}: </span>}
          <i aria-hidden />
          {open ? (
            <span>{t.hideEnergy}</span>
          ) : (
            <span className="cfg-dock-line">
              <em aria-hidden>{t.energyTitle}, {t.provisional}</em>
              <span>{fmt(e.pvKwp, lang, 1)} kWp, {fmtRound(e.pvKwh, 100, lang)} kWh, {fmt(e.selfSufficiencyPct, lang)} %</span>
            </span>
          )}
          {!open && <span className="sr">. {t.showEnergy}</span>}
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12" className={open ? "" : "up"}><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </section>
    </div>
  );
}
