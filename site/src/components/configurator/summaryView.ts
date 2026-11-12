/**
 * The summary as both designs and the printed sheet show it: the rows of lib/configurator/state summary(), grouped
 * by step, with each price in words, and the totals kept apart (options, house, plot) as the buyer reads them.
 */
import { OPTION_BY_ID, STEPS } from "@/lib/configurator/catalog";
import type { StepId } from "@/lib/configurator/types";
import { applicable } from "./model";
import { kr } from "./text";
import type { Configurator } from "./useConfigurator";

export type SummaryLine = {
  option: string;
  optionLabel: string;
  choiceLabel: string;
  /** included: the standard delivery; price: the administrator's figure; request: no price set; none: not possible on the plot. */
  kind: "included" | "price" | "request" | "none";
  price: string;
};

export function summaryGroups(c: Configurator): { step: StepId; label: string; lines: SummaryLine[] }[] {
  const { t, lang } = c;
  return STEPS.filter((s) => s.id !== "tomt").map((s) => ({
    step: s.id,
    label: s.label[lang],
    lines: c.rows
      .filter((r) => r.step === s.id)
      .map((r): SummaryLine => {
        const o = OPTION_BY_ID[r.option];
        if (o && !applicable(o, c.facts)) {
          return { option: r.option, optionLabel: r.optionLabel, choiceLabel: c.facts ? t.notApplicable : t.lowerNeedsPlot, kind: "none", price: "" };
        }
        if (r.standard) return { option: r.option, optionLabel: r.optionLabel, choiceLabel: r.choiceLabel, kind: "included", price: t.included };
        if (r.price === null) return { option: r.option, optionLabel: r.optionLabel, choiceLabel: r.choiceLabel, kind: "request", price: t.onRequest };
        return { option: r.option, optionLabel: r.optionLabel, choiceLabel: r.choiceLabel, kind: "price", price: kr(r.price, lang) };
      }),
  }));
}

/** Options, house and plot apart, then the sum of what is known and whether anything is still on request. */
export function priceSummary(c: Configurator) {
  let picksKnown = 0;
  let picksOpen = false;
  let picks = 0;
  for (const r of c.rows) {
    if (r.standard) continue;
    picks++;
    if (r.price === null) picksOpen = true;
    else picksKnown += r.price;
  }
  const base = c.prices["house:base"];
  return {
    picks,
    picksKnown,
    picksOpen,
    house: typeof base === "number" ? base : null,
    plot: c.card?.price ?? null,
    known: c.total.known,
    open: c.total.open,
  };
}

/** The options' total in words: included, a sum, a sum and the rest on request, or on request. */
export function picksText(c: Configurator, m: ReturnType<typeof priceSummary>): string {
  const { t, lang } = c;
  if (m.picks === 0) return t.included;
  if (!m.picksOpen) return kr(m.picksKnown, lang);
  return m.picksKnown > 0 ? `${kr(m.picksKnown, lang)} + ${t.onRequest.toLowerCase()}` : t.onRequest;
}
