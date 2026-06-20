import { getDb } from "@/db";
import { getBlock } from "@/lib/content/service";
import { KNOWN_BLOCKS } from "@/lib/content/registry";
import { saveBlockAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { FormBanner, TextAreaField } from "@/components/admin/form";

export default async function BlocksEditor({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const rows = await Promise.all(KNOWN_BLOCKS.map((b) => getBlock(db, b.key)));

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Tekstblokker</h1>
      <FormBanner saved={sp.saved === "1"} error={sp.error} />

      <div className="space-y-6">
        {KNOWN_BLOCKS.map((b, i) => {
          const row = rows[i];
          return (
            <div key={b.key} className="border-border max-w-xl rounded-lg border p-6">
              <h2 className="text-foreground text-sm font-semibold">{b.label}</h2>
              <p className="text-muted-foreground mb-4 text-xs">{b.hint}</p>
              <form action={saveBlockAction} className="space-y-4">
                <input type="hidden" name="key" value={b.key} />
                <TextAreaField name="bodyNo" label="Tekst (NO)" defaultValue={row?.bodyNo} />
                <TextAreaField name="bodyEn" label="Tekst (EN)" defaultValue={row?.bodyEn} />
                <Button type="submit">Lagre</Button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
