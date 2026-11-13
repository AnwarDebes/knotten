import "server-only";
import { cache } from "react";
import { createJSON, getDel, getValue, mutate, readJSON, setNX, STORAGE } from "./kv";
import { hashPassword, humanCode, randomToken, sha256 } from "./crypto";
import { forget, giveBack, limitId, take, type Rule, type Verdict } from "./limit";
import { AREAS, type AccountRole, type Area } from "@/lib/auth-shared";
import type { Design } from "@/lib/design";
import { CONTACT } from "@/lib/facts";

/**
 * Accounts for the portal: who can log in, with what role and which areas. Kept apart from the CRM records (and
 * out of git): this is the only place password hashes and link tokens live.
 *
 * Storage: one record set ("auth") changed through kv.mutate, which is a compare-and-set in Redis, so two servers
 * changing accounts at once never undo each other. It is created once with SET NX, so every server signs sessions
 * with the same secret. What changes with every attempt (failed logins, reset requests, the setup code) is not in
 * it: those are small atomic keys with an expiry (lib/server/limit.ts and kv.setNX), counted before a password or
 * code is checked.
 */
export type Account = {
  id: string;
  email: string;
  name: string;
  role: AccountRole;
  areas: Area[];
  /** For residents: the plot that is their home, `plot-NN`. */
  plot?: string;
  /** Company, municipality or institution, for the overview. */
  org?: string;
  /** "pending": signed up, email not confirmed yet (buyers' own accounts; cleared after 7 days by /api/cron/cleanup). */
  status: "invited" | "active" | "disabled" | "pending";
  /** "member": a buyer's own account. Missing means a project stakeholder (every account made before sign-up existed). */
  kind?: "stakeholder" | "member";
  /** When the person proved the address is theirs (a link from an email was used). */
  email_verified_at?: string;
  /** The design and language of the last login: links in emails open the same page the person knows. */
  design?: Design;
  lang?: "no" | "en";
  /**
   * A buyer's own choice on Min side of the language and design for emails and links. It wins over the last login's
   * design and language (memberPlace in lib/server/member-store.ts).
   */
  prefs?: { lang: "no" | "en"; design: Design };
  /** Optional, given by a buyer on the sign-up page or Min side. */
  phone?: string;
  password?: string;
  created: string;
  created_by?: string;
  last_login?: string;
  logins: number;
  /** Raised when the password changes or someone logs out everywhere; older sessions stop working. */
  sv: number;
};
/**
 * One-time links, sent by email or passed on by an administrator:
 * - "invite": an administrator invites a stakeholder, who chooses a password;
 * - "reset": a new password;
 * - "verify": a buyer who signed up confirms the address (and chooses a password, if the account has none yet);
 * - "email-change": a buyer confirms a new address; `email` is that address.
 */
export type LinkToken = {
  hash: string;
  uid: string;
  kind: "invite" | "reset" | "verify" | "email-change";
  expires: string;
  created: string;
  by: string;
  /** Which design's password page the link opens. */
  design?: Design;
  locale?: "no" | "en";
  /** "email-change": the new address, which becomes the account's address when the link is used. */
  email?: string;
};
export type AuditEntry = { at: string; who: string; what: string };
/** Someone asked for a new password and the email could not go out: an administrator makes the link. */
export type ResetRequest = { at: string; email: string; reason?: "no-mail" | "mail-failed" | "no-address"; link_at?: string };
export type AuthState = {
  accounts: Account[];
  tokens: LinkToken[];
  secret: string;
  audit: AuditEntry[];
  reset_requests: ResetRequest[];
};

const KEY = "auth";
const now = () => new Date().toISOString();
export const newAccountId = () => `u-${Date.now().toString(36)}${randomToken(4).slice(0, 5).toLowerCase()}`;

function seed(): AuthState {
  return {
    accounts: [
      // the project owner, waiting for the first-time setup to choose a password
      { id: "u-owner", email: CONTACT.email.toLowerCase(), name: CONTACT.name, role: "superadmin", areas: [...AREAS], org: CONTACT.company, status: "invited", created: now(), logins: 0, sv: 1 },
    ],
    tokens: [],
    secret: randomToken(48),
    audit: [],
    reset_requests: [],
  };
}

