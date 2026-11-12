import Link from "next/link";
import { pageTitle, portalPage } from "@/lib/server/portal";
import NoAccess from "@/components/portal/NoAccess";
import { ActionForm, ConfirmButton } from "@/components/portal/forms";
import { Empty, Notice, PageHead, Section, when } from "@/components/portal/ui";
import { OPTIONS, STEPS } from "@/lib/configurator/catalog";
import { loadPlotFacts } from "@/lib/configurator/plots.server";
import { summary } from "@/lib/configurator/state";
import { choiceCounts, configuratorPath, getPrices, listSent, pricesChanged } from "@/lib/server/configurations";
import { loadCommercial } from "@/lib/data";
import { fmt } from "@/lib/facts";
import { plotName } from "@/lib/format";
import { readStore } from "@/lib/store";
import { deleteSentConfig, savePrices } from "./actions";

export const dynamic = "force-dynamic";
export const generateMetadata = pageTitle("Husvalg og priser", "House choices and prices");

/** One price field: whole kroner, written with spaces ("4 950 000"); empty for "on request". */
function PriceInput({ id, name, value, no }: { id: string; name: string; value: number | null | undefined; no: boolean }) {
  const v = typeof value === "number" ? fmt(value, "no") : "";
  return (
    <span className="flex items-center gap-2 justify-self-end">
      <input
        key={`${name}:${v}`}
        id={id}
        name={`p:${name}`}
        defaultValue={v}
        inputMode="numeric"
        autoComplete="off"
        placeholder={no ? "på forespørsel" : "on request"}
        className="input !py-1.5 !w-[150px] !text-[14px] text-right tabular-nums"
      />
      <span className="text-[13px] text-muted" aria-hidden="true">kr</span>
    </span>
  );
}

/**
 * The house configurator for the administrator: the price list (the house's base price and every choice that is not
 * standard, by step), the configurations people have sent with a link to their lead and to the configurator with the
 * same choices, and how often each choice is taken.
 */
