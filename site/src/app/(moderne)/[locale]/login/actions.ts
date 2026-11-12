"use server";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { afterLogout, clientIp, endSession, getRealSession, getSession, safeNext, sessionInfo, startSession } from "@/lib/auth";
import { AREAS } from "@/lib/auth-shared";
import type { Design } from "@/lib/design";
import { STORAGE_MESSAGE } from "@/lib/errors";
import {
  audit, changeAuth, clearSetupCode, findByEmail, findById, hasActiveSuperadmin, issueLink, linkUrl, loadAuth, loginGate, loginPassed,
  needsSetup, newAccountId, passwordCheckGate, passwordCheckPassed, peekLink, queueResetRequest, redeemLink, resetGate, setupCode,
  setupGate, setupPassed,
} from "@/lib/server/accounts";
import { hashPassword, passwordProblem, safeEqual, verifyPassword } from "@/lib/server/crypto";
import { memberPasswordChangedMail, memberResetMail, passwordChangedMail, resetMail, verifyMail } from "@/lib/server/emails";
import { isStorageUnavailable, STORAGE } from "@/lib/server/kv";
import { minutes, take } from "@/lib/server/limit";
import { MAIL_ON, sendMail, siteOrigin } from "@/lib/server/mail";
import { afterVerified, mayEmail, memberPlace } from "@/lib/server/member-store";
import { recordEvent } from "@/lib/server/stats";
import { minSidePath } from "@/lib/member-paths";
import type { Account } from "@/lib/server/accounts";

/**
 * Sign-in for the portal, shared by both designs. Every form posts here; the answers are the same
 * whether an address exists or not, attempts are counted per address and per network before any
 * password or code is checked, and passwords never leave this file except as scrypt hashes.
 * Emails go out after the answer, so how long the answer takes says nothing about the address.
 */
export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const lang = (fd: FormData) => (fd.get("lang") === "en" ? "en" : "no") as "no" | "en";
const localeOf = (fd: FormData) => (str(fd, "locale") === "en" ? "en" : "no") as "no" | "en";
/** Which design the form was in: Klassisk forms say so, everything else is Moderne. */
const designOf = (fd: FormData): Design => (fd.get("design") === "klassisk" ? "klassisk" : "moderne");
const T = {
  no: {
    missing: "Skriv inn e-post og passord.",
    wrong: "Feil e-post eller passord.",
    locked: (m: number) => `For mange forsøk. Prøv igjen om ${m} ${m === 1 ? "minutt" : "minutter"}.`,
    done: "Oppsettet er allerede gjort. Logg inn som vanlig.",
    badCode: "Feil oppsettskode.",
    name: "Skriv inn navnet ditt.",
    email: "Skriv inn en gyldig e-postadresse.",
    mismatch: "Passordene er ikke like.",
    badLink: "Lenken er ugyldig eller utløpt. Be administratoren om en ny.",
    confirmFirst: (e: string) => `Bekreft e-postadressen først. Vi har sendt en ny lenke til ${e}.`,
    resetSent: "Takk. Hvis adressen har tilgang til portalen, får administratoren beskjed og sender deg en lenke for nytt passord.",
    resetMailed: "Takk. Hvis adressen har tilgang til portalen, kommer en lenke for nytt passord på e-post i løpet av noen minutter.",
    wrongCurrent: "Nåværende passord stemmer ikke.",
    changed: "Passordet er endret. Andre innlogginger er logget ut.",
    saved: "Lagret.",
    failed: "Noe gikk galt. Prøv igjen om litt.",
  },
  en: {
    missing: "Enter your email and password.",
    wrong: "Wrong email or password.",
    locked: (m: number) => `Too many attempts. Try again in ${m} ${m === 1 ? "minute" : "minutes"}.`,
    done: "The setup is already done. Log in as usual.",
    badCode: "Wrong setup code.",
    name: "Enter your name.",
    email: "Enter a valid email address.",
    mismatch: "The passwords do not match.",
    badLink: "The link is invalid or has expired. Ask the administrator for a new one.",
    confirmFirst: (e: string) => `Confirm the email address first. We have sent a new link to ${e}.`,
    resetSent: "Thank you. If the address has access to the portal, the administrator is told and sends you a link for a new password.",
    resetMailed: "Thank you. If the address has access to the portal, a link for a new password arrives by email within a few minutes.",
    wrongCurrent: "The current password is not correct.",
    changed: "The password is changed. Other sessions have been logged out.",
    saved: "Saved.",
    failed: "Something went wrong. Try again shortly.",
  },
};
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Runs a form action; when nothing can be saved (no storage set up), the person is told so instead of an error page. */
async function guarded(fd: FormData, run: () => Promise<FormState>): Promise<FormState> {
  if (STORAGE === "temp") return { error: STORAGE_MESSAGE[lang(fd)] };
  try {
    return await run();
  } catch (e) {
    if (isStorageUnavailable(e)) return { error: STORAGE_MESSAGE[lang(fd)] };
    throw e;
  }
}

