import { AREAS, AREA_LABEL, ROLE_LABEL, type AccountRole } from "@/lib/auth-shared";
import { pageTitle, portalPage } from "@/lib/server/portal";
import { loadAuth, type Account } from "@/lib/server/accounts";
import { MAIL_ON, recentMailFailures } from "@/lib/server/mail";
import { loadPlots } from "@/lib/data";
import { readMembers } from "@/lib/server/member-store";
import { dismissResetRequest, inviteUser, promoteMember, setUserStatus, updateUser, userLink } from "../actions";
import NoAccess from "@/components/portal/NoAccess";
import { ActionForm, ConfirmButton } from "@/components/portal/forms";
import { Notice, PageHead, Section, initials, when } from "@/components/portal/ui";
import { logText } from "@/lib/logText";

export const dynamic = "force-dynamic";
export const generateMetadata = pageTitle("Brukere og tilgang", "Users and access");

const STATUS = { invited: { no: "Invitert", en: "Invited" }, active: { no: "Aktiv", en: "Active" }, disabled: { no: "Deaktivert", en: "Disabled" }, pending: { no: "Venter på bekreftelse", en: "Awaiting confirmation" } };
/** Why a request for a new password is waiting here instead of having been emailed. */
const REASON = {
  "no-mail": { no: "e-post er ikke satt opp", en: "email is not set up" },
  "mail-failed": { no: "e-posten kunne ikke sendes", en: "the email could not be sent" },
  "no-address": { no: "nettadressen (SITE_URL) mangler", en: "the site address (SITE_URL) is missing" },
};

/**
 * Who can use the portal, with which role and which areas. Administrators invite and manage users;
 * super administrators also manage administrators and see the security log. Invitations and
 * password links are emailed when email is set up, and otherwise shown once to copy.
 * Two lists: project accounts (invited into the portal) and buyer accounts (made by buyers themselves on the
 * sign-up page; they see Min side only). A buyer who moves in is made a resident of their plot.
 */
