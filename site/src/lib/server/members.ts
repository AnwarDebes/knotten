"use server";
import "server-only";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clientIp, endSession, getSession, sessionInfo, startSession } from "@/lib/auth";
import type { Design } from "@/lib/design";
import { STORAGE_MESSAGE } from "@/lib/errors";
import { leadErrorText } from "@/lib/forms";
import { consentEvents } from "@/lib/consent";
import { loadPlots } from "@/lib/data";
import { plotNo } from "@/lib/format";
import { loginPagePath, minSidePath } from "@/lib/member-paths";
import { audit, changeAuth, confirmLink, findByEmail, findById, issueLink, linkUrl, loadAuth, newAccountId, passwordCheckGate, passwordCheckPassed, type Account } from "./accounts";
import { hashPassword, passwordProblem, verifyPassword } from "./crypto";
import { accountDeletedMail, alreadyMail, emailChangeMail, emailChangedMail, linkMail, verifyMail } from "./emails";
import { checkStamp, humanCheck } from "./human";
import { isStorageUnavailable, StorageBusyError, STORAGE } from "./kv";
import { limitId, minutes, take } from "./limit";
import { MAIL_ON, sendMail, siteOrigin } from "./mail";
import { deleteSaved } from "./configurations";
import { recordEvent } from "./stats";
import {
  afterSignupWithoutEmail, afterVerified, changeMember, deleteMember, getMember, leadsFollowAddress, mayEmail, memberPlace, NOTIFY_PURPOSES, signupByEmail, syncLead,
  type NotifyPurpose,
} from "./member-store";

/**
 * Buyers' own accounts, shared by both designs: the sign-up page (Klassisk /registrer, Moderne /{no,en}/registrer)
 * and Min side (Klassisk /min-side, Moderne /{no,en}/min-side). Every action checks the person itself; a buyer's
 * account (kind "member") acts only on its own records. The data behind them is in lib/server/member-store.ts.
 *
 * Sign-up works two ways, decided by signupByEmail():
 * - With email set up (MAIL_FROM with Resend or SMTP, and the site's address): a self-invitation. The form asks for
 *   no password. A pending account is made and a "verify" link is emailed; the link opens the password page in the
 *   design and language of the sign-up, where opening the page changes nothing and choosing the password confirms
 *   the address. The answer is the same "check your email" whatever the address's state, and the work is done after
 *   the answer, so its timing says nothing either: an address with an account gets a "you already have an account"
 *   email instead, a pending one gets its link again (within the limits), a disabled one gets nothing.
 * - Without email (the owner's choice for now): the form also asks for a password, the account is active at once
 *   and the person is logged in. The address stays unconfirmed (email_verified_at unset): Min side says so, the
 *   choices are stored, and nothing is ever emailed to the address until it is confirmed. Without email the site
 *   cannot keep secret whether an address has an account, so a taken address is refused in plain words.
 * Without storage (Vercel without a database) nothing can be kept, and every action says so.
 */
export type MemberState = { error?: string; ok?: string; done?: boolean } | undefined;

type L = "no" | "en";
const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const langOf = (fd: FormData): L => (fd.get("locale") === "en" || fd.get("lang") === "en" ? "en" : "no");
const designOf = (fd: FormData): Design => (fd.get("design") === "klassisk" ? "klassisk" : "moderne");
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PURPOSES = ["buy", "invest", "partner", "curious"] as const;
const mask = (e: string) => e.replace(/^(.)[^@]*(@.*)$/, "$1***$2");

