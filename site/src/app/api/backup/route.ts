import { fromOtherSite, getSession, isAdmin } from "@/lib/auth";
import { readStore } from "@/lib/store";
import { docs, meters, residents, threads, workspace } from "@/lib/server/records";
import { readDays } from "@/lib/server/stats";
import { STORAGE } from "@/lib/server/kv";
import { audit, changeAuth, loadAuth } from "@/lib/server/accounts";
import { readMembers } from "@/lib/server/member-store";

/**
 * Everything the site has stored, as one JSON file for the owner to keep: the project's own copy,
 * independent of the hosting. Accounts are listed without password hashes, link tokens or the
 * session secret; document files are listed, not included (they are downloaded one by one).
 */
export async function GET(req: Request) {
  // another site cannot make an administrator's browser fetch (and log) a backup
  if (fromOtherSite(req)) return new Response("Sikkerhetskopien kan bare lastes ned fra portalen.", { status: 403 });
  const session = await getSession();
  if (!session || !isAdmin(session) || session.preview) return new Response("Bare administratorer kan ta sikkerhetskopi.", { status: 403 });
  const [store, auth, docState, threadState, ws, res, met, days, buyers] = await Promise.all([readStore(), loadAuth(), docs.read(), threads.read(), workspace.read(), residents.read(), meters.read(), readDays(365), readMembers().catch(() => ({}))]);
  const made = new Date().toISOString();
  const body = {
    om: { laget: made, av: session.email, lagring: STORAGE, merknad: "Sikkerhetskopi av Knotten-nettsiden og prosjektportalen. Inneholder personopplysninger: oppbevares trygt." },
    crm: { interessenter: store.leads, tomter: store.plots, nyheter: store.news, innstillinger: store.settings, logg: store.activity },
    kontoer: auth.accounts.map((a) => ({ id: a.id, type: a.kind === "member" ? "kjøperkonto" : "prosjektkonto", epost: a.email, navn: a.name, telefon: a.phone, rolle: a.role, omrader: a.areas, tomt: a.plot, organisasjon: a.org, status: a.status, e_post_bekreftet: a.email_verified_at, opprettet: a.created, sist_innlogget: a.last_login, innlogginger: a.logins })),
    // buyers' own accounts: followed plots, the consent log and the link to their lead (lib/server/member-store.ts)
    kjoperkontoer: buyers,
    dokumenter: docState.docs.map(({ file, previous, ...d }) => ({ ...d, fil: { navn: file.name, storrelse: file.size, type: file.type }, tidligere_versjoner: previous.map((p) => ({ versjon: p.version, navn: p.name, lastet_opp: p.uploaded, av: p.by })) })),
    nedlastinger: docState.log,
    henvendelser: threadState.threads,
    prosjektrom: ws,
    samtykker: res.consents,
    eksisterende_bygg: met.buildings,
    statistikk: days.filter((d) => Object.keys(d.c).length > 0),
  };
  await changeAuth((st) => audit(st, session.email, "lastet ned sikkerhetskopi")).catch(() => undefined);
  return new Response(JSON.stringify(body, null, 1), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="knotten-sikkerhetskopi-${made.slice(0, 10)}.json"`,
      "Cache-Control": "private, no-store",
    },
  });
}
