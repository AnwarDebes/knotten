"use server";
import { revalidatePath } from "next/cache";
import { actor, type Session } from "@/lib/auth";
import { AREAS, type AccountRole, type Area } from "@/lib/auth-shared";
import { KPI_KEYS, LEAD_STATUSES, PLOT_STATUSES, newId, readStore, updateStore, type KpiTargets, type LeadStatus, type PlotStatus } from "@/lib/store";
import { buildDigest } from "@/lib/server/digest";
import { audit, changeAuth, findByEmail, findById, issueLink, linkUrl, loadAuth, newAccountId } from "@/lib/server/accounts";
import { linkMail, memberResetMail } from "@/lib/server/emails";
import { deleteMemberData } from "@/lib/server/member-store";
import { isStorageUnavailable } from "@/lib/server/kv";
import { MAIL_ON, sendMail, siteOrigin } from "@/lib/server/mail";
import { problemOf, STORAGE_MESSAGE } from "@/lib/errors";
import type { Design } from "@/lib/design";

/** The administration: leads, plots, news, settings, and who may use the portal. */
export type AdminState = { error?: string; ok?: string; link?: string } | undefined;

const str = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
const en = (fd: FormData) => fd.get("lang") === "en";
const say = (fd: FormData, no: string, eng: string) => (en(fd) ? eng : no);
const done = () => revalidatePath("/", "layout");
const by = (s: Session) => s.name || s.email;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PLOT_ID = /^plot-\d{2}$/;
/** A real calendar date as yyyy-mm-dd (pages format these dates, and an impossible one would break them). */
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

// ------------------------------------------------------------------ leads
export async function setLeadStatus(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id"), status = str(fd, "status") as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) return;
  await updateStore(by(s), `interessent ${id}: ${status}`, (st) => {
    const l = st.leads.find((x) => x.id === id);
    if (!l) return;
    if (l.status === "new" && status !== "new" && !l.replied) l.replied = new Date().toISOString();
    l.status = status;
  });
  done();
}

export async function addLeadNote(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id"), text = str(fd, "text", 1000);
  if (!text) return;
  await updateStore(by(s), `notat på ${id}`, (st) => {
    const l = st.leads.find((x) => x.id === id);
    if (!l) return;
    l.notes.push({ at: new Date().toISOString(), by: by(s), text });
    l.replied ??= new Date().toISOString();
  });
  done();
}

/** Suppliers, job seekers and spam stay in the list but are left out of the figures. */
export async function toggleExcluded(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id");
  await updateStore(by(s), `interessent ${id}: telles/telles ikke`, (st) => { const l = st.leads.find((x) => x.id === id); if (l) l.excluded = !l.excluded; });
  done();
}

export async function deleteLead(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id");
  await updateStore(by(s), `slettet interessent ${id}`, (st) => { st.leads = st.leads.filter((x) => x.id !== id); });
  done();
}

export async function addLead(fd: FormData) {
  const s = await actor();
  const email = str(fd, "email", 200);
  if (!EMAIL.test(email)) return;
  const purpose = str(fd, "purpose") as "buy" | "invest" | "partner" | "curious";
  const at = new Date().toISOString();
  const note = str(fd, "note", 1000);
  await updateStore(by(s), `la inn interessent ${email}`, (st) => {
    // no consents: nobody ticked a box here (the person can give them later, and the log shows who gave what)
    st.leads.push({ id: newId("lead"), name: str(fd, "name", 120), email, phone: str(fd, "phone", 40), purpose: ["buy", "invest", "partner", "curious"].includes(purpose) ? purpose : "curious", plots: str(fd, "plots", 200).split(/[\s,]+/).filter((p) => /^(plot-)?\d{1,2}$/.test(p)).map((p) => (p.startsWith("plot-") ? p : `plot-${p.padStart(2, "0")}`)), consent_updates: false, consent_investor: false, consent_research: false, consent_log: [], source: "admin", created: at, last_contact: at, status: "contacted", replied: at, notes: note ? [{ at, by: by(s), text: note }] : [] });
  });
  done();
}

export async function removeExamples() {
  const s = await actor();
  await updateStore(by(s), "eksempelinteressenter fjernet", (st) => { st.leads = st.leads.filter((x) => x.source !== "eksempel"); });
  done();
}

// ------------------------------------------------------------------ plots
export async function savePlot(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id"), status = str(fd, "status") as PlotStatus;
  if (!PLOT_STATUSES.includes(status) || !PLOT_ID.test(id)) return;
  const price = Number(String(fd.get("price_nok") ?? "").replace(/[^\d]/g, ""));
  await updateStore(by(s), `tomt ${id}: ${status}${price ? `, ${price} kr` : ""}`, (st) => {
    st.plots[id] = { id, status, price_nok: price || undefined, note: str(fd, "note", 300) || undefined, updated: new Date().toISOString() };
  });
  done();
}

