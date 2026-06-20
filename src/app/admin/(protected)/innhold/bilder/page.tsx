import { getDb } from "@/db";
import { listImageSlots } from "@/lib/content/service";
import { KNOWN_IMAGE_SLOTS } from "@/lib/content/registry";
import { saveImageSlotAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TextField, CheckboxField, FormBanner } from "@/components/admin/form";
import type { ImageSlot } from "@/db/schema";

export default async function ImagesEditor({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const db = await getDb();
  const rows = await listImageSlots(db);
  const byKey = new Map(rows.map((r) => [r.slotKey, r]));

  // Known slots first, then any extra slots already in the database.
  const known = KNOWN_IMAGE_SLOTS.map((s) => ({
    key: s.key,
    label: s.label,
    hint: s.hint,
    row: byKey.get(s.key),
  }));
  const extra = rows
    .filter((r) => !KNOWN_IMAGE_SLOTS.some((s) => s.key === r.slotKey))
    .map((r) => ({
      key: r.slotKey,
      label: r.slotKey,
      hint: "Egendefinert spor",
      row: r as ImageSlot,
    }));
  const slots = [...known, ...extra];

  return (
    <div className="space-y-6">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Bilder</h1>
      <p className="text-muted-foreground max-w-xl text-sm">
        Alle bilder trenger alt-tekst. AI- eller illustrasjonsbilder maa merkes og forklares, slik
        at det vises tydelig pa nettstedet.
      </p>
      <FormBanner saved={sp.saved === "1"} error={sp.error} />

      <div className="space-y-6">
        {slots.map((slot) => {
          const row = slot.row;
          return (
            <div key={slot.key} className="border-border max-w-xl rounded-lg border p-6">
              <h2 className="text-foreground text-sm font-semibold">{slot.label}</h2>
              <p className="text-muted-foreground text-xs">{slot.hint}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Naverende fil: {row?.assetRef ?? "Ingen fil enna"}
              </p>
              <form
                action={saveImageSlotAction}
                encType="multipart/form-data"
                className="mt-4 space-y-4"
              >
                <input type="hidden" name="slotKey" value={slot.key} />
                <div className="grid gap-1.5">
                  <Label htmlFor={`file-${slot.key}`}>Last opp nytt bilde (valgfritt)</Label>
                  <input
                    id={`file-${slot.key}`}
                    type="file"
                    name="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="text-sm"
                  />
                </div>
                <TextField name="altNo" label="Alt-tekst (NO)" defaultValue={row?.altNo} required />
                <TextField name="altEn" label="Alt-tekst (EN)" defaultValue={row?.altEn} required />
                <TextField
                  name="forbeholdText"
                  label="Forbehold"
                  defaultValue={row?.forbeholdText}
                />
                <CheckboxField
                  name="isAiOrIllustration"
                  label="AI- eller illustrasjonsbilde"
                  defaultChecked={row?.isAiOrIllustration}
                />
                <TextField
                  name="disclosureText"
                  label="Merknad om AI/illustrasjon"
                  defaultValue={row?.disclosureText}
                />
                <Button type="submit">Lagre</Button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
