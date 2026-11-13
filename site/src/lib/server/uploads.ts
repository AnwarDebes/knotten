import "server-only";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { AREAS, can, isAdmin, type Session } from "@/lib/auth-shared";
import { internalDoc } from "@/lib/docRegister";
import { configuredOrigin } from "./mail";
import { FILES_ON, MAX_BYTES, prettySize, removeFile, saveFile, safeName } from "./files";
import { take } from "./limit";
import { DOC_CATEGORIES, docs, meters, parseMeterCsv, rid, type Audience, type DocCategory } from "./records";
import { readCapped } from "./requestGuard";

/**
 * Uploads in the portal: documents and meter data. They come to route handlers (POST /api/files and POST
 * /api/energy/readings) instead of server actions, so each has its own size limit and the server actions (the
 * public login and sign-up forms among them) keep Next's small default limit. Every upload is checked here the
 * way the portal's actions check: who is asking, from a page on this site, and within the limits.
 */
export type UploadAnswer = { ok?: string; error?: string };
type Reply = { status: number; body: UploadAnswer };

/** Room for the form's other fields and the multipart framing around the file. */
const FORM_OVERHEAD = 512 * 1024;
/** A pasted or uploaded meter export: at most 8 million characters (years of hourly values). */
export const METER_MAX_CHARS = 8_000_000;

const str = (fd: FormData, k: string, max = 400) => String(fd.get(k) ?? "").trim().slice(0, max);
const say = (fd: FormData, no: string, en: string) => (fd.get("lang") === "en" ? en : no);
const answer = (status: number, body: UploadAnswer): Reply => ({ status, body });

/** The request comes from a page on this site: the browser says so (Sec-Fetch-Site), or its Origin is this site. */
export function fromThisSite(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = req.headers.get("origin");
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const allowed = new Set<string>();
  for (const h of [req.headers.get("x-forwarded-host"), req.headers.get("host")]) if (h) allowed.add(h.split(",")[0].trim().toLowerCase());
  const configured = configuredOrigin();
  if (configured) allowed.add(new URL(configured).host.toLowerCase());
  return allowed.has(host);
}

/** Who may send an upload to a route, and what they are told when they may not. */
export type UploadRule = { allowed: (s: Session) => boolean; refused: { no: string; en: string } };

/**
 * The form a portal page sent with fetch, and the person who sent it. In this order, so nothing is read for a
 * request that will be refused: multipart, from a page on this site, a session that may do this (not a preview,
 * not a buyer's own account), then the body, at most `max` bytes and the form's other fields. Anything else is an
 * answer to send back at once (401, 403, 413 or 415), in the language the page asked for (?lang=en).
 */
export async function receiveUpload(req: Request, max: number, rule: UploadRule): Promise<{ fd: FormData; s: Session } | { reply: Reply }> {
  const en = new URL(req.url).searchParams.get("lang") === "en";
  const type = req.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data;/i.test(type)) return { reply: answer(415, { error: en ? "The form must be sent as an upload." : "Skjemaet må sendes som filopplasting." }) };
  if (!fromThisSite(req)) return { reply: answer(403, { error: en ? "The upload must come from the portal." : "Opplastingen må komme fra portalen." }) };
  const s = await getSession();
  if (!s) return { reply: answer(401, { error: en ? "Log in again to upload." : "Logg inn på nytt for å laste opp." }) };
  if (s.preview) return { reply: answer(403, { error: en ? "Preview: you are viewing the portal as someone else, so changes are switched off. End the preview at the top to make changes." : "Forhåndsvisning: du ser portalen som en annen, så endringer er slått av. Avslutt forhåndsvisningen øverst for å gjøre endringer." }) };
  if (s.kind === "member" || !rule.allowed(s)) return { reply: answer(403, { error: rule.refused[en ? "en" : "no"] }) };
  const bytes = await readCapped(req, max + FORM_OVERHEAD);
  if (!bytes) return { reply: answer(413, { error: en ? `The file is too large. The limit is ${prettySize(max, false)}.` : `Filen er for stor. Største tillatte størrelse er ${prettySize(max)}.` }) };
  try {
    const fd = await new Response(bytes as BodyInit, { headers: { "content-type": type } }).formData();
    fd.set("lang", en ? "en" : "no");
    return { fd, s };
  } catch {
    return { reply: answer(400, { error: en ? "The form could not be read. Reload the page and try again." : "Skjemaet kunne ikke leses. Last siden på nytt og prøv igjen." }) };
  }
}

