import Link from "next/link";
import { getDb } from "@/db";
import {
  searchLeads,
  listSources,
  PIPELINE_STATUSES,
  type PipelineStatus,
  type LeadFilter,
} from "@/lib/admin/leads-admin";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SP = {
  q?: string;
  status?: string;
  source?: string;
  page?: string;
  erased?: string;
  error?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Avventer bekreftelse",
  confirmed: "Bekreftet",
  unsubscribed: "Avmeldt",
};

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium" }).format(d);
}

function qs(base: SP, over: Partial<SP>): string {
  const p = new URLSearchParams();
  const merged = { ...base, ...over };
  for (const [k, v] of Object.entries(merged)) {
    if (v && k !== "erased" && k !== "error") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const db = await getDb();
  const sources = await listSources(db);

  const filter: LeadFilter = {
    q: sp.q,
    pipelineStatus: PIPELINE_STATUSES.includes(sp.status as PipelineStatus)
      ? (sp.status as PipelineStatus)
      : undefined,
    source: sp.source || undefined,
    page: sp.page ? Number(sp.page) : 1,
    pageSize: 25,
  };
  const result = await searchLeads(db, filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">Registreringer</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {result.total} registreringer totalt. Hver er en verdifull kontakt.
          </p>
        </div>
        <a
          href={`/admin/export${qs(sp, { page: undefined })}`}
          className="border-border text-foreground hover:bg-secondary/40 rounded-md border px-4 py-2 text-sm font-medium"
        >
          Last ned CSV
        </a>
      </div>

      {sp.erased === "1" ? (
        <Alert variant="success">
          <AlertDescription>Registreringen er slettet for godt.</AlertDescription>
        </Alert>
      ) : null}
      {sp.error === "forbidden" ? (
        <Alert variant="destructive">
          <AlertDescription>Du har ikke tilgang til den handlingen.</AlertDescription>
        </Alert>
      ) : null}

      {/* Aggregate interest over time comes from cookieless analytics (SPEC-08);
          until that is connected the panel degrades gracefully. */}
      <section className="border-border bg-card rounded-lg border p-4">
        <h2 className="text-foreground text-sm font-semibold">Interesse over tid</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Aggregert, anonym statistikk kobles til nar webanalysen (SPEC-08) er aktivert. Tallene her
          stammer aldri fra sporing av enkeltpersoner.
        </p>
      </section>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <label htmlFor="q" className="text-muted-foreground text-xs font-medium">
            Sok (navn eller e-post)
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q ?? ""}
            className="border-input bg-background h-9 w-56 rounded-md border px-3 text-sm"
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="status" className="text-muted-foreground text-xs font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={sp.status ?? ""}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">Alle</option>
            {PIPELINE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor="source" className="text-muted-foreground text-xs font-medium">
            Kilde
          </label>
          <select
            id="source"
            name="source"
            defaultValue={sp.source ?? ""}
            className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          >
            <option value="">Alle</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-primary text-primary-foreground h-9 rounded-md px-4 text-sm font-medium"
        >
          Filtrer
        </button>
      </form>

      {result.rows.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Ingen registreringer matcher filteret.
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Navn</th>
                <th className="px-4 py-2 font-medium">E-post</th>
                <th className="px-4 py-2 font-medium">Kilde</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Bekreftelse</th>
                <th className="px-4 py-2 font-medium">Registrert</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((lead) => (
                <tr key={lead.id} className="border-border border-t">
                  <td className="px-4 py-2">
                    <Link href={`/admin/leads/${lead.id}`} className="text-sea hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-4 py-2">{lead.email}</td>
                  <td className="text-muted-foreground px-4 py-2">{lead.source ?? "-"}</td>
                  <td className="px-4 py-2">{lead.pipelineStatus}</td>
                  <td className="text-muted-foreground px-4 py-2">
                    {STATUS_LABELS[lead.status] ?? lead.status}
                  </td>
                  <td className="text-muted-foreground px-4 py-2">{fmtDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Side {result.page} av {result.pageCount}
          </span>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link
                href={`/admin${qs(sp, { page: String(result.page - 1) })}`}
                className="border-border rounded-md border px-3 py-1"
              >
                Forrige
              </Link>
            ) : null}
            {result.page < result.pageCount ? (
              <Link
                href={`/admin${qs(sp, { page: String(result.page + 1) })}`}
                className="border-border rounded-md border px-3 py-1"
              >
                Neste
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
