"use client";

/**
 * The plot step in the Moderne design: the 30 plots as cards in one radio group, with the measured winter sun, the
 * water in view, open sea, whether a lower floor fits, and the administrator's status and price. A row filter and
 * two sorts help compare.
 */
import { useId, useState } from "react";
import { fmt } from "@/lib/facts";
import { kr } from "../text";
import { sortCards, type ConfiguratorData, type PlotCard, type PlotSort } from "../model";
import type { Configurator } from "../useConfigurator";

const ROWS = ["", "A", "B", "C", "D"] as const;
const SORTS: PlotSort[] = ["nr", "sol", "sjo"];

export default function ModernePlots({ c, data }: { c: Configurator; data: ConfiguratorData }) {
  const { t, lang } = c;
  const id = useId();
  const [row, setRow] = useState<(typeof ROWS)[number]>("");
  const [sort, setSort] = useState<PlotSort>("nr");
  const cards = sortCards(c.cards.filter((k) => !row || k.row === row), sort);
  const unpriced = c.cards.some((k) => k.price === null);
  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-labelledby={`${id}-r`}>
          <span id={`${id}-r`} className="label mr-1">{t.rowFilter}</span>
          {ROWS.map((r) => (
            <button key={r || "all"} type="button" aria-pressed={row === r} onClick={() => setRow(r)} className="cfg-m-press">{r || t.allRows}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-labelledby={`${id}-s`}>
          <span id={`${id}-s`} className="label mr-1">{t.sort}</span>
          {SORTS.map((s) => (
            <button key={s} type="button" aria-pressed={sort === s} onClick={() => setSort(s)} className="cfg-m-press">{t.sorts[s]}</button>
          ))}
        </div>
      </div>
      {unpriced && <p className="provenance mt-3">{data.releaseNote[lang]}</p>}
      <p role="status" className={c.notice ? "mt-3 text-[14px] panel-2 px-4 py-2.5" : "sr-only"}>{c.notice}</p>

      <fieldset className="mt-4">
        <legend className="sr-only">{t.choosePlot}, {t.plotsShown(cards.length)}</legend>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {cards.map((k) => <Card key={k.id} k={k} c={c} />)}
        </div>
      </fieldset>
      <p className="provenance mt-4 max-w-[70ch]">{t.plotMethod}</p>
    </div>
  );
}

function Card({ k, c }: { k: PlotCard; c: Configurator }) {
  const { t, lang } = c;
  const id = useId();
  const on = c.cfg.plot === k.id;
  const pct = k.sunDecPossible ? Math.min(1, k.sunDec / k.sunDecPossible) : 0;
  const tone = k.status === "available" ? "chip-pine" : k.status === "reserved" ? "chip-amber" : "";
  return (
    <label className={`cfg-m-card${on ? " on" : ""}`}>
      <input type="radio" className="cfg-radio" name="cfg-tomt" value={k.id} checked={on} onChange={() => c.choosePlot(k.id)} aria-label={`${t.plotName(k.n)}, ${t.rowLower(k.row)}`} aria-describedby={`${id}-d`} />
      <span className="flex items-start justify-between gap-3">
        <span className="block">
          <span className="block display text-[23px] leading-none">{t.plotName(k.n)}</span>
          <span className="block text-[13px] text-muted mt-1.5">{t.rowName(k.row)}, {t.metres(k.elevation)}</span>
        </span>
        <span className={`chip ${tone}`} aria-hidden>{t.status(k.status)}</span>
      </span>
      <span id={`${id}-d`} className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3.5 text-[13.5px] text-ink-2">
        <span className="block"><span className="num text-[19px] text-ink">{fmt(k.sunDec, lang, 1)}</span> {lang === "no" ? "t" : "h"} {t.sunDec}</span>
        <span className="block"><span className="num text-[19px] text-ink">{k.seaDeg}°</span> {t.seaInView}</span>
        <span className="block">{k.openSea ? t.openSeaDeg(k.openSeaDeg) : t.noOpenSea}</span>
        <span className="block">{k.lowerFloor ? t.lowerYes : t.lowerNo}</span>
        <span className="sr-only">. Status: {t.status(k.status)}.</span>
        {k.price !== null && <span className="block col-span-2 num text-[17px] text-ink mt-1">{kr(k.price, lang)}</span>}
      </span>
      <span aria-hidden className="block mt-3 h-[3px] rounded bg-ink/10 overflow-hidden"><span className="block h-full bg-amber" style={{ width: `${pct * 100}%` }} /></span>
    </label>
  );
}