/**
 * Email the person that their password changed (after the answer; a failure is logged, not shown). A buyer's own
 * account gets it only at a confirmed address, without the name it was given on the public sign-up form.
 */
function noticePasswordChanged(a: Pick<Account, "email" | "name" | "kind" | "email_verified_at">, l: "no" | "en") {
  if (!MAIL_ON) return;
  if (a.kind === "member" && !mayEmail(a)) return;
  after(async () => {
    const m = a.kind === "member" ? memberPasswordChangedMail(l) : passwordChangedMail(l, a.name);
    await sendMail(a.email, m.subject, m.text);
  });
}

/**
 * Where a person lands after logging in: the page they came for, or by kind of account, a buyer's Min side in the
 * design and language they logged in from, and a stakeholder's portal. A buyer sent towards the portal (an old
 * bookmark, the header's portal link) goes to Min side as well.
 */
function landing(a: Pick<Account, "kind">, next: string, design: Design, locale: "no" | "en") {
  const dest = safeNext(next, locale);
  if (a.kind !== "member") return dest;
  return !next || /^\/(no|en)\/portal(\/|\?|#|$)/.test(dest) ? minSidePath(design, locale) : dest;
}

/**
 * A buyer who signed up with email and never confirmed has no password yet; should one exist all the same and be
 * typed correctly, knowing it proves the account is theirs: a new link goes out (at most 3 an hour).
 */
async function sendFreshVerification(a: Account, design: Design, locale: "no" | "en") {
  if (!MAIL_ON) return;
  const gate = await take([{ key: `verify:u:${a.id}`, max: 3, windowSec: 3600 }]);
  if (!gate.ok) return;
  const origin = await siteOrigin();
  if (!origin) return;
  after(async () => {
    const { token, hours } = await issueLink(a.id, "verify", a.email, { design, locale });
    const m = verifyMail(locale, linkUrl(origin, token, design, locale), hours, false);
    await sendMail(a.email, m.subject, m.text);
  });
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(fd, async () => {
    const t = T[lang(fd)];
    const locale = localeOf(fd);
    const email = str(fd, "email").toLowerCase();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) return { error: t.missing };
    if (!EMAIL.test(email)) return { error: t.email };
    const ip = await clientIp();
    const gate = await loginGate(email, ip);
    if (!gate.ok) return { error: t.locked(minutes(gate.retryAfterSec)) };
    const a = findByEmail(await loadAuth(), email);
    const usable = a?.status === "active" || (a?.status === "pending" && a.kind === "member");
    const ok = await verifyPassword(password, usable ? a?.password : undefined);
    if (!ok || !a || !usable) {
      await changeAuth((s) => audit(s, email, "mislykket innlogging"));
      return { error: t.wrong };
    }
    await loginPassed(email, ip);
    const design = designOf(fd);
    if (a.status === "pending") {
      await sendFreshVerification(a, design, locale);
      return { error: t.confirmFirst(a.email) };
    }
    const fresh = await changeAuth((s) => {
      const x = findById(s, a.id);
      if (!x || x.status !== "active") return null;
      x.last_login = new Date().toISOString();
      x.logins = (x.logins ?? 0) + 1;
      x.design = design;
      x.lang = locale;
      audit(s, x.email, "logget inn");
      return { ...x };
    });
    if (!fresh) return { error: t.wrong };
    await startSession(fresh, fd.get("remember") === "on", design);
    await recordEvent("login");
    redirect(landing(fresh, str(fd, "next", 300), design, locale));
  });
}