/** Records written by older versions: fill what is missing and drop what moved elsewhere (in place). */
function complete(s: AuthState): AuthState {
  s.accounts ??= [];
  s.tokens ??= [];
  s.audit ??= [];
  s.reset_requests ??= [];
  const old = s as AuthState & { failures?: unknown; setup_code?: unknown };
  delete old.failures;
  delete old.setup_code;
  return s;
}

/** Temp mode (Vercel without a database): one starting point per server process, never saved. */
let tempState: AuthState | null = null;

export const loadAuth = cache(async (): Promise<AuthState> => {
  const s = await readJSON<AuthState>(KEY);
  if (s) return complete(s);
  if (STORAGE === "temp") return (tempState ??= seed());
  // the first seed is stored with SET NX: whichever server comes first, every server then uses that one
  await createJSON(KEY, seed());
  const saved = await readJSON<AuthState>(KEY);
  if (!saved) throw new Error("The account records could not be created");
  return complete(saved);
});

/** Change the accounts. `fn` may run again if another server changed them at the same moment. */
export const changeAuth = <R>(fn: (s: AuthState) => R | Promise<R>) => mutate<AuthState, R>(KEY, seed, (s) => fn(complete(s)));

export const findByEmail = (s: AuthState, email: string) => s.accounts.find((a) => a.email === email.trim().toLowerCase());
export const findById = (s: AuthState, id: string) => s.accounts.find((a) => a.id === id);

/** Where the session secret comes from: AUTH_SECRET (at least 32 characters), or the one kept with the accounts. */
export function authSecretSource(): "env" | "short" | "stored" {
  const env = process.env.AUTH_SECRET;
  if (!env) return "stored";
  return env.length >= 32 ? "env" : "short";
}

/** The secret that signs sessions: AUTH_SECRET when set (recommended in production), else one kept with the accounts. */
export async function authSecret() {
  const env = process.env.AUTH_SECRET;
  if (env && env.length >= 32) return env;
  return (await loadAuth()).secret;
}

/** True until a super administrator with a password exists. */
export const hasActiveSuperadmin = (s: AuthState) => s.accounts.some((a) => a.role === "superadmin" && a.status === "active" && !!a.password);
export async function needsSetup() {
  return !hasActiveSuperadmin(await loadAuth());
}

let announced = false;
/** The one-time code that proves the person doing the first-time setup can see the server (its log or its settings). */
export async function setupCode() {
  const fromEnv = process.env.KNOTTEN_SETUP_CODE?.trim();
  if (fromEnv) return fromEnv;
  // one code for every server: the first one stored wins (no write once it exists)
  if ((await getValue("setup-code")) === null) await setNX("setup-code", humanCode());
  const code = (await getValue("setup-code")) ?? "";
  if (!announced && code) {
    announced = true;
    console.warn(`\n[knotten] First-time setup: open /no/login and enter the setup code ${code}\n`);
  }
  return code;
}

/** The setup is done: the code is used up. */
export async function clearSetupCode() {
  await getDel("setup-code").catch(() => null);
}

export function audit(s: AuthState, who: string, what: string) {
  s.audit = [{ at: now(), who, what }, ...s.audit].slice(0, 500);
}

// ---------------------------------------------------------------- brakes: counted before anything is checked
const MIN15 = 15 * 60;
const loginRules = (email: string, ip: string): Rule[] => [
  // one network guessing one address
  { key: `login:ei:${limitId(`${email}|${ip}`)}`, max: 5, windowSec: MIN15 },
  // many networks guessing one address (a guesser on one network cannot lock the owner out alone)
  { key: `login:e:${limitId(email)}`, max: 20, windowSec: MIN15 },
  // one network guessing many addresses
  { key: `login:i:${limitId(ip)}`, max: 30, windowSec: MIN15 },
];

/** Count a login attempt (before the password is checked); refused while the address or the network is over its limit. */
export const loginGate = (email: string, ip: string): Promise<Verdict> => take(loginRules(email, ip));
/** A correct password: the address's count starts again, and the attempt no longer counts against the network. */
export async function loginPassed(email: string, ip: string) {
  const [pair, address, network] = loginRules(email, ip);
  await Promise.all([forget([pair.key, address.key]), giveBack([network])]);
}

