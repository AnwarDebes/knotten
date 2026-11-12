"use client";

/**
 * The plot step in the Klassisk design, drawn like the plot picker's cards: the 30 plots in one radio group, the row
 * chips A to D, and a sort by winter sun or water in view. Each card has the measured sun on 21 December, the water
 * in view, open sea, whether a lower floor fits, and the administrator's status and price.
 */
import { useId, useState } from "react";
import { fmt } from "@/lib/facts";
import { kr } from "../text";
import { sortCards, type ConfiguratorData, type PlotCard, type PlotSort } from "../model";
import type { Configurator } from "../useConfigurator";

const ROWS = ["", "A", "B", "C", "D"] as const;
const SORTS: PlotSort[] = ["nr", "sol", "sjo"];

export default function KlassiskPlots({ c, data }: { c: Configurator; data: ConfiguratorData }) {
  const { t, lang } = c;
  const id = useId();
  const [row, setRow] = useState<(typeof ROWS)[number]>("");
  const [sort, setSort] = useState<PlotSort>("nr");
  const cards = sortCards(c.cards.filter((k) => !row || k.row === row), sort);
  const unpriced = c.cards.some((k) => k.price === null);
  return (
    <div className="cfg-plots">
      <div className="cfg-tools">
        <div className="filters" role="group" aria-labelledby={`${id}-r`}>
          <span id={`${id}-r`} className="small">{t.rowFilter}</span>
          {ROWS.map((r) => (
            <button key={r || "all"} type="button" className="chip" aria-pressed={row === r} onClick={() => setRow(r)}>{r ? t.rowName(r) : t.allRows}</button>
          ))}
        </div>
        <div className="filters" role="group" aria-labelledby={`${id}-s`}>
          <span id={`${id}-s`} className="small">{t.sort}</span>
          <span className="seg">
            {SORTS.map((s) => (
              <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)}>{t.sorts[s]}</button>
            ))}
          </span>
        </div>
      </div>
      {unpriced && <p className="small cfg-release">{data.releaseNote[lang]}</p>}
      <p role="status" className={c.notice ? "cfg-msg" : "sr"}>{c.notice}</p>
      <fieldset className="cfg-group">
        <legend className="sr">{t.choosePlot}, {t.plotsShown(cards.length)}</legend>
        <div className="cfg-cards">
          {cards.map((k) => <Card key={k.id} k={k} c={c} />)}
        </div>
      </fieldset>
      <p className="small cfg-source">{t.plotMethod}</p>
    </div>
  );
}

function Card({ k, c }: { k: PlotCard; c: Configurator }) {
  const { t, lang } = c;
  const id = useId();
  const on = c.cfg.plot === k.id;
  const pct = k.sunDecPossible ? Math.min(1, k.sunDec / k.sunDecPossible) : 0;
  const tone = k.status === "available" ? "green" : k.status === "reserved" ? "" : "blue";
  return (
    <label className={`cfg-card${on ? " sel" : ""}`}>
      <input type="radio" className="cfg-radio" name="cfg-tomt" value={k.id} checked={on} onChange={() => c.choosePlot(k.id)} aria-label={`${t.plotName(k.n)}, ${t.rowLower(k.row)}`} aria-describedby={`${id}-d`} />
      <span className="cfg-card-top">
        <b>{t.plotName(k.n)}</b>
        <span className={`tag ${tone}`} aria-hidden>{t.status(k.status)}</span>
      </span>
      <span className="m">{t.rowName(k.row)}, {t.metres(k.elevation)}</span>
      <span id={`${id}-d`} className="cfg-card-facts">
        <span><em>{fmt(k.sunDec, lang, 1)}</em> {lang === "no" ? "t" : "h"} {t.sunDec}</span>
        <span><em>{k.seaDeg}°</em> {t.seaInView}</span>
        <span className="m">{k.openSea ? t.openSeaDeg(k.openSeaDeg) : t.noOpenSea}</span>
        <span className="m">{k.lowerFloor ? t.lowerYes : t.lowerNo}</span>
        <span className="sr">. Status: {t.status(k.status)}.</span>
        {k.price !== null && <span className="cfg-card-price">{kr(k.price, lang)}</span>}
      </span>
      <span className="cfg-sunbar" aria-hidden><i style={{ width: `${pct * 100}%` }} /></span>
    </label>
  );
}
