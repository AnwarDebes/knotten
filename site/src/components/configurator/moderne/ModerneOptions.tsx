"use client";

/**
 * A catalogue step in the Moderne design: each option is a real radio group (fieldset and legend), its help text and
 * source chip under the name, and each choice a card with its colour, its note, and "Inkludert" for the standard
 * delivery or the price (or "Pris på forespørsel"). The energy step ends with what every house includes.
 */
import { useId } from "react";
import { INCLUDED } from "@/lib/configurator/catalog";
import { allowed, chosen, priceOf } from "@/lib/configurator/state";
import type { Choice, OptionDef } from "@/lib/configurator/types";
import { SOURCES, type SourceId } from "@/lib/facts";
import Src from "@/components/ui/Source";
import { applicable, modelFacadeName, optionsOf, swatchOf, type Swatch } from "../model";
import { kr } from "../text";
import type { Configurator } from "../useConfigurator";

const isSource = (s: string | undefined): s is SourceId => !!s && s in SOURCES;

export function ModerneStepOptions({ c }: { c: Configurator }) {
  return (
    <div className="mt-8 grid gap-10">
      {optionsOf(c.step).map((o) => <Group key={o.id} o={o} c={c} />)}
    </div>
  );
}

function Group({ o, c }: { o: OptionDef; c: Configurator }) {
  const { t, lang } = c;
  const id = useId();
  const ok = applicable(o, c.facts);
  const current = chosen(c.cfg, o.id, c.facts);
  const why = ok ? null : c.facts ? t.lowerNotHere(c.plotNo ?? 0) : t.lowerNeedsPlot;
  const described = [o.help ? `${id}-h` : "", why ? `${id}-w` : ""].filter(Boolean).join(" ") || undefined;
  const colour = o.kind === "colour";
  return (
    <fieldset className="cfg-m-group" aria-describedby={described}>
      <legend><h3 className="display text-[23px] leading-tight">{o.label[lang]}</h3></legend>
      {(o.help || isSource(o.source)) && (
        <p className="mt-1.5 text-[14.5px] text-ink-2 max-w-[58ch]">
          {o.help && <span id={`${id}-h`}>{o.help[lang]}</span>}
          {isSource(o.source) && <Src id={o.source} locale={lang} />}
        </p>
      )}
      {why && <p id={`${id}-w`} className="mt-2 text-[14px] panel-2 px-3.5 py-2.5 max-w-[58ch]">{why}</p>}
      <div className={colour ? "mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5" : "mt-3.5 grid gap-2.5"}>
        {o.choices.map((ch) => (
          <ChoiceCard key={ch.id} o={o} ch={ch} c={c} on={ok && current.id === ch.id} colour={colour} />
        ))}
      </div>
    </fieldset>
  );
}

function ChoiceCard({ o, ch, c, on, colour }: { o: OptionDef; ch: Choice; c: Configurator; on: boolean; colour: boolean }) {
  const { t, lang } = c;
  const can = allowed(ch, c.facts);
  const sw = swatchOf(o, ch, c.cfg.plot);
  const facade = o.id === "farge" && ch.id === "modell" ? modelFacadeName(c.cfg.plot, lang) : null;
  const note = o.id === "farge" && ch.id === "modell" ? (facade && c.plotNo ? t.modelColourOn(facade, c.plotNo) : t.modelColourVaries) : ch.note?.[lang];
  const p = ch.standard ? 0 : priceOf(c.prices, o.id, ch);
  return (
    <label className={`cfg-m-choice${colour ? " col" : ""}${on ? " on" : ""}${can ? "" : " off"}`}>
      <input type="radio" className="cfg-radio" name={`cfg-${o.id}`} value={ch.id} checked={on} disabled={!can} onChange={() => c.choose(o.id, ch.id)} />
      {colour ? <Chip sw={sw} /> : <span className="cfg-m-dot" aria-hidden />}
      <span className="grid gap-0.5 min-w-0">
        <span className="font-medium leading-snug">
          {ch.label[lang]}
          {!colour && sw && "hex" in sw && <span aria-hidden className="inline-block align-[-2px] ml-2 w-3.5 h-3.5 rounded-full border border-black/15" style={{ background: sw.hex }} />}
        </span>
        {note && <span className="text-[13.5px] text-ink-2 leading-snug">{note}</span>}
        <span className="mt-1">
          {ch.standard ? <span className="chip chip-pine">{t.included}</span> : <span className="text-[13px] text-muted">{p === null ? t.onRequest : t.plus(kr(p, lang))}</span>}
        </span>
      </span>
    </label>
  );
}

/** A paint chip: the colour, the six model colours side by side, or a neutral pattern for "as in the model". */
function Chip({ sw }: { sw: Swatch }) {
  const style =
    sw && "hex" in sw
      ? { background: sw.hex }
      : sw && "mix" in sw
        ? { background: `linear-gradient(90deg, ${sw.mix.map((h, i) => `${h} ${(i * 100) / sw.mix.length}% ${((i + 1) * 100) / sw.mix.length}%`).join(", ")})` }
        : undefined;
  return <span aria-hidden className={`cfg-m-chip${style ? "" : " plain"}`} style={style} />;
}

/** What every house includes, shown once, with the source where the project material gives one. */
export function ModerneIncluded({ c }: { c: Configurator }) {
  const { t, lang } = c;
  const id = useId();
  return (
    <section aria-labelledby={id} className="mt-10 panel-2 p-5 md:p-6">
      <h3 id={id} className="display text-[23px] leading-tight">{t.includedTitle}</h3>
      <p className="mt-1.5 text-[14.5px] text-ink-2">{t.includedIntro}</p>
      <ul className="mt-4 grid gap-3.5">
        {INCLUDED.map((i) => (
          <li key={i.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 items-start">
            <svg aria-hidden width="18" height="18" viewBox="0 0 18 18" className="mt-0.5 text-pine"><circle cx="9" cy="9" r="8.2" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M5.2 9.3l2.4 2.4 5-5.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="block">
              <span className="font-medium">{i.label[lang]}</span>
              <span className="block text-[14px] text-ink-2 mt-0.5">
                {i.note[lang]}
                {isSource(i.source) && <Src id={i.source} locale={lang} />}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