const setupRule = (ip: string): Rule => ({ key: `setup:i:${limitId(ip)}`, max: 5, windowSec: MIN15 });
/** Count a first-time setup attempt per network (there is no single key that anyone could lock for everybody). */
export const setupGate = (ip: string) => take([setupRule(ip)]);
export const setupPassed = (ip: string) => giveBack([setupRule(ip)]);

/** "Forgot password": at most 3 an hour and 10 a day for one address, and 20 an hour from one network. */
export const resetGate = (email: string, ip: string) =>
  take([
    { key: `reset:e:${limitId(email)}`, max: 3, windowSec: 3600 },
    { key: `reset:d:${limitId(email)}`, max: 10, windowSec: 86400 },
    { key: `reset:i:${limitId(ip)}`, max: 20, windowSec: 3600 },
  ]);

const passwordRule = (uid: string): Rule => ({ key: `pw:u:${uid}`, max: 5, windowSec: MIN15 });
/** Checking the current password when changing it: 5 tries in 15 minutes per account. */
export const passwordCheckGate = (uid: string) => take([passwordRule(uid)]);
export const passwordCheckPassed = (uid: string) => forget([passwordRule(uid).key]);

/** Ask the administrators to send a password link by hand (no email, or the email failed). */
export async function queueResetRequest(email: string, reason: ResetRequest["reason"]) {
  await changeAuth((s) => {
    s.reset_requests = [{ at: now(), email, reason }, ...s.reset_requests.filter((r) => r.email !== email)].slice(0, 50);
    audit(s, email, reason === "mail-failed" ? "ba om nytt passord (e-posten kunne ikke sendes)" : "ba om nytt passord");
  });
}

// ---------------------------------------------------------------- links (invitation, new password, confirmations)
export const LINK_HOURS = { invite: 24 * 7, reset: 24, verify: 48, "email-change": 24 } as const satisfies Record<LinkToken["kind"], number>;
const LINK_AUDIT: Record<LinkToken["kind"], string> = {
  invite: "invitasjon laget for",
  reset: "lenke for nytt passord laget for",
  verify: "bekreftelseslenke laget for",
  "email-change": "lenke for ny e-postadresse laget for",
};

/** The password page a link opens: Klassisk's for Norwegian links made from Klassisk, else the Moderne page in the language. */
export function passwordPath(design: Design | undefined, locale: "no" | "en" | undefined) {
  return design === "klassisk" && locale !== "en" ? "/logg-inn/passord" : `/${locale === "en" ? "en" : "no"}/login/passord`;
}
/** The whole link for an email or for an administrator to copy. */
export const linkUrl = (origin: string, token: string, design?: Design, locale?: "no" | "en") => `${origin}${passwordPath(design, locale)}?token=${encodeURIComponent(token)}`;

/** Make a link token; only its hash is stored, the token itself is shown once. A new link replaces the account's older one of the same kind. */
export async function issueLink(uid: string, kind: LinkToken["kind"], by: string, opts: { design?: Design; locale?: "no" | "en"; email?: string } = {}) {
  const token = randomToken(32);
  const hours = LINK_HOURS[kind];
  await changeAuth((s) => {
    s.tokens = s.tokens.filter((t) => !(t.uid === uid && t.kind === kind) && Date.parse(t.expires) > Date.now());
    s.tokens.push({
      hash: sha256(token), uid, kind, expires: new Date(Date.now() + hours * 3600e3).toISOString(), created: now(), by, design: opts.design, locale: opts.locale,
      ...(kind === "email-change" && opts.email ? { email: opts.email.trim().toLowerCase() } : {}),
    });
    const a = findById(s, uid);
    audit(s, by, `${LINK_AUDIT[kind]} ${a?.email ?? uid}`);
  });
  return { token, hours };
}

/** Who a link belongs to, without using it up (opening the page, or a mail scanner following the link, changes nothing). */
export async function peekLink(token: string) {
  if (!token) return null;
  const s = await loadAuth();
  const t = s.tokens.find((x) => x.hash === sha256(token));
  if (!t || Date.parse(t.expires) < Date.now()) return null;
  const account = findById(s, t.uid);
  if (!account || account.status === "disabled") return null;
  return { account, kind: t.kind, design: t.design, locale: t.locale, email: t.email };
}

/**
 * Use a link to set a password: the account becomes active, the address counts as confirmed, and every older
 * session ends. The token is used up in the same change, so a link works once even when sent twice at once.
 */
