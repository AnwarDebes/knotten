"use client";

/**
 * The house configurator in the Moderne design. On a computer the 3D view and the energy figures stay in view on
 * the left while the steps run on the right; on a phone the view comes first (a still until the visitor asks for
 * 3D), the steps follow with a step bar, and the energy figures ride in a small panel at the bottom.
 */
import type { Locale } from "@/lib/i18n";
import { useConfigurator, type Configurator } from "../useConfigurator";
import { usePrint } from "../useActions";
import { STEP_KEYS, stepIntro, stepLabel, type ConfiguratorData, type Initial } from "../model";
import PrintSheet from "../PrintSheet";
import ModerneView from "./ModerneView";
import ModerneEnergy from "./ModerneEnergy";
import ModernePlots from "./ModernePlots";
import { ModerneIncluded, ModerneStepOptions } from "./ModerneOptions";
import ModerneSummary from "./ModerneSummary";

export default function ModerneConfigurator({ locale, data, initial }: { locale: Locale; data: ConfiguratorData; initial: Initial }) {
  const c = useConfigurator({ data, initial, lang: locale, design: "moderne" });
  const printer = usePrint(c);
  const { step } = c;
  return (
    <>
      <section className="cfg-m wrap pb-16 md:pb-24" aria-label={c.t.title}>
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,1fr)] items-start">
          <div className="grid gap-3 lg:sticky lg:top-[calc(var(--nav-h)+16px)]">
            <ModerneView c={c} data={data} />
            <ModerneEnergy c={c} variant="side" />
          </div>
          <div className="min-w-0">
            <Rail c={c} />
            {c.offerDraft && <DraftOffer c={c} />}
            <div key={step} className="rise-in">
              <StepHead c={c} />
              {step === "tomt" ? (
                <ModernePlots c={c} data={data} />
              ) : step === "oppsummering" ? (
                <ModerneSummary c={c} onPrint={printer.print} />
              ) : (
                <>
                  <ModerneStepOptions c={c} />
                  {step === "energi" && <ModerneIncluded c={c} />}
                </>
              )}
              <StepNav c={c} />
            </div>
            <ModerneEnergy c={c} variant="dock" />
          </div>
        </div>
      </section>
      <PrintSheet c={c} info={printer.info} />
      {/* the energy figures, read out once after a change (the panels themselves are not live regions) */}
      <p className="sr-only" aria-live="polite">{c.spoken}</p>
    </>
  );
}

/** The seven steps as a rail: the current one in ink, the ones behind in fjord blue; any step can be opened. */
function Rail({ c }: { c: Configurator }) {
  return (
    <nav aria-label={c.t.steps} className="cfg-m-rail sticky top-[var(--nav-h)] z-20">
      <ol id={c.railId}>
        {STEP_KEYS.map((s, i) => {
          const on = s === c.step;
          const picks = s === "tomt" || s === "oppsummering" ? 0 : c.picksIn(s);
          return (
            <li key={s}>
              <button type="button" onClick={() => c.go(s)} aria-current={on ? "step" : undefined} className={on ? "on" : i < c.index ? "done" : undefined}>
                <span className="n" aria-hidden>{i + 1}</span>
                <span>{stepLabel(s, c.lang)}</span>
                {s === "tomt" && c.plotNo ? <span className="sr-only">, {c.t.plotName(c.plotNo)}</span> : null}
                {picks > 0 && <span className="pk"><span aria-hidden>{picks}</span><span className="sr-only">, {c.t.picks(picks)}</span></span>}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepHead({ c }: { c: Configurator }) {
  const { t, step } = c;
  const picks = step === "tomt" || step === "oppsummering" ? 0 : c.picksIn(step);
  return (
    <header className="pt-7 md:pt-9">
      <div className="label">{t.stepOf(c.index + 1, STEP_KEYS.length)}</div>
      <h2 id={c.headingId} tabIndex={-1} className="cfg-m-heading display text-[clamp(30px,3.4vw,46px)] mt-2 outline-none">{stepLabel(step, c.lang)}</h2>
      <p className="lede mt-3 max-w-[52ch]">{stepIntro(step, c.lang)}</p>
      {step !== "tomt" && step !== "oppsummering" && <PlotLine c={c} />}
      {picks > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[14px]">
          <span className="chip chip-fjord">{t.picksHere(picks)}</span>
          <button type="button" className="underline underline-offset-4 text-ink-2 hover:text-ink" onClick={() => c.resetStep(step)}>{t.resetStep}</button>
        </div>
      )}
    </header>
  );
}

/** The chosen plot in one line on every step after the first, with the way back to change it. */
function PlotLine({ c }: { c: Configurator }) {
  const { t, card } = c;
  return (
    <div className="mt-5 panel-2 px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14.5px]">
      {card ? (
        <>
          <span><span className="label mr-2">{t.yourPlot}</span><b className="font-semibold">{t.plotName(card.n)}</b>, {t.rowLower(card.row)}</span>
          <span className="text-ink-2">{t.hours(card.sunDec)} {t.sunDec}, {card.seaDeg}° {t.seaInView}</span>
          <button type="button" className="ml-auto underline underline-offset-4 text-ink-2 hover:text-ink" onClick={() => c.go("tomt")}>{t.changePlot}</button>
        </>
      ) : (
        <>
          <span><b className="font-semibold">{t.noPlot}</b> <span className="text-ink-2">{t.noPlotHint}</span></span>
          <button type="button" className="ml-auto underline underline-offset-4 text-ink-2 hover:text-ink" onClick={() => c.go("tomt")}>{t.choosePlot}</button>
        </>
      )}
    </div>
  );
}

function StepNav({ c }: { c: Configurator }) {
  const { t, prevStep, nextStep } = c;
  return (
    <div className="mt-10 pt-6 border-t line flex flex-wrap items-center justify-between gap-3">
      {prevStep ? <button type="button" className="btn btn-ghost" onClick={() => c.go(prevStep)}>{t.back}</button> : <span />}
      {nextStep && <button type="button" className="btn" onClick={() => c.go(nextStep)}>{t.next(stepLabel(nextStep, c.lang))}</button>}
    </div>
  );
}

/** A setup from an earlier visit: the visitor chooses to go on with it or to start afresh (nothing jumps by itself). */
function DraftOffer({ c }: { c: Configurator }) {
  const { t, draft } = c;
  if (!draft) return null;
  const n = draft.cfg.plot ? Number(draft.cfg.plot.slice(5)) : null;
  const k = Object.keys(draft.cfg.sel).length;
  const what = [n ? t.plotName(n) : null, k ? t.picks(k) : null].filter(Boolean).join(", ");
  return (
    <div className="mt-5 panel-2 p-4 flex flex-wrap items-center gap-3">
      <p className="text-[15px] mr-auto">{t.draftFound(what)}</p>
      <button type="button" className="btn btn-sm" onClick={c.restoreDraft}>{t.draftContinue}</button>
      <button type="button" className="btn btn-sm btn-ghost" onClick={c.discardDraft}>{t.draftDiscard}</button>
    </div>
  );
}
