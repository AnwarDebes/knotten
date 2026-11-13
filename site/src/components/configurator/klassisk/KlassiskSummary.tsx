"use client";

/**
 * The summary in the Klassisk design, set like the document bank: grouped rows under small capital headings, the
 * prices kept apart with the sum of what is known, the honest notes with a rule beside them, and the Klassisk form
 * for sending the setup to Sigve Simonsen AS. The actions (share, print, save) come first.
 */
import { useId } from "react";
import Link from "next/link";
import Turnstile, { TURNSTILE_SITE_KEY } from "@/components/Turnstile";
import { INCLUDED } from "@/lib/configurator/catalog";
import { CONTACT_NOTICE } from "@/lib/consent";
import { privacyPath } from "@/lib/member-paths";
import { kr } from "../text";
import { picksText, priceSummary, summaryGroups } from "../summaryView";
import { authLinks, CONSENT_KEYS, consentText, splitNotice, useSave, useSend, useShare } from "../useActions";
import type { Configurator } from "../useConfigurator";

export default function KlassiskSummary({ c, onPrint }: { c: Configurator; onPrint: () => void }) {
  const { t, lang, card } = c;
  const share = useShare(c);
  const saver = useSave(c);
  const money = priceSummary(c);
  const links = authLinks("klassisk", lang, c.returnPath);
  return (
    <div className="cfg-summary">
      <div className="cfg-actions">
        <div className="cta-row">
          <button type="button" className="btn ghost sm" onClick={() => { saver.reset(); share.share(); }}>{t.share}</button>
          <button type="button" className="btn ghost sm" onClick={onPrint}>{t.print}</button>
          <button type="button" className="btn ghost sm" onClick={() => { share.reset(); saver.save(); }} disabled={saver.state.kind === "saving"}>
            {saver.state.kind === "saving" ? `${t.saving} …` : c.saved ? t.saveAgain : t.save}
          </button>
          <a className="btn sm" href="#cfg-send">{t.send}</a>
        </div>
        <div role="status" className="cfg-status">
          {share.state.kind === "copied" && <p className="auth-msg ok">{t.copied}</p>}
          {share.state.kind === "manual" && (
            <label className="cfg-copy">
              {t.copyBelow}
              <input readOnly value={share.state.url} onFocus={(e) => e.currentTarget.select()} />
            </label>
          )}
          {saver.state.kind === "saved" && <p className="auth-msg ok">{t.savedAs(saver.state.item.name)} <Link href={links.mine}>{t.savedWhere}</Link></p>}
          {saver.state.kind === "login" && (
            <div className="cfg-login">
              <p>{t.saveLogin}</p>
              <div className="cta-row">
                <Link className="btn sm" href={links.login}>{t.login}</Link>
                <Link className="btn ghost sm" href={links.signup}>{t.signup}</Link>
              </div>
            </div>
          )}
          {saver.state.kind === "unavailable" && <p className="auth-msg err">{t.saveUnavailable}</p>}
          {saver.state.kind === "error" && <p className="auth-msg err">{t.saveFailed}</p>}
        </div>
      </div>

      <section className="cfg-block" aria-label={t.yourPlot}>
        <h3>{t.yourPlot}</h3>
        {card ? (
          <dl className="kv">
            <div><dt>{t.plot}</dt><dd>{t.plotName(card.n)}, {t.rowLower(card.row)}, {t.metres(card.elevation)}</dd></div>
            <div><dt>{t.sunDecLong}</dt><dd>{t.hours(card.sunDec)}</dd></div>
            <div><dt>{t.seaInViewLong}</dt><dd>{card.seaDeg}°{card.openSea ? `, ${t.openSeaDeg(card.openSeaDeg)}` : ""}</dd></div>
            <div><dt>{t.lowerFloor}</dt><dd>{card.lowerFloor ? t.lowerYes : t.lowerNo}</dd></div>
            <div><dt>Status</dt><dd>{t.status(card.status)}{card.price !== null ? `, ${kr(card.price, lang)}` : ""}</dd></div>
          </dl>
        ) : (
          <p className="cfg-plotline"><span>{t.noPlot}</span> <button type="button" className="linkish" onClick={() => c.go("tomt")}>{t.choosePlot}</button></p>
        )}
      </section>

      <section className="cfg-block" aria-label={t.summaryChoices}>
        <div className="cfg-block-head">
          <h3>{t.summaryChoices}</h3>
          <span className="small">{t.picks(c.picks)}</span>
        </div>
        <div className="cfg-sum">
          {summaryGroups(c).map((g) => (
            <div key={g.step}>
              <div className="grp">
                <span>{g.label}</span>
                <button type="button" className="linkish" onClick={() => c.go(g.step)}>{lang === "no" ? "Endre" : "Change"}<span className="sr"> {g.label}</span></button>
              </div>
              <dl>
                {g.lines.map((l) => (
                  <div key={l.option} className="row">
                    <dt>{l.optionLabel}</dt>
                    <dd>{l.choiceLabel}</dd>
                    <dd className="p">{l.kind === "included" ? <span className="tag green">{l.price}</span> : l.kind === "none" ? null : <span className={l.kind === "request" ? "small" : "num"}>{l.price}</span>}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="cfg-block cfg-money" aria-label={lang === "no" ? "Pris" : "Price"}>
        <dl>
          <div><dt>{t.picksTotal}</dt><dd>{picksText(c, money)}</dd></div>
          <div><dt>{t.house}</dt><dd>{money.house !== null ? kr(money.house, lang) : t.onRequest}</dd></div>
          <div>
            <dt>{t.plot}</dt>
            <dd>{money.plot !== null ? kr(money.plot, lang) : card ? t.onRequest : t.noPlot}{money.plot === null && card ? <small>{c.releaseNote}</small> : null}</dd>
          </div>
          {money.known > 0 && <div className="sum"><dt>{t.knownSum}</dt><dd>{kr(money.known, lang)}</dd></div>}
        </dl>
        <p className="small">{money.known === 0 && money.open ? t.allOnRequest : money.open ? t.restOnRequest : ""}</p>
      </section>

      <section className="cfg-block" aria-label={t.includedTitle}>
        <h3>{t.includedTitle}</h3>
        <ul className="cfg-inc">
          {INCLUDED.map((i) => <li key={i.id}>{i.label[lang]}</li>)}
        </ul>
      </section>

      <section className="cfg-notes" aria-label={lang === "no" ? "Merk" : "Note"}>
        {t.honesty.map((h) => <p key={h}>{h}</p>)}
      </section>

      <Send c={c} />
    </div>
  );
}

function Send({ c }: { c: Configurator }) {
  const { t, lang } = c;
  const id = useId();
  const s = useSend(c, "klassisk");
  const [pre, link, post] = splitNotice(CONTACT_NOTICE[lang], t.privacy);
  if (s.state.kind === "sent") {
    return (
      <div id={s.doneId} tabIndex={-1} role="status" className="cfg-done">
        <div className="eyebrow">{t.sentTitle}</div>
        <p className="lede">{t.sentText}</p>
      </div>
    );
  }
  const sending = s.state.kind === "sending";
  return (
    <section className="cfg-send" aria-labelledby="cfg-send">
      <h3 id="cfg-send" tabIndex={-1}>{t.send}</h3>
      <p className="small">{t.sendIntro}</p>
      {/* (method post: before the page's script runs, a sent form never puts the email and phone in the address) */}
      <form className="form" method="post" onSubmit={s.submit} onFocus={s.onFocus}>
        <label>{t.name}<input type="text" name="name" autoComplete="name" required /></label>
        <label>{t.email}<input type="email" name="email" autoComplete="email" required /></label>
        <label className="full">{t.phone}<input type="tel" name="phone" autoComplete="tel" /></label>
        <label className="full">
          {t.message}
          <textarea name="message" rows={4} maxLength={2000} aria-describedby={`${id}-mh`} />
          <span id={`${id}-mh`} className="small">{t.messageHint}</span>
        </label>
        <fieldset className="full cfg-consents">
          <legend>{t.optional}</legend>
          {CONSENT_KEYS.map((k) => (
            <label key={k} className="consent">
              <input type="checkbox" name={`consent_${k}`} />
              <span className="small">{consentText(k, lang)}</span>
            </label>
          ))}
        </fieldset>
        {TURNSTILE_SITE_KEY ? <div className="full"><Turnstile locale={lang} onToken={s.onToken} /></div> : null}
        <p className="full small">
          {pre}
          {link && <Link href={privacyPath("klassisk", lang)}>{link}</Link>}
          {post}
        </p>
        <label className="sr" aria-hidden>{lang === "no" ? "Nettside" : "Website"}<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
        <div className="full cta-row">
          <button className="btn" type="submit" disabled={sending}>{sending ? `${t.sending} …` : t.sendButton}</button>
          <span role="alert" className="small no">{s.state.kind === "error" ? s.state.message : ""}</span>
        </div>
      </form>
    </section>
  );
}
