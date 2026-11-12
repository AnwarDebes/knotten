"use client";

/**
 * A catalogue step in the Klassisk design: each option a radio group (fieldset, its name as the legend), the help
 * text and the "Kilde" chip, and the choices as cards: round paint samples for colours, a ring for the rest,
 * "Inkludert" for the standard delivery and the price, or "Pris på forespørsel", for the others.
 */
import { useId } from "react";
import { INCLUDED } from "@/lib/configurator/catalog";
import { allowed, chosen, priceOf } from "@/lib/configurator/state";
import type { Choice, OptionDef } from "@/lib/configurator/types";
import { SOURCES, type SourceId } from "@/lib/facts";
import { Src } from "@/components/klassisk/Source";
import { applicable, modelFacadeName, optionsOf, swatchOf, type Swatch } from "../model";
import { kr } from "../text";
import type { Configurator } from "../useConfigurator";

const isSource = (s: string | undefined): s is SourceId => !!s && s in SOURCES;

export function KlassiskStepOptions({ c }: { c: Configurator }) {
  return (
    <div className="cfg-options">
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
    <fieldset className="cfg-group" aria-describedby={described}>
      <legend><h3>{o.label[lang]}</h3></legend>
      {(o.help || isSource(o.source)) && (
        <p className="small cfg-help">
          {o.help && <span id={`${id}-h`}>{o.help[lang]}</span>}
          {isSource(o.source) && <Src id={o.source} label={lang === "no" ? "Kilde" : "Source"} />}
        </p>
      )}
      {why && <p id={`${id}-w`} className="cfg-msg">{why}</p>}
      <div className={colour ? "cfg-choices col" : "cfg-choices"}>
        {o.choices.map((ch) => (
          <Option key={ch.id} o={o} ch={ch} c={c} on={ok && current.id === ch.id} colour={colour} />
        ))}
      </div>
    </fieldset>
  );
}

function Option({ o, ch, c, on, colour }: { o: OptionDef; ch: Choice; c: Configurator; on: boolean; colour: boolean }) {
  const { t, lang } = c;
  const can = allowed(ch, c.facts);
  const sw = swatchOf(o, ch, c.cfg.plot);
  const facade = o.id === "farge" && ch.id === "modell" ? modelFacadeName(c.cfg.plot, lang) : null;
  const note = o.id === "farge" && ch.id === "modell" ? (facade && c.plotNo ? t.modelColourOn(facade, c.plotNo) : t.modelColourVaries) : ch.note?.[lang];
  const p = ch.standard ? 0 : priceOf(c.prices, o.id, ch);
  return (
    <label className={`cfg-opt${on ? " sel" : ""}${can ? "" : " off"}`}>
      <input type="radio" className="cfg-radio" name={`cfg-${o.id}`} value={ch.id} checked={on} disabled={!can} onChange={() => c.choose(o.id, ch.id)} />
      {colour ? <Sample sw={sw} /> : <span className="cfg-ring" aria-hidden />}
      <span className="cfg-opt-t">
        <span className="cfg-opt-l">
          {ch.label[lang]}
          {!colour && sw && "hex" in sw && <span aria-hidden className="cfg-dot" style={{ background: sw.hex }} />}
        </span>
        {note && <span className="m">{note}</span>}
        {ch.standard ? <span className="tag green">{t.included}</span> : <span className="m cfg-price">{p === null ? t.onRequest : t.plus(kr(p, lang))}</span>}
      </span>
    </label>
  );
}

/** A round paint sample: the colour, the six model colours in turn, or a quiet pattern for "as in the model". */
function Sample({ sw }: { sw: Swatch }) {
  const style =
    sw && "hex" in sw
      ? { background: sw.hex }
      : sw && "mix" in sw
        ? { background: `conic-gradient(${sw.mix.map((h, i) => `${h} ${(i * 360) / sw.mix.length}deg ${((i + 1) * 360) / sw.mix.length}deg`).join(", ")})` }
        : undefined;
  return <span aria-hidden className={`cfg-sample${style ? "" : " plain"}`} style={style} />;
}

export function KlassiskIncluded({ c }: { c: Configurator }) {
  const { t, lang } = c;
  const id = useId();
  return (
    <section className="cfg-included" aria-labelledby={id}>
      <h3 id={id}>{t.includedTitle}</h3>
      <p className="small">{t.includedIntro}</p>
      <ul>
        {INCLUDED.map((i) => (
          <li key={i.id}>
            <b>{i.label[lang]}</b>
            <span>
              {i.note[lang]}
              {isSource(i.source) && <Src id={i.source} label={lang === "no" ? "Kilde" : "Source"} />}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