const T = {
  no: {
    name: "Skriv inn navnet ditt.",
    email: "Skriv inn en gyldig e-postadresse.",
    mismatch: "Passordene er ikke like.",
    checkMail: (e: string) => `Sjekk e-posten din. Vi har sendt neste steg til ${e}. Finner du ikke e-posten, se i søppelposten, eller prøv igjen om noen minutter.`,
    taken: "Denne e-postadressen kan ikke brukes til en ny konto. Har du allerede en konto, logg inn, eller be om nytt passord på innloggingssiden.",
    login: "Logg inn for å gjøre dette.",
    notMember: "Dette gjelder kjøperkontoer. Prosjektkontoer bruker Min konto i portalen.",
    saved: "Lagret.",
    wrongPw: "Passordet stemmer ikke.",
    locked: (m: number) => `For mange forsøk. Prøv igjen om ${m} ${m === 1 ? "minutt" : "minutter"}.`,
    same: "Det er allerede adressen din.",
    changeSent: (e: string) => `Vi har sendt en lenke til ${e}. Adressen endres når du åpner lenken; til da bruker kontoen den gamle.`,
    changedNow: (e: string) => `E-postadressen er endret til ${e}. Den er ikke bekreftet, siden nettstedet ikke sender e-post ennå.`,
    takenChange: "Den adressen kan ikke brukes.",
    verifySent: (e: string) => `Vi har sendt en lenke til ${e}. Åpne den for å bekrefte adressen.`,
    noMail: "Nettstedet sender ikke e-post ennå, så adressen kan ikke bekreftes nå.",
    badPlot: "Velg en tomt fra listen.",
    followed: (n: string) => `Du følger nå tomt ${n}.`,
    unfollowed: (n: string) => `Du følger ikke lenger tomt ${n}.`,
    notifyOn: "Slått på. Valget er lagret med tidspunkt.",
    notifyOff: "Slått av. Valget er lagret med tidspunkt.",
    houseGone: "Huset er slettet.",
    badLink: "Lenken er ugyldig, allerede brukt eller utløpt.",
    linkTaken: "Den nye adressen er tatt i bruk av en annen konto, så den kan ikke brukes. Prøv en annen fra Min side.",
    busy: "Mange endringer akkurat nå. Prøv igjen om litt.",
    many: "Mange endringer på kort tid. Vent litt og prøv igjen.",
    bad: "Noe gikk galt. Last siden på nytt og prøv igjen.",
  },
  en: {
    name: "Enter your name.",
    email: "Enter a valid email address.",
    mismatch: "The passwords do not match.",
    checkMail: (e: string) => `Check your email. We have sent the next step to ${e}. If you cannot find the email, look in the spam folder, or try again in a few minutes.`,
    taken: "This email address cannot be used for a new account. If you already have an account, log in, or ask for a new password on the login page.",
    login: "Log in to do this.",
    notMember: "This is for buyer accounts. Project accounts use My account in the portal.",
    saved: "Saved.",
    wrongPw: "The password is not correct.",
    locked: (m: number) => `Too many attempts. Try again in ${m} ${m === 1 ? "minute" : "minutes"}.`,
    same: "That is already your address.",
    changeSent: (e: string) => `We have sent a link to ${e}. The address changes when you open the link; until then the account keeps the old one.`,
    changedNow: (e: string) => `The email address is changed to ${e}. It is not confirmed, since the site does not send email yet.`,
    takenChange: "That address cannot be used.",
    verifySent: (e: string) => `We have sent a link to ${e}. Open it to confirm the address.`,
    noMail: "The site does not send email yet, so the address cannot be confirmed now.",
    badPlot: "Choose a plot from the list.",
    followed: (n: string) => `You now follow plot ${n}.`,
    unfollowed: (n: string) => `You no longer follow plot ${n}.`,
    notifyOn: "Switched on. The choice is stored with the time.",
    notifyOff: "Switched off. The choice is stored with the time.",
    houseGone: "The house is deleted.",
    badLink: "The link is invalid, already used or expired.",
    linkTaken: "The new address is now used by another account, so it cannot be used. Try another one from My page.",
    busy: "Many changes right now. Try again shortly.",
    many: "Many changes in a short time. Wait a little and try again.",
    bad: "Something went wrong. Reload the page and try again.",
  },
};

/** Runs an action; when nothing can be saved, or the records are too busy, the person is told so instead of an error page. */
async function guarded(fd: FormData, run: () => Promise<MemberState>): Promise<MemberState> {
  const l = langOf(fd);
  if (STORAGE === "temp") return { error: STORAGE_MESSAGE[l] };
  try {
    return await run();
  } catch (e) {
    if (isStorageUnavailable(e)) return { error: STORAGE_MESSAGE[l] };
    if (e instanceof StorageBusyError) return { error: T[l].busy };
    throw e;
  }
}

/** The buyer behind this request, with the account as stored; null for anyone else (a stakeholder, a preview, nobody). */
async function currentMember(): Promise<Account | null> {
  const s = await getSession();
  if (!s || s.preview || s.kind !== "member") return null;
  const a = findById(await loadAuth(), s.id);
  return a && a.kind === "member" && a.status === "active" ? a : null;
}

/** Min side in both designs and languages shows the change. */
function refresh() {
  for (const p of ["/min-side", "/no/min-side", "/en/min-side"]) revalidatePath(p);
}

/** One buyer making many changes in a row (each can write to the lead): 120 an hour is far above any real use. */
const changeGate = (uid: string) => take([{ key: `member:u:${uid}`, max: 120, windowSec: 3600 }]);