export async function setAllPlots(fd: FormData) {
  const s = await actor();
  const status = str(fd, "status") as PlotStatus;
  const ids = str(fd, "ids", 4000).split(",").map((x) => x.trim()).filter((x) => PLOT_ID.test(x));
  if (!PLOT_STATUSES.includes(status)) return;
  await updateStore(by(s), `alle tomter: ${status}`, (st) => {
    for (const id of ids) st.plots[id] = { ...(st.plots[id] ?? { id }), id, status, updated: new Date().toISOString() };
  });
  done();
}

// ------------------------------------------------------------------ news
export async function saveNews(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id") || newId("n");
  const date = str(fd, "date", 10);
  const item = { id, date: isDate(date) ? date : new Date().toISOString().slice(0, 10), title: { no: str(fd, "title_no", 160), en: str(fd, "title_en", 160) }, text: { no: str(fd, "text_no", 2000), en: str(fd, "text_en", 2000) }, published: fd.get("published") === "on" };
  if (!item.title.no && !item.title.en) return;
  if (!item.title.en) item.title.en = item.title.no;
  if (!item.title.no) item.title.no = item.title.en;
  if (!item.text.en) item.text.en = item.text.no;
  if (!item.text.no) item.text.no = item.text.en;
  await updateStore(by(s), `nyhet: ${item.title.no}`, (st) => {
    const i = st.news.findIndex((n) => n.id === id);
    if (i >= 0) st.news[i] = item; else st.news.unshift(item);
    st.news.sort((a, b) => b.date.localeCompare(a.date));
  });
  done();
}

export async function toggleNews(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id");
  await updateStore(by(s), `nyhet vist/skjult ${id}`, (st) => { const n = st.news.find((x) => x.id === id); if (n) n.published = !n.published; });
  done();
}

export async function deleteNews(fd: FormData) {
  const s = await actor();
  const id = str(fd, "id");
  await updateStore(by(s), `nyhet slettet ${id}`, (st) => { st.news = st.news.filter((x) => x.id !== id); });
  done();
}

// ------------------------------------------------------------------ settings and targets
export async function saveSettings(fd: FormData) {
  const s = await actor();
  // notifications go to this address: one that cannot be an address keeps the one saved before
  const email = str(fd, "contact_email", 200);
  await updateStore(by(s), "innstillinger lagret", (st) => {
    st.settings = { ...st.settings, release_note: { no: str(fd, "release_no", 300), en: str(fd, "release_en", 300) }, contact_email: EMAIL.test(email) ? email : st.settings.contact_email, contact_phone: str(fd, "contact_phone", 40), weekly_digest: fd.get("weekly_digest") === "on", digest_lang: str(fd, "digest_lang") === "en" ? "en" : "no" };
  });
  done();
}

/** Send this week's summary now, to check how it looks in the inbox. */
export async function sendDigestNow(_: AdminState, fd: FormData): Promise<AdminState> {
  await actor();
  if (!MAIL_ON) return { error: say(fd, "E-post er ikke satt opp ennå (RESEND_API_KEY eller SMTP_URL, og MAIL_FROM). Forhåndsvisningen over viser innholdet.", "Email is not set up yet (RESEND_API_KEY or SMTP_URL, and MAIL_FROM). The preview above shows the content.") };
  const { settings } = await readStore();
  const lang = settings.digest_lang ?? "no";
  const d = await buildDigest(lang);
  const sent = await sendMail(settings.contact_email, `${lang === "en" ? "[Test]" : "[Prøve]"} ${d.subject}`, d.text);
  return sent.ok ? { ok: say(fd, `Sendt til ${settings.contact_email}.`, `Sent to ${settings.contact_email}.`) } : { error: say(fd, `Sendingen feilet: ${sent.error ?? "ukjent feil"}. Sjekk e-postoppsettet.`, `Sending failed: ${sent.error ?? "unknown error"}. Check the email setup.`) };
}

/** The owner's targets for the success criteria; an empty field means "not set yet". */
export async function saveTargets(fd: FormData) {
  const s = await actor();
  const kpi: KpiTargets = {};
  for (const k of KPI_KEYS) {
    const v = Number(str(fd, k, 20).replace(",", "."));
    if (str(fd, k) && Number.isFinite(v) && v >= 0) kpi[k] = v;
  }
  await updateStore(by(s), "mål for nøkkeltall lagret", (st) => { st.settings.kpi = kpi; });
  done();
}