/** Log out on this device and land on the login page of the design and language the person was using. */
export async function logout(fd: FormData) {
  const s = await getRealSession();
  const info = await sessionInfo();
  if (s) await changeAuth((st) => audit(st, s.email, "logget ut")).catch(() => undefined);
  await endSession();
  redirect(afterLogout(fd, info?.design));
}

export async function logoutEverywhere(fd: FormData) {
  const s = await getRealSession();
  const info = await sessionInfo();
  if (s) await changeAuth((st) => { const a = findById(st, s.id); if (a) { a.sv += 1; audit(st, a.email, "logget ut på alle enheter"); } }).catch(() => undefined);
  await endSession();
  redirect(afterLogout(fd, info?.design));
}

/** First-time setup: the super administrator chooses a password, proven by the setup code. */
export async function setup(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(fd, async () => {
    const l = lang(fd), t = T[l];
    const locale = localeOf(fd);
    if (!(await needsSetup())) return { error: t.done };
    const ip = await clientIp();
    const gate = await setupGate(ip);
    if (!gate.ok) return { error: t.locked(minutes(gate.retryAfterSec)) };
    // the code may be typed with or without the dash, in any case
    const plain = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const code = plain(await setupCode());
    if (!code || !safeEqual(plain(str(fd, "code", 40)), code)) return { error: t.badCode };
    // a right code does not count against the network, whatever happens next
    await setupPassed(ip);
    const name = str(fd, "name", 80), email = str(fd, "email").toLowerCase(), pw = String(fd.get("password") ?? ""), pw2 = String(fd.get("confirm") ?? "");
    if (!name) return { error: t.name };
    if (!EMAIL.test(email)) return { error: t.email };
    const problem = passwordProblem(pw, email, l);
    if (problem) return { error: problem };
    if (pw !== pw2) return { error: t.mismatch };
    const hash = await hashPassword(pw);
    const design = designOf(fd);
    const account = await changeAuth((s) => {
      // two setups at once: only the first one counts
      if (hasActiveSuperadmin(s)) return null;
      const seeded = s.accounts.find((x) => x.role === "superadmin" && !x.password);
      let a = findByEmail(s, email) ?? seeded;
      if (!a) {
        a = { id: newAccountId(), email, name, role: "superadmin", areas: [...AREAS], status: "active", created: new Date().toISOString(), logins: 0, sv: 1 };
        s.accounts.push(a);
      }
      // the seeded owner's company stays only when the owner is the one setting up
      const org = a.email === email ? a.org : undefined;
      Object.assign(a, { email, name, org, role: "superadmin", areas: [...AREAS], password: hash, status: "active", sv: a.sv + 1, last_login: new Date().toISOString(), logins: (a.logins ?? 0) + 1, design, lang: locale });
      audit(s, email, "første oppsett: superadministrator opprettet");
      return { ...a };
    });
    if (!account) return { error: t.done };
    await clearSetupCode();
    await startSession(account, false, design);
    redirect(`/${locale}/portal`);
  });
}

/**
 * Choose a password from an invitation, a reset link, or a buyer's confirmation link ("verify": signed up with
 * email, so the password is chosen here and the address counts as confirmed). Buyers land on Min side in the design
 * and language of the page, everyone else in the portal.
 */
export async function choosePassword(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(fd, async () => {
    const l = lang(fd), t = T[l];
    const locale = localeOf(fd);
    const token = str(fd, "token", 200), pw = String(fd.get("password") ?? ""), pw2 = String(fd.get("confirm") ?? "");
    const link = await peekLink(token);
    if (!link) return { error: t.badLink };
    // checked against the account's own address, not one the form sends
    const problem = passwordProblem(pw, link.account.email, l);
    if (problem) return { error: problem };
    if (pw !== pw2) return { error: t.mismatch };
    const a = await redeemLink(token, pw);
    if (!a) return { error: t.badLink };
    if (a.via === "reset") noticePasswordChanged(a, l);
    const design = designOf(fd);
    await startSession(a, false, design);
    await recordEvent("login");
    if (a.kind === "member") {
      // the address is now confirmed: the sign-up reaches the leads, and the welcome email goes out
      afterVerified(a.id, { welcome: a.via === "verify", design, locale });
      if (a.via === "verify") await recordEvent("signup_verified");
      redirect(`${minSidePath(design, locale)}${a.via === "verify" ? "?velkommen=1" : ""}`);
    }
    redirect(`/${locale}/portal`);
  });
}