// ------------------------------------------------------------------ documents
function audienceFrom(fd: FormData, s: Session): Audience[] {
  const picked = fd.getAll("audience").map(String).filter((a): a is Audience => a === "all" || (AREAS as readonly string[]).includes(a));
  // people who are not administrators share within the areas they have themselves
  const allowed = isAdmin(s) ? picked : picked.filter((a) => a !== "all" && s.areas.includes(a));
  return allowed.length ? allowed : isAdmin(s) ? ["all"] : [s.areas[0] ?? "project"];
}

/** Documents: administrators, and people with the project area (who share within their own areas). */
export const DOC_UPLOADERS: UploadRule = { allowed: (s) => isAdmin(s) || can(s, "project"), refused: { no: "Du har ikke tilgang til å laste opp dokumenter.", en: "You may not upload documents." } };

/**
 * A document, or a new version of one, from a person DOC_UPLOADERS let through. A new version may come only from
 * the account that uploaded the document (matched by account id, never by name: anyone can change their own
 * display name) or from an administrator.
 */
export async function uploadDocument(fd: FormData, s: Session): Promise<Reply> {
  const admin = isAdmin(s);
  if (!FILES_ON) return answer(503, { error: say(fd, "Filer kan ikke lagres før en fillagring er satt opp (Vercel Blob). Se Innstillinger.", "Files cannot be stored until file storage is set up (Vercel Blob). See Settings.") });
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return answer(400, { error: say(fd, "Velg en fil.", "Choose a file.") });
  if (file.size > MAX_BYTES) return answer(413, { error: say(fd, `Filen er for stor. Største tillatte størrelse er ${prettySize(MAX_BYTES)}.`, `The file is too large. The limit is ${prettySize(MAX_BYTES, false)}.`) });
  if (!(await take([{ key: `upload:u:${s.id}`, max: 60, windowSec: 3600 }])).ok) return answer(429, { error: say(fd, "Mange opplastinger på kort tid. Vent litt og prøv igjen.", "Many uploads in a short time. Wait a little and try again.") });

  // one of the documents the public bank lists: filed under its title, as a new version if it is there already
  const reg = admin ? internalDoc(str(fd, "register", 40)) : undefined;
  const current = (await docs.read()).docs;
  const asked = str(fd, "replace", 60);
  const target = asked ? current.find((d) => d.id === asked) : reg ? current.find((d) => d.register === reg.key) : undefined;
  if (asked && !target) return answer(404, { error: say(fd, "Fant ikke dokumentet. Last siden på nytt.", "The document was not found. Reload the page.") });
  const notYours = say(fd, "Bare den som lastet opp dokumentet, eller en administrator, kan laste opp en ny versjon.", "Only the uploader or an administrator can add a new version.");
  if (target && !admin && target.by_id !== s.id) return answer(403, { error: notYours });

  const id = target?.id ?? rid("doc");
  const key = await saveFile(`${id}-v${Date.now().toString(36)}`, file);
  const ext = file.name.match(/\.[a-z0-9]{1,6}$/i)?.[0]?.toLowerCase() ?? "";
  const stored = { key, name: reg ? safeName(`${reg.title.no}${ext}`) : safeName(file.name), size: file.size, type: file.type || "application/octet-stream" };
  const title = str(fd, "title", 160) || reg?.title.no || stored.name.replace(/\.[a-z0-9]+$/i, "");
  const category = (DOC_CATEGORIES as readonly string[]).includes(str(fd, "category")) ? (str(fd, "category") as DocCategory) : "other";
  const plot = admin && /^plot-\d{2}$/.test(str(fd, "plot", 10)) ? str(fd, "plot", 10) : undefined;
  const name = s.name || s.email;
  const at = new Date().toISOString();
  const result = await docs.change((st) => {
    const old = target ? st.docs.find((d) => d.id === target.id) : undefined;
    if (target && !old) return "gone";
    if (old) {
      // checked again inside the change: the document may have changed hands since it was read
      if (!admin && old.by_id !== s.id) return "forbidden";
      old.previous = [{ ...old.file, version: old.version, uploaded: old.uploaded, by: old.by, by_id: old.by_id }, ...old.previous].slice(0, 20);
      old.file = stored;
      old.version += 1;
      old.uploaded = at;
      old.by = name;
      old.by_id = s.id;
      return "version";
    }
    st.docs.unshift({ id, title, description: str(fd, "description", 600) || reg?.what.no || undefined, category, audience: audienceFrom(fd, s), plot, register: reg?.key, file: stored, version: 1, previous: [], uploaded: at, by: name, by_id: s.id, downloads: 0 });
    return "new";
  });
  if (result === "forbidden" || result === "gone") {
    await removeFile(key);
    return result === "gone" ? answer(404, { error: say(fd, "Fant ikke dokumentet. Last siden på nytt.", "The document was not found. Reload the page.") }) : answer(403, { error: notYours });
  }
  revalidatePath("/", "layout");
  return answer(200, { ok: result === "version" ? say(fd, "Ny versjon lastet opp.", "New version uploaded.") : say(fd, `«${title}» er lastet opp.`, `"${title}" is uploaded.`) });
}

