import "server-only";
import { unstable_cache } from "next/cache";
import { readStore, type CompanyFacts } from "@/lib/store";
import { RELEASE_NOTE } from "@/lib/content/status";

/**
 * The few settings the public pages show: the status line (the release note) and the company facts the
 * administrator has filled in. Every page of both designs reads them (the footers, the front pages, the
 * privacy statement), so they are kept in Next's data cache instead of being read from the store on every
 * visit: the pages stay static, and saving the settings (portal/admin/innstillinger) refreshes them.
 */
export const SETTINGS_TAG = "site-settings";

export type PublicSettings = { release_note: { no: string; en: string }; company: CompanyFacts };

const EMPTY: CompanyFacts = { org_number: "", postal_address: "", email: "", phone: "" };

const cached = unstable_cache(
  async (): Promise<PublicSettings> => {
    const { settings } = await readStore();
    return { release_note: settings.release_note, company: { ...EMPTY, ...settings.company } };
  },
  ["public-settings-v1"],
  { tags: [SETTINGS_TAG] },
);

/** The public settings; when the store cannot be read, the honest defaults (nothing is made up). */
export async function loadPublicSettings(): Promise<PublicSettings> {
  try {
    return await cached();
  } catch {
    return { release_note: RELEASE_NOTE, company: EMPTY };
  }
}

/** "123456789" or "123 456 789" -> "123 456 789", the way Brønnøysundregistrene writes it. */
export function formatOrgNumber(v: string): string {
  const d = v.replace(/\D/g, "");
  return d.length === 9 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : v.trim();
}
