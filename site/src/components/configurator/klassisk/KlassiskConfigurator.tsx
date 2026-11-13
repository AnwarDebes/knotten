"use client";

/**
 * The house configurator in the Klassisk design: a numbered strip of steps like the project's phases, the step
 * itself in the main column, and the model's picture with the energy figures in the margin, as in a printed
 * brochure. On a phone the picture comes first and the energy figures ride in a small panel at the bottom.
 * In Norwegian at /konfigurator and in English at /english/konfigurator (locale).
 */
import type { Lang } from "@/lib/configurator/types";
import { useConfigurator, type Configurator } from "../useConfigurator";
import { usePrint } from "../useActions";
import { STEP_KEYS, stepIntro, stepLabel, type ConfiguratorData, type Initial } from "../model";
import PrintSheet from "../PrintSheet";
import KlassiskView from "./KlassiskView";
import KlassiskEnergy from "./KlassiskEnergy";
import KlassiskPlots from "./KlassiskPlots";
import { KlassiskIncluded, KlassiskStepOptions } from "./KlassiskOptions";
import KlassiskSummary from "./KlassiskSummary";

export default function KlassiskConfigurator({ locale, data, initial }: { locale: Lang; data: ConfiguratorData; initial: Initial }) {
  const c = useConfigurator({ data, initial, lang: locale, design: "klassisk" });
  const printer = usePrint(c);
  const { step } = c;
  return (
    <>
      <section className="sec cfg" aria-label={c.t.title}>
        <div className="wrap cfg-grid">
          <div className="cfg-main">
            <Steps c={c} />
            {c.offerDraft && <DraftOffer c={c} />}
            <div key={step} className="cfg-step">
              <StepHead c={c} />
              {step === "tomt" ? (
                <KlassiskPlots c={c} data={data} />
              ) : step === "oppsummering" ? (
                <KlassiskSummary c={c} onPrint={printer.print} />
              ) : (
                <>
                  <KlassiskStepOptions c={c} />
                  {step === "energi" && <KlassiskIncluded c={c} />}
                </>
              )}
              <StepNav c={c} />
            </div>
            <KlassiskEnergy c={c} variant="dock" />
          </div>
          <aside className="cfg-side" aria-label={c.t.sideRegion}>
            <KlassiskView c={c} data={data} />
            <KlassiskEnergy c={c} variant="side" />
          </aside>
        </div>
      </section>
      <PrintSheet c={c} info={printer.info} />
      {/* the energy figures, read out once after a change */}
      <p className="sr" aria-live="polite">{c.spoken}</p>
    </>
  );
}

/** The steps as the project's phases are drawn: a rule over each, the whole width for the step that is open. */
function Steps({ c }: { c: Configurator }) {
  const { t } = c;
  return (
    <nav className="cfg-steps" aria-label={t.steps}>
      <ol id={c.railId}>
        {STEP_KEYS.map((s, i) => {
          const picks = s === "tomt" || s === "oppsummering" ? 0 : c.picksIn(s);
          return (
            <li key={s}>
              <button type="button" onClick={() => c.go(s)} aria-current={s === c.step ? "step" : undefined} className={i < c.index ? "done" : undefined}>
                <small>
                  {i + 1}
                  {picks > 0 && <i aria-hidden>{picks}</i>}
                </small>
                <b>{stepLabel(s, c.lang)}</b>
                {s === "tomt" && c.plotNo ? <span className="sr">, {t.plotName(c.plotNo)}</span> : null}
                {picks > 0 && <span className="sr">, {t.picks(picks)}</span>}
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
    <header className="cfg-head">
      <div className="eyebrow">{t.stepOf(c.index + 1, STEP_KEYS.length)}</div>
      <h2 id={c.headingId} tabIndex={-1}>{stepLabel(step, c.lang)}</h2>
      <p className="lede">{stepIntro(step, c.lang)}</p>
      {step !== "tomt" && step !== "oppsummering" && <PlotLine c={c} />}
      {picks > 0 && (
        <p className="cfg-picks">
          <span className="tag blue">{t.picksHere(picks)}</span>
          <button type="button" className="linkish" onClick={() => c.resetStep(step)}>{t.resetStep}</button>
        </p>
      )}
    </header>
  );
}

function PlotLine({ c }: { c: Configurator }) {
  const { t, card } = c;
  return (
    <div className="cfg-plotline">
      {card ? (
        <p>
          <span className="cfg-k">{t.yourPlot}</span> <b>{t.plotName(card.n)}</b>, {t.rowLower(card.row)}. {t.hours(card.sunDec)} {t.sunDec}, {card.seaDeg}° {t.seaInView}.
        </p>
      ) : (
        <p><b>{t.noPlot}</b> {t.noPlotHint}</p>
      )}
      <button type="button" className="linkish" onClick={() => c.go("tomt")}>{card ? t.changePlot : t.choosePlot}</button>
    </div>
  );
}

function StepNav({ c }: { c: Configurator }) {
  const { t, prevStep, nextStep } = c;
  return (
    <div className="cfg-nav">
      {prevStep ? <button type="button" className="btn ghost" onClick={() => c.go(prevStep)}>{t.back}</button> : <span />}
      {nextStep && <button type="button" className="btn" onClick={() => c.go(nextStep)}>{t.next(stepLabel(nextStep, c.lang))}</button>}
    </div>
  );
}

function DraftOffer({ c }: { c: Configurator }) {
  const { t, draft } = c;
  if (!draft) return null;
  const n = draft.cfg.plot ? Number(draft.cfg.plot.slice(5)) : null;
  const k = Object.keys(draft.cfg.sel).length;
  const what = [n ? t.plotName(n) : null, k ? t.picks(k) : null].filter(Boolean).join(", ");
  return (
    <div className="cfg-draft">
      <p>{t.draftFound(what)}</p>
      <div className="cta-row">
        <button type="button" className="btn sm" onClick={c.restoreDraft}>{t.draftContinue}</button>
        <button type="button" className="btn ghost sm" onClick={c.discardDraft}>{t.draftDiscard}</button>
      </div>
    </div>
  );
}
