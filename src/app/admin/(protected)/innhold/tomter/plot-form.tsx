import { savePlotAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { TextField, SelectField } from "@/components/admin/form";
import { PLOT_STATUSES, ORIENTATIONS } from "@/lib/content/validation";
import type { Plot } from "@/db/schema";

const ORIENTATION_LABELS: Record<string, string> = {
  soer: "Sor",
  oestVest: "Ost/vest",
  nord: "Nord",
};

/** Create/edit form for a plot. A plain server-action form, no client JS. */
export function PlotForm({ plot }: { plot?: Plot }) {
  return (
    <form action={savePlotAction} className="max-w-xl space-y-5">
      {plot ? <input type="hidden" name="id" value={plot.id} /> : null}
      <TextField name="label" label="Navn" defaultValue={plot?.label} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="status"
          label="Status"
          defaultValue={plot?.status}
          options={PLOT_STATUSES.map((s) => ({ value: s, label: s }))}
        />
        <SelectField
          name="orientation"
          label="Orientering"
          defaultValue={plot?.orientation ?? ""}
          options={[
            { value: "", label: "Ikke satt" },
            ...ORIENTATIONS.map((o) => ({ value: o, label: ORIENTATION_LABELS[o] ?? o })),
          ]}
        />
        <TextField
          name="sizeM2"
          label="Storrelse (m2)"
          type="number"
          defaultValue={plot?.sizeM2}
          hint="La sta tom inntil oppmaling foreligger"
        />
        <TextField
          name="priceIndicative"
          label="Indikativ pris (NOK)"
          type="number"
          defaultValue={plot?.priceIndicative}
          hint="Indikativt estimat, ikke endelig"
        />
        <TextField name="gnrBnr" label="Gnr/bnr" defaultValue={plot?.gnrBnr} />
        <TextField
          name="sortOrder"
          label="Rekkefolge"
          type="number"
          defaultValue={plot?.sortOrder ?? 0}
        />
        <TextField
          name="positionX"
          label="Posisjon X (terreng)"
          type="number"
          defaultValue={plot?.positionX}
        />
        <TextField
          name="positionZ"
          label="Posisjon Z (terreng)"
          type="number"
          defaultValue={plot?.positionZ}
        />
        <TextField
          name="sightlineBearing"
          label="Siktelinje (grader)"
          type="number"
          defaultValue={plot?.sightlineBearing}
        />
      </div>
      <TextField name="note" label="Notat" defaultValue={plot?.note} />
      <Button type="submit" size="lg">
        {plot ? "Lagre endringer" : "Opprett tomt"}
      </Button>
    </form>
  );
}
