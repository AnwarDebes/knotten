import Link from "next/link";
import { getDb } from "@/db";
import { listFaq } from "@/lib/content/service";
import { deleteFaqAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/admin/form";

export default async function FaqList({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const entries = await listFaq(db);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">FAQ</h1>
        <Button asChild>
          <Link href="/admin/innhold/faq/ny">Nytt sporsmal</Link>
        </Button>
      </div>
      <FormBanner saved={sp.saved === "1"} deleted={sp.deleted === "1"} />

      {entries.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Ingen sporsmal enna. Legg til det forste.
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Sporsmal (NO)</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2">
                  <span className="sr-only">Handlinger</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-border border-t">
                  <td className="px-4 py-2">
                    <Link href={`/admin/innhold/faq/${e.id}`} className="text-sea hover:underline">
                      {e.questionNo}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-4 py-2">{e.status}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteFaqAction}>
                      <input type="hidden" name="id" value={e.id} />
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
