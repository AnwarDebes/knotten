import "server-only";
import { after } from "next/server";
import { mutate, readJSON } from "./kv";
import { audit, changeAuth, findById, loadAuth, type Account } from "./accounts";
import { sha256 } from "./crypto";
import { MAIL_ON, sendMail, siteOrigin } from "./mail";
import { ACCOUNT_NOTE_BY, forgetLeads, moveLeads, recordLead, type LeadSource } from "./leads";
import { deleteAllFor, listSaved } from "./configurations";
import { welcomeMail } from "./emails";
import { CONSENT_TEXT, PRIVACY_VERSION, type ConsentEvent, type ConsentPurpose } from "@/lib/consent";
import { consentState } from "@/lib/leadConsent";
import { readStore, type Lead } from "@/lib/store";
import { loadCommercial, loadPlots, loadSettings } from "@/lib/data";
import type { Design } from "@/lib/design";
import { minSidePath } from "@/lib/member-paths";
import { plotNo } from "@/lib/format";
import { CONTACT } from "@/lib/facts";

/**
 * Buyers' own accounts ("members", kind "member" in lib/server/accounts.ts): what they follow and what they have
 * agreed to. The account itself (name, email, password) lives with the other accounts; this record set ("members",
 * one entry per account id) holds the rest, so the account records stay small.
 *
 * The rules that hold everywhere:
 * - Nothing is emailed to a buyer whose address is not confirmed (mayEmail). With email set up, sign-up confirms
 *   the address before the account can be used. Without email (no MAIL_FROM with Resend or SMTP), sign-up asks
 *   for a password and the account works at once, unconfirmed: its choices are stored here, but the CRM lead gets
 *   them only once the address is confirmed, and no email goes out to it.
 * - The CRM lead is written only through recordLead (lib/server/leads.ts), with `verified` true only for a
 *   confirmed address. Leads the account created itself are remembered (lead_ids), so the person can see them in
 *   the export and delete them with the account (before the address is confirmed, only while nothing else has been
 *   written to them: see ownLeads); another lead with the same address is theirs only once the address is
 *   confirmed. When the address changes, the person's own leads move to the new address with it, so the CRM keeps
 *   one record per person.
 * - Every change to news and plot alerts is a new consent event (append-only), with the text id and the privacy
 *   statement's version, as for the interest forms.
 */
export type MemberRecord = {
  uid: string;
  /** Plots followed, `plot-NN`, in the order they were followed. */
  plots: string[];
  /** Every choice about news and plot alerts, from sign-up on (append-only). */
  consents: ConsentEvent[];
  /** What the person is interested in (the lead's purpose), from the sign-up form. */
  purpose: Lead["purpose"];
  /** Leads that are this person's own (created by the account, or moved with its address): shown in the export and deleted with the account when the person asks. */
  lead_ids?: string[];
  /** When the sign-up was written to the CRM (with email set up: once the address was confirmed). */
  lead_at?: string;
  /** Earlier addresses of the account, so deleting it also clears them from the security log. */
  old_emails?: string[];
  created: string;
  updated: string;
};
type MembersState = { members: Record<string, MemberRecord> };

const KEY = "members";
const seed = (): MembersState => ({ members: {} });
const now = () => new Date().toISOString();
const blank = (uid: string, at = now()): MemberRecord => ({ uid, plots: [], consents: [], purpose: "buy", created: at, updated: at });

/** The two choices Min side switches: news by email and alerts about the followed plots. */
export const NOTIFY_PURPOSES = ["updates", "plot_alerts"] as const satisfies readonly ConsentPurpose[];
export type NotifyPurpose = (typeof NOTIFY_PURPOSES)[number];

// ------------------------------------------------------------------ the record set
export async function readMembers(): Promise<Record<string, MemberRecord>> {
  return (await readJSON<MembersState>(KEY))?.members ?? {};
}

export async function getMember(uid: string): Promise<MemberRecord> {
  const m = (await readMembers())[uid];
  return m ? { ...blank(uid, m.created), ...m } : blank(uid);
}

/** Change one buyer's record (made when missing). `fn` may run again after a clash, so it only changes `m`. */
export async function changeMember<R>(uid: string, fn: (m: MemberRecord) => R): Promise<R> {
  return mutate<MembersState, R>(KEY, seed, (st) => {
    st.members ??= {};
    const m = (st.members[uid] ??= blank(uid));
    m.plots ??= [];
    m.consents ??= [];
    const out = fn(m);
    m.updated = now();
    return out;
  });
}