// ------------------------------------------------------------------ meter data for the buildings on the property
/** Meter data: administrators only. */
export const METER_IMPORTERS: UploadRule = { allowed: (s) => isAdmin(s), refused: { no: "Bare administratorer kan legge inn målerdata.", en: "Only administrators can add meter data." } };

/** A meter export (a file or pasted figures) read into one building's monthly history, from an administrator. */
export async function importMeterReadings(fd: FormData): Promise<Reply> {
  const id = str(fd, "building", 40);
  const file = fd.get("file");
  const text = file instanceof File && file.size ? await file.text() : String(fd.get("text") ?? "");
  if (!text.trim()) return answer(400, { error: say(fd, "Velg en fil eller lim inn tallene.", "Choose a file or paste the figures.") });
  if (text.length > METER_MAX_CHARS) return answer(413, { error: say(fd, "Filen er for stor.", "The file is too large.") });
  const { readings, rows, skipped } = parseMeterCsv(text);
  if (!readings.length) return answer(400, { error: say(fd, "Fant ingen datoer og tall i filen. Forventet format: dato og kWh per linje, for eksempel 01.01.2025;1234,5.", "Found no dates and figures. Expected: a date and kWh per line, e.g. 2025-01-01,1234.5.") });
  const source = str(fd, "source", 160) || (file instanceof File && file.size ? safeName(file.name) : say(fd, "lagt inn for hånd", "entered by hand"));
  const at = new Date().toISOString();
  const ok = await meters.change((m) => {
    const b = m.buildings.find((x) => x.id === id);
    if (!b) return false;
    const map = new Map(b.readings.map((r) => [r.month, r.kwh]));
    for (const r of readings) map.set(r.month, r.kwh);
    b.readings = [...map.entries()].sort((a, c) => a[0].localeCompare(c[0])).map(([month, kwh]) => ({ month, kwh }));
    b.source = source;
    b.updated = at;
    return true;
  });
  if (!ok) return answer(404, { error: say(fd, "Fant ikke bygget. Last siden på nytt.", "The building was not found. Reload the page.") });
  revalidatePath("/", "layout");
  const first = readings[0].month, last = readings[readings.length - 1].month;
  return answer(200, { ok: say(fd, `${readings.length} måneder lest inn (${first} til ${last}) fra ${rows} linjer${skipped ? `; ${skipped} linjer uten dato eller tall ble hoppet over` : ""}.`, `${readings.length} months read (${first} to ${last}) from ${rows} lines${skipped ? `; ${skipped} lines without a date or figure were skipped` : ""}.`) });
}
