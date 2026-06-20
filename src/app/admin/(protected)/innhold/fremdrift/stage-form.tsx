import { saveStageAction } from "../../../content-actions";
import { Button } from "@/components/ui/button";
import { TextField, CheckboxField } from "@/components/admin/form";
import type { TimelineStage } from "@/db/schema";

/** Create/edit form for a fremdrift (timeline) stage. */
export function StageForm({ stage }: { stage?: TimelineStage }) {
  return (
    <form action={saveStageAction} className="max-w-xl space-y-5">
      {stage ? <input type="hidden" name="id" value={stage.id} /> : null}
      <TextField name="key" label="Nokkel" defaultValue={stage?.key} required />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="labelNo" label="Etikett (NO)" defaultValue={stage?.labelNo} required />
        <TextField name="labelEn" label="Etikett (EN)" defaultValue={stage?.labelEn} required />
        <TextField name="dateOrStage" label="Dato eller fase" defaultValue={stage?.dateOrStage} />
        <TextField
          name="sortOrder"
          label="Rekkefolge"
          type="number"
          defaultValue={stage?.sortOrder ?? 0}
        />
      </div>
      <CheckboxField name="isCurrent" label="Naverende steg" defaultChecked={stage?.isCurrent} />
      <Button type="submit" size="lg">
        {stage ? "Lagre endringer" : "Opprett steg"}
      </Button>
    </form>
  );
}