const plotIds = async () => new Set((await loadPlots()).plots.map((p) => p.id));

// ------------------------------------------------------------------ sign-up
export async function signUp(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const design = designOf(fd);
    const email = str(fd, "email").toLowerCase();
    const name = str(fd, "name", 80);
    const phone = str(fd, "phone", 40);
    const purpose = PURPOSES.find((p) => p === str(fd, "purpose")) ?? "buy";
    const known = await plotIds();
    const plots = [...new Set(fd.getAll("plots").map(String))].filter((p) => known.has(p)).slice(0, 30);
    const consents = Object.fromEntries(NOTIFY_PURPOSES.filter((p) => fd.get(`consent_${p}`) === "on").map((p) => [p, true]));
    const byEmail = await signupByEmail();
    // programs fill in every field; people never see this one: answer as usual, keep nothing
    if (str(fd, "website")) return byEmail ? { ok: t.checkMail(email), done: true } : { error: leadErrorText("bad_request", locale) };
    const stamp = await checkStamp("signup", fd.get("stamp"));
    if (stamp === "too_fast") return { error: leadErrorText("too_fast", locale) };
    if (stamp === "bad") return { error: leadErrorText("bad_request", locale) };
    if (!name) return { error: t.name };
    if (!EMAIL.test(email)) return { error: t.email };
    let password = "";
    if (!byEmail) {
      password = String(fd.get("password") ?? "");
      const problem = passwordProblem(password, email, locale);
      if (problem) return { error: problem };
      if (password !== String(fd.get("confirm") ?? "")) return { error: t.mismatch };
    }
    const ip = await clientIp();
    const gate = await take([{ key: `signup:i:${limitId(ip)}`, max: 5, windowSec: 3600 }]);
    if (!gate.ok) return { error: leadErrorText("too_many", locale) };
    if (!(await humanCheck(fd.get("turnstile"), ip))) return { error: leadErrorText("captcha", locale) };
    const perEmail = await take([{ key: `signup:e:${limitId(email)}`, max: 3, windowSec: 86400 }]);
    await recordEvent("signup");

    if (byEmail) {
      const answer: MemberState = { ok: t.checkMail(email), done: true };
      // over the limit for this address: the same answer, and nothing is sent (the form cannot flood anyone)
      if (!perEmail.ok) return answer;
      const origin = await siteOrigin();
      after(async () => {
        try {
          await signUpByEmail({ email, name, phone, purpose, plots, consents, design, locale, origin });
        } catch (e) {
          console.error("[knotten] a sign-up could not be handled", e);
        }
      });
      return answer;
    }

    if (!perEmail.ok) return { error: leadErrorText("too_many", locale) };
    const hash = await hashPassword(password);
    const at = new Date().toISOString();
    const made = await changeAuth((s) => {
      const a = findByEmail(s, email);
      // a sign-up that was never confirmed (made while email was on) may be taken over: it holds nothing yet
      if (a && !(a.kind === "member" && a.status === "pending" && !a.password)) return null;
      if (a) {
        Object.assign(a, { name, phone: phone || undefined, password: hash, status: "active", email_verified_at: undefined, sv: a.sv + 1, last_login: at, logins: 1, design, lang: locale });
        audit(s, email, "opprettet kjøperkonto (e-posten er ikke bekreftet)");
        return { ...a, replaced: true };
      }
      const fresh: Account = { id: newAccountId(), email, name, phone: phone || undefined, role: "user", kind: "member", areas: [], status: "active", password: hash, created: at, created_by: "registrering", last_login: at, logins: 1, sv: 1, design, lang: locale };
      s.accounts.push(fresh);
      audit(s, email, "opprettet kjøperkonto (e-posten er ikke bekreftet)");
      return { ...fresh, replaced: false };
    });
    if (!made) return { error: t.taken };
    const { replaced, ...account } = made;
    await changeMember(account.id, (m) => {
      m.plots = plots;
      // a replaced sign-up's choices were never confirmed: they go, and the new ones count
      m.consents = [...(replaced ? [] : m.consents), ...consentEvents(consents, "signup", at)];
      m.purpose = purpose;
      m.created = replaced ? at : m.created;
      delete m.lead_at;
    });
    afterSignupWithoutEmail(account.id);
    await startSession(account, false, design);
    redirect(`${minSidePath(design, locale)}?ny=1`);
  });
}