export async function redeemLink(token: string, password: string): Promise<(Account & { via: LinkToken["kind"] }) | null> {
  const hash = await hashPassword(password);
  return changeAuth((s) => {
    const t = s.tokens.find((x) => x.hash === sha256(token));
    // a new address is confirmed with confirmLink, never by choosing a password
    if (!t || Date.parse(t.expires) < Date.now() || t.kind === "email-change") return null;
    const a = findById(s, t.uid);
    if (!a || a.status === "disabled") return null;
    a.password = hash;
    a.status = "active";
    a.email_verified_at ??= now();
    a.sv += 1;
    a.last_login = now();
    a.logins = (a.logins ?? 0) + 1;
    if (t.design) a.design = t.design;
    if (t.locale) a.lang = t.locale;
    s.tokens = s.tokens.filter((x) => x.uid !== a.id);
    s.reset_requests = s.reset_requests.filter((r) => r.email !== a.email);
    audit(s, a.email, t.kind === "invite" ? "tok imot invitasjonen og valgte passord" : t.kind === "verify" ? "bekreftet e-postadressen og valgte passord" : "valgte nytt passord med lenke");
    return { ...a, via: t.kind };
  });
}

export type Confirmed =
  | { ok: true; kind: "verify"; account: Account }
  | { ok: true; kind: "email-change"; account: Account; old: string; oldVerified: boolean }
  | { ok: false; reason: "invalid" | "taken" };

/**
 * Use a link that confirms an address without choosing a password: "verify" for an account that already has a
 * password (a buyer who signed up while the site sent no email), and "email-change" for a new address. The token
 * is used up in the same change. A new address that another account took in the meantime is refused, and that link
 * is spent.
 */
export async function confirmLink(token: string): Promise<Confirmed> {
  return changeAuth<Confirmed>((s) => {
    const t = s.tokens.find((x) => x.hash === sha256(token));
    if (!t || Date.parse(t.expires) < Date.now() || (t.kind !== "verify" && t.kind !== "email-change")) return { ok: false, reason: "invalid" };
    const a = findById(s, t.uid);
    // a pending sign-up without a password chooses one on the password page instead (redeemLink)
    if (!a || a.status === "disabled" || (t.kind === "verify" && !a.password)) return { ok: false, reason: "invalid" };
    if (t.kind === "verify") {
      a.email_verified_at = now();
      if (a.status === "pending") a.status = "active";
      s.tokens = s.tokens.filter((x) => !(x.uid === a.id && x.kind === "verify"));
      audit(s, a.email, "bekreftet e-postadressen");
      return { ok: true, kind: "verify", account: { ...a } };
    }
    const next = (t.email ?? "").trim().toLowerCase();
    if (!next || s.accounts.some((x) => x.id !== a.id && x.email === next)) {
      s.tokens = s.tokens.filter((x) => x.hash !== t.hash);
      return { ok: false, reason: "taken" };
    }
    const old = a.email;
    const oldVerified = !!a.email_verified_at;
    a.email = next;
    a.email_verified_at = now();
    // links made for the old address stop working with it
    s.tokens = s.tokens.filter((x) => x.uid !== a.id || x.kind === "invite");
    s.reset_requests = s.reset_requests.filter((r) => r.email !== old);
    audit(s, next, "endret e-postadressen med lenke");
    return { ok: true, kind: "email-change", account: { ...a }, old, oldVerified };
  });
}

// ---------------------------------------------------------------- retention
/** Daily cleanup: expired links go, and accounts that were never confirmed are deleted after 7 days. */
export async function cleanupAccounts(at = Date.now()) {
  return changeAuth((s) => {
    const cut = at - 7 * 86400e3;
    const stale = s.accounts.filter((a) => a.status === "pending" && Date.parse(a.created) < cut);
    const gone = new Set(stale.map((a) => a.id));
    s.accounts = s.accounts.filter((a) => !gone.has(a.id));
    const before = s.tokens.length;
    s.tokens = s.tokens.filter((t) => !gone.has(t.uid) && Date.parse(t.expires) > at);
    if (stale.length) audit(s, "opprydding", `slettet ${stale.length} ubekreftede kontoer eldre enn 7 dager`);
    return { pendingDeleted: stale.length, tokensDropped: before - s.tokens.length };
  });
}
