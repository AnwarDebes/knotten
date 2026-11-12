"use client";

/**
 * The configurator's state for both designs: the configuration and the step, kept in the address (so a link or a
 * reload brings the same house back), a draft in this browser, the plot facts, the administrator's prices with
 * "Pris på forespørsel" as the fallback, the summary and the energy estimate. The pages only draw it.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { normalize, summary, totals } from "@/lib/configurator/state";
import type { EnergyOptions, HouseConfig, Lang, PriceTable, PricesResponse } from "@/lib/configurator/types";
import { useEnergyEstimate } from "./useEnergyEstimate";
import { isStepKey, optionsOf, plotCards, plotNumber, searchFor, STEP_KEYS, type ConfiguratorData, type Initial, type PlotStatus, type StepKey } from "./model";
import { copy, energyLine } from "./text";

export type PriceModel = NonNullable<EnergyOptions["prices"]>;
export type SavedRef = { id: string; name: string };
type Pricing = { state: "loading" | "ready" | "fallback"; prices: PriceTable; live: PricesResponse["plots"] | null };

// ------------------------------------------------------------------------------------------------ the draft

const DRAFT_KEY = "knotten.konfigurator";
type Draft = { v: 1; cfg: HouseConfig; step: StepKey; saved: SavedRef | null; at: number };

function subscribeStorage(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function readDraft(): string | null {
  try {
    return window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}
const serverDraft = () => null;

function parseDraft(raw: string | null, facts: ConfiguratorData["facts"]): Draft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as Partial<Draft> | null;
    if (!d || d.v !== 1 || !d.cfg) return null;
    const plotId = typeof d.cfg.plot === "string" ? d.cfg.plot : null;
    const cfg = normalize(d.cfg, plotId ? facts[plotId] ?? null : null);
    if (!cfg.plot && Object.keys(cfg.sel).length === 0) return null;
    const saved = d.saved && typeof d.saved.id === "string" && typeof d.saved.name === "string" ? { id: d.saved.id, name: d.saved.name } : null;
    return { v: 1, cfg, step: isStepKey(d.step) ? d.step : "tomt", saved, at: Number(d.at) || 0 };
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------------------------ prices

const STATUSES: PlotStatus[] = ["unreleased", "available", "reserved", "sold"];

/** Only what the contract allows: numbers or null per price, a known status and a number or null per plot. */
function cleanPrices(j: unknown): Omit<Pricing, "state"> | null {
  if (!j || typeof j !== "object") return null;
  const r = j as Partial<PricesResponse>;
  const prices: PriceTable = {};
  if (r.prices && typeof r.prices === "object") {
    for (const [k, v] of Object.entries(r.prices)) if (v === null || (typeof v === "number" && Number.isFinite(v))) prices[k] = v;
  }
  let live: PricesResponse["plots"] | null = null;
  if (r.plots && typeof r.plots === "object") {
    live = {};
    for (const [id, p] of Object.entries(r.plots)) {
      if (!p || !STATUSES.includes(p.status)) continue;
      live[id] = { status: p.status, price_nok: typeof p.price_nok === "number" && Number.isFinite(p.price_nok) ? p.price_nok : null, note: null };
    }
  }
  return { prices, live };
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function focusHeading(h: HTMLElement) {
  h.focus({ preventScroll: true });
  const top = h.getBoundingClientRect().top;
  // the heading's own scroll margin plus the page's scroll padding: what scrolling into view leaves above it
  const margin = (parseFloat(getComputedStyle(h).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0);
  if (top < margin || top > window.innerHeight * 0.55) h.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
}

// ------------------------------------------------------------------------------------------------ the hook

export function useConfigurator({ data, initial, lang }: { data: ConfiguratorData; initial: Initial; lang: Lang }) {
  const t = copy(lang);
  const [cfg, setCfg] = useState<HouseConfig>(initial.cfg);
  const [step, setStep] = useState<StepKey>(initial.step);
  // nothing is written to this browser until the visitor does something: a shared link opened and closed again
  // leaves the visitor's own draft as it was
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState("");
  const [pricing, setPricing] = useState<Pricing>({ state: "loading", prices: {}, live: null });
  const [priceModel, setPriceModel] = useState<PriceModel>("budget");
  const [saved, setSaved] = useState<SavedRef | null>(null);
  const [draftDismissed, setDraftDismissed] = useState(false);

  const factsOf = useCallback((id: string | null) => (id ? data.facts[id] ?? null : null), [data.facts]);
  const facts = factsOf(cfg.plot);
  const plot = useMemo(() => data.plots.find((p) => p.id === cfg.plot) ?? null, [data.plots, cfg.plot]);
  const cards = useMemo(() => plotCards(data, pricing.live), [data, pricing.live]);
  const card = useMemo(() => cards.find((c) => c.id === cfg.plot) ?? null, [cards, cfg.plot]);
  const rows = useMemo(() => summary(cfg, lang, pricing.prices, facts), [cfg, lang, pricing.prices, facts]);
  const total = useMemo(() => totals(rows, pricing.prices, card?.price ?? null), [rows, pricing.prices, card]);

  // the energy figures for this house on this plot (the estimate is the energy model's; the pages only show it)
  const energyOpts = useMemo<EnergyOptions>(() => ({ prices: priceModel }), [priceModel]);
  const { estimate, loading: energyLoading } = useEnergyEstimate(cfg, plot, facts, energyOpts);

  // ---------------------------------------------------------------- choosing
  const choose = (optionId: string, choiceId: string) => {
    setTouched(true);
    setCfg((c) => normalize({ ...c, sel: { ...c.sel, [optionId]: choiceId } }, factsOf(c.plot)));
  };
  const choosePlot = (id: string) => {
    setTouched(true);
    const next = normalize({ ...cfg, plot: id }, factsOf(id));
    const dropped = !!cfg.sel.underetasje && !next.sel.underetasje;
    setCfg(next);
    setNotice(dropped ? t.lowerDropped(plotNumber(id) ?? 0) : "");
  };
  /** "Tilbake til standard": the step's options go back to the standard delivery. */
  const resetStep = (s: StepKey) => {
    setTouched(true);
    setCfg((c) => {
      const sel = { ...c.sel };
      for (const o of optionsOf(s)) delete sel[o.id];
      return { ...c, sel };
    });
  };
  const picksIn = (s: StepKey) => optionsOf(s).filter((o) => cfg.sel[o.id]).length;

  // ---------------------------------------------------------------- the steps
  // a new step: the keyboard and the screen reader go to its heading; the page scrolls only when the heading is out
  // of sight, as after "Neste" at the end of a long step on a phone
  const headingId = useId();
  const focusPending = useRef(false);
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    const h = document.getElementById(headingId);
    if (h) focusHeading(h);
  }, [step, headingId]);
  const go = (s: StepKey) => {
    setTouched(true);
    if (s === step) {
      const h = document.getElementById(headingId);
      if (h) focusHeading(h);
      return;
    }
    focusPending.current = true;
    setStep(s);
  };
  const index = STEP_KEYS.indexOf(step);
  const prevStep = index > 0 ? STEP_KEYS[index - 1] : null;
  const nextStep = index < STEP_KEYS.length - 1 ? STEP_KEYS[index + 1] : null;

  // the step bar keeps the open step in sight (on a phone it scrolls sideways)
  const railId = useId();
  useEffect(() => {
    const ol = document.getElementById(railId);
    const li = ol?.querySelector('[aria-current="step"]')?.closest("li");
    if (!ol || !li) return;
    const left = li.offsetLeft;
    const right = left + li.offsetWidth;
    if (left >= ol.scrollLeft && right <= ol.scrollLeft + ol.clientWidth) return;
    ol.scrollTo({ left: Math.max(0, left - (ol.clientWidth - li.offsetWidth) / 2), behavior: reducedMotion() ? "auto" : "smooth" });
  }, [step, railId]);

  // ---------------------------------------------------------------- the address: the house can be shared and reloaded
  useEffect(() => {
    const want = searchFor(cfg, step);
    if (want === window.location.search) return;
    // (Next.js keeps its router in step with the native history API)
    window.history.replaceState(null, "", `${window.location.pathname}${want}${window.location.hash}`);
  }, [cfg, step]);

  // ---------------------------------------------------------------- the draft in this browser
  const draftRaw = useSyncExternalStore(subscribeStorage, readDraft, serverDraft);
  const draft = useMemo(() => parseDraft(draftRaw, data.facts), [draftRaw, data.facts]);
  const offerDraft = !initial.fromAddress && !touched && !draftDismissed && !!draft;
  const restoreDraft = () => {
    if (!draft) return;
    setCfg(draft.cfg);
    setSaved(draft.saved);
    go(draft.step);
  };
  const discardDraft = () => {
    setDraftDismissed(true);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* a browser without storage simply has no draft */
    }
  };
  useEffect(() => {
    if (!touched) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ v: 1, cfg, step, saved, at: Date.now() } satisfies Draft));
    } catch {
      /* private browsing or full storage: the address still holds the house */
    }
  }, [touched, cfg, step, saved]);

  // ---------------------------------------------------------------- prices set by the administrator
  useEffect(() => {
    const ctl = new AbortController();
    fetch("/api/configurator/prices", { signal: ctl.signal, headers: { accept: "application/json" } })
      .then((r) => {
        if (r.ok) return r.json();
        // (the body of an error page is not needed: let the connection go at once)
        r.body?.cancel().catch(() => undefined);
        return Promise.reject(new Error(`prices ${r.status}`));
      })
      .then((j: unknown) => {
        const c = cleanPrices(j);
        setPricing(c ? { state: "ready", ...c } : { state: "fallback", prices: {}, live: null });
      })
      .catch(() => {
        // no price list (or none reachable): every choice says "Pris på forespørsel", the plots keep the page's status
        if (!ctl.signal.aborted) setPricing({ state: "fallback", prices: {}, live: null });
      });
    return () => ctl.abort();
  }, []);

  // ---------------------------------------------------------------- what the screen reader hears when the figures change
  const line = energyLine(estimate, lang);
  const lastLine = useRef(line);
  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    if (!touched || line === lastLine.current) {
      lastLine.current = line;
      return;
    }
    lastLine.current = line;
    // after a short pause, so arrowing through a group is read once, with the figures it ends on
    const id = window.setTimeout(() => setSpoken(line), 800);
    return () => window.clearTimeout(id);
  }, [line, touched]);

  /** The link to share: this house, opened at the summary. */
  const shareUrl = () => `${window.location.origin}${window.location.pathname}${searchFor(cfg, "oppsummering")}`;
  /** The way back after logging in: this house at the summary. */
  const returnPath = () => `${window.location.pathname}${searchFor(cfg, "oppsummering")}`;

  return {
    t,
    lang,
    cfg,
    step,
    index,
    prevStep,
    nextStep,
    go,
    headingId,
    railId,
    choose,
    choosePlot,
    resetStep,
    picksIn,
    picks: Object.keys(cfg.sel).length,
    facts,
    plot,
    plotNo: plotNumber(cfg.plot),
    cards,
    card,
    releaseNote: data.releaseNote[lang],
    rows,
    total,
    prices: pricing.prices,
    pricing: pricing.state,
    estimate,
    energyLoading,
    priceModel,
    setPriceModel: (m: PriceModel) => {
      setTouched(true);
      setPriceModel(m);
    },
    spoken,
    notice,
    offerDraft,
    draft,
    restoreDraft,
    discardDraft,
    saved,
    setSaved,
    shareUrl,
    returnPath,
  };
}

export type Configurator = ReturnType<typeof useConfigurator>;
