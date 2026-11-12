import { pageTitle, portalPage } from "@/lib/server/portal";
import { readStore } from "@/lib/store";
import { ASSUMPTIONS, ASSUMPTIONS_VERSION } from "@/lib/facts";
import { KV_PREFIX, STORAGE } from "@/lib/server/kv";
import { configuredOrigin, MAIL_ON, MAIL_PROVIDER, readMailLog } from "@/lib/server/mail";
import { authSecretSource } from "@/lib/server/accounts";
import { FILES_ON, MAX_BYTES, prettySize } from "@/lib/server/files";
import { saveSettings, sendDigestNow } from "../actions";
import { saveCompany } from "./actions";
import { MODEL_ON } from "@/lib/server/assistant";
import { DAILY_LIMIT, modelCallsToday } from "@/lib/server/aiBudget";
import { formatOrgNumber } from "@/lib/server/siteSettings";
import { brregUrl } from "@/lib/content/company";
import { buildDigest } from "@/lib/server/digest";
import { ActionForm } from "@/components/portal/forms";
import Icon from "@/components/portal/Icon";
import NoAccess from "@/components/portal/NoAccess";
import { PageHead, Section, when } from "@/components/portal/ui";

export const dynamic = "force-dynamic";
export const generateMetadata = pageTitle("Innstillinger", "Settings");

/**
 * What the owner may change without a developer, the state of the services the site runs on,
 * and the figures the site is built on.
 */
