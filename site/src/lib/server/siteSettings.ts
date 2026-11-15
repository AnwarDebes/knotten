import "server-only";
import type { PublicSettings } from "@/lib/store";
import { readPublicSettings } from "./publicRecords";

/**
 * The few settings the public pages show: the status line (the release note) and the company facts the
 * administrator has filled in. Every page of both designs reads them (the footers, the front pages, the
 * privacy statement), so they come from the public pages' cache (lib/server/publicRecords.ts) instead of being
 * read from the store on every visit: the pages stay static, and saving the settings refreshes them.
 */
export type { PublicSettings };

/** The public settings; when the store cannot be read, the last ones read, else the honest defaults (nothing is made up). */
export async function loadPublicSettings(): Promise<PublicSettings> {
  return readPublicSettings();
}

/** "123456789" or "123 456 789" -> "123 456 789", the way Brønnøysundregistrene writes it. */
export function formatOrgNumber(v: string): string {
  const d = v.replace(/\D/g, "");
  return d.length === 9 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : v.trim();
}
