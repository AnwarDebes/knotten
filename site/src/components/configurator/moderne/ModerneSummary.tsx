"use client";

/**
 * The summary in the Moderne design: the plot, every choice with "Inkludert", a price or "Pris på forespørsel", the
 * prices kept apart (options, house, plot) with the sum of what is known, the honest notes, and the actions: share
 * the link, print, save (with an account) and send the setup to Sigve Simonsen AS.
 */
import { useId } from "react";
import Link from "next/link";
import { INCLUDED } from "@/lib/configurator/catalog";
import { CONTACT_NOTICE } from "@/lib/consent";
import { kr } from "../text";
import { picksText, priceSummary, summaryGroups } from "../summaryView";
import { authLinks, CONSENT_KEYS, consentText, splitNotice, useSave, useSend, useShare } from "../useActions";
import type { Configurator } from "../useConfigurator";

export default function ModerneSummary({ c, onPrint }: { c: Configurator; onPrint: () => void }) {
  const { t, lang, card } = c;
  const share = useShare(c);
  const saver = useSave(c);
  const money = priceSummary(c);
  const links = authLinks("moderne", lang, c.returnPath());
  const tone = card?.status === "available" ? "chip-pine" : card?.status === "reserved" ? "chip-amber" : "";
  return (
    <div className="mt-6 grid gap-5">
      {/* the actions first, so they are found without scrolling past the whole summary */}
      <div>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { saver.reset(); share.share(); }}>{t.share}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onPrint}>{t.print}</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { share.reset(); saver.save(); }} disabled={saver.state.kind === "saving"}>
            {saver.state.kind === "saving" ? `${t.saving} …` : c.saved ? t.saveAgain : t.save}
          </button>
          <a className="btn btn-sm" href="#cfg-send">{t.send}</a>
        </div>
        <div role="status" className="grid gap-2 text-[14.5px] [&:not(:empty)]:mt-3">
          {share.state.kind === "copied" && <p className="panel-2 px-4 py-2.5">{t.copied}</p>}
          {share.state.kind === "manual" && (
            <label className="panel-2 px-4 py-3 grid gap-1.5">
              <span>{t.copyBelow}</span>
              <input className="input !py-2 text-[14px]" readOnly value={share.state.url} onFocus={(e) => e.currentTarget.select()} />
            </label>
          )}
          {saver.state.kind === "saved" && (
            <p className="panel-2 px-4 py-2.5">{t.savedAs(saver.state.item.name)} <Link href={links.mine} className="underline underline-offset-4">{t.savedWhere}</Link></p>
          )}
          {saver.state.kind === "login" && (
            <div className="panel-2 px-4 py-3.5 grid gap-3">
              <p>{t.saveLogin}</p>
              <div className="flex flex-wrap gap-2.5">
                <Link className="btn btn-sm no-underline" href={links.login}>{t.login}</Link>
                <Link className="btn btn-ghost btn-sm no-underline" href={links.signup}>{t.signup}</Link>
              </div>
            </div>
          )}
          {saver.state.kind === "unavailable" && <p className="panel-2 px-4 py-2.5">{t.saveUnavailable}</p>}
          {saver.state.kind === "error" && <p className="panel-2 px-4 py-2.5">{t.saveFailed}</p>}
        </div>
      </div>

      {/* the plot */}
      <section className="panel p-5 md:p-6" aria-label={t.yourPlot}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="label">{t.yourPlot}</div>
            <div className="display text-[26px] mt-1">{card ? t.plotName(card.n) : t.noPlot}</div>
            {card && <div className="text-[14px] text-muted mt-1">{t.rowName(card.row)}, {t.metres(card.elevation)}</div>}
          </div>
          {card ? <span className={`chip ${tone}`}>{t.status(card.status)}</span> : <button type="button" className="btn btn-sm" onClick={() => c.go("tomt")}>{t.choosePlot}</button>}
        </div>
        {card && (
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 text-[14px]">
            <div><dt className="text-muted text-[12.5px]">{t.sunDecLong}</dt><dd>{t.hours(card.sunDec)}</dd></div>
            <div><dt className="text-muted text-[12.5px]">{t.seaInViewLong}</dt><dd>{card.seaDeg}°</dd></div>
            <div><dt className="text-muted text-[12.5px]">{t.openSea}</dt><dd>{card.openSea ? `${card.openSeaDeg}°` : t.noOpenSea}</dd></div>
            <div><dt className="text-muted text-[12.5px]">{t.lowerFloor}</dt><dd>{card.lowerFloor ? t.lowerYes : t.lowerNo}</dd></div>
          </dl>
        )}
      </section>

      {/* the choices */}
      <section className="panel p-5 md:p-6" aria-label={t.summaryChoices}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="display text-[23px]">{t.summaryChoices}</h3>
          <span className="text-[14px] text-muted">{t.picks(c.picks)}</span>
        </div>
        {summaryGroups(c).map((g) => (
          <div key={g.step} className="mt-5">
            <div className="flex items-baseline justify-between gap-3 border-b line pb-1.5">
              <h4 className="label !text-ink-2">{g.label}</h4>
              <button type="button" className="text-[13px] underline underline-offset-4 text-ink-2 hover:text-ink" onClick={() => c.go(g.step)}>
                {lang === "no" ? "Endre" : "Change"}<span className="sr-only"> {g.label}</span>
              </button>
            </div>
            <dl>
              {g.lines.map((l) => (
                <div key={l.option} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2.5 border-b line">
                  <dt className="text-[12.5px] text-muted col-start-1">{l.optionLabel}</dt>
                  <dd className="col-start-1 text-[15px] leading-snug">{l.choiceLabel}</dd>
                  <dd className="col-start-2 row-start-1 row-span-2 self-center text-right">
                    {l.kind === "included" ? <span className="chip chip-pine">{l.price}</span> : l.kind === "none" ? null : <span className={`text-[14px] ${l.kind === "request" ? "text-muted" : "num text-[17px]"}`}>{l.price}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      {/* the prices, apart and summed */}
      <section className="panel p-5 md:p-6" aria-label={lang === "no" ? "Pris" : "Price"}>
        <dl className="grid gap-0">
          <Row label={t.picksTotal} value={picksText(c, money)} />
          <Row label={t.house} value={money.house !== null ? kr(money.house, lang) : t.onRequest} />
          <Row label={t.plot} value={money.plot !== null ? kr(money.plot, lang) : card ? t.onRequest : t.noPlot} note={money.plot === null && card ? c.releaseNote : undefined} />
          {money.known > 0 && <Row label={t.knownSum} value={kr(money.known, lang)} strong />}
        </dl>
        <p className="mt-3 text-[14px] text-ink-2">{money.known === 0 && money.open ? t.allOnRequest : money.open ? t.restOnRequest : ""}</p>
      </section>

      {/* every house */}
      <section className="panel-2 p-5 md:p-6" aria-label={t.includedTitle}>
        <h3 className="display text-[20px]">{t.includedTitle}</h3>
        <ul className="mt-2.5 grid gap-1.5 text-[14.5px] text-ink-2">
          {INCLUDED.map((i) => <li key={i.id}>{i.label[lang]}</li>)}
        </ul>
      </section>

      {/* the honest notes */}
      <section className="grid gap-2 text-[14px] text-ink-2 max-w-[62ch]" aria-label={lang === "no" ? "Merk" : "Note"}>
        {t.honesty.map((h) => <p key={h}>{h}</p>)}
      </section>

      <Send c={c} />
    </div>
  );
}

function Row({ label, value, strong = false, note }: { label: string; value: string; strong?: boolean; note?: string }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 py-2.5 border-b line ${strong ? "!border-b-0 pt-3.5" : ""}`}>
      <dt className={strong ? "font-semibold" : "text-ink-2"}>{label}</dt>
      <dd className={`text-right ${strong ? "num text-[24px]" : ""}`}>{value}</dd>
      {note && <dd className="col-span-2 text-[13px] text-muted">{note}</dd>}
    </div>
  );
}

function Send({ c }: { c: Configurator }) {
  const { t, lang } = c;
  const id = useId();
  const s = useSend(c, "moderne");
  const [pre, link, post] = splitNotice(CONTACT_NOTICE[lang], t.privacy);
  if (s.state.kind === "sent") {
    return (
      <div id={s.doneId} tabIndex={-1} role="status" className="panel p-6 md:p-7 outline-none">
        <div className="display text-[30px]">{t.sentTitle}</div>
        <p className="mt-2 text-[15.5px] max-w-[54ch]">{t.sentText}</p>
      </div>
    );
  }
  const sending = s.state.kind === "sending";
  return (
    <section className="panel p-5 md:p-7" aria-labelledby="cfg-send">
      <h3 id="cfg-send" tabIndex={-1} className="cfg-m-heading display text-[clamp(24px,2.4vw,30px)] outline-none">{t.send}</h3>
      <p className="mt-2 text-[15px] text-ink-2 max-w-[54ch]">{t.sendIntro}</p>
      {/* (method post: before the page's script runs, a sent form never puts the email and phone in the address) */}
      <form method="post" onSubmit={s.submit} onFocus={s.onFocus} className="relative mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-[14px]">{t.name}<input className="input" name="name" autoComplete="name" required /></label>
        <label className="grid gap-1 text-[14px]">{t.email}<input className="input" name="email" type="email" autoComplete="email" required /></label>
        <label className="grid gap-1 text-[14px] sm:col-span-2">{t.phone}<input className="input" name="phone" type="tel" autoComplete="tel" /></label>
        <label className="grid gap-1 text-[14px] sm:col-span-2">
          {t.message}
          <textarea className="input" name="message" rows={4} maxLength={2000} aria-describedby={`${id}-mh`} />
          <span id={`${id}-mh`} className="text-[12.5px] text-muted">{t.messageHint}</span>
        </label>
        <fieldset className="sm:col-span-2 grid gap-2 text-[14px]">
          <legend className="label mb-1.5">{t.optional}</legend>
          {CONSENT_KEYS.map((k) => (
            <label key={k} className="flex items-start gap-2.5">
              <input type="checkbox" name={`consent_${k}`} className="mt-1 w-4 h-4 accent-[var(--fjord)] shrink-0" />
              <span>{consentText(k, lang)}</span>
            </label>
          ))}
        </fieldset>
        <p className="sm:col-span-2 provenance">
          {pre}
          {link && <Link href={`/${lang}/personvern`} className="underline underline-offset-2">{link}</Link>}
          {post}
        </p>
        <label className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden>
          {lang === "no" ? "Nettside" : "Website"}
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-amber" disabled={sending}>{sending ? `${t.sending} …` : t.sendButton}</button>
          <p role="alert" className="text-[14px] text-[#8a2f1d]">{s.state.kind === "error" ? s.state.message : ""}</p>
        </div>
      </form>
    </section>
  );
}