export async function removeMember(uid: string) {
  await mutate<MembersState, void>(KEY, seed, (st) => {
    if (st.members) delete st.members[uid];
  });
}

/** The nightly cleanup: records (and saved houses) of accounts that no longer exist, such as unconfirmed sign-ups. */
export async function pruneMembers(): Promise<{ membersPruned: number }> {
  const ids = new Set((await loadAuth()).accounts.map((a) => a.id));
  const orphans = Object.keys(await readMembers()).filter((uid) => !ids.has(uid));
  if (!orphans.length) return { membersPruned: 0 };
  for (const uid of orphans) await deleteAllFor(uid);
  await mutate<MembersState, void>(KEY, seed, (st) => {
    for (const uid of orphans) delete st.members?.[uid];
  });
  return { membersPruned: orphans.length };
}

// ------------------------------------------------------------------ rules
/** The rule for every email to a buyer: email is set up, and the address is one the person has confirmed. */
export const mayEmail = (a: Pick<Account, "email_verified_at">) => MAIL_ON && !!a.email_verified_at;

/**
 * Sign-up confirms the address by email when email is set up and the site knows its own address (SITE_URL in
 * production). Otherwise the sign-up form asks for a password and the account works at once, unconfirmed.
 */
export async function signupByEmail() {
  return MAIL_ON && !!(await siteOrigin());
}

/** The language and design for a buyer's emails and links: the choice on Min side, else the last login's. */
export function memberPlace(a: Pick<Account, "prefs" | "lang" | "design">): { design: Design; locale: "no" | "en" } {
  return { locale: a.prefs?.lang ?? a.lang ?? "no", design: a.prefs?.design ?? a.design ?? "klassisk" };
}

/** Each switch's state and when it was last changed (the newest event decides). */
export function notifyState(m: Pick<MemberRecord, "consents">): Record<NotifyPurpose, { on: boolean; at?: string }> {
  const st = consentState(m.consents ?? []);
  const last = (p: NotifyPurpose) => [...(m.consents ?? [])].reverse().find((e) => e.purpose === p)?.at;
  return { updates: { on: st.updates, at: last("updates") }, plot_alerts: { on: st.plot_alerts, at: last("plot_alerts") } };
}

/** The switches that are on, as consents for the lead. */
const grants = (m: MemberRecord) => {
  const st = notifyState(m);
  return Object.fromEntries(NOTIFY_PURPOSES.filter((p) => st[p].on).map((p) => [p, true])) as Partial<Record<ConsentPurpose, boolean>>;
};
const CHOICE_NO: Record<NotifyPurpose, string> = { updates: "nyheter på e-post", plot_alerts: "varsler om tomtene" };

// ------------------------------------------------------------------ the CRM lead
/**
 * Write to the person's lead (recordLead): the consents only for a confirmed address, plots always. A lead this
 * account created is remembered as its own.
 */
export async function syncLead(a: Account, m: MemberRecord, input: { plots?: string[]; consents?: Partial<Record<ConsentPurpose, boolean>>; message?: string; source: LeadSource }) {
  const verified = !!a.email_verified_at;
  const { id, repeat } = await recordLead({
    name: a.name,
    email: a.email,
    phone: a.phone,
    purpose: m.purpose,
    plots: input.plots ?? [],
    consents: verified ? input.consents ?? {} : {},
    message: input.message,
    source: input.source,
    locale: memberPlace(a).locale,
    verified,
  });
  if (!repeat) await changeMember(a.id, (x) => { x.lead_ids = [...new Set([...(x.lead_ids ?? []), id])]; });
  return { id, repeat };
}

/** The sign-up as a lead: at once without email (unconfirmed), or when the address is confirmed with email. */
async function recordSignup(a: Account, m: MemberRecord) {
  const chosen = NOTIFY_PURPOSES.filter((p) => notifyState(m)[p].on).map((p) => CHOICE_NO[p]);
  const message = a.email_verified_at
    ? "Opprettet kjøperkonto og bekreftet e-postadressen."
    : `Opprettet kjøperkonto. E-postadressen er ikke bekreftet.${chosen.length ? ` Valgte på kontoen: ${chosen.join(", ")}; føres inn her når adressen er bekreftet.` : ""}`;
  await syncLead(a, m, { plots: m.plots, consents: grants(m), message, source: "registrering" });
  await changeMember(a.id, (x) => { x.lead_at = now(); });
}

