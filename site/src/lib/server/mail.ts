import { promises as fs } from "fs";
import path from "path";
import { headers } from "next/headers";
import { mutate, PRIVATE_DIR, readJSON } from "./kv";

/**
 * Outgoing email, through one of:
 * - Resend: RESEND_API_KEY and MAIL_FROM (for example "Knotten <post@knotten.no>", a domain verified in Resend);
 * - any SMTP server: SMTP_URL (smtps://user:password@smtp.example.com:465) and MAIL_FROM;
 * - for tests on a computer: MAIL_DEV_OUTBOX=1 writes every email as an .eml file to data/private/outbox instead of
 *   sending it (never on Vercel), so the links in it can be followed.
 * Without any of them the portal shows invitation and password links to the administrator, who passes them on.
 * sendMail never throws: it answers { ok, error }, and failures are logged and listed for the administrators.
 */
const RESEND_KEY = process.env.RESEND_API_KEY?.trim();
const SMTP_URL = process.env.SMTP_URL?.trim();
const FROM = process.env.MAIL_FROM?.trim();
const OUTBOX = process.env.MAIL_DEV_OUTBOX === "1" && !process.env.VERCEL;

export type MailProvider = "resend" | "smtp" | "outbox";
export const MAIL_PROVIDER: MailProvider | null = OUTBOX ? "outbox" : RESEND_KEY && FROM ? "resend" : SMTP_URL && FROM ? "smtp" : null;
export const MAIL_ON = MAIL_PROVIDER !== null;
export const OUTBOX_DIR = path.join(PRIVATE_DIR, "outbox");

export type MailResult = { ok: boolean; error?: string };
export type MailOptions = { replyTo?: string };

/** A recipient as the failure list shows it: enough to recognise, not the whole address. */
const mask = (to: string) => to.replace(/^(.)[^@]*(@.*)$/, "$1***$2");

type MailLog = { failures: { at: string; to: string; subject: string; error: string; provider: string }[]; last_ok?: string };
const LOG_KEY = "mail-log";

/** The latest sending failures (newest first) and the time of the last email that went out. */
export async function readMailLog(): Promise<MailLog> {
  return { failures: [], ...((await readJSON<MailLog>(LOG_KEY).catch(() => null)) ?? {}) };
}

/** Sending failures of the last `days` days, newest first. */
export async function recentMailFailures(days = 7) {
  const since = Date.now() - days * 86400e3;
  return (await readMailLog()).failures.filter((f) => Date.parse(f.at) > since);
}

async function note(change: (log: MailLog) => void) {
  await mutate<MailLog, void>(LOG_KEY, () => ({ failures: [] }), (log) => {
    log.failures ??= [];
    change(log);
  }).catch(() => undefined);
}

async function viaResend(to: string, subject: string, text: string, opts: MailOptions) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, text, ...(opts.replyTo ? { reply_to: opts.replyTo } : {}) }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string; name?: string } | null;
    throw new Error(`Resend answered ${res.status}${body?.message ? `: ${body.message}` : ""}`);
  }
}

type Transport = { sendMail: (m: Record<string, unknown>) => Promise<{ message?: Buffer | string }> };
let smtp: Promise<Transport> | null = null;
async function smtpTransport(): Promise<Transport> {
  smtp ??= import("nodemailer").then(({ createTransport }) => {
    const u = new URL(SMTP_URL!);
    const secure = u.protocol === "smtps:";
    return createTransport({
      host: u.hostname,
      port: Number(u.port) || (secure ? 465 : 587),
      secure,
      auth: u.username ? { user: decodeURIComponent(u.username), pass: decodeURIComponent(u.password) } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    }) as unknown as Transport;
  });
  return smtp;
}

async function viaSmtp(to: string, subject: string, text: string, opts: MailOptions) {
  await (await smtpTransport()).sendMail({ from: FROM, to, subject, text, replyTo: opts.replyTo });
}

let outboxSeq = 0;
async function toOutbox(to: string, subject: string, text: string, opts: MailOptions) {
  const { createTransport } = await import("nodemailer");
  const t = createTransport({ streamTransport: true, buffer: true, newline: "unix" }) as unknown as Transport;
  const info = await t.sendMail({ from: FROM || "Knotten <post@localhost>", to, subject, text, replyTo: opts.replyTo });
  await fs.mkdir(OUTBOX_DIR, { recursive: true });
  const slug = subject.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const file = path.join(OUTBOX_DIR, `${new Date().toISOString().replace(/[:.]/g, "-")}-${++outboxSeq}-${slug || "mail"}.eml`);
  await fs.writeFile(file, info.message ?? "", "utf-8");
}

/** Send one plain-text email. Never throws; a failure is logged and kept for the administrators to see. */
export async function sendMail(to: string, subject: string, text: string, opts: MailOptions = {}): Promise<MailResult> {
  if (!MAIL_PROVIDER) return { ok: false, error: "email is not set up" };
  try {
    if (MAIL_PROVIDER === "outbox") await toOutbox(to, subject, text, opts);
    else if (MAIL_PROVIDER === "resend") await viaResend(to, subject, text, opts);
    else await viaSmtp(to, subject, text, opts);
    await note((log) => { log.last_ok = new Date().toISOString(); });
    return { ok: true };
  } catch (e) {
    const error = String((e as Error)?.message ?? e).replace(/\s+/g, " ").slice(0, 300);
    console.error(`[knotten] email "${subject}" to ${mask(to)} could not be sent (${MAIL_PROVIDER}): ${error}`);
    await note((log) => {
      log.failures = [{ at: new Date().toISOString(), to: mask(to), subject: subject.slice(0, 120), error, provider: MAIL_PROVIDER! }, ...log.failures].slice(0, 20);
    });
    return { ok: false, error };
  }
}

// ------------------------------------------------------------------ the site's public address
const clean = (u: string | undefined) => {
  const v = u?.trim().replace(/\/+$/, "");
  if (!v) return null;
  try {
    const url = new URL(v.includes("://") ? v : `https://${v}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
};

/**
 * The address set for this deployment: SITE_URL, else Vercel's production domain (VERCEL_PROJECT_PRODUCTION_URL,
 * which Vercel sets itself). Null when neither is set.
 */
export function configuredOrigin(): string | null {
  return clean(process.env.SITE_URL) ?? clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
}

let warned = false;
/**
 * The site's own address, for links in emails. In production only the configured address is used, never the
 * address a request claims to come to (a forged Host header must not decide where a password link points). In
 * development the request's own address is fine. Empty when production has no address set; callers then do not
 * send links (a reset is queued for the administrators instead).
 */
export async function siteOrigin(): Promise<string> {
  const configured = configuredOrigin();
  if (configured) return configured;
  if (process.env.NODE_ENV !== "production") {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
    return `${proto}://${host}`;
  }
  if (!warned) {
    warned = true;
    console.error("[knotten] SITE_URL is not set: links in emails cannot be made. Set SITE_URL to the public address.");
  }
  return "";
}
