import { NextResponse } from "next/server";
import { answer, redact } from "@/lib/server/assistant";
import { allow } from "@/lib/server/limit";
import { recordEvent } from "@/lib/server/stats";
import { mutate } from "@/lib/server/kv";
import { takeModelCall } from "@/lib/server/aiBudget";
import { isJson, isSameOrigin, readTextCapped } from "@/lib/server/requestGuard";

/** The largest body read: a question of 500 characters, the language and the design, with room to spare. */
const MAX_BODY = 8_000;

/**
 * Questions to Knotten AI, from either design in either language (the body says which: `locale` "no" or "en", `design`
 * "klassisk" or "moderne"). Answers come from the project's own data (lib/server/assistant.ts), with links into the
 * same design and language; a question the data does not cover may go to the language model, within the daily budget
 * (lib/server/aiBudget.ts). Only the site's own pages may ask, as JSON. What is kept: a count per topic, and the
 * questions that got no answer, with email addresses and numbers removed, so the owner can see what visitors want to
 * know. Nothing about the asker.
 */
export async function POST(req: Request) {
  if (!isJson(req) || !isSameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  // a question is at most 500 characters: the body is read up to a few kilobytes, never more
  const text = await readTextCapped(req, MAX_BODY).catch(() => "");
  if (text === null) return NextResponse.json({ error: "too_large" }, { status: 413 });
  let body: { q?: unknown; locale?: unknown; design?: unknown } | null;
  try {
    body = JSON.parse(text) as { q?: unknown; locale?: unknown; design?: unknown } | null;
  } catch {
    body = null;
  }
  const q = typeof body?.q === "string" ? body.q.trim().slice(0, 500) : "";
  const lang = body?.locale === "en" ? "en" : "no";
  // the design the question is asked from: the answer's links go to that design's own pages (Moderne unless said)
  const design = body?.design === "klassisk" ? "klassisk" : "moderne";
  if (!q) return NextResponse.json({ error: "empty" }, { status: 400 });
  const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
  if (!(await allow("ask", ip, 30, 10))) {
    return NextResponse.json({ text: lang === "no" ? "Du har spurt mye på kort tid. Vent litt og prøv igjen." : "You have asked a lot in a short time. Wait a little and try again.", links: [], source: "none", intent: "limit" });
  }
  let overBudget = false;
  const allowModel = async () => {
    const ok = await takeModelCall();
    if (!ok) overBudget = true;
    return ok;
  };
  const a = await answer(q, lang, { allowModel, design });
  await recordEvent("ask");
  await recordEvent(`ask_${a.intent}`);
  if (overBudget) await recordEvent("ask_budget");
  if (a.source !== "data") {
    await mutate<{ asked: { at: string; q: string; lang: string; source: string }[] }, void>("asked", () => ({ asked: [] }), (v) => {
      v.asked = [{ at: new Date().toISOString(), q: redact(q), lang, source: a.source }, ...v.asked].slice(0, 200);
    }).catch(() => undefined);
  }
  return NextResponse.json(a);
}