/** The sign-up's work with email, after the answer has gone (see the comment at the top). */
async function signUpByEmail(x: { email: string; name: string; phone: string; purpose: (typeof PURPOSES)[number]; plots: string[]; consents: Record<string, boolean>; design: Design; locale: L; origin: string }) {
  const at = new Date().toISOString();
  const found = await changeAuth((s) => {
    const a = findByEmail(s, x.email);
    if (a) {
      // a sign-up waiting for its link: the newest details count (neither is confirmed)
      if (a.kind === "member" && a.status === "pending") Object.assign(a, { name: x.name, phone: x.phone || undefined, design: x.design, lang: x.locale });
      return { ...a, fresh: false };
    }
    const fresh: Account = { id: newAccountId(), email: x.email, name: x.name, phone: x.phone || undefined, role: "user", kind: "member", areas: [], status: "pending", created: at, created_by: "registrering", logins: 0, sv: 1, design: x.design, lang: x.locale };
    s.accounts.push(fresh);
    audit(s, x.email, "opprettet kjøperkonto (venter på bekreftelse)");
    return { ...fresh, fresh: true };
  });
  const login = `${x.origin}${loginPagePath(x.design, x.locale)}`;
  if (found.kind === "member" && found.status === "pending") {
    await changeMember(found.id, (m) => {
      m.plots = x.plots;
      // until the address is confirmed the choices are the newest form's; nothing reached the lead yet
      m.consents = consentEvents(x.consents, "signup", at);
      m.purpose = x.purpose;
    });
    const { token, hours } = await issueLink(found.id, "verify", "registrering", { design: x.design, locale: x.locale });
    const m = verifyMail(x.locale, linkUrl(x.origin, token, x.design, x.locale), hours, true);
    await sendMail(x.email, m.subject, m.text);
    return;
  }
  if (found.status === "active") {
    const m = alreadyMail(x.locale, login);
    await sendMail(x.email, m.subject, m.text);
    return;
  }
  if (found.status === "invited") {
    // an invitation that never arrived or was lost: the invited address gets it again
    const { token, hours } = await issueLink(found.id, "invite", "registrering", { design: x.design, locale: x.locale });
    const m = linkMail(x.locale, "invite", found.name, linkUrl(x.origin, token, x.design, x.locale), hours);
    await sendMail(x.email, m.subject, m.text);
  }
  // a disabled account: nothing
}

// ------------------------------------------------------------------ links from emails (both designs' password pages)
/**
 * Confirm a link that needs no password: a new address, or an address confirmed from Min side. Opening the page
 * only shows the button; this POST uses the link up.
 */
export async function confirmEmailLink(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const design = designOf(fd);
    const r = await confirmLink(str(fd, "token", 200));
    if (!r.ok) return { error: r.reason === "taken" ? t.linkTaken : t.badLink };
    if (r.kind === "email-change") {
      await changeMember(r.account.id, (m) => { m.old_emails = [...new Set([...(m.old_emails ?? []), r.old])].slice(-10); });
      // the person's own leads take the new address (the account as it was decides which leads are theirs)
      await leadsFollowAddress({ ...r.account, email: r.old, email_verified_at: r.oldVerified ? r.account.email_verified_at : undefined }, r.account.email);
      if (MAIL_ON) {
        const old = r.old, lang = memberPlace(r.account).locale, next = mask(r.account.email);
        after(async () => {
          const m = emailChangedMail(lang, next);
          await sendMail(old, m.subject, m.text);
        });
      }
    }
    afterVerified(r.account.id);
    const s = await getSession();
    if (s?.id === r.account.id) {
      refresh();
      redirect(`${minSidePath(design, locale)}?bekreftet=1`);
    }
    redirect(`${loginPagePath(design, locale)}?bekreftet=1`);
  });
}

// ------------------------------------------------------------------ Min side: profile and address
export async function updateMemberProfile(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const a = await currentMember();
    if (!a) return { error: t.login };
    const name = str(fd, "name", 80);
    if (!name) return { error: t.name };
    const lang: L = fd.get("pref_lang") === "en" ? "en" : "no";
    const design: Design = fd.get("pref_design") === "moderne" ? "moderne" : "klassisk";
    const fresh = await changeAuth((s) => {
      const x = findById(s, a.id);
      if (!x) return null;
      x.name = name;
      x.phone = str(fd, "phone", 40) || undefined;
      x.prefs = { lang, design };
      return { ...x };
    });
    if (!fresh) return { error: t.login };
    // the header's greeting shows the new name; the session lasts as long as it would have
    await startSession(fresh, (await sessionInfo())?.remember ?? false);
    refresh();
    return { ok: t.saved };
  });
}

