import Link from "next/link";
import { getDb } from "@/db";
import { listAudit } from "@/lib/admin/leads-admin";

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const page = sp.page ? Number(sp.page) : 1;
  const result = await listAudit(db, { page, pageSize: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Aktivitetslogg</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tilfoyes kun, inneholder ingen personopplysninger. {result.total} hendelser.
        </p>
      </div>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-muted-foreground text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Tidspunkt</th>
              <th className="px-4 py-2 font-medium">Aktor</th>
              <th className="px-4 py-2 font-medium">Handling</th>
              <th className="px-4 py-2 font-medium">Registrering</th>
              <th className="px-4 py-2 font-medium">Detalj</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className="border-border border-t">
                <td className="text-muted-foreground px-4 py-2 whitespace-nowrap">{fmt(row.at)}</td>
                <td className="px-4 py-2">{row.actor}</td>
                <td className="px-4 py-2 font-mono text-xs">{row.action}</td>
                <td className="text-muted-foreground px-4 py-2 font-mono text-xs">
                  {row.leadId ? row.leadId.slice(0, 8) : "-"}
                </td>
                <td className="text-muted-foreground px-4 py-2">{row.detail ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result.pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Side {result.page} av {result.pageCount}
          </span>
          <div className="flex gap-2">
            {result.page > 1 ? (
              <Link
                href={`/admin/audit?page=${result.page - 1}`}
                className="border-border rounded-md border px-3 py-1"
              >
                Forrige
              </Link>
            ) : null}
            {result.page < result.pageCount ? (
              <Link
                href={`/admin/audit?page=${result.page + 1}`}
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