// ------------------------------------------------------------------ users and access
/**
 * Who may manage whom: administrators manage users; super administrators also manage
 * administrators and other super administrators. Nobody changes their own role or locks
 * themselves out, and there is always at least one active super administrator.
 */
function mayManage(me: Session, target: { role: AccountRole }, newRole?: AccountRole) {
  if (me.role === "superadmin") return true;
  return target.role === "user" && (!newRole || newRole === "user");
}

function areasFrom(fd: FormData): Area[] {
  return fd.getAll("areas").map(String).filter((a): a is Area => (AREAS as readonly string[]).includes(a));
}

/** The answer to show when the acting person may not do this, or nothing can be saved; anything else is thrown on. */
function refused(e: unknown, fd: FormData): AdminState {
  const p = problemOf(e);
  if (p === "preview") return { error: say(fd, "Forhåndsvisning: endringer er slått av. Avslutt forhåndsvisningen øverst.", "Preview: changes are switched off. End the preview at the top.") };
  if (p === "forbidden") return { error: say(fd, "Du har ikke tilgang til å gjøre dette.", "You do not have access to do this.") };
  if (isStorageUnavailable(e)) return { error: STORAGE_MESSAGE[en(fd) ? "en" : "no"] };
  throw e;
}

/**
 * Which page the link opens and which language the email is in: the choice in the form ("klassisk:no",
 * "moderne:no", "moderne:en"), else the design and language of the person's last login, else Klassisk in the
 * administrator's language (Klassisk is Norwegian, so an English link opens the Moderne page).
 */
function linkPlace(fd: FormData, account?: { design?: Design; lang?: "no" | "en"; prefs?: { design: Design; lang: "no" | "en" } }) {
  const [d, l] = str(fd, "link_place", 20).split(":");
  // a buyer's own choice on Min side comes first, then the last login
  const design: Design = d === "klassisk" || d === "moderne" ? d : account?.prefs?.design ?? account?.design ?? "klassisk";
  const locale: "no" | "en" = l === "en" || l === "no" ? l : account?.prefs?.lang ?? account?.lang ?? (en(fd) ? "en" : "no");
  return { design: locale === "en" ? "moderne" : design, locale };
}

async function linkFor(uid: string, kind: "invite" | "reset", me: Session, place: { design: Design; locale: "no" | "en" }) {
  const { token, hours } = await issueLink(uid, kind, me.email, place);
  // without the site's address (SITE_URL in production) the link is a path; the administrator adds the address
  return { url: linkUrl(await siteOrigin(), token, place.design, place.locale), hours };
}