/** A buyer signed up without email: the lead is written at once (after the answer has gone). */
export function afterSignupWithoutEmail(uid: string) {
  after(async () => {
    try {
      const a = findById(await freshAuth(), uid);
      if (a) await recordSignup(a, await getMember(uid));
    } catch (e) {
      console.error("[knotten] a sign-up could not be written to the leads", e);
    }
  });
}

/**
 * The address is confirmed (a sign-up's link, a confirmation from Min side, a new address, or a password link):
 * the sign-up reaches the CRM with its consents, or the switches made while unconfirmed are written to the lead
 * now. `welcome` sends the welcome email (the first confirmation after signing up with email).
 */
export function afterVerified(uid: string, opts: { welcome?: boolean; design?: Design; locale?: "no" | "en" } = {}) {
  after(async () => {
    try {
      const a = findById(await freshAuth(), uid);
      if (!a || a.kind !== "member" || !a.email_verified_at) return;
      const m = await getMember(uid);
      if (!m.lead_at) await recordSignup(a, m);
      else if (Object.keys(grants(m)).length) await syncLead(a, m, { plots: m.plots, consents: grants(m), message: "Bekreftet e-postadressen. Valgene fra Min side er ført inn.", source: "min side" });
      if (opts.welcome && mayEmail(a)) {
        const origin = await siteOrigin();
        const place = { ...memberPlace(a), ...(opts.design ? { design: opts.design } : {}), ...(opts.locale ? { locale: opts.locale } : {}) };
        const mail = welcomeMail(place.locale, `${origin}${minSidePath(place.design, place.locale)}`);
        if (origin) await sendMail(a.email, mail.subject, mail.text);
      }
    } catch (e) {
      console.error("[knotten] a confirmed address could not be written to the leads", e);
    }
  });
}

/** The accounts as stored now (loadAuth keeps one copy per request; work after the answer reads again). */
async function freshAuth() {
  return (await readJSON<Awaited<ReturnType<typeof loadAuth>>>("auth")) ?? (await loadAuth());
}

/**
 * Leads that belong to this person: the one the account created, and with a confirmed address any with that address.
 * Until the address is confirmed, the lead the account created counts only while nothing but the account has written
 * to it: a later registration with the same address (the interest form, the configurator) is added to that lead as a
 * note and may come from the real owner of the address, as may the project's own notes. Such a lead is then not shown
 * in the export, moved with a new address or deleted with the account.
 */
async function ownLeads(a: Account, m: MemberRecord): Promise<Lead[]> {
  const { leads } = await readStore();
  const mine = new Set(m.lead_ids ?? []);
  const verified = !!a.email_verified_at;
  const onlyOwn = (l: Lead) => (l.notes ?? []).every((n) => ACCOUNT_NOTE_BY.includes(n.by));
  return leads.filter((l) => l.source !== "eksempel" && ((mine.has(l.id) && (verified || onlyOwn(l))) || (verified && l.email.toLowerCase() === a.email)));
}

/**
 * The account's address changed (`before` is the account as it was): the person's own leads move to the new
 * address, unless another lead already has it (then both stay as they are, for the project to merge).
 */
export async function leadsFollowAddress(before: Account, next: string) {
  const m = await getMember(before.id);
  const ids = (await ownLeads(before, m)).map((l) => l.id);
  if (!ids.length) return;
  await moveLeads(ids, before.email, next);
  await changeMember(before.id, (x) => { x.lead_ids = [...new Set([...(x.lead_ids ?? []), ...ids])]; });
}

// ------------------------------------------------------------------ Min side
export type FollowedPlot = { id: string; n: string; status: "unreleased" | "available" | "reserved" | "sold"; price_nok?: number; note?: string };