export default async function AdminConfigurator({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ lead?: string }> }) {
  const { locale, no, session, ok } = await portalPage(params, "/admin/konfigurator", "admin");
  if (!ok) return <NoAccess locale={locale} session={session} area="admin" />;
  const { lead: leadFilter } = await searchParams;
  const [prices, changed, sentAll, counts, store, facts, commercial] = await Promise.all([getPrices(), pricesChanged(), listSent(), choiceCounts(), readStore(), loadPlotFacts(), loadCommercial()]);
  const leads = new Map(store.leads.map((l) => [l.id, l]));
  const filtered = leadFilter ? sentAll.filter((x) => x.lead === leadFilter) : sentAll;
  const filterLead = leadFilter ? leads.get(leadFilter) : undefined;
  const kr = (n: number) => `${fmt(n, locale)} kr`;
  const base = `/${locale}/portal/admin`;
  const rows = filtered.map((s) => {
    const pf = s.config.plot ? facts[s.config.plot] ?? null : null;
    const picks = summary(s.config, locale, prices, pf).filter((r) => !r.standard);
    return {
      s,
      lead: leads.get(s.lead),
      picks,
      known: picks.reduce((a, r) => a + (r.price ?? 0), 0),
      open: picks.some((r) => r.price === null),
      plotPrice: s.config.plot ? commercial[s.config.plot]?.price_nok : undefined,
    };
  });
  const via = (s: (typeof rows)[number]["s"]) => `${s.design === "klassisk" ? (no ? "klassisk" : "classic") : (no ? "moderne" : "modern")}, ${s.locale === "no" ? (no ? "norsk" : "Norwegian") : (no ? "engelsk" : "English")}`;
  const leadLink = (r: (typeof rows)[number]) => r.lead
    ? <Link href={`${base}/interessenter?q=${encodeURIComponent(r.lead.email)}`} className="font-medium">{r.lead.name || r.lead.email}</Link>
    : <span className="text-muted">{no ? "Interessenten er slettet" : "The lead was deleted"}</span>;
  const picksText = (r: (typeof rows)[number]) => r.picks.length ? r.picks.map((x) => `${x.optionLabel}: ${x.choiceLabel}`).join("; ") : <span className="text-muted">{no ? "Standardleveranse" : "Standard delivery"}</span>;
  const priceText = (r: (typeof rows)[number], amount = "") => <><span className={amount}>{r.picks.length ? kr(r.known) : "0 kr"}</span>{r.open && <div className="text-[12px] text-muted">{no ? "+ på forespørsel" : "+ on request"}</div>}</>;
  const actions = (r: (typeof rows)[number]) => (
    <>
      <Link href={configuratorPath(r.s.config, locale)} className="btn btn-sm btn-ghost btn-plain no-underline">{no ? "Åpne" : "Open"}</Link>
      <ConfirmButton action={deleteSentConfig} fields={{ id: r.s.id }} label={no ? "Slett" : "Delete"} question={no ? "Slette dette husvalget? Interessenten blir stående." : "Delete these house choices? The lead stays."} />
    </>
  );

  return (
    <>
      <PageHead
        eyebrow={no ? "Administrasjon" : "Administration"}
        title={no ? "Husvalg og priser" : "House choices and prices"}
        lede={no
          ? "Prislisten konfiguratoren viser i begge utseender, husvalgene folk har sendt, og hva kjøperne velger. Valgene er ønsker, ikke bestillinger: pris og leveranse avtales i kontrakt."
          : "The price list the configurator shows in both designs, the house choices people have sent, and what buyers choose. The choices are wishes, not orders: price and delivery are agreed in a contract."}
        actions={<Link className="btn btn-sm btn-ghost btn-plain no-underline" href={`/${locale}/konfigurator`}>{no ? "Åpne konfiguratoren" : "Open the configurator"}</Link>}
      />

      <Section
        id="priser"
        title={no ? "Prisliste" : "Price list"}
        sub={no
          ? "Kroner inkludert mva. Et tomt felt betyr «pris på forespørsel». Standardvalgene er inkludert i grunnprisen. Bruk minus for et fradrag, for eksempel når et valg gir mindre enn standard."
          : "Kroner including VAT. An empty field means \"price on request\". The standard choices are included in the base price. Use a minus for a deduction, for example when a choice gives less than the standard."}
      >
        <ActionForm action={savePrices} submit={no ? "Lagre prislisten" : "Save the price list"} pending={no ? "Lagrer …" : "Saving …"} resetOnSuccess={false} className="grid gap-5" buttonClass="btn btn-sm justify-self-start" footer={changed ? <span className="text-[12.5px] text-muted">{no ? "Sist endret" : "Last changed"} {when(changed.at, locale)}, {changed.by}</span> : undefined}>
          <input type="hidden" name="lang" value={locale} />
          <div className="panel p-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
            <label htmlFor="p-house-base" className="grid gap-0.5">
              <span className="font-medium">{no ? "Grunnpris for huset" : "Base price of the house"}</span>
              <span className="text-[13px] text-muted">{no ? "Eksempelhuset med standardleveransen, uten tomt. Tomteprisen settes under Tomter og priser." : "The example house with the standard delivery, without the plot. The plot price is set under Plots and prices."}</span>
            </label>
            <PriceInput id="p-house-base" name="house:base" value={prices["house:base"]} no={no} />
          </div>
          <div className="grid gap-5 xl:grid-cols-2 items-start">
            {STEPS.filter((s) => s.id !== "tomt").map((step) => (
              <div key={step.id} role="group" aria-labelledby={`steg-${step.id}`} className="panel p-5 grid gap-4 content-start">
                <h3 id={`steg-${step.id}`} className="display text-[20px]">{step.label[locale]}</h3>
                {OPTIONS.filter((o) => o.step === step.id).map((o) => (
                  <div key={o.id} className="grid gap-2">
                    <div className="text-[13.5px] font-medium text-ink-2">{o.label[locale]}</div>
                    <ul className="grid gap-1.5">
                      {o.choices.map((c) => {
                        const id = `p-${o.id}-${c.id}`;
                        const text = (
                          <>
                            <span className="sr-only">{o.label[locale]}: </span>
                            {c.label[locale]}
                            {c.needs === "lowerFloorPlot" && <span className="text-[12.5px] text-muted">{no ? " (tomter med underetasje)" : " (plots with a lower floor)"}</span>}
                          </>
                        );
                        return (
                          <li key={c.id} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] items-center min-h-[40px]">
                            {c.standard ? <span className="text-[14px]">{text}</span> : <label htmlFor={id} className="text-[14px]">{text}</label>}
                            {c.standard
                              ? <span className="chip chip-pine justify-self-start sm:justify-self-end">{no ? "Inkludert" : "Included"}</span>
                              : <PriceInput id={id} name={`${o.id}:${c.id}`} value={prices[`${o.id}:${c.id}`]} no={no} />}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ActionForm>
      </Section>

      <Section
        id="sendt"
        title={no ? "Sendte husvalg" : "Sent house choices"}
        sub={no
          ? `${filtered.length} av ${sentAll.length} husvalg. Hvert husvalg er knyttet til en interessent; navn og e-post står der. «Åpne» viser konfiguratoren med de samme valgene.`
          : `${filtered.length} of ${sentAll.length} house choices. Each is linked to a lead; the name and email are kept there. "Open" shows the configurator with the same choices.`}
      >
        {leadFilter && (
          <Notice>
            {no ? "Viser husvalg fra " : "Showing house choices from "}
            <strong>{filterLead ? filterLead.name || filterLead.email : no ? "en slettet interessent" : "a deleted lead"}</strong>.{" "}
            <Link href={`${base}/konfigurator#sendt`}>{no ? "Vis alle" : "Show all"}</Link>
          </Notice>
        )}
        {filtered.length === 0 ? (
          <Empty icon="sliders" title={no ? "Ingen husvalg ennå" : "No house choices yet"}>
            {no ? "Når noen sender huset sitt fra konfiguratoren, kommer det her og på interessenten." : "When someone sends their house from the configurator, it appears here and on the lead."}
          </Empty>
        ) : (
          <>
            {/* phones: one card per house choice */}
            <ul className="grid gap-3 md:hidden">
              {rows.map((r) => (
                <li key={r.s.id} className="panel p-4 grid gap-2 text-[14px]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    {leadLink(r)}
                    <span className="text-[12.5px] text-muted">{when(r.s.at, locale)}</span>
                  </div>
                  {r.lead && <div className="text-[12.5px] text-muted break-all -mt-1">{r.lead.email}</div>}
                  <div>
                    <span className="font-medium">{r.s.config.plot ? plotName(r.s.config.plot, no) : <span className="text-muted">{no ? "Ingen tomt" : "No plot"}</span>}</span>
                    {typeof r.plotPrice === "number" && <span className="text-muted">, {kr(r.plotPrice)}</span>}
                    <span className="text-[12.5px] text-muted">. {via(r.s)}</span>
                  </div>
                  <div className="text-[13.5px]">{picksText(r)}</div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t line pt-3">
                    <div>{priceText(r, "num text-[16px]")}</div>
                    <div className="flex items-center gap-3">{actions(r)}</div>
                  </div>
                </li>
              ))}
            </ul>
            {/* wider screens: the table (relative keeps its screen-reader texts inside the scrolling box) */}
            <div className="panel scroll-x relative hidden md:block">
              <table className="table table-tight min-w-[900px]">
                <caption className="sr-only">{no ? "Sendte husvalg, nyeste først" : "Sent house choices, newest first"}</caption>
                <thead>
                  <tr>
                    <th scope="col">{no ? "Sendt" : "Sent"}</th>
                    <th scope="col">{no ? "Interessent" : "Lead"}</th>
                    <th scope="col">{no ? "Tomt" : "Plot"}</th>
                    <th scope="col">{no ? "Tilvalg" : "Options"}</th>
                    <th scope="col" className="n">{no ? "Tilvalg, kjent pris" : "Options, known price"}</th>
                    <th scope="col"><span className="sr-only">{no ? "Handlinger" : "Actions"}</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.s.id}>
                      <td className="whitespace-nowrap">{when(r.s.at, locale)}<div className="text-[12px] text-muted">{via(r.s)}</div></td>
                      <td>
                        {leadLink(r)}
                        {r.lead && <div className="text-[12px] text-muted break-all">{r.lead.email}</div>}
                      </td>
                      <td className="whitespace-nowrap">
                        {r.s.config.plot ? plotName(r.s.config.plot, no) : <span className="text-muted">{no ? "Ingen tomt" : "No plot"}</span>}
                        {typeof r.plotPrice === "number" && <div className="text-[12px] text-muted">{kr(r.plotPrice)}</div>}
                      </td>
                      <td className="text-[13.5px] max-w-[420px]">{picksText(r)}</td>
                      <td className="n whitespace-nowrap">{priceText(r)}</td>
                      <td><div className="flex flex-wrap items-center justify-end gap-3">{actions(r)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Section>

      <Section
        id="valg"
        title={no ? "Hva kjøperne velger" : "What buyers choose"}
        sub={no
          ? `Antall per valg i ${counts.sent} sendte og ${counts.saved} lagrede husvalg (lagret på Min side). Underetasjen telles bare på tomter som har en.`
          : `How often each choice is taken in ${counts.sent} sent and ${counts.saved} saved house choices (saved on My page). The lower floor counts only on plots that have one.`}
      >
        {counts.sent + counts.saved === 0 ? (
          <Empty icon="chart" title={no ? "Ingen tall ennå" : "No figures yet"}>{no ? "Tallene kommer når de første husvalgene er sendt eller lagret." : "The figures come once the first house choices are sent or saved."}</Empty>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2 items-start">
            {STEPS.filter((s) => s.id !== "tomt").map((step) => (
              <div key={step.id} className="panel p-5 grid gap-4 content-start">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="display text-[20px]">{step.label[locale]}</h3>
                  <span className="text-[12.5px] text-muted">{no ? "sendt / lagret" : "sent / saved"}</span>
                </div>
                {OPTIONS.filter((o) => o.step === step.id).map((o) => {
                  const total = o.choices.reduce((a, c) => a + (counts.counts[`${o.id}:${c.id}`]?.sent ?? 0), 0);
                  return (
                    <div key={o.id} className="grid gap-1.5">
                      <div className="text-[13.5px] font-medium text-ink-2">{o.label[locale]}</div>
                      <ul className="grid gap-1.5">
                        {o.choices.map((c) => {
                          const n = counts.counts[`${o.id}:${c.id}`] ?? { sent: 0, saved: 0 };
                          const share = total ? n.sent / total : 0;
                          return (
                            <li key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 text-[13.5px]">
                              <div className="min-w-0">
                                <div>{c.label[locale]}{c.standard && <span className="text-muted">{no ? " (standard)" : " (standard)"}</span>}</div>
                                <div className="h-[6px] mt-1 rounded-full bg-bg-2 overflow-hidden" aria-hidden="true"><div className="h-full rounded-full bg-fjord" style={{ width: `${Math.round(share * 100)}%` }} /></div>
                              </div>
                              <span className="num text-[15px] whitespace-nowrap">{n.sent}<span className="text-muted text-[13px]"> / {n.saved}</span></span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
