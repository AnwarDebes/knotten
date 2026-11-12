"use client";

/**
 * The printed summary: one clean A4 sheet with the plot, the energy figures, the choices, the prices as they stand
 * and the honest notes. Hidden on screen; each design's stylesheet shows it in print (the .cfgp classes) and hides
 * the rest of the page.
 */
import { INCLUDED } from "@/lib/configurator/catalog";
import { fmt, fmtRound } from "@/lib/facts";
import { kr } from "./text";
import { picksText, priceSummary, summaryGroups } from "./summaryView";
import type { Configurator } from "./useConfigurator";

export default function PrintSheet({ c, info }: { c: Configurator; info: { date: string; url: string } | null }) {
  const { t, lang, card, estimate: e } = c;
  const money = priceSummary(c);
  return (
    <div className="cfg-print">
      <header className="cfgp-head">
        <p className="cfgp-brand">Knotten, Sigve Simonsen AS</p>
        <h1>{t.printTitle}</h1>
        <p className="cfgp-meta">
          {/* (the height ends with its own full stop: "73 moh.") */}
          {card ? `${t.plotName(card.n)}, ${t.rowLower(card.row)}, ${t.metres(card.elevation)} ` : `${t.noPlot} `}
          {info ? `${t.printed(info.date)}.` : ""}
        </p>
      </header>

      <section className="cfgp-sec cfgp-cols">
        <div>
          <h2>{t.yourPlot}</h2>
          {card ? (
            <table className="cfgp-table">
              <tbody>
                <tr><th scope="row">{t.sunDecLong}</th><td>{t.hours(card.sunDec)}</td></tr>
                <tr><th scope="row">{t.seaInViewLong}</th><td>{card.seaDeg}°{card.openSea ? `, ${t.openSeaDeg(card.openSeaDeg)}` : ""}</td></tr>
                <tr><th scope="row">{t.lowerFloor}</th><td>{card.lowerFloor ? t.lowerYes : t.lowerNo}</td></tr>
                <tr><th scope="row">Status</th><td>{t.status(card.status)}{card.price !== null ? `, ${kr(card.price, lang)}` : ""}</td></tr>
              </tbody>
            </table>
          ) : (
            <p className="cfgp-note">{t.noPlot}</p>
          )}
        </div>
        <div>
          <h2>{t.energyTitle} ({t.provisional})</h2>
          <table className="cfgp-table">
            <tbody>
              <tr><th scope="row">{t.solar}</th><td className="cfgp-price">{fmt(e.pvKwp, lang, 1)} kWp</td></tr>
              <tr><th scope="row">{t.production}</th><td className="cfgp-price">{fmtRound(e.pvKwh, 100, lang)} {t.perYear}</td></tr>
              <tr><th scope="row">{t.selfSufficiency}</th><td className="cfgp-price">{fmt(e.selfSufficiencyPct, lang)} %</td></tr>
              {e.costNok !== null && <tr><th scope="row">{t.costYear}</th><td className="cfgp-price">{kr(e.costNok, lang)}</td></tr>}
              {e.outageHours !== null && <tr><th scope="row">{t.outage}</th><td className="cfgp-price">{t.outageHours(e.outageHours)}</td></tr>}
            </tbody>
          </table>
          <p className="cfgp-note">{e.method[lang]}</p>
        </div>
      </section>

      <section className="cfgp-sec">
        <h2>{t.summaryChoices}</h2>
        <table className="cfgp-table cfgp-choices">
          <tbody>
            {summaryGroups(c).map((g) => [
              <tr key={g.step} className="cfgp-group"><th colSpan={3} scope="colgroup">{g.label}</th></tr>,
              ...g.lines.map((l) => (
                <tr key={l.option}>
                  <th scope="row">{l.optionLabel}</th>
                  <td>{l.choiceLabel}</td>
                  <td className="cfgp-price">{l.price}</td>
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </section>

      <section className="cfgp-sec cfgp-cols">
        <div>
          <h2>{lang === "no" ? "Pris" : "Price"}</h2>
          <table className="cfgp-table">
            <tbody>
              <tr><th scope="row">{t.picksTotal}</th><td className="cfgp-price">{picksText(c, money)}</td></tr>
              <tr><th scope="row">{t.house}</th><td className="cfgp-price">{money.house !== null ? kr(money.house, lang) : t.onRequest}</td></tr>
              <tr><th scope="row">{t.plot}</th><td className="cfgp-price">{money.plot !== null ? kr(money.plot, lang) : c.cfg.plot ? t.onRequest : t.noPlot}</td></tr>
              {money.known > 0 && <tr className="cfgp-total"><th scope="row">{t.knownSum}</th><td className="cfgp-price">{kr(money.known, lang)}</td></tr>}
            </tbody>
          </table>
          <p className="cfgp-note">{money.known === 0 && money.open ? t.allOnRequest : money.open ? t.restOnRequest : ""}</p>
        </div>
        <div>
          <h2>{t.includedTitle}</h2>
          <ul className="cfgp-list">
            {INCLUDED.map((i) => <li key={i.id}>{i.label[lang]}</li>)}
          </ul>
        </div>
      </section>

      <section className="cfgp-sec cfgp-notes">
        {t.honesty.map((h) => <p key={h}>{h}</p>)}
      </section>

      <footer className="cfgp-foot">
        <p>{t.contactLine}. <b>{t.linkLabel}:</b> <span className="cfgp-url">{info?.url ?? ""}</span></p>
      </footer>
    </div>
  );
}