/** The email in the language of the link it carries. */
async function mailLink(to: string, locale: "no" | "en", kind: "invite" | "reset", name: string, url: string, hours: number, from?: string, member = false) {
  if (!MAIL_ON || !/^https?:\/\//.test(url)) return { ok: false };
  // a buyer's account: no name in the email (it was typed on the public sign-up form)
  const m = member ? memberResetMail(locale, url, hours) : linkMail(locale, kind, name, url, hours, from);
  return sendMail(to, m.subject, m.text);
}

export async function inviteUser(_: AdminState, fd: FormData): Promise<AdminState> {
  try {
    const me = await actor();
    const email = str(fd, "email", 200).toLowerCase();
    const name = str(fd, "name", 80);
    const role = (["user", "admin", "superadmin"].includes(str(fd, "role")) ? str(fd, "role") : "user") as AccountRole;
    if (!EMAIL.test(email)) return { error: say(fd, "Skriv en gyldig e-postadresse.", "Enter a valid email address.") };
    if (!name) return { error: say(fd, "Skriv navnet.", "Enter the name.") };
    if (!mayManage(me, { role }, role)) return { error: say(fd, "Bare en superadministrator kan invitere administratorer.", "Only a super administrator can invite administrators.") };
    const areas = role === "user" ? areasFrom(fd) : [...AREAS];
    if (role === "user" && !areas.length) return { error: say(fd, "Velg minst ett område personen skal ha tilgang til.", "Choose at least one area.") };
    const plot = /^plot-\d{2}$/.test(str(fd, "plot")) ? str(fd, "plot") : undefined;
    const place = linkPlace(fd);
    const result = await changeAuth((st) => {
      const existing = findByEmail(st, email);
      if (existing && existing.status !== "invited") return { taken: true as const };
      if (existing) {
        // a pending invitation is rewritten only by someone who may manage the role it already has
        if (!mayManage(me, existing, role)) return { forbidden: true as const };
        Object.assign(existing, { name, role, areas, plot, org: str(fd, "org", 120) || undefined });
        audit(st, me.email, `invitasjon fornyet for ${email}`);
        return { id: existing.id };
      }
      const id = newAccountId();
      st.accounts.push({ id, email, name, role, areas, plot, org: str(fd, "org", 120) || undefined, status: "invited", created: new Date().toISOString(), created_by: me.email, logins: 0, sv: 1 });
      audit(st, me.email, `inviterte ${email} som ${role}${role === "user" ? ` (${areas.join(", ")})` : ""}`);
      return { id };
    });
    if ("taken" in result) return { error: say(fd, "Det finnes allerede en aktiv konto med denne e-postadressen.", "An active account with this email already exists.") };
    if ("forbidden" in result) return { error: say(fd, "Invitasjonen gjelder en administrator. Bare en superadministrator kan endre den.", "The invitation is for an administrator. Only a super administrator can change it.") };
    const { url, hours } = await linkFor(result.id, "invite", me, place);
    const days = Math.round(hours / 24);
    const mailed = await mailLink(email, place.locale, "invite", name, url, hours, by(me));
    done();
    if (mailed.ok) return { ok: say(fd, `Invitasjonen er sendt til ${email}.`, `The invitation is emailed to ${email}.`) };
    const why = MAIL_ON ? say(fd, " E-posten kunne ikke sendes.", " The email could not be sent.") : "";
    return { ok: say(fd, `${name} er lagt inn.${why} Send lenken under til ${email}; den gjelder i ${days} dager og vises bare nå.`, `${name} is added.${why} Send the link below to ${email}; it lasts ${days} days and is shown only now.`), link: url };
  } catch (e) {
    return refused(e, fd);
  }
}

export async function updateUser(_: AdminState, fd: FormData): Promise<AdminState> {
  try {
    const me = await actor();
    const id = str(fd, "id", 40);
    const role = (["user", "admin", "superadmin"].includes(str(fd, "role")) ? str(fd, "role") : "user") as AccountRole;
    const out = await changeAuth((st) => {
      const a = findById(st, id);
      if (!a) return "missing";
      if (a.id === me.id && role !== a.role) return "self";
      if (!mayManage(me, a, role)) return "forbidden";
      if (a.role === "superadmin" && role !== "superadmin" && st.accounts.filter((x) => x.role === "superadmin" && x.status === "active").length <= 1 && a.status === "active") return "last";
      const areas = role === "user" ? areasFrom(fd) : [...AREAS];
      a.role = role;
      a.areas = areas;
      a.name = str(fd, "name", 80) || a.name;
      a.org = str(fd, "org", 120) || undefined;
      a.plot = /^plot-\d{2}$/.test(str(fd, "plot")) ? str(fd, "plot") : undefined;
      audit(st, me.email, `endret ${a.email}: ${role}${role === "user" ? ` (${areas.join(", ") || "ingen områder"})` : ""}`);
      return "ok";
    });
    if (out === "self") return { error: say(fd, "Du kan ikke endre din egen rolle.", "You cannot change your own role.") };
    if (out === "forbidden") return { error: say(fd, "Bare en superadministrator kan endre administratorer.", "Only a super administrator can change administrators.") };
    if (out === "last") return { error: say(fd, "Det må finnes minst én aktiv superadministrator.", "There must be at least one active super administrator.") };
    if (out === "missing") return { error: say(fd, "Kontoen finnes ikke lenger.", "The account no longer exists.") };
    done();
    return { ok: say(fd, "Lagret.", "Saved.") };
  } catch (e) {
    return refused(e, fd);
  }
}

export async function setUserStatus(fd: FormData) {
  const me = await actor();
  const id = str(fd, "id", 40), op = str(fd, "op", 20);
  const deleted = await changeAuth((st) => {
    const a = findById(st, id);
    if (!a || a.id === me.id || !mayManage(me, a)) return;
    if (op === "disable") {
      if (a.role === "superadmin" && st.accounts.filter((x) => x.role === "superadmin" && x.status === "active").length <= 1) return;
      a.status = "disabled";
      a.sv += 1; // ends the person's sessions at once
      st.tokens = st.tokens.filter((t) => t.uid !== a.id);
      audit(st, me.email, `deaktiverte ${a.email}`);
    }
    if (op === "enable" && a.status === "disabled") {
      // a buyer who never confirmed the address is back to waiting for it; an invited person to the invitation
      a.status = a.password ? "active" : a.kind === "member" ? "pending" : "invited";
      audit(st, me.email, `aktiverte ${a.email} igjen`);
    }
    if (op === "delete") {
      if (a.role === "superadmin" && st.accounts.filter((x) => x.role === "superadmin" && x.status === "active").length <= 1 && a.status === "active") return;
      st.accounts = st.accounts.filter((x) => x.id !== a.id);
      st.tokens = st.tokens.filter((t) => t.uid !== a.id);
      st.reset_requests = st.reset_requests.filter((r) => r.email !== a.email);
      audit(st, me.email, `slettet kontoen til ${a.email}`);
      return a.id;
    }
  });
  // what the person kept on Min side (saved houses, followed plots, consent records) goes with the account; leads stay
  if (deleted) await deleteMemberData(deleted);
  done();
}

/**
 * A buyer becomes a resident: the account turns into a project account with the resident area and the plot that
 * is their home, and from then on logs into the portal instead of Min side. Only an active account (a person who
 * has logged in) can be promoted; the leads, followed plots and saved houses stay as they are.
 */
export async function promoteMember(_: AdminState, fd: FormData): Promise<AdminState> {
  try {
    const me = await actor();
    const id = str(fd, "id", 40);
    const plot = str(fd, "plot", 20);
    if (!/^plot-\d{2}$/.test(plot)) return { error: say(fd, "Velg tomten som blir hjemmet.", "Choose the plot that becomes the home.") };
    const out = await changeAuth((st) => {
      const a = findById(st, id);
      if (!a || a.kind !== "member") return "missing";
      if (!mayManage(me, a, "user")) return "forbidden";
      if (a.status !== "active") return "inactive";
      a.kind = "stakeholder";
      a.role = "user";
      a.areas = ["resident"];
      a.plot = plot;
      audit(st, me.email, `endret ${a.email}: beboer på tomt ${Number(plot.slice(5))}`);
      return "ok";
    });
    if (out === "missing") return { error: say(fd, "Kjøperkontoen finnes ikke lenger.", "The buyer account no longer exists.") };
    if (out === "forbidden") return { error: say(fd, "Du har ikke tilgang til å gjøre dette.", "You do not have access to do this.") };
    if (out === "inactive") return { error: say(fd, "Bare en aktiv konto kan bli beboer. Personen må ha bekreftet og logget inn først.", "Only an active account can become a resident. The person must have confirmed and logged in first.") };
    done();
    return { ok: say(fd, `Kontoen er nå beboer på tomt ${Number(plot.slice(5))}. Neste innlogging går til portalen, Mitt hjem.`, `The account is now a resident of plot ${Number(plot.slice(5))}. The next login goes to the portal, My home.`) };
  } catch (e) {
    return refused(e, fd);
  }
}

/**
 * A new link: an invitation for someone who never chose a password, a password link otherwise. It opens the design
 * and language the person last logged in with. A request in the queue stays there until the person has used the
 * link (or it is dismissed), so the link shown here does not leave the page with the request.
 */
export async function userLink(_: AdminState, fd: FormData): Promise<AdminState> {
  try {
    const me = await actor();
    const id = str(fd, "id", 40);
    const a = findById(await loadAuth(), id);
    if (!a || !mayManage(me, a) || a.status === "disabled") return { error: say(fd, "Ikke mulig for denne kontoen.", "Not possible for this account.") };
    const kind = a.status === "invited" ? "invite" : "reset";
    const place = linkPlace(fd, a);
    const { url, hours } = await linkFor(a.id, kind, me, place);
    if (kind === "reset") await changeAuth((st) => { for (const r of st.reset_requests) if (r.email === a.email) r.link_at = new Date().toISOString(); });
    const mailed = await mailLink(a.email, place.locale, kind, a.name, url, hours, undefined, a.kind === "member");
    done();
    if (mailed.ok) return { ok: say(fd, `Lenken er sendt til ${a.email}.`, `The link is emailed to ${a.email}.`) };
    const why = MAIL_ON ? say(fd, "E-posten kunne ikke sendes. ", "The email could not be sent. ") : "";
    return { ok: say(fd, `${why}Send lenken til ${a.email}. Den vises bare nå.`, `${why}Send the link to ${a.email}. It is shown only now.`), link: url };
  } catch (e) {
    return refused(e, fd);
  }
}

export async function dismissResetRequest(fd: FormData) {
  const me = await actor();
  const email = str(fd, "email", 200).toLowerCase();
  await changeAuth((st) => {
    // only someone who may manage the account behind the request can dismiss it
    const a = findByEmail(st, email);
    if (a && !mayManage(me, a)) return;
    st.reset_requests = st.reset_requests.filter((r) => r.email !== email);
    audit(st, me.email, `avviste forespørsel om nytt passord fra ${email}`);
  });
  done();
}
