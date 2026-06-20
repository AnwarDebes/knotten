import Link from "next/link";
import { getDb } from "@/db";
import { listPlots } from "@/lib/content/service";
import { deletePlotAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/admin/form";

export default async function PlotsList({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; restored?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const plots = await listPlots(db);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Tomter</h1>
        <Button asChild>
          <Link href="/admin/innhold/tomter/ny">Ny tomt</Link>
        </Button>
      </div>
      <FormBanner
        saved={sp.saved === "1"}
        deleted={sp.deleted === "1"}
        restored={sp.restored === "1"}
      />

      {plots.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Ingen tomter enna. Legg til den forste.
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Navn</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Storrelse</th>
                <th className="px-4 py-2 font-medium">Pris</th>
                <th className="px-4 py-2">
                  <span className="sr-only">Handlinger</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {plots.map((p) => (
                <tr key={p.id} className="border-border border-t">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/innhold/tomter/${p.id}`}
                      className="text-sea hover:underline"
                    >
                      {p.label}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p.status}</td>
                  <td className="text-muted-foreground px-4 py-2">
                    {p.sizeM2 ? `${p.sizeM2} m2` : "-"}
                  </td>
                  <td className="text-muted-foreground px-4 py-2">
                    {p.priceIndicative ? p.priceIndicative.toLocaleString("nb-NO") : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={deletePlotAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="text-destructive text-sm hover:underline">
                        Slett
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
