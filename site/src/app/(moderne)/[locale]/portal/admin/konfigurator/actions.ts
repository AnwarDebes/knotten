"use server";
import { revalidatePath } from "next/cache";
import { actor } from "@/lib/auth";
import { OPTION_BY_ID } from "@/lib/configurator/catalog";
import { deleteSent, priceKeys, setPrices } from "@/lib/server/configurations";
import type { PriceTable } from "@/lib/configurator/types";

/** The administrator's side of the house configurator: the price table and the sent configurations. */
export type PriceState = { error?: string; ok?: string } | undefined;

const en = (fd: FormData) => fd.get("lang") === "en";
const by = (s: { name: string; email: string }) => s.name || s.email;

/** "2 450 000", "2450000 kr" or "-15 000" to whole kroner; empty is "on request" (null); anything else is undefined. */
function kroner(raw: string): number | null | undefined {
  // \s also covers the no-break spaces Norwegian number formatting uses
  let t = raw.replace(/\s/g, "").replace(/kr\.?$/i, "");
  // the long minus sign (U+2212) the Norwegian format prints, typed or pasted, counts as a minus
  if (t.charCodeAt(0) === 0x2212) t = `-${t.slice(1)}`;
  if (!t) return null;
  if (!/^-?\d{1,9}$/.test(t)) return undefined;
  return Number(t);
}

/** A field's name in the form for the error message: "Hjemmebatteri: 20 kWh". */
function fieldName(key: string, english: boolean) {
  if (key === "house:base") return english ? "Base price of the house" : "Grunnpris for huset";
  const [o, c] = key.split(":");
  const option = OPTION_BY_ID[o];
  const choice = option?.choices.find((x) => x.id === c);
  return option && choice ? `${option.label[english ? "en" : "no"]}: ${choice.label[english ? "en" : "no"]}` : key;
}

/** Saves the whole price table at once; nothing is saved while a field is not whole kroner. */
export async function savePrices(_: PriceState, fd: FormData): Promise<PriceState> {
  const english = en(fd);
  let s;
  try {
    s = await actor("admin");
  } catch (e) {
    return { error: (e as Error).message === "preview" ? (english ? "You are viewing the portal as someone else. Leave the preview to change prices." : "Du ser portalen som en annen. Gå ut av forhåndsvisningen for å endre priser.") : (english ? "Only administrators can change prices." : "Bare administratorer kan endre priser.") };
  }
  const table: PriceTable = {};
  const bad: string[] = [];
  for (const key of priceKeys()) {
    const v = kroner(String(fd.get(`p:${key}`) ?? ""));
    if (v === undefined || (key === "house:base" && typeof v === "number" && v < 0)) bad.push(fieldName(key, english));
    else if (v !== null) table[key] = v;
  }
  if (bad.length) {
    return { error: english ? `Not saved. Write whole kroner (a minus for a deduction) or leave the field empty for "on request": ${bad.join("; ")}.` : `Ikke lagret. Skriv hele kroner (minus for fradrag), eller la feltet stå tomt for «pris på forespørsel»: ${bad.join("; ")}.` };
  }
  const saved = await setPrices(table, by(s));
  revalidatePath("/", "layout");
  const n = Object.keys(saved).length;
  return { ok: english ? `Saved: ${n} ${n === 1 ? "price" : "prices"}. The configurator shows them within a minute.` : `Lagret: ${n} ${n === 1 ? "pris" : "priser"}. Konfiguratoren viser dem innen et minutt.` };
}

export async function deleteSentConfig(fd: FormData) {
  await actor("admin");
  const id = String(fd.get("id") ?? "");
  if (/^cfg-[a-z0-9]{1,40}$/.test(id)) await deleteSent(id);
  revalidatePath("/", "layout");
}
