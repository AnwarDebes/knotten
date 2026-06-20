import Link from "next/link";
import { getDb } from "@/db";
import { listNews } from "@/lib/content/service";
import { deleteNewsAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { FormBanner } from "@/components/admin/form";

function fmt(d: Date | null): string {
  return d ? new Intl.DateTimeFormat("nb-NO", { dateStyle: "short" }).format(d) : "-";
}

export default async function NewsList({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; restored?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const posts = await listNews(db);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">Aktuelt</h1>
        <Button asChild>
          <Link href="/admin/innhold/aktuelt/ny">Ny sak</Link>
        </Button>
      </div>
      <FormBanner
        saved={sp.saved === "1"}
        deleted={sp.deleted === "1"}
        restored={sp.restored === "1"}
      />

      {posts.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
          Ingen saker enna. Skriv den forste.
        </p>
      ) : (
        <div className="border-border overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Tittel (NO)</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Publisert</th>
                <th className="px-4 py-2">
                  <span className="sr-only">Handlinger</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-border border-t">
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/innhold/aktuelt/${p.id}`}
                      className="text-sea hover:underline"
                    >
                      {p.titleNo}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-4 py-2">{p.status}</td>
                  <td className="text-muted-foreground px-4 py-2">{fmt(p.publishedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteNewsAction}>
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