export default async function Users({ params }: { params: Promise<{ locale: string }> }) {
  const { locale, no, session, ok } = await portalPage(params, "/admin/brukere", "admin");
  if (!ok) return <NoAccess locale={locale} session={session} area="admin" />;
  // sending failures in the last week, so a link that never arrived is noticed here
  const [auth, { plots }, failed, memberRecords] = await Promise.all([loadAuth(), loadPlots(), recentMailFailures(7), readMembers().catch(() => ({}) as Awaited<ReturnType<typeof readMembers>>)]);
  const superadmin = session.role === "superadmin";
  const roles: AccountRole[] = superadmin ? ["user", "admin", "superadmin"] : ["user"];
  const order = { superadmin: 0, admin: 1, user: 2 } as const;
  const accounts = [...auth.accounts].filter((a) => a.kind !== "member").sort((a, b) => order[a.role] - order[b.role] || a.name.localeCompare(b.name));
  // buyers' own accounts, newest first
  const buyers = auth.accounts.filter((a) => a.kind === "member").sort((a, b) => b.created.localeCompare(a.created));
  const mayManage = (a: Account) => a.id !== session.id && (superadmin || a.role === "user");
  const L = { no, locale };
  return (
    <>
      <PageHead
        eyebrow={no ? "Administrasjon" : "Administration"}
        title={no ? "Brukere og tilgang" : "Users and access"}
        lede={no ? "Tre roller: bruker, administrator og superadministrator. En bruker ser bare de områdene kontoen har fått tilgang til, for eksempel datarommet for en investor eller kommunerommet for kommunen." : "Three roles: user, administrator and super administrator. A user sees only the areas they have been given, for example the data room for an investor or the municipality room for the municipality."}
      />
      {!MAIL_ON && <Notice>{no ? "E-post er ikke satt opp, så invitasjoner og passordlenker vises her for å kopieres og sendes. Med e-post (Resend eller SMTP) sendes de automatisk." : "Email is not set up, so invitations and password links are shown here to copy and send. With email (Resend or SMTP) they are sent automatically."}</Notice>}
      {MAIL_ON && failed.length > 0 && (
        <div role="status" className="rounded-[var(--radius)] px-4 py-3 text-[14px] bg-[rgba(197,75,48,.09)] text-[#8a2f1d] border border-[rgba(197,75,48,.25)]">
          {no ? `${failed.length} e-post${failed.length === 1 ? "" : "er"} kunne ikke sendes den siste uken. Den siste: «${failed[0].subject}» ${when(failed[0].at, locale)} (${failed[0].error}). Se Innstillinger.` : `${failed.length} email${failed.length === 1 ? "" : "s"} could not be sent in the last week. The latest: "${failed[0].subject}" ${when(failed[0].at, locale)} (${failed[0].error}). See Settings.`}
        </div>
      )}

      {auth.reset_requests.length > 0 && (
        <Section title={no ? "Ber om nytt passord" : "Asking for a new password"} sub={no ? "Disse har bedt om nytt passord på innloggingssiden. Lag en lenke og send den, eller avvis." : "These asked for a new password on the login page. Make a link and send it, or dismiss."}>
          <div className="panel divide-y divide-[var(--line)]">
            {auth.reset_requests.map((r) => {
              const a = auth.accounts.find((x) => x.email === r.email);
              return (
                <div key={r.email + r.at} className="p-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="text-[14.5px]">
                    <span className="font-medium">{a?.name ?? r.email}</span> <span className="text-muted">{r.email} · {when(r.at, locale)}</span>
                    {(r.reason || r.link_at) && <div className="text-[13px] text-muted mt-0.5">{[r.reason ? REASON[r.reason][locale] : "", r.link_at ? (no ? `lenke laget ${when(r.link_at, locale)}` : `link made ${when(r.link_at, locale)}`) : ""].filter(Boolean).join(" · ")}</div>}
                  </div>
                  <div className="flex flex-wrap items-start gap-3">
                    {a && mayManage(a) && (
                      <ActionForm action={userLink} submit={no ? "Lag lenke" : "Make link"} buttonClass="btn btn-sm btn-ghost btn-plain" className="grid gap-2" resetOnSuccess={false}>
                        <input type="hidden" name="id" value={a.id} /><input type="hidden" name="lang" value={locale} />
                      </ActionForm>
                    )}
                    <form action={dismissResetRequest}><input type="hidden" name="email" value={r.email} /><button className="text-[13px] text-muted hover:underline mt-2">{no ? "Avvis" : "Dismiss"}</button></form>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px] items-start">
        <Section title={no ? `Prosjektkontoer (${accounts.length})` : `Project accounts (${accounts.length})`} sub={no ? "Invitert inn i portalen av prosjektet: prosjektgruppen, investorer, kommunen, forskere og beboere." : "Invited into the portal by the project: the project group, investors, the municipality, researchers and residents."}>
          <div className="panel divide-y divide-[var(--line)]">
            {accounts.map((a) => (
              <div key={a.id} className="p-4 md:p-5 grid gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="avatar">{initials(a.name, a.email)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.name}{a.id === session.id && <span className="text-muted font-normal"> ({no ? "deg" : "you"})</span>}</div>
                    <div className="text-[13px] text-muted truncate">{a.email}{a.org ? ` · ${a.org}` : ""}</div>
                  </div>
                  <span className={`chip ${a.role === "superadmin" ? "chip-fjord" : a.role === "admin" ? "chip-fjord" : ""}`}>{ROLE_LABEL[a.role][locale]}</span>
                  <span className={`chip ${a.status === "active" ? "chip-pine" : a.status === "invited" ? "chip-amber" : ""}`}>{STATUS[a.status][locale]}</span>
                </div>
                <div className="text-[13px] text-muted">
                  {a.role === "user" ? (a.areas.length ? a.areas.map((x) => AREA_LABEL[x][locale]).join(", ") : (no ? "Ingen områder" : "No areas")) : (no ? "Alle områder" : "All areas")}
                  {a.plot && ` · ${no ? "tomt" : "plot"} ${Number(a.plot.slice(5))}`}
                  {" · "}{a.last_login ? `${no ? "sist inne" : "last in"} ${when(a.last_login, locale)}` : (no ? "aldri logget inn" : "never logged in")}
                </div>
                {mayManage(a) && (
                  <div className="flex flex-wrap items-start gap-x-5 gap-y-2 text-[13.5px]">
                    <details className="w-full sm:w-auto">
                      <summary className="cursor-pointer text-fjord list-none">{no ? "Endre rolle og tilgang" : "Change role and access"}</summary>
                      <div className="mt-3 max-w-[520px]"><AccountFields a={a} roles={roles} plots={plots.map((p) => p.id)} {...L} /></div>
                    </details>
                    {a.status !== "disabled" && (
                      <details>
                        <summary className="cursor-pointer text-fjord list-none">{a.status === "invited" ? (no ? "Ny invitasjonslenke" : "New invitation link") : (no ? "Lenke for nytt passord" : "New password link")}</summary>
                        <div className="mt-3 max-w-[520px]">
                          <ActionForm action={userLink} submit={no ? "Lag lenke" : "Make link"} buttonClass="btn btn-sm btn-ghost btn-plain">
                            <input type="hidden" name="id" value={a.id} /><input type="hidden" name="lang" value={locale} />
                            <p className="text-[13px] text-muted">{a.status === "invited" ? (no ? "Den gamle invitasjonen slutter å virke." : "The old invitation stops working.") : (no ? "Lenken gjelder i ett døgn. Passordet endres først når personen velger et nytt." : "The link lasts one day. The password only changes when the person chooses a new one.")}</p>
                          </ActionForm>
                        </div>
                      </details>
                    )}
                    <form action={setUserStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="op" value={a.status === "disabled" ? "enable" : "disable"} /><button className="text-ink-2 hover:underline">{a.status === "disabled" ? (no ? "Aktiver igjen" : "Enable again") : (no ? "Deaktiver" : "Disable")}</button></form>
                    <ConfirmButton action={setUserStatus} fields={{ id: a.id, op: "delete" }} label={no ? "Slett konto" : "Delete account"} question={no ? `Slette kontoen til ${a.name}? Dette kan ikke angres.` : `Delete ${a.name}'s account? This cannot be undone.`} className="text-[13.5px] text-amber-ink hover:underline" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
        <Section title={no ? "Inviter noen" : "Invite someone"}>
          <div className="panel p-5 md:p-6"><AccountFields roles={roles} plots={plots.map((p) => p.id)} {...L} /></div>
          <div className="panel-2 p-5 grid gap-2 text-[13.5px]">
            {(["user", "admin", "superadmin"] as const).map((r) => (
              <div key={r}><span className="font-medium">{ROLE_LABEL[r][locale]}: </span><span className="text-ink-2">{{ user: no ? "ser områdene den har fått, og kan spørre og laste ned der." : "sees the areas it has been given, and can ask and download there.", admin: no ? "ser alt, svarer på henvendelser, styrer interessenter, tomter, nyheter og brukere." : "sees everything, answers questions, runs leads, plots, news and users.", superadmin: no ? "som administrator, og styrer også administratorer og sikkerheten." : "as administrator, and also manages administrators and security." }[r]}</span></div>
            ))}
          </div>
        </Section>
      </div>

      <Section title={no ? `Kjøperkontoer (${buyers.length})` : `Buyer accounts (${buyers.length})`} sub={no ? "Kontoer kjøpere har opprettet selv på nettsiden. De ser bare Min side, aldri portalen eller dokumentene der. Når en kjøper flytter inn, gjør kontoen til beboer på tomten." : "Accounts buyers made themselves on the website. They see Min side only, never the portal or its documents. When a buyer moves in, make the account a resident of the plot."}>
        {buyers.length === 0 ? (
          <div className="panel p-5 text-[14.5px] text-ink-2">{no ? "Ingen kjøperkontoer ennå. Kjøpere oppretter dem selv på siden «Opprett konto»." : "No buyer accounts yet. Buyers make them themselves on the \"Create an account\" page."}</div>
        ) : (
          <div className="panel divide-y divide-[var(--line)]">
            {buyers.map((a) => {
              const follows = memberRecords[a.id]?.plots ?? [];
              return (
                <div key={a.id} className="p-4 md:p-5 grid gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="avatar">{initials(a.name, a.email)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{a.name}</div>
                      <div className="text-[13px] text-muted truncate">{a.email}{a.phone ? ` · ${a.phone}` : ""}</div>
                    </div>
                    <span className={`chip ${a.status === "active" ? "chip-pine" : a.status === "pending" ? "chip-amber" : ""}`}>{STATUS[a.status][locale]}</span>
                    <span className={`chip ${a.email_verified_at ? "chip-fjord" : ""}`}>{a.email_verified_at ? (no ? "E-post bekreftet" : "Email confirmed") : (no ? "E-post ikke bekreftet" : "Email not confirmed")}</span>
                  </div>
                  <div className="text-[13px] text-muted">
                    {follows.length ? `${no ? "Følger tomt" : "Follows plot"} ${follows.map((p) => Number(p.slice(5))).join(", ")}` : no ? "Følger ingen tomter" : "Follows no plots"}
                    {" · "}{no ? "opprettet" : "created"} {when(a.created, locale, false)}
                    {" · "}{a.last_login ? `${no ? "sist inne" : "last in"} ${when(a.last_login, locale)}` : (no ? "aldri logget inn" : "never logged in")}
                  </div>
                  {mayManage(a) && (
                    <div className="flex flex-wrap items-start gap-x-5 gap-y-2 text-[13.5px]">
                      {a.status === "active" && (
                        <details className="w-full sm:w-auto">
                          <summary className="cursor-pointer text-fjord list-none">{no ? "Gjør til beboer" : "Make a resident"}</summary>
                          <div className="mt-3 max-w-[420px]">
                            <ActionForm action={promoteMember} submit={no ? "Gjør til beboer" : "Make a resident"} className="grid gap-3" resetOnSuccess={false}>
                              <input type="hidden" name="id" value={a.id} /><input type="hidden" name="lang" value={locale} />
                              <label className="grid gap-1.5 text-[13.5px]">
                                <span className="font-medium text-ink-2">{no ? "Tomten som blir hjemmet" : "The plot that becomes the home"}</span>
                                <select name="plot" defaultValue={follows[0] ?? ""} className="input !py-2" required>
                                  <option value="">{no ? "Velg tomt" : "Choose a plot"}</option>
                                  {plots.map((p) => <option key={p.id} value={p.id}>{no ? "Tomt" : "Plot"} {Number(p.id.slice(5))}</option>)}
                                </select>
                              </label>
                              <p className="text-[13px] text-muted">{no ? "Kontoen blir en prosjektkonto med området Mitt hjem for tomten, og logger inn i portalen fra da av." : "The account becomes a project account with the My home area for the plot, and logs into the portal from then on."}</p>
                            </ActionForm>
                          </div>
                        </details>
                      )}
                      {a.status !== "disabled" && (
                        <details className="w-full sm:w-auto">
                          <summary className="cursor-pointer text-fjord list-none">{no ? "Lenke for passord" : "Password link"}</summary>
                          <div className="mt-3 max-w-[520px]">
                            <ActionForm action={userLink} submit={no ? "Lag lenke" : "Make link"} buttonClass="btn btn-sm btn-ghost btn-plain">
                              <input type="hidden" name="id" value={a.id} /><input type="hidden" name="lang" value={locale} />
                              <p className="text-[13px] text-muted">{no ? "Lenken gjelder i ett døgn. Når personen velger passord med den, regnes e-postadressen som bekreftet." : "The link lasts one day. When the person chooses a password with it, the email address counts as confirmed."}</p>
                            </ActionForm>
                          </div>
                        </details>
                      )}
                      <form action={setUserStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="op" value={a.status === "disabled" ? "enable" : "disable"} /><button className="text-ink-2 hover:underline">{a.status === "disabled" ? (no ? "Aktiver igjen" : "Enable again") : (no ? "Deaktiver" : "Disable")}</button></form>
                      <ConfirmButton action={setUserStatus} fields={{ id: a.id, op: "delete" }} label={no ? "Slett konto" : "Delete account"} question={no ? `Slette kjøperkontoen til ${a.name}, med fulgte tomter og lagrede hus? Interessenten i CRM beholdes. Dette kan ikke angres.` : `Delete ${a.name}'s buyer account, with followed plots and saved houses? The lead in the CRM is kept. This cannot be undone.`} className="text-[13.5px] text-amber-ink hover:underline" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {superadmin && (
        <Section title={no ? "Sikkerhetslogg" : "Security log"} sub={no ? "Innlogginger, mislykkede forsøk, invitasjoner og endringer i tilgang. De siste 60." : "Logins, failed attempts, invitations and changes of access. The last 60."}>
          <div className="panel scroll-x">
            <table className="table table-tight min-w-[560px]">
              <thead><tr><th>{no ? "Når" : "When"}</th><th>{no ? "Hvem" : "Who"}</th><th>{no ? "Hva" : "What"}</th></tr></thead>
              <tbody>{auth.audit.slice(0, 60).map((x, i) => <tr key={i}><td className="whitespace-nowrap">{when(x.at, locale)}</td><td>{logText(x.who, locale)}</td><td className={x.what.includes("mislykket") ? "text-amber-ink" : ""}>{logText(x.what, locale)}</td></tr>)}</tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  );
}

function AccountFields({ a, roles, plots, no, locale }: { a?: Account; roles: AccountRole[]; plots: string[]; no: boolean; locale: "no" | "en" }) {
  return (
    <ActionForm action={a ? updateUser : inviteUser} submit={a ? (no ? "Lagre" : "Save") : (no ? "Inviter" : "Invite")} pending={a ? undefined : (no ? "Inviterer …" : "Inviting …")} className="grid gap-3">
      <input type="hidden" name="lang" value={locale} />
      {a && <input type="hidden" name="id" value={a.id} />}
      <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Navn" : "Name"}</span><input name="name" required defaultValue={a?.name} className="input !py-2" autoComplete="off" /></label>
      {!a && <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "E-post" : "Email"}</span><input name="email" type="email" required className="input !py-2" autoComplete="off" /></label>}
      <label className="grid gap-1.5 text-[13.5px]"><span className="font-medium text-ink-2">{no ? "Firma, kommune eller institusjon" : "Company, municipality or institution"}</span><input name="org" defaultValue={a?.org} className="input !py-2" /></label>
      <label className="grid gap-1.5 text-[13.5px]">
        <span className="font-medium text-ink-2">{no ? "Rolle" : "Role"}</span>
        <select name="role" defaultValue={a?.role ?? "user"} className="input !py-2">{roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r][locale]}</option>)}</select>
      </label>
      <fieldset className="grid gap-1.5 text-[13.5px]">
        <legend className="font-medium text-ink-2 mb-1">{no ? "Områder (for brukere)" : "Areas (for users)"}</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {AREAS.map((x) => (
            <label key={x} className="flex items-start gap-2 text-[14px]"><input type="checkbox" name="areas" value={x} defaultChecked={a ? a.areas.includes(x) : false} className="mt-1" /><span>{AREA_LABEL[x][locale]}<span className="block text-[12px] text-muted">{AREA_LABEL[x].hint[locale]}</span></span></label>
          ))}
        </div>
        <span className="text-[12px] text-muted">{no ? "Administratorer har alle områder." : "Administrators have every area."}</span>
      </fieldset>
      <label className="grid gap-1.5 text-[13.5px]">
        <span className="font-medium text-ink-2">{no ? "Tomt (for beboere)" : "Plot (for residents)"}</span>
        <select name="plot" defaultValue={a?.plot ?? ""} className="input !py-2"><option value="">{no ? "Ingen" : "None"}</option>{plots.map((p) => <option key={p} value={p}>{no ? "Tomt" : "Plot"} {Number(p.slice(5))}</option>)}</select>
      </label>
      {!a && (
        <label className="grid gap-1.5 text-[13.5px]">
          <span className="font-medium text-ink-2">{no ? "Invitasjonen og lenken" : "The invitation and its link"}</span>
          <select name="link_place" defaultValue={no ? "klassisk:no" : "moderne:en"} className="input !py-2">
            <option value="klassisk:no">{no ? "På norsk, klassisk utseende" : "In Norwegian, classic design"}</option>
            <option value="moderne:no">{no ? "På norsk, moderne utseende" : "In Norwegian, modern design"}</option>
            <option value="moderne:en">{no ? "På engelsk, moderne utseende" : "In English, modern design"}</option>
          </select>
        </label>
      )}
    </ActionForm>
  );
}