export async function requestEmailChange(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const a = await currentMember();
    if (!a) return { error: t.login };
    const next = str(fd, "email").toLowerCase();
    if (!EMAIL.test(next)) return { error: t.email };
    if (next === a.email) return { error: t.same };
    const gate = await passwordCheckGate(a.id);
    if (!gate.ok) return { error: t.locked(minutes(gate.retryAfterSec)) };
    if (!(await verifyPassword(String(fd.get("password") ?? ""), a.password))) return { error: t.wrongPw };
    await passwordCheckPassed(a.id);
    const day = await take([{ key: `email-change:u:${a.id}`, max: 5, windowSec: 86400 }]);
    if (!day.ok) return { error: t.many };
    const design = designOf(fd);
    if (await signupByEmail()) {
      const answer = { ok: t.changeSent(next) };
      const origin = await siteOrigin();
      after(async () => {
        try {
          // an address that already has an account gets nothing (the answer is the same, so it is not revealed)
          if (findByEmail(await loadAuth(), next)) return;
          const { token, hours } = await issueLink(a.id, "email-change", a.email, { design, locale, email: next });
          const m = emailChangeMail(locale, linkUrl(origin, token, design, locale), hours);
          await sendMail(next, m.subject, m.text);
        } catch (e) {
          console.error("[knotten] an address change could not be sent", e);
        }
      });
      refresh();
      return answer;
    }
    // without email: changed at once, and unconfirmed (as the sign-up itself was)
    const old = a.email;
    const changed = await changeAuth((s) => {
      if (s.accounts.some((x) => x.id !== a.id && x.email === next)) return false;
      const x = findById(s, a.id);
      if (!x) return false;
      x.email = next;
      x.email_verified_at = undefined;
      s.tokens = s.tokens.filter((tk) => tk.uid !== a.id);
      audit(s, next, "endret e-postadressen (ikke bekreftet)");
      return true;
    });
    if (!changed) return { error: t.takenChange };
    await changeMember(a.id, (m) => { m.old_emails = [...new Set([...(m.old_emails ?? []), old])].slice(-10); });
    await leadsFollowAddress(a, next);
    refresh();
    return { ok: t.changedNow(next) };
  });
}

/** An unconfirmed address (signed up while the site sent no email) gets a confirmation link once email is on. */
export async function resendVerification(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const a = await currentMember();
    if (!a) return { error: t.login };
    if (a.email_verified_at) { refresh(); return { ok: t.saved }; }
    if (!(await signupByEmail())) return { error: t.noMail };
    const gate = await take([{ key: `verify:u:${a.id}`, max: 3, windowSec: 3600 }]);
    if (!gate.ok) return { error: t.many };
    const design = designOf(fd);
    const origin = await siteOrigin();
    const { token, hours } = await issueLink(a.id, "verify", a.email, { design, locale });
    const m = verifyMail(locale, linkUrl(origin, token, design, locale), hours, false);
    const sent = await sendMail(a.email, m.subject, m.text);
    return sent.ok ? { ok: t.verifySent(a.email) } : { error: leadErrorText("error", locale) };
  });
}

// ------------------------------------------------------------------ plots
export type FollowResult = { ok: true; following: boolean } | { ok: false; reason: "login" | "not-member" | "bad-plot" | "storage" | "busy" };

async function setFollowing(a: Account, plotId: string, on: boolean): Promise<FollowResult> {
  if (!(await plotIds()).has(plotId)) return { ok: false, reason: "bad-plot" };
  if (!(await changeGate(a.id)).ok) return { ok: false, reason: "busy" };
  const changed = await changeMember(a.id, (m) => {
    const has = m.plots.includes(plotId);
    if (on && !has) m.plots = [...m.plots, plotId];
    else if (!on && has) m.plots = m.plots.filter((p) => p !== plotId);
    else return false;
    return true;
  });
  // a follow is interest in the plot: the lead gets it too (only for a confirmed address does it change the lead)
  if (on && changed) {
    after(async () => {
      try {
        await syncLead(a, await getMember(a.id), { plots: [plotId], message: `Følger tomt ${plotNo(plotId)} på Min side.`, source: "min side" });
      } catch (e) {
        console.error("[knotten] a followed plot could not be written to the lead", e);
      }
    });
  }
  refresh();
  return { ok: true, following: on };
}

