import { fromOtherSite, getSession } from "@/lib/auth";
import { audit, changeAuth } from "@/lib/server/accounts";
import { memberExport } from "@/lib/server/member-store";

export const dynamic = "force-dynamic";

const plain = (text: string, status: number) => new Response(text, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

/**
 * "Mine data" on Min side: everything stored about the logged-in buyer, as one JSON file (the right of access and
 * of data portability). Only for the person's own session, and only when the request comes from the site's own
 * pages or is typed or bookmarked (another site cannot make the browser fetch it).
 */
export async function GET(req: Request) {
  if (fromOtherSite(req)) return plain("Dataene kan bare lastes ned fra Min side.\nThe data can only be downloaded from My page.", 403);
  const s = await getSession();
  if (!s || s.preview) return plain("Logg inn for å laste ned dataene dine.\nLog in to download your data.", 401);
  if (s.kind !== "member") return plain("Dette gjelder kjøperkontoer.\nThis is for buyer accounts.", 403);
  const data = await memberExport(s.id);
  if (!data) return plain("Fant ikke kontoen.\nThe account was not found.", 404);
  await changeAuth((st) => audit(st, s.email, "lastet ned egne data")).catch(() => undefined);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="knotten-mine-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
