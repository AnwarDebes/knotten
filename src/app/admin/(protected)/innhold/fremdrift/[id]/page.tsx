import Link from "next/link";
import { notFound } from "next/navigation";
import { getDb } from "@/db";
import { listTimeline, listVersions } from "@/lib/content/service";
import { restoreVersionAction } from "../../../../content-actions";
import { StageForm } from "../stage-form";
import { FormBanner } from "@/components/admin/form";

function fmt(d: Date): string {
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "short", timeStyle: "short" }).format(d);
}

export default async function EditStage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; restored?: string }>;
}) {
  const { id } = await params;
  const { error, restored } = await searchParams;
  const db = await getDb();
  const stage = (await listTimeline(db)).find((s) => s.id === id);
  if (!stage) notFound();
  const versions = await listVersions(db, "timeline", id);

  return (
    <div className="space-y-6">
      <Link href="/admin/innhold/fremdrift" className="text-sea text-sm hover:underline">
        &larr; Tilbake til fremdrift
      </Link>
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">{stage.labelNo}</h1>
      <FormBanner error={error} restored={restored === "1"} />
      <StageForm stage={stage} />

      {versions.length > 0 ? (
        <section className="border-border max-w-xl border-t pt-6">
          <h2 className="text-foreground mb-2 text-sm font-semibold">Tidligere versjoner</h2>
          <ul className="divide-border divide-y">
            {versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted-foreground">
                  {fmt(v.at)} av {v.editor}
                </span>
                <form action={restoreVersionAction}>
                  <input type="hidden" name="versionId" value={v.id} />
                  <input type="hidden" name="back" value={`/admin/innhold/fremdrift/${id}`} />
                  <button type="submit" className="text-sea hover:underline">
                    Gjenopprett
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