async function followAction(plotId: unknown, on: boolean): Promise<FollowResult> {
  try {
    if (STORAGE === "temp") return { ok: false, reason: "storage" };
    const s = await getSession();
    if (!s) return { ok: false, reason: "login" };
    const a = await currentMember();
    if (!a) return { ok: false, reason: "not-member" };
    return await setFollowing(a, typeof plotId === "string" ? plotId : "", on);
  } catch (e) {
    if (isStorageUnavailable(e)) return { ok: false, reason: "storage" };
    if (e instanceof StorageBusyError) return { ok: false, reason: "busy" };
    throw e;
  }
}

/** For the plot pages' "follow" buttons: follow one plot (`plot-07`). Not logged in: { ok: false, reason: "login" }. */
export async function followPlot(plotId: string): Promise<FollowResult> {
  return followAction(plotId, true);
}

/** For the plot pages' buttons: stop following one plot. */
export async function unfollowPlot(plotId: string): Promise<FollowResult> {
  return followAction(plotId, false);
}

/** For a plot page's button: is this plot followed by the person looking (read only)? */
export async function followState(plotId: string): Promise<FollowResult> {
  const s = await getSession();
  if (!s) return { ok: false, reason: "login" };
  if (s.kind !== "member") return { ok: false, reason: "not-member" };
  const m = await getMember(s.id).catch(() => null);
  return { ok: true, following: !!m?.plots.includes(String(plotId)) };
}

/** Min side's forms: follow a plot from the list, or stop following one. */
export async function setFollow(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const a = await currentMember();
    if (!a) return { error: t.login };
    const plot = str(fd, "plot", 20);
    const on = fd.get("op") !== "unfollow";
    const r = await setFollowing(a, plot, on);
    if (!r.ok) return { error: r.reason === "bad-plot" ? t.badPlot : t.many };
    return { ok: on ? t.followed(plotNo(plot)) : t.unfollowed(plotNo(plot)) };
  });
}

// ------------------------------------------------------------------ notifications
export async function setNotify(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const a = await currentMember();
    if (!a) return { error: t.login };
    const purpose = NOTIFY_PURPOSES.find((p) => p === str(fd, "purpose")) as NotifyPurpose | undefined;
    if (!purpose) return { error: t.bad };
    if (!(await changeGate(a.id)).ok) return { error: t.many };
    const on = fd.get("on") === "1";
    const events = consentEvents({ [purpose]: on }, "min-side");
    await changeMember(a.id, (m) => { m.consents = [...m.consents, ...events]; });
    // the lead's consent changes only for a confirmed address; until then the choice waits here
    if (a.email_verified_at) {
      after(async () => {
        try {
          await syncLead(a, await getMember(a.id), { consents: { [purpose]: on }, source: "min side" });
        } catch (e) {
          console.error("[knotten] a consent could not be written to the lead", e);
        }
      });
    }
    refresh();
    return { ok: on ? t.notifyOn : t.notifyOff };
  });
}

// ------------------------------------------------------------------ saved houses
export async function deleteSavedHouse(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const a = await currentMember();
    if (!a) return { error: t.login };
    await deleteSaved(a.id, str(fd, "id", 80));
    refresh();
    return { ok: t.houseGone };
  });
}

// ------------------------------------------------------------------ delete the account
/**
 * Confirmed with the password. Saved houses, follows and consent records go; the person's own lead goes too unless
 * they untick the box; the session ends; a confirmation goes to a confirmed address when email is on.
 */
export async function deleteMyAccount(_: MemberState, fd: FormData): Promise<MemberState> {
  return guarded(fd, async () => {
    const locale = langOf(fd), t = T[locale];
    const a = await currentMember();
    if (!a) return { error: t.login };
    const gate = await passwordCheckGate(a.id);
    if (!gate.ok) return { error: t.locked(minutes(gate.retryAfterSec)) };
    if (!(await verifyPassword(String(fd.get("password") ?? ""), a.password))) return { error: t.wrongPw };
    const deleteLead = fd.get("delete_lead") === "on";
    const notify = mayEmail(a);
    const { leadsDeleted, leadsKept } = await deleteMember(a, { leads: deleteLead });
    await recordEvent("member_deleted");
    if (notify) {
      const m = accountDeletedMail(memberPlace(a).locale, leadsDeleted > 0 ? "deleted" : leadsKept > 0 ? "kept" : "none");
      after(() => sendMail(a.email, m.subject, m.text).then(() => undefined));
    }
    await endSession();
    redirect(`${loginPagePath(designOf(fd), locale)}?slettet=1`);
  });
}
