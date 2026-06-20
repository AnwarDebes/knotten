import Link from "next/link";
import { getDb } from "@/db";
import { listTimeline } from "@/lib/content/service";
import { deleteStageAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/admin/form";

export default async function TimelineList({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; restored?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const stages = await listTimeline(db);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Fremdrift</h1>
        <Button asChild>
          <Link href="/admin/innhold/fremdrift/ny">Nytt steg</Link>
        </Button>
      </div>
      <FormBanner
        saved={sp.saved === "1"}
        deleted={sp.deleted === "1"}
        restored={sp.restored === "1"}
      />

      {stages.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Ingen steg enna. Legg til det forste.
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Etikett (NO)</th>
                <th className="px-4 py-2 font-medium">Dato/fase</th>
                <th className="px-4 py-2 font-medium">Naverende</th>
                <th className="px-4 py-2">
                  <span className="sr-only">Handlinger</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {stages.map((s) => (
                <tr key={s.id} className="border-border border-t">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/innhold/fremdrift/${s.id}`}
                      className="text-sea hover:underline"
                    >
                      {s.labelNo}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-4 py-2">{s.dateOrStage ?? "-"}</td>
                  <td className="text-muted-foreground px-4 py-2">{s.isCurrent ? "Ja" : "Nei"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteStageAction}>
                      <input type="hidden" name="id" value={s.id} />
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
