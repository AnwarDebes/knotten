"use server";
import { revalidatePath, updateTag } from "next/cache";
import { actor } from "@/lib/auth";
import { updateStore, type CompanyFacts } from "@/lib/store";
import { SETTINGS_TAG } from "@/lib/server/siteSettings";

type State = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A Norwegian organisation number: nine digits, the last a modulus 11 check digit (Brønnøysundregistrene). */
function validOrgNumber(digits: string): boolean {
  if (!/^\d{9}$/.test(digits)) return false;
  const w = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = w.reduce((a, x, i) => a + x * Number(digits[i]), 0);
  const check = (11 - (sum % 11)) % 11;
  return check !== 10 && check === Number(digits[8]);
}

/**
 * The company facts the public pages show in "Om utbygger", the footers and the privacy statement. Every field
 * may stay empty; a filled-in organisation number must be a real one (nine digits with a valid check digit), so a
 * typing error never reaches the public pages.
 */
export async function saveCompany(_: State, fd: FormData): Promise<State> {
  const s = await actor();
  const en = fd.get("lang") === "en";
  const org = str(fd, "org_number", 20).replace(/\D/g, "");
  const email = str(fd, "company_email", 200);
  const company: CompanyFacts = {
    org_number: org,
    postal_address: str(fd, "postal_address", 200),
    email,
    phone: str(fd, "company_phone", 40),
  };
  if (str(fd, "org_number", 20) && !validOrgNumber(org)) {
    return { error: en ? "The organisation number must be nine digits with a valid check digit. Check it against Brønnøysundregistrene." : "Organisasjonsnummeret må ha ni siffer med gyldig kontrollsiffer. Sjekk det mot Brønnøysundregistrene." };
  }
  if (email && !EMAIL.test(email)) return { error: en ? "The email address does not look right." : "E-postadressen ser ikke riktig ut." };
  await updateStore(s.name || s.email, "selskapsopplysninger lagret", (st) => { st.settings.company = company; });
  updateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: en ? "Saved. The public pages show the new details." : "Lagret. De offentlige sidene viser de nye opplysningene." };
}