/** Everything Min side shows, read once. */
export async function minSideData(uid: string) {
  const [auth, member, commercial, settings, saved, { plots }] = await Promise.all([loadAuth(), getMember(uid), loadCommercial(), loadSettings(), listSaved(uid).catch(() => []), loadPlots()]);
  const account = findById(auth, uid);
  if (!account) return null;
  const follows: FollowedPlot[] = member.plots
    .filter((id) => commercial[id])
    .map((id) => ({ id, n: plotNo(id), status: commercial[id].status, price_nok: commercial[id].price_nok, note: commercial[id].note }));
  const change = auth.tokens.find((t) => t.uid === uid && t.kind === "email-change" && Date.parse(t.expires) > Date.now());
  return {
    account,
    member,
    follows,
    allPlots: plots.map((p) => p.id),
    releaseNote: settings.release_note,
    saved,
    notify: notifyState(member),
    pendingEmail: change?.email,
    mailOn: MAIL_ON,
  };
}
export type MinSideData = NonNullable<Awaited<ReturnType<typeof minSideData>>>;

// ------------------------------------------------------------------ the right of access: everything as JSON
export async function memberExport(uid: string) {
  const auth = await loadAuth();
  const a = findById(auth, uid);
  if (!a) return null;
  const m = await getMember(uid);
  const [saved, commercial, leads] = await Promise.all([listSaved(uid).catch(() => []), loadCommercial(), ownLeads(a, m)]);
  const texts = Object.fromEntries(
    Object.values(CONSENT_TEXT)
      .filter((c) => m.consents.some((e) => e.text_id === c.id))
      .map((c) => [c.id, c.text]),
  );
  return {
    about: {
      no: `Alt ${CONTACT.company} har lagret om kontoen din hos Knotten: kontoen, tomtene du følger, samtykkene dine med tekst og tidspunkt, husene du har lagret og interessemeldingene dine.`,
      en: `Everything ${CONTACT.company} has stored about your Knotten account: the account, the plots you follow, your consents with their text and time, the houses you have saved and your interest registrations.`,
      made: now(),
      privacy_version: PRIVACY_VERSION,
    },
    account: {
      email: a.email,
      name: a.name,
      phone: a.phone ?? null,
      status: a.status,
      created: a.created,
      email_verified_at: a.email_verified_at ?? null,
      last_login: a.last_login ?? null,
      logins: a.logins,
      language: memberPlace(a).locale,
      design: memberPlace(a).design,
    },
    interested_in: m.purpose,
    followed_plots: m.plots.map((id) => ({ plot: id, number: Number(plotNo(id)), status: commercial[id]?.status ?? null, price_nok: commercial[id]?.price_nok ?? null })),
    consents: m.consents,
    consent_texts: texts,
    saved_houses: saved,
    interest_registrations: leads,
  };
}

// ------------------------------------------------------------------ deletion
/**
 * Delete a buyer's account and what belongs to it: saved houses, follows and consent records, and (when asked) the
 * leads that are the person's own. The account goes last, so a failure on the way leaves an account to try again
 * with. The security log keeps a line without the address, and earlier lines lose it too.
 */
export async function deleteMember(a: Account, opts: { leads: boolean }): Promise<{ leadsDeleted: number; leadsKept: number }> {
  const m = await getMember(a.id);
  const own = (await ownLeads(a, m)).map((l) => l.id);
  const leadIds = opts.leads ? own : [];
  await deleteAllFor(a.id);
  const leadsDeleted = leadIds.length ? await forgetLeads(leadIds, { name: a.name, email: a.email }) : 0;
  await removeMember(a.id);
  const label = `slettet konto ${sha256(`deleted|${a.id}`).slice(0, 8)}`;
  const addresses = [a.email, ...(m.old_emails ?? [])].filter(Boolean);
  await changeAuth((s) => {
    s.accounts = s.accounts.filter((x) => x.id !== a.id);
    s.tokens = s.tokens.filter((t) => t.uid !== a.id);
    s.reset_requests = s.reset_requests.filter((r) => !addresses.includes(r.email));
    s.audit = s.audit.map((e) => ({ ...e, who: addresses.includes(e.who) ? label : e.who, what: addresses.reduce((w, x) => w.split(x).join(label), e.what) }));
    audit(s, label, "kjøperkontoen ble slettet av eieren");
  });
  return { leadsDeleted, leadsKept: opts.leads ? 0 : own.length };
}

/** When an administrator deletes an account: what the buyer kept on Min side goes with it (the lead stays in the CRM). */
export async function deleteMemberData(uid: string) {
  await deleteAllFor(uid);
  await removeMember(uid);
}