export default async function Settings({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, no, session, ok } = await portalPage(params, "/admin/innstillinger", "admin");
  if (!ok) return <NoAccess locale={locale} session={session} area="admin" />;
  const { settings } = await readStore();
  // the preview is exactly what Monday's email will say, in the language chosen for it
  const digestLang = settings.digest_lang ?? "no";
  const digest = await buildDigest(digestLang);
  const cron = !!process.env.CRON_SECRET;
  const prod = process.env.NODE_ENV === "production";
  const callsToday = MODEL_ON ? await modelCallsToday() : 0;
  const co = settings.company;
  const secret = authSecretSource();
  const origin = configuredOrigin();
  const mail = await readMailLog();
  const lastFail = mail.failures[0];
  const sender = MAIL_PROVIDER === "resend" ? "Resend" : MAIL_PROVIDER === "smtp" ? "SMTP" : no ? "utboks på disk (test)" : "outbox on disk (test)";
  const turnstile = !!(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  // severe: the site loses or refuses data until it is fixed (shown in red, not amber)
  const services: { name: string; ok: boolean; severe?: boolean; state: string; how: string }[] = no
    ? [
        { name: "Lagring av data", ok: STORAGE !== "temp", severe: STORAGE === "temp", state: STORAGE === "kv" ? `Database (Redis/KV), nøkler ${KV_PREFIX}:*` : STORAGE === "file" ? "Filer på serveren (site/data)" : "Ikke satt opp: ingenting kan lagres. Skjemaene sier fra, og innlogging er ikke mulig.", how: "På Vercel: koble en Redis-database (Upstash) til prosjektet. KV_REST_API_URL og KV_REST_API_TOKEN (eller UPSTASH_REDIS_REST_URL og UPSTASH_REDIS_REST_TOKEN) settes da automatisk." },
        { name: "Innloggingsnøkkel", ok: secret === "env" || (!prod && secret === "stored"), severe: secret === "short", state: secret === "env" ? "AUTH_SECRET er satt" : secret === "short" ? "AUTH_SECRET er for kort (under 32 tegn) og brukes ikke" : "Nøkkel lagret sammen med kontoene", how: "Sett AUTH_SECRET til en lang, tilfeldig tekst på minst 32 tegn i produksjon." },
        { name: "E-post", ok: MAIL_ON && MAIL_PROVIDER !== "outbox" && !(lastFail && (!mail.last_ok || lastFail.at > mail.last_ok)), severe: !!lastFail && (!mail.last_ok || lastFail.at > mail.last_ok), state: !MAIL_ON ? "Ikke satt opp: lenker vises for kopiering" : lastFail && (!mail.last_ok || lastFail.at > mail.last_ok) ? `Sending feilet ${when(lastFail.at, locale)}: ${lastFail.error}` : `Sender med ${sender}${process.env.MAIL_FROM ? ` fra ${process.env.MAIL_FROM}` : ""}${mail.last_ok ? `, sist sendt ${when(mail.last_ok, locale)}` : ""}`, how: "Opprett en konto hos Resend og bekreft domenet (RESEND_API_KEY), eller bruk en SMTP-server (SMTP_URL), og sett MAIL_FROM. Send en prøve under for å sjekke." },
        { name: "Fillagring", ok: FILES_ON, state: FILES_ON ? `På plass, inntil ${prettySize(MAX_BYTES)} per fil` : "Ikke satt opp: opplasting er slått av", how: "På Vercel: koble en Blob-lagring til prosjektet (BLOB_READ_WRITE_TOKEN). Filene lagres private." },
        { name: "Ukentlig sammendrag og opprydding", ok: cron, state: cron ? "Planlagt (Vercel Cron): sammendrag mandag morgen, opprydding hver natt" : settings.weekly_digest ? "Ikke planlagt: verken sammendrag eller opprydding går" : "Ikke planlagt: oppryddingen går ikke", how: "Sett CRON_SECRET i Vercel (en lang, tilfeldig tekst). Tidsplanen står i vercel.json; sammendraget trenger også e-post." },
        { name: "Nettadresse i lenker", ok: !!origin || !prod, severe: prod && !origin, state: origin ?? (prod ? "Ikke satt: lenker i e-post kan ikke lages" : "Hentes fra forespørselen (bare under utvikling)"), how: "Sett SITE_URL, for eksempel https://knotten.no, så lenker i e-post alltid peker riktig." },
        { name: "Spamvern på skjemaene", ok: turnstile, state: turnstile ? "Cloudflare Turnstile er på" : "Skjult felt, tidskontroll og grenser per nettverk og adresse; Turnstile er av", how: "Sett TURNSTILE_SECRET_KEY og NEXT_PUBLIC_TURNSTILE_SITE_KEY fra en Cloudflare-konto." },
        { name: "Knotten AI", ok: true, state: MODEL_ON ? `Språkmodell på: ${callsToday} av ${DAILY_LIMIT} svar brukt i dag. Over grensen svarer Knotten AI bare fra dataene.` : "Svarer fra prosjektets data (ingen språkmodell satt opp)", how: "Grensen per dag settes med KNOTTEN_AI_DAILY_LIMIT." },
      ]
    : [
        { name: "Data storage", ok: STORAGE !== "temp", severe: STORAGE === "temp", state: STORAGE === "kv" ? `Database (Redis/KV), keys ${KV_PREFIX}:*` : STORAGE === "file" ? "Files on the server (site/data)" : "Not set up: nothing can be saved. The forms say so, and logging in is not possible.", how: "On Vercel: connect a Redis database (Upstash) to the project. KV_REST_API_URL and KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN) are then set automatically." },
        { name: "Login key", ok: secret === "env" || (!prod && secret === "stored"), severe: secret === "short", state: secret === "env" ? "AUTH_SECRET is set" : secret === "short" ? "AUTH_SECRET is too short (under 32 characters) and is not used" : "Key stored with the accounts", how: "Set AUTH_SECRET to a long random text of at least 32 characters in production." },
        { name: "Email", ok: MAIL_ON && MAIL_PROVIDER !== "outbox" && !(lastFail && (!mail.last_ok || lastFail.at > mail.last_ok)), severe: !!lastFail && (!mail.last_ok || lastFail.at > mail.last_ok), state: !MAIL_ON ? "Not set up: links are shown to copy" : lastFail && (!mail.last_ok || lastFail.at > mail.last_ok) ? `Sending failed ${when(lastFail.at, locale)}: ${lastFail.error}` : `Sending with ${sender}${process.env.MAIL_FROM ? ` from ${process.env.MAIL_FROM}` : ""}${mail.last_ok ? `, last sent ${when(mail.last_ok, locale)}` : ""}`, how: "Create a Resend account and verify the domain (RESEND_API_KEY), or use an SMTP server (SMTP_URL), and set MAIL_FROM. Send a test below to check." },
        { name: "File storage", ok: FILES_ON, state: FILES_ON ? `In place, up to ${prettySize(MAX_BYTES, false)} per file` : "Not set up: uploads are off", how: "On Vercel: connect a Blob store to the project (BLOB_READ_WRITE_TOKEN). Files are stored private." },
        { name: "Weekly summary and cleanup", ok: cron, state: cron ? "Scheduled (Vercel Cron): summary on Monday mornings, cleanup every night" : settings.weekly_digest ? "Not scheduled: neither the summary nor the cleanup runs" : "Not scheduled: the cleanup does not run", how: "Set CRON_SECRET in Vercel (a long random text). The schedule is in vercel.json; the summary also needs email." },
        { name: "Address in links", ok: !!origin || !prod, severe: prod && !origin, state: origin ?? (prod ? "Not set: links in emails cannot be made" : "Taken from the request (only during development)"), how: "Set SITE_URL, for example https://knotten.no, so links in emails always point right." },
        { name: "Spam protection on the forms", ok: turnstile, state: turnstile ? "Cloudflare Turnstile is on" : "Hidden field, time check and limits per network and address; Turnstile is off", how: "Set TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY from a Cloudflare account." },
        { name: "Knotten AI", ok: true, state: MODEL_ON ? `Language model on: ${callsToday} of ${DAILY_LIMIT} answers used today. Over the limit Knotten AI answers from the data only.` : "Answers from the project's data (no language model set up)", how: "The daily limit is set with KNOTTEN_AI_DAILY_LIMIT." },
      ];
  // what the public pages still lack before launch: listed here until it is filled in, never shown on the site itself
  const before: { label: string; done: boolean }[] = [
    { label: no ? "Organisasjonsnummer" : "Organisation number", done: !!co.org_number },
    { label: no ? "Postadresse for selskapet" : "Company postal address", done: !!co.postal_address },
    { label: no ? "E-postadresse for selskapet" : "Company email address", done: !!co.email },
    { label: no ? "Nettadresse (SITE_URL)" : "Web address (SITE_URL)", done: !!process.env.SITE_URL },
    { label: no ? "Lagring i database" : "Storage in a database", done: STORAGE === "kv" },
    { label: no ? "E-post satt opp" : "Email set up", done: MAIL_ON },
  ];
  return (
    <>
      <PageHead eyebrow={no ? "Administrasjon" : "Administration"} title={no ? "Innstillinger" : "Settings"} lede={no ? "Det du kan endre uten utvikler, tjenestene nettsiden står på, og tallene den bygger på." : "What you can change without a developer, the services the site runs on, and the figures it builds on."} />
      <div className="grid gap-6 xl:grid-cols-2 items-start">
        <Section title={no ? "Nettsiden" : "The website"}>
          <form action={saveSettings} className="panel p-5 md:p-6 grid gap-3">
            <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Statuslinje om salget (norsk)" : "Status line about the sale (Norwegian)"}</span><textarea className="input !py-2" name="release_no" rows={2} maxLength={300} defaultValue={settings.release_note.no} /></label>
            <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Statuslinje om salget (engelsk)" : "Status line about the sale (English)"}</span><textarea className="input !py-2" name="release_en" rows={2} maxLength={300} defaultValue={settings.release_note.en} /></label>
            <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "E-post for varsler om nye interessenter og henvendelser" : "Email for alerts about new leads and questions"}</span><input className="input !py-2" type="email" name="contact_email" defaultValue={settings.contact_email} /></label>
            <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Telefon" : "Phone"}</span><input className="input !py-2" name="contact_phone" defaultValue={settings.contact_phone} /></label>
            <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" name="weekly_digest" defaultChecked={settings.weekly_digest} /> {no ? "Send meg et sammendrag på e-post hver mandag morgen" : "Email me a summary every Monday morning"}</label>
            <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Språk i sammendraget" : "Language of the summary"}</span><select key={digestLang} className="input !py-2" name="digest_lang" defaultValue={digestLang}><option value="no">Norsk</option><option value="en">English</option></select></label>
            <p className="text-[12.5px] text-muted">{no ? "Statuslinjen står under overskriften på begge forsidene, på siden Status og spørsmål og på tomtesidene. Står feltet tomt, vises ingen statuslinje." : "The status line shows under the headline on both front pages, on the Status and questions page and on the plot pages. Leave it empty to show none."}</p>
            <button className="btn btn-sm justify-self-start">{no ? "Lagre" : "Save"}</button>
          </form>
        </Section>
        <Section title={no ? "Om utbygger" : "About the developer"} sub={no ? "Vises i «Om utbygger» på forsidene og siden Status og spørsmål, i bunnteksten og i personvernerklæringen. Et tomt felt vises ikke; da brukes e-post og telefon fra utlysningen." : "Shown under About the developer on the front pages and the Status and questions page, in the footer and in the privacy statement. An empty field is not shown; email and phone then come from the internship posting."}>
          <div className="panel p-5 md:p-6 grid gap-4">
            <ActionForm action={saveCompany} submit={no ? "Lagre" : "Save"} pending={no ? "Lagrer …" : "Saving …"} resetOnSuccess={false}>
              <input type="hidden" name="lang" value={locale} />
              <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Organisasjonsnummer (ni siffer)" : "Organisation number (nine digits)"}</span><input className="input !py-2" name="org_number" inputMode="numeric" autoComplete="off" defaultValue={formatOrgNumber(co.org_number)} aria-describedby="org-help" /></label>
              <p id="org-help" className="text-[12.5px] text-muted -mt-1">{no ? "Kontrolleres mot kontrollsifferet. " : "Checked against the check digit. "}{co.org_number && <a className="underline underline-offset-2" href={brregUrl(co.org_number)} target="_blank" rel="noopener noreferrer">{no ? "Se oppføringen i Brønnøysundregistrene" : "See the entry in the Brønnøysund Register"}</a>}</p>
              <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Postadresse" : "Postal address"}</span><input className="input !py-2" name="postal_address" autoComplete="off" defaultValue={co.postal_address} /></label>
              <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "E-post for selskapet" : "Company email"}</span><input className="input !py-2" type="email" name="company_email" autoComplete="off" defaultValue={co.email} /></label>
              <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Telefon for selskapet" : "Company phone"}</span><input className="input !py-2" type="tel" name="company_phone" autoComplete="off" defaultValue={co.phone} /></label>
            </ActionForm>
          </div>
        </Section>
        <Section title={no ? "Før lansering" : "Before launch"} sub={no ? "Det som mangler før nettsiden settes i drift. Nettsiden viser aldri et oppdiktet tall i stedet." : "What is missing before the site goes live. The site never shows a made-up value instead."}>
          <ul className="panel divide-y divide-[var(--line)]">
            {before.map((b) => (
              <li key={b.label} className="p-4 flex flex-wrap items-center justify-between gap-2 text-[14.5px]">
                <span>{b.label}</span>
                <span className={`chip ${b.done ? "chip-pine" : "chip-amber"}`}>{b.done ? (no ? "På plass" : "In place") : (no ? "Mangler" : "Missing")}</span>
              </li>
            ))}
          </ul>
        </Section>
        <Section title={no ? "Tjenester" : "Services"} sub={no ? "Det som må være på plass når nettsiden settes i drift. Detaljene står i README.md." : "What must be in place when the site goes live. The details are in README.md."}>
          <div className="panel divide-y divide-[var(--line)]">
            {services.map((s) => (
              <div key={s.name} className="p-4 grid gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium text-[14.5px]">{s.name}</span><span className={`chip ${s.ok ? "chip-pine" : s.severe ? "bg-[rgba(197,75,48,.14)] text-[#8a2f1d]" : "chip-amber"}`}>{s.ok ? (no ? "I orden" : "In order") : s.severe ? (no ? "Må rettes nå" : "Fix now") : (no ? "Må settes opp" : "Needs setting up")}</span></div>
                <div className={`text-[13.5px] ${s.severe ? "text-[#8a2f1d] font-medium" : "text-ink-2"}`}>{s.state}</div>
                {!s.ok && <div className="text-[13px] text-muted">{s.how}</div>}
              </div>
            ))}
          </div>
        </Section>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr] items-start">
        <Section title={no ? "Ukens sammendrag" : "This week's summary"} sub={no ? `Slik ser e-posten ut hvis den sendes nå, på ${digestLang === "en" ? "engelsk" : "norsk"}. Den går til ${settings.contact_email} mandag morgen når sammendraget er slått på.` : `This is how the email looks if sent now, in ${digestLang === "en" ? "English" : "Norwegian"}. It goes to ${settings.contact_email} on Monday mornings when the summary is switched on.`}>
          <div className="panel p-5 md:p-6 grid gap-3">
            <div className="text-[14px]"><span className="text-muted">{no ? "Emne: " : "Subject: "}</span><span className="font-medium">{digest.subject}</span></div>
            <pre className="whitespace-pre-wrap text-[13px] leading-relaxed bg-bg/70 rounded-[var(--radius)] p-4 font-mono max-h-[420px] overflow-auto">{digest.text}</pre>
            <ActionForm action={sendDigestNow} submit={no ? "Send en prøve til meg nå" : "Send a test to me now"} pending={no ? "Sender …" : "Sending …"} buttonClass="btn btn-sm btn-ghost btn-plain justify-self-start">
              <input type="hidden" name="lang" value={locale} />
            </ActionForm>
          </div>
        </Section>
        <Section title={no ? "Sikkerhetskopi" : "Backup"} sub={no ? "Alt nettsiden og portalen har lagret, som én fil: interessenter, tomter, nyheter, innstillinger, kontoer (uten passord), dokumentlisten, henvendelser, prosjektrommet, samtykker, målerdata og statistikk." : "Everything the website and portal have stored, as one file: leads, plots, news, settings, accounts (without passwords), the document list, questions, the project room, consents, meter data and statistics."}>
          <div className="panel p-5 md:p-6 grid gap-3 text-[14px]">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download from an API route, not a page */}
            <a className="btn btn-sm no-underline justify-self-start" href="/api/backup"><Icon name="download" size={16} />{no ? "Last ned sikkerhetskopi" : "Download backup"}</a>
            <p className="text-muted text-[13px]">{no ? "Ta en kopi jevnlig og oppbevar den trygt: filen inneholder personopplysninger. Selve dokumentfilene lastes ned fra Dokumenter." : "Take a copy regularly and keep it safe: the file contains personal data. The document files themselves are downloaded from Documents."}</p>
          </div>
        </Section>
      </div>
      <Section title={no ? "Tallene nettsiden bygger på" : "The figures the site is built on"} sub={`${no ? "Versjon" : "Version"} ${ASSUMPTIONS_VERSION} (${no ? "foreløpig" : "provisional"}). ${no ? "Målte tall kommer fra modellen og endres når den regnes på nytt; foreløpige tall byttes ut når rapportene fra energi- og markedssporet leveres." : "Measured figures come from the model and change when it is recomputed; provisional figures are replaced when the energy and market track reports are delivered."}`}>
        <div className="panel scroll-x relative">
          <table className="table table-tight min-w-[720px]">
            <thead><tr><th>{no ? "Hva" : "What"}</th><th className="n">{no ? "Verdi" : "Value"}</th><th>{no ? "Kilde" : "Source"}</th><th>{no ? "Dato" : "Date"}</th><th><span className="sr-only">Status</span></th></tr></thead>
            <tbody>{ASSUMPTIONS.map((a) => <tr key={a.key}><td>{a.label[locale]}</td><td className="n whitespace-nowrap">{a.value.toLocaleString(no ? "nb-NO" : "en-GB")} {a.unit[locale]}</td><td>{a.source[locale]}</td><td className="whitespace-nowrap">{a.date}</td><td className="whitespace-nowrap">{a.provisional ? <span className="chip chip-amber">{no ? "foreløpig" : "provisional"}</span> : <span className="chip chip-pine">{no ? "fastsatt" : "settled"}</span>}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