/**
 * "Forgot password": always the same answer, at once. The work happens after the answer has gone: with email the
 * link is sent (and if sending fails, the request goes to the administrators instead); without email the
 * administrators see the request on the users page.
 */
export async function requestReset(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(fd, async () => {
    const l = lang(fd), t = T[l];
    const email = str(fd, "email").toLowerCase();
    if (!EMAIL.test(email)) return { error: t.email };
    const answer = { ok: MAIL_ON ? t.resetMailed : t.resetSent };
    const gate = await resetGate(email, await clientIp());
    // over the limit: the same answer, and nothing is sent (the form cannot be used to flood anyone)
    if (!gate.ok) return answer;
    const locale = localeOf(fd);
    const design = designOf(fd);
    const origin = MAIL_ON ? await siteOrigin() : "";
    after(async () => {
      try {
        const a = findByEmail(await loadAuth(), email);
        if (!a || a.status !== "active") return;
        if (!MAIL_ON || !origin) return await queueResetRequest(email, MAIL_ON ? "no-address" : "no-mail");
        const { token, hours } = await issueLink(a.id, "reset", "glemt passord", { design, locale });
        // a buyer's account: no name in the email (it was typed on the public sign-up form)
        const m = a.kind === "member" ? memberResetMail(l, linkUrl(origin, token, design, locale), hours) : resetMail(l, a.name, linkUrl(origin, token, design, locale), hours);
        const sent = await sendMail(a.email, m.subject, m.text);
        if (!sent.ok) await queueResetRequest(email, "mail-failed");
      } catch (e) {
        console.error("[knotten] a password reset request could not be handled", e);
      }
    });
    return answer;
  });
}

/** Signed in: change the password (the current one is required, 5 tries in 15 minutes); other sessions end. */
export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(fd, async () => {
    const l = lang(fd), t = T[l];
    const s = await getSession();
    if (!s) return { error: t.wrong };
    const gate = await passwordCheckGate(s.id);
    if (!gate.ok) return { error: t.locked(minutes(gate.retryAfterSec)) };
    const a = findById(await loadAuth(), s.id);
    if (!a || !(await verifyPassword(String(fd.get("current") ?? ""), a.password))) return { error: t.wrongCurrent };
    await passwordCheckPassed(s.id);
    const pw = String(fd.get("password") ?? ""), pw2 = String(fd.get("confirm") ?? "");
    const problem = passwordProblem(pw, a.email, l);
    if (problem) return { error: problem };
    if (pw !== pw2) return { error: t.mismatch };
    const hash = await hashPassword(pw);
    const fresh = await changeAuth((st) => {
      const x = findById(st, s.id);
      if (!x) return null;
      x.password = hash;
      x.sv += 1;
      audit(st, x.email, "endret passord");
      return { ...x };
    });
    if (!fresh) return { error: t.failed };
    // the new session lasts as long as the old one would have ("remember me" is kept)
    await startSession(fresh, (await sessionInfo())?.remember ?? false);
    noticePasswordChanged(fresh, fresh.kind === "member" ? memberPlace(fresh).locale : l);
    return { ok: t.changed };
  });
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  return guarded(fd, async () => {
    const t = T[lang(fd)];
    const s = await getSession();
    if (!s) return { error: t.wrong };
    const name = str(fd, "name", 80);
    if (!name) return { error: t.name };
    const fresh = await changeAuth((st) => { const x = findById(st, s.id); if (!x) return null; x.name = name; x.org = str(fd, "org", 120) || undefined; return { ...x }; });
    if (!fresh) return { error: t.failed };
    await startSession(fresh, (await sessionInfo())?.remember ?? false);
    return { ok: t.saved };
  });
}
